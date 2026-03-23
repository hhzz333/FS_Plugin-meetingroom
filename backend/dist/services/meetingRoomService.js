import BaseService from './baseService.js';
/**
 * 会议室业务服务
 */
export class MeetingRoomService {
    baseService;
    constructor(context) {
        this.baseService = new BaseService(context);
    }
    /**
     * 加载会议室和会议数据
     */
    async loadMeetingData(config) {
        // 1. 加载所有会议室
        const roomRecords = await this.baseService.getRecordList(config.roomTableId, config.roomViewId || undefined);
        const rooms = [];
        const roomNameMap = new Map();
        for (const record of roomRecords) {
            const roomName = this.extractTextFromCell(record.fields[config.roomNameFieldId]);
            if (!roomName) {
                continue;
            }
            const room = {
                id: record.id,
                name: roomName,
                roomId: record.id,
                todayMeetings: [],
                status: 'available',
            };
            // 加载附件（如果配置了）
            if (config.mediaAttachmentsFieldId) {
                try {
                    room.attachments = await this.baseService.getAttachmentUrls(config.roomTableId, record.id, config.mediaAttachmentsFieldId);
                }
                catch (error) {
                    // 附件加载失败时静默处理，不输出日志
                    room.attachments = [];
                }
            }
            rooms.push(room);
            roomNameMap.set(roomName, room);
        }
        // 2. 加载今日预定
        const bookingRecords = await this.baseService.getRecordList(config.bookingTableId, config.bookingViewId || undefined);
        const allMeetings = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        for (const record of bookingRecords) {
            // 检查预定状态筛选
            if (config.bookingStatusFieldId) {
                const bookingStatus = this.extractTextFromCell(record.fields[config.bookingStatusFieldId]);
                if (bookingStatus !== config.bookingStatusValue) {
                    continue;
                }
            }
            const bookingRoomName = this.extractTextFromCell(record.fields[config.bookingRoomFieldId]);
            if (!bookingRoomName) {
                continue;
            }
            const matchedRoom = roomNameMap.get(bookingRoomName);
            if (!matchedRoom) {
                continue;
            }
            const meetingTitle = this.extractTextFromCell(record.fields[config.meetingTitleFieldId]) || '未命名会议';
            const startTime = this.extractDateTimeFromCell(record.fields[config.startTimeFieldId]);
            const endTime = this.extractDateTimeFromCell(record.fields[config.endTimeFieldId]);
            let organizer = '未知';
            if (config.organizerFieldId) {
                organizer = this.extractTextFromCell(record.fields[config.organizerFieldId]) || '未知';
            }
            if (startTime && endTime) {
                // 检查是否与今天有时间重叠
                if ((startTime < today && endTime > today) ||
                    (startTime >= today && startTime < tomorrow)) {
                    const meeting = {
                        id: record.id,
                        title: meetingTitle,
                        startTime: startTime.toISOString(),
                        endTime: endTime.toISOString(),
                        organizer,
                        roomName: matchedRoom.name,
                        roomId: matchedRoom.roomId,
                        status: this.getMeetingStatus(startTime, endTime),
                    };
                    allMeetings.push(meeting);
                    matchedRoom.todayMeetings.push(meeting);
                }
            }
        }
        // 3. 更新每个会议室的状态
        const updatedRooms = rooms.map(room => {
            // 按开始时间排序
            room.todayMeetings.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
            // 查找当前会议
            const now = new Date();
            const currentMeeting = room.todayMeetings.find(meeting => meeting.status === 'ongoing');
            if (currentMeeting) {
                room.currentMeeting = currentMeeting;
                room.status = 'in-use';
            }
            else {
                // 检查是否有即将开始的会议（10分钟内），但不显示soon状态，只用于停止视频播放
                const soonMeeting = room.todayMeetings.find(meeting => {
                    const timeUntilStart = new Date(meeting.startTime).getTime() - now.getTime();
                    return meeting.status === 'upcoming' && timeUntilStart <= 10 * 60 * 1000;
                });
                // 将soonMeeting信息附加到room上供前端使用，但状态显示为available
                room.currentMeeting = undefined;
                room.status = 'available';
                // 添加标记，用于前端判断是否需要停止视频
                room.hasUpcomingMeetingSoon = !!soonMeeting;
            }
            return room;
        });
        return { rooms: updatedRooms, allMeetings };
    }
    /**
     * 获取会议状态
     */
    getMeetingStatus(startTime, endTime) {
        const now = new Date();
        if (now >= startTime && now <= endTime) {
            return 'ongoing';
        }
        else if (now < startTime) {
            return 'upcoming';
        }
        else {
            return 'completed';
        }
    }
    /**
     * 从单元格提取文本
     */
    extractTextFromCell(cellValue) {
        if (!cellValue)
            return '';
        if (typeof cellValue === 'string') {
            return cellValue.trim();
        }
        if (typeof cellValue === 'object') {
            if (cellValue.text) {
                return String(cellValue.text).trim();
            }
            if (cellValue.name) {
                return String(cellValue.name).trim();
            }
            if (Array.isArray(cellValue) && cellValue.length > 0) {
                const firstItem = cellValue[0];
                if (firstItem?.text) {
                    return String(firstItem.text).trim();
                }
                else if (firstItem?.name) {
                    return String(firstItem.name).trim();
                }
                else if (typeof firstItem === 'string') {
                    return firstItem.trim();
                }
            }
        }
        return String(cellValue).trim();
    }
    /**
     * 从单元格提取日期时间
     */
    extractDateTimeFromCell(cellValue) {
        if (!cellValue)
            return null;
        try {
            if (typeof cellValue === 'number') {
                // 时间戳（毫秒）
                return new Date(cellValue);
            }
            else if (typeof cellValue === 'string') {
                const date = new Date(cellValue);
                return isNaN(date.getTime()) ? null : date;
            }
            else if (typeof cellValue === 'object') {
                if (cellValue.timestamp) {
                    return new Date(cellValue.timestamp);
                }
            }
        }
        catch (error) {
            console.warn('日期解析失败:', error);
        }
        return null;
    }
    /**
     * 结束会议
     * 将结束时间更新为当前时间，使用状态改为"已结束"
     */
    async endMeeting(params) {
        const { bookingTableId, recordId, endTimeFieldId, usageStatusFieldId, endTimeFieldName, usageStatusFieldName } = params;
        console.log('结束会议参数:', { bookingTableId, recordId, endTimeFieldId, usageStatusFieldId, endTimeFieldName, usageStatusFieldName });
        try {
            // 获取当前时间 - 飞书日期字段需要时间戳（毫秒）
            const now = new Date();
            const endTimeTimestamp = now.getTime();
            console.log('当前时间戳:', endTimeTimestamp);
            // 准备更新的字段 - 使用字段名称而不是字段 ID
            const fields = {};
            // 优先使用字段名称，如果没有则使用字段 ID
            const endTimeKey = endTimeFieldName || endTimeFieldId;
            fields[endTimeKey] = endTimeTimestamp;
            // 如果使用状态字段已配置，更新为"已结束"
            if (usageStatusFieldId || usageStatusFieldName) {
                const usageStatusKey = usageStatusFieldName || usageStatusFieldId;
                if (usageStatusKey) {
                    fields[usageStatusKey] = '已结束';
                }
            }
            console.log('准备更新的字段:', fields);
            // 调用 Base API 更新记录
            const result = await this.baseService.updateRecord(bookingTableId, recordId, fields);
            console.log('更新记录结果:', result);
            return {
                success: true,
                message: '会议已结束',
            };
        }
        catch (error) {
            console.error('结束会议失败:', error);
            throw new Error(error.message || '结束会议失败');
        }
    }
    /**
     * 快速预定会议
     * 创建一条新的预定记录
     */
    async quickBook(params) {
        const { bookingTableId, roomId, roomName, title, organizerId, organizerName, participantsFieldId, startTime, endTime, meetingTitleFieldId, bookingRoomFieldId, organizerFieldId, startTimeFieldId, endTimeFieldId, 
        // 字段名称
        meetingTitleFieldName, bookingRoomFieldName, organizerFieldName, participantsFieldName, startTimeFieldName, endTimeFieldName, } = params;
        try {
            // 构建字段数据 - 使用字段名称而不是字段ID
            const fields = {};
            // 会议标题 - 优先使用字段名称
            const titleKey = meetingTitleFieldName || meetingTitleFieldId;
            if (titleKey) {
                fields[titleKey] = title;
            }
            // 会议室 - 单选字段，使用字段名称 + 选项名称
            if (bookingRoomFieldName) {
                fields[bookingRoomFieldName] = roomName;
            }
            // 组织者 - 优先使用字段名称（CreatedUser类型字段不需要手动设置）
            // const organizerKey = organizerFieldName || organizerFieldId;
            // if (organizerKey) {
            //   fields[organizerKey] = organizerName;
            // }
            // 参与人（使用人员类型字段）- 暂时跳过
            // const participantsKey = participantsFieldName || participantsFieldId;
            // if (participantsKey && organizerId) {
            //   fields[participantsKey] = [organizerId];
            // }
            // 开始时间和结束时间（使用时间戳）- 优先使用字段名称
            const startTimeKey = startTimeFieldName || startTimeFieldId;
            const endTimeKey = endTimeFieldName || endTimeFieldId;
            if (startTimeKey) {
                fields[startTimeKey] = startTime;
            }
            if (endTimeKey) {
                fields[endTimeKey] = endTime;
            }
            // 创建记录
            const result = await this.baseService.createRecord(bookingTableId, fields);
            return {
                success: true,
                message: '预定成功',
                recordId: result.record_id,
            };
        }
        catch (error) {
            console.error('快速预定失败:', error);
            throw new Error(error.message || '快速预定失败');
        }
    }
    /**
     * 检查时间冲突
     * 检查指定时间段是否与现有会议冲突
     */
    async checkTimeConflict(bookingTableId, roomName, startTime, endTime, bookingRoomFieldId, startTimeFieldId, endTimeFieldId, excludeRecordId) {
        try {
            // 获取所有预定记录
            const records = await this.baseService.getRecordList(bookingTableId);
            const conflictingMeetings = [];
            for (const record of records) {
                // 跳过当前记录（用于更新时）
                if (excludeRecordId && record.id === excludeRecordId) {
                    continue;
                }
                // 检查是否是同一会议室
                if (bookingRoomFieldId) {
                    const recordRoom = this.extractTextFromCell(record.fields[bookingRoomFieldId]);
                    if (recordRoom !== roomName) {
                        continue;
                    }
                }
                // 获取会议时间
                let recordStartTime = null;
                let recordEndTime = null;
                if (startTimeFieldId && record.fields[startTimeFieldId]) {
                    const startValue = record.fields[startTimeFieldId];
                    recordStartTime = typeof startValue === 'number' ? startValue : new Date(startValue).getTime();
                }
                if (endTimeFieldId && record.fields[endTimeFieldId]) {
                    const endValue = record.fields[endTimeFieldId];
                    recordEndTime = typeof endValue === 'number' ? endValue : new Date(endValue).getTime();
                }
                // 如果没有时间信息，跳过
                if (!recordStartTime || !recordEndTime) {
                    continue;
                }
                // 检查时间冲突
                // 冲突条件：(start1 < end2) && (end1 > start2)
                if (startTime < recordEndTime && endTime > recordStartTime) {
                    conflictingMeetings.push({
                        id: record.id,
                        title: this.extractTextFromCell(record.fields[Object.keys(record.fields)[0]]) || '未命名会议',
                        startTime: new Date(recordStartTime).toISOString(),
                        endTime: new Date(recordEndTime).toISOString(),
                        organizer: '',
                        roomName,
                        roomId: '',
                        status: 'ongoing',
                    });
                }
            }
            return {
                hasConflict: conflictingMeetings.length > 0,
                conflictingMeetings,
            };
        }
        catch (error) {
            console.error('检查时间冲突失败:', error);
            throw new Error(error.message || '检查时间冲突失败');
        }
    }
}
export default MeetingRoomService;
//# sourceMappingURL=meetingRoomService.js.map
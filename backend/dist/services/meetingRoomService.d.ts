import type { MeetingRoomConfig, AttachmentInfo, RequestContext } from '../types/index.js';
/**
 * 会议室信息
 */
export interface MeetingRoom {
    id: string;
    name: string;
    roomId: string;
    currentMeeting?: Meeting;
    todayMeetings: Meeting[];
    status: 'available' | 'in-use' | 'soon';
    attachments?: AttachmentInfo[];
    hasUpcomingMeetingSoon?: boolean;
}
/**
 * 会议信息
 */
export interface Meeting {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    organizer: string;
    roomName: string;
    roomId: string;
    status: 'ongoing' | 'upcoming' | 'completed';
}
/**
 * 会议室业务服务
 */
export declare class MeetingRoomService {
    private baseService;
    constructor(context: RequestContext);
    /**
     * 加载会议室和会议数据
     */
    loadMeetingData(config: MeetingRoomConfig): Promise<{
        rooms: MeetingRoom[];
        allMeetings: Meeting[];
    }>;
    /**
     * 获取会议状态
     */
    private getMeetingStatus;
    /**
     * 从单元格提取文本
     */
    private extractTextFromCell;
    /**
     * 从单元格提取日期时间
     */
    private extractDateTimeFromCell;
    /**
     * 结束会议
     * 将结束时间更新为当前时间，使用状态改为"已结束"
     */
    endMeeting(params: {
        bookingTableId: string;
        recordId: string;
        endTimeFieldId: string;
        usageStatusFieldId?: string;
        endTimeFieldName?: string;
        usageStatusFieldName?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * 快速预定会议
     * 创建一条新的预定记录
     */
    quickBook(params: {
        bookingTableId: string;
        roomId: string;
        roomName: string;
        title: string;
        organizerId: string;
        organizerName: string;
        participantsFieldId?: string;
        startTime: number;
        endTime: number;
        meetingTitleFieldId?: string;
        bookingRoomFieldId?: string;
        organizerFieldId?: string;
        startTimeFieldId: string;
        endTimeFieldId: string;
        meetingTitleFieldName?: string;
        bookingRoomFieldName?: string;
        organizerFieldName?: string;
        participantsFieldName?: string;
        startTimeFieldName?: string;
        endTimeFieldName?: string;
    }): Promise<{
        success: boolean;
        message: string;
        recordId?: string;
    }>;
    /**
     * 检查时间冲突
     * 检查指定时间段是否与现有会议冲突
     */
    checkTimeConflict(bookingTableId: string, roomName: string, startTime: number, endTime: number, bookingRoomFieldId?: string, startTimeFieldId?: string, endTimeFieldId?: string, excludeRecordId?: string): Promise<{
        hasConflict: boolean;
        conflictingMeetings: Meeting[];
    }>;
}
export default MeetingRoomService;
//# sourceMappingURL=meetingRoomService.d.ts.map
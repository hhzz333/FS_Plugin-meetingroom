import BaseService from '../services/baseService.js';
import MeetingRoomService from '../services/meetingRoomService.js';
/**
 * 从请求头获取上下文
 */
function getContextFromRequest(req) {
    const appToken = req.headers['x-app-token'];
    const personalBaseToken = req.headers['x-personal-base-token'];
    if (!appToken || !personalBaseToken) {
        throw new Error('缺少必要的认证信息: x-app-token 和 x-personal-base-token');
    }
    return { appToken, personalBaseToken };
}
/**
 * 发送成功响应
 */
function sendSuccess(res, data, message = 'success') {
    res.json({
        code: 0,
        message,
        data,
    });
}
/**
 * 发送错误响应
 */
function sendError(res, message, code = 500, statusCode = 500) {
    res.status(statusCode).json({
        code,
        message,
        data: null,
    });
}
/**
 * Base API 控制器
 */
export const BaseController = {
    /**
     * 获取表格列表
     * GET /api/base/:appToken/tables
     */
    async getTableList(req, res) {
        try {
            const context = getContextFromRequest(req);
            const baseService = new BaseService(context);
            const tables = await baseService.getTableList();
            sendSuccess(res, tables);
        }
        catch (error) {
            console.error('获取表格列表失败:', error);
            sendError(res, error.message || '获取表格列表失败', 500, 500);
        }
    },
    /**
     * 获取字段列表
     * GET /api/base/:appToken/tables/:tableId/fields
     */
    async getFieldList(req, res) {
        try {
            const context = getContextFromRequest(req);
            const { tableId } = req.params;
            const baseService = new BaseService(context);
            const fields = await baseService.getFieldList(tableId);
            sendSuccess(res, fields);
        }
        catch (error) {
            console.error('获取字段列表失败:', error);
            sendError(res, error.message || '获取字段列表失败', 500, 500);
        }
    },
    /**
     * 获取记录列表
     * GET /api/base/:appToken/tables/:tableId/records
     */
    async getRecordList(req, res) {
        try {
            const context = getContextFromRequest(req);
            const { tableId } = req.params;
            const { viewId, filter } = req.query;
            const baseService = new BaseService(context);
            const records = await baseService.getRecordList(tableId, viewId, filter);
            sendSuccess(res, records);
        }
        catch (error) {
            console.error('获取记录列表失败:', error);
            sendError(res, error.message || '获取记录列表失败', 500, 500);
        }
    },
    /**
     * 获取单个记录
     * GET /api/base/:appToken/tables/:tableId/records/:recordId
     */
    async getRecord(req, res) {
        try {
            const context = getContextFromRequest(req);
            const { tableId, recordId } = req.params;
            const baseService = new BaseService(context);
            const record = await baseService.getRecord(tableId, recordId);
            sendSuccess(res, record);
        }
        catch (error) {
            console.error('获取记录失败:', error);
            sendError(res, error.message || '获取记录失败', 500, 500);
        }
    },
    /**
     * 获取单元格值
     * GET /api/base/:appToken/tables/:tableId/records/:recordId/fields/:fieldId
     */
    async getCellValue(req, res) {
        try {
            const context = getContextFromRequest(req);
            const { tableId, recordId, fieldId } = req.params;
            const baseService = new BaseService(context);
            const value = await baseService.getCellValue(tableId, recordId, fieldId);
            sendSuccess(res, { value });
        }
        catch (error) {
            console.error('获取单元格值失败:', error);
            sendError(res, error.message || '获取单元格值失败', 500, 500);
        }
    },
    /**
     * 获取附件 URL
     * GET /api/base/:appToken/tables/:tableId/records/:recordId/attachments
     */
    async getAttachmentUrls(req, res) {
        try {
            const context = getContextFromRequest(req);
            const { tableId, recordId } = req.params;
            const { fieldId } = req.query;
            if (!fieldId) {
                return sendError(res, '缺少 fieldId 参数', 400, 400);
            }
            const baseService = new BaseService(context);
            const attachments = await baseService.getAttachmentUrls(tableId, recordId, fieldId);
            sendSuccess(res, attachments);
        }
        catch (error) {
            console.error('获取附件 URL 失败:', error);
            sendError(res, error.message || '获取附件 URL 失败', 500, 500);
        }
    },
    /**
     * 代理附件下载
     * GET /api/proxy/attachment/:fileToken
     */
    async proxyAttachment(req, res) {
        console.log('========== 代理附件下载请求 ==========');
        console.log('fileToken:', req.params.fileToken);
        console.log('headers:', req.headers);
        try {
            const { fileToken } = req.params;
            const context = getContextFromRequest(req);
            console.log('代理附件下载请求:', { fileToken });
            // 构建飞书 Drive API URL
            const driveUrl = new URL('https://open.feishu.cn/open-apis/drive/v1/medias/batch_get_tmp_download_url');
            driveUrl.searchParams.append('file_tokens', fileToken);
            console.log('调用飞书 Drive API:', driveUrl.toString());
            // 调用飞书 Drive API 获取临时下载链接
            const response = await fetch(driveUrl.toString(), {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${context.personalBaseToken}`,
                },
            });
            const data = await response.json();
            console.log('飞书 Drive API 响应:', { code: data.code, msg: data.msg, hasUrls: !!data.data?.tmp_download_urls });
            if (data.code !== 0 || !data.data?.tmp_download_urls?.[0]?.tmp_download_url) {
                console.error('获取附件下载链接失败:', data);
                return sendError(res, `获取附件下载链接失败: ${data.msg || '未知错误'}`, 500, 500);
            }
            const downloadUrl = data.data.tmp_download_urls[0].tmp_download_url;
            console.log('获取到下载 URL:', downloadUrl.substring(0, 100) + '...');
            // 代理视频流
            try {
                console.log('开始代理视频流...');
                const videoResponse = await fetch(downloadUrl);
                console.log('视频流响应:', {
                    status: videoResponse.status,
                    statusText: videoResponse.statusText,
                    contentType: videoResponse.headers.get('content-type'),
                    contentLength: videoResponse.headers.get('content-length'),
                });
                if (!videoResponse.ok) {
                    console.error('获取视频流失败:', videoResponse.status, videoResponse.statusText);
                    return sendError(res, '获取视频流失败', 500, 500);
                }
                // 设置响应头
                const contentType = videoResponse.headers.get('content-type') || 'video/mp4';
                res.setHeader('Content-Type', contentType);
                res.setHeader('Accept-Ranges', 'bytes');
                // 转发内容长度（如果有）
                const contentLength = videoResponse.headers.get('content-length');
                if (contentLength) {
                    res.setHeader('Content-Length', contentLength);
                }
                // 转发响应体
                const arrayBuffer = await videoResponse.arrayBuffer();
                console.log('视频流大小:', arrayBuffer.byteLength, 'bytes');
                res.send(Buffer.from(arrayBuffer));
                console.log('视频流代理完成');
            }
            catch (proxyError) {
                console.error('代理视频流失败:', proxyError);
                // 如果代理失败，回退到重定向
                res.redirect(downloadUrl);
            }
        }
        catch (error) {
            console.error('代理附件下载失败:', error);
            sendError(res, error.message || '代理附件下载失败', 500, 500);
        }
    },
};
/**
 * 会议室控制器
 */
export const MeetingRoomController = {
    /**
     * 加载会议室数据
     * POST /api/meetingroom/data
     */
    async loadMeetingData(req, res) {
        try {
            const context = getContextFromRequest(req);
            const config = req.body;
            // 验证必要配置
            if (!config.roomTableId || !config.bookingTableId) {
                return sendError(res, '缺少必要的配置信息', 400, 400);
            }
            const meetingRoomService = new MeetingRoomService(context);
            const data = await meetingRoomService.loadMeetingData(config);
            sendSuccess(res, data);
        }
        catch (error) {
            console.error('加载会议室数据失败:', error);
            sendError(res, error.message || '加载会议室数据失败', 500, 500);
        }
    },
    /**
     * 结束会议
     * POST /api/meetingroom/end
     */
    async endMeeting(req, res) {
        try {
            const context = getContextFromRequest(req);
            const { bookingTableId, recordId, endTimeFieldId, usageStatusFieldId, endTimeFieldName, usageStatusFieldName } = req.body;
            // 验证必要参数
            if (!bookingTableId || !recordId || !endTimeFieldId) {
                return sendError(res, '缺少必要的参数: bookingTableId, recordId, endTimeFieldId', 400, 400);
            }
            const meetingRoomService = new MeetingRoomService(context);
            const result = await meetingRoomService.endMeeting({
                bookingTableId,
                recordId,
                endTimeFieldId,
                usageStatusFieldId,
                endTimeFieldName,
                usageStatusFieldName,
            });
            sendSuccess(res, result, '会议已结束');
        }
        catch (error) {
            console.error('结束会议失败:', error);
            sendError(res, error.message || '结束会议失败', 500, 500);
        }
    },
    /**
     * 检查时间冲突
     * POST /api/meetingroom/check-conflict
     */
    async checkConflict(req, res) {
        try {
            const context = getContextFromRequest(req);
            const { bookingTableId, roomName, startTime, endTime, bookingRoomFieldId, startTimeFieldId, endTimeFieldId, } = req.body;
            // 验证必要参数
            if (!bookingTableId || !roomName || !startTime || !endTime) {
                return sendError(res, '缺少必要的参数', 400, 400);
            }
            const meetingRoomService = new MeetingRoomService(context);
            const result = await meetingRoomService.checkTimeConflict(bookingTableId, roomName, startTime, endTime, bookingRoomFieldId, startTimeFieldId, endTimeFieldId);
            sendSuccess(res, result);
        }
        catch (error) {
            console.error('检查时间冲突失败:', error);
            sendError(res, error.message || '检查时间冲突失败', 500, 500);
        }
    },
    /**
     * 快速预定
     * POST /api/meetingroom/quick-book
     */
    async quickBook(req, res) {
        try {
            const context = getContextFromRequest(req);
            const { bookingTableId, roomId, roomName, title, organizerId, organizerName, participantsFieldId, startTime, endTime, meetingTitleFieldId, bookingRoomFieldId, organizerFieldId, startTimeFieldId, endTimeFieldId, 
            // 字段名称
            meetingTitleFieldName, bookingRoomFieldName, organizerFieldName, participantsFieldName, startTimeFieldName, endTimeFieldName, } = req.body;
            // 验证必要参数
            if (!bookingTableId || !roomId || !roomName || !startTime || !endTime) {
                return sendError(res, '缺少必要的参数', 400, 400);
            }
            // 先检查时间冲突
            const meetingRoomService = new MeetingRoomService(context);
            const conflictResult = await meetingRoomService.checkTimeConflict(bookingTableId, roomName, startTime, endTime, bookingRoomFieldId, startTimeFieldId, endTimeFieldId);
            if (conflictResult.hasConflict) {
                return sendError(res, '该时间段与现有会议冲突', 409, 409);
            }
            // 创建预定记录
            const result = await meetingRoomService.quickBook({
                bookingTableId,
                roomId,
                roomName,
                title: title || '快速会议',
                organizerId: organizerId || '',
                organizerName: organizerName || '',
                participantsFieldId,
                startTime,
                endTime,
                meetingTitleFieldId,
                bookingRoomFieldId,
                organizerFieldId,
                startTimeFieldId,
                endTimeFieldId,
                // 字段名称
                meetingTitleFieldName,
                bookingRoomFieldName,
                organizerFieldName,
                participantsFieldName,
                startTimeFieldName,
                endTimeFieldName,
            });
            sendSuccess(res, result, '预定成功');
        }
        catch (error) {
            console.error('快速预定失败:', error);
            sendError(res, error.message || '快速预定失败', 500, 500);
        }
    },
};
export default { BaseController, MeetingRoomController };
//# sourceMappingURL=baseController.js.map
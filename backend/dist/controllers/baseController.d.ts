import type { Request, Response } from 'express';
/**
 * Base API 控制器
 */
export declare const BaseController: {
    /**
     * 获取表格列表
     * GET /api/base/:appToken/tables
     */
    getTableList(req: Request, res: Response): Promise<void>;
    /**
     * 获取字段列表
     * GET /api/base/:appToken/tables/:tableId/fields
     */
    getFieldList(req: Request, res: Response): Promise<void>;
    /**
     * 获取记录列表
     * GET /api/base/:appToken/tables/:tableId/records
     */
    getRecordList(req: Request, res: Response): Promise<void>;
    /**
     * 获取单个记录
     * GET /api/base/:appToken/tables/:tableId/records/:recordId
     */
    getRecord(req: Request, res: Response): Promise<void>;
    /**
     * 获取单元格值
     * GET /api/base/:appToken/tables/:tableId/records/:recordId/fields/:fieldId
     */
    getCellValue(req: Request, res: Response): Promise<void>;
    /**
     * 获取附件 URL
     * GET /api/base/:appToken/tables/:tableId/records/:recordId/attachments
     */
    getAttachmentUrls(req: Request, res: Response): Promise<void>;
    /**
     * 代理附件下载
     * GET /api/proxy/attachment/:fileToken
     */
    proxyAttachment(req: Request, res: Response): Promise<void>;
};
/**
 * 会议室控制器
 */
export declare const MeetingRoomController: {
    /**
     * 加载会议室数据
     * POST /api/meetingroom/data
     */
    loadMeetingData(req: Request, res: Response): Promise<void>;
    /**
     * 结束会议
     * POST /api/meetingroom/end
     */
    endMeeting(req: Request, res: Response): Promise<void>;
    /**
     * 检查时间冲突
     * POST /api/meetingroom/check-conflict
     */
    checkConflict(req: Request, res: Response): Promise<void>;
    /**
     * 快速预定
     * POST /api/meetingroom/quick-book
     */
    quickBook(req: Request, res: Response): Promise<void>;
};
declare const _default: {
    BaseController: {
        /**
         * 获取表格列表
         * GET /api/base/:appToken/tables
         */
        getTableList(req: Request, res: Response): Promise<void>;
        /**
         * 获取字段列表
         * GET /api/base/:appToken/tables/:tableId/fields
         */
        getFieldList(req: Request, res: Response): Promise<void>;
        /**
         * 获取记录列表
         * GET /api/base/:appToken/tables/:tableId/records
         */
        getRecordList(req: Request, res: Response): Promise<void>;
        /**
         * 获取单个记录
         * GET /api/base/:appToken/tables/:tableId/records/:recordId
         */
        getRecord(req: Request, res: Response): Promise<void>;
        /**
         * 获取单元格值
         * GET /api/base/:appToken/tables/:tableId/records/:recordId/fields/:fieldId
         */
        getCellValue(req: Request, res: Response): Promise<void>;
        /**
         * 获取附件 URL
         * GET /api/base/:appToken/tables/:tableId/records/:recordId/attachments
         */
        getAttachmentUrls(req: Request, res: Response): Promise<void>;
        /**
         * 代理附件下载
         * GET /api/proxy/attachment/:fileToken
         */
        proxyAttachment(req: Request, res: Response): Promise<void>;
    };
    MeetingRoomController: {
        /**
         * 加载会议室数据
         * POST /api/meetingroom/data
         */
        loadMeetingData(req: Request, res: Response): Promise<void>;
        /**
         * 结束会议
         * POST /api/meetingroom/end
         */
        endMeeting(req: Request, res: Response): Promise<void>;
        /**
         * 检查时间冲突
         * POST /api/meetingroom/check-conflict
         */
        checkConflict(req: Request, res: Response): Promise<void>;
        /**
         * 快速预定
         * POST /api/meetingroom/quick-book
         */
        quickBook(req: Request, res: Response): Promise<void>;
    };
};
export default _default;
//# sourceMappingURL=baseController.d.ts.map
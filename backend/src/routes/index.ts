import { Router } from 'express';
import { BaseController, MeetingRoomController } from '../controllers/baseController.js';
import { serveVideoCache, clearVideoCache, getCacheStatus } from '../controllers/videoController.js';

const router = Router();

/**
 * 健康检查
 */
router.get('/health', (req, res) => {
  res.json({
    code: 0,
    message: 'ok',
    data: {
      status: 'running',
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * Base API 路由
 * 所有路由需要在请求头中携带:
 * - x-app-token: Base 的 AppToken
 * - x-personal-base-token: 用户的 PersonalBaseToken
 */

// 获取表格列表
router.get('/base/tables', BaseController.getTableList);

// 获取字段列表
router.get('/base/tables/:tableId/fields', BaseController.getFieldList);

// 获取记录列表
router.get('/base/tables/:tableId/records', BaseController.getRecordList);

// 获取单个记录
router.get('/base/tables/:tableId/records/:recordId', BaseController.getRecord);

// 获取单元格值
router.get('/base/tables/:tableId/records/:recordId/fields/:fieldId', BaseController.getCellValue);

// 获取附件 URL
router.get('/base/tables/:tableId/records/:recordId/attachments', BaseController.getAttachmentUrls);

// 代理附件下载
router.get('/proxy/attachment/:fileToken', BaseController.proxyAttachment);

// 提供本地缓存的视频文件
router.get('/cache/video/:fileToken', serveVideoCache);

// 清除视频缓存
router.delete('/cache/video/:fileToken', clearVideoCache);

// 获取缓存状态
router.get('/cache/status', getCacheStatus);

/**
 * 会议室业务路由
 */

// 加载会议室数据
router.post('/meetingroom/data', MeetingRoomController.loadMeetingData);

// 结束会议
router.post('/meetingroom/end', MeetingRoomController.endMeeting);

// 检查时间冲突
router.post('/meetingroom/check-conflict', MeetingRoomController.checkConflict);

// 快速预定
router.post('/meetingroom/quick-book', MeetingRoomController.quickBook);

export default router;

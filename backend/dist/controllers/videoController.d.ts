import type { Request, Response } from 'express';
/**
 * 清除视频缓存
 * DELETE /api/cache/video/:fileToken
 */
export declare function clearVideoCache(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 获取缓存状态
 * GET /api/cache/status
 */
export declare function getCacheStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * 提供本地缓存的视频文件
 * GET /api/cache/video/:fileToken
 */
export declare function serveVideoCache(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=videoController.d.ts.map
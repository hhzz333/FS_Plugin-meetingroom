import type { Request, Response, NextFunction } from 'express';
/**
 * 请求日志中间件
 * 只在非开发环境或需要时启用详细日志
 */
export declare function requestLogger(req: Request, res: Response, next: NextFunction): void;
declare const _default: {
    requestLogger: typeof requestLogger;
};
export default _default;
//# sourceMappingURL=logger.d.ts.map
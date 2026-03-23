import type { Request, Response, NextFunction } from 'express';
/**
 * 自定义错误类
 */
export declare class ApiError extends Error {
    statusCode: number;
    code: number;
    constructor(message: string, statusCode?: number, code?: number);
}
/**
 * 404 错误处理
 */
export declare function notFoundHandler(req: Request, res: Response, next: NextFunction): void;
/**
 * 全局错误处理
 */
export declare function errorHandler(err: Error | ApiError, req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
declare const _default: {
    notFoundHandler: typeof notFoundHandler;
    errorHandler: typeof errorHandler;
    ApiError: typeof ApiError;
};
export default _default;
//# sourceMappingURL=errorHandler.d.ts.map
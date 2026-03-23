/**
 * 自定义错误类
 */
export class ApiError extends Error {
    statusCode;
    code;
    constructor(message, statusCode = 500, code = 500) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = 'ApiError';
    }
}
/**
 * 404 错误处理
 */
export function notFoundHandler(req, res, next) {
    res.status(404).json({
        code: 404,
        message: `路由未找到: ${req.method} ${req.originalUrl}`,
        data: null,
    });
}
/**
 * 全局错误处理
 */
export function errorHandler(err, req, res, next) {
    console.error('错误:', err);
    // 如果是自定义 API 错误
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            code: err.code,
            message: err.message,
            data: null,
        });
    }
    // 飞书 SDK 错误
    if (err.name === 'LarkAPIError' || err.message?.includes('lark')) {
        return res.status(500).json({
            code: 5001,
            message: '飞书 API 调用失败: ' + err.message,
            data: null,
        });
    }
    // 默认错误响应
    res.status(500).json({
        code: 500,
        message: err.message || '服务器内部错误',
        data: null,
    });
}
export default { notFoundHandler, errorHandler, ApiError };
//# sourceMappingURL=errorHandler.js.map
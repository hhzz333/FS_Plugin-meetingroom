import type { Request, Response, NextFunction } from 'express';

/**
 * 请求日志中间件
 * 只在非开发环境或需要时启用详细日志
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const method = req.method;
    const url = req.originalUrl;
    const status = res.statusCode;

    // 只记录 API 请求，跳过静态资源
    if (url.startsWith('/api/')) {
      console.log(`${method} ${url} ${status} - ${duration}ms`);
    }
  });

  next();
}

export default { requestLogger };

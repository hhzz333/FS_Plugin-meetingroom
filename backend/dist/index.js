import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logger.js';
// 加载环境变量
dotenv.config();
const app = express();
const PORT = Number(process.env.PORT) || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
// 安全中间件
app.use(helmet({
    contentSecurityPolicy: false, // 允许加载外部资源（如飞书附件）
}));
// CORS 配置
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-app-token', 'x-personal-base-token'],
}));
// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// 日志中间件
if (NODE_ENV === 'development') {
    app.use(morgan('dev'));
}
app.use(requestLogger);
// API 路由
app.use('/api', routes);
// 根路径
app.get('/', (req, res) => {
    res.json({
        name: '会议室看板后端服务',
        version: '1.0.0',
        description: '基于 BaseOpenSDK 的会议室数据服务',
        documentation: 'https://feishu.feishu.cn/docx/RlrpdAGwnoONCaxmIVQcD7MZnug',
        endpoints: {
            health: 'GET /api/health',
            tables: 'GET /api/base/:appToken/tables',
            fields: 'GET /api/base/:appToken/tables/:tableId/fields',
            records: 'GET /api/base/:appToken/tables/:tableId/records',
            record: 'GET /api/base/:appToken/tables/:tableId/records/:recordId',
            cellValue: 'GET /api/base/:appToken/tables/:tableId/records/:recordId/fields/:fieldId',
            attachments: 'GET /api/base/:appToken/tables/:tableId/records/:recordId/attachments',
            meetingRoomData: 'POST /api/meetingroom/data',
        },
    });
});
// 错误处理
app.use(notFoundHandler);
app.use(errorHandler);
// 启动服务器
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║     会议室看板后端服务已启动                             ║
║                                                          ║
║     环境: ${NODE_ENV.padEnd(47)}║
║     端口: ${String(PORT).padEnd(47)}║
║     地址: http://${HOST}:${String(PORT).padEnd(32)}║
║     本机访问: http://localhost:${String(PORT).padEnd(26)}║
║     局域网访问: http://172.21.1.120:${String(PORT).padEnd(21)}║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);
});
export default app;
//# sourceMappingURL=index.js.map
# 会议室看板 - 部署指南

## 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                    安卓应用 (Capacitor)                  │
│                   React + TypeScript                    │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTPS
┌─────────────────────────┴───────────────────────────────┐
│                    后端服务 (Node.js)                    │
│                   Express + BaseOpenSDK                 │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────┐
│              飞书开放平台 API (BaseOpenSDK)               │
└─────────────────────────────────────────────────────────┘
```

## 部署步骤

### 1. 后端服务部署

#### 1.1 安装依赖

```bash
cd backend
npm install
```

#### 1.2 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
PORT=3000
NODE_ENV=production
CORS_ORIGIN=*
LOG_LEVEL=info
```

#### 1.3 启动服务

开发模式：
```bash
npm run dev
```

生产模式：
```bash
npm run build
npm start
```

#### 1.4 使用 PM2 部署（推荐）

```bash
npm install -g pm2
pm2 start dist/index.js --name meetingroom-backend
pm2 save
pm2 startup
```

### 2. 前端应用构建

#### 2.1 安装依赖

```bash
npm install
```

#### 2.2 配置 API 地址

创建 `.env.production` 文件：

```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

#### 2.3 构建 Web 应用

```bash
npm run build
```

### 3. 安卓应用构建

#### 3.1 添加安卓平台

```bash
npx cap add android
```

#### 3.2 同步 Web 资源到安卓项目

```bash
npx cap sync android
```

#### 3.3 打开 Android Studio

```bash
npx cap open android
```

#### 3.4 在 Android Studio 中构建 APK

1. 等待 Gradle 同步完成
2. 点击菜单栏 `Build` → `Generate Signed Bundle / APK`
3. 选择 `APK`
4. 配置签名密钥（首次需要创建）
5. 选择 `release` 构建类型
6. 点击 `Finish` 生成 APK

### 4. 服务器配置

#### 4.1 Nginx 反向代理配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 后端 API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # 前端静态资源（可选，如果使用独立部署）
    location / {
        root /path/to/your/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

#### 4.2 使用 HTTPS（推荐）

使用 Let's Encrypt 获取免费 SSL 证书：

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 5. 飞书配置

#### 5.1 获取认证信息

1. 打开飞书多维表格
2. 点击右上角「...」→「开发工具」
3. 复制以下信息：
   - **AppToken** (BaseId): 多维表格的唯一标识
   - **PersonalBaseToken**: 用户授权码

#### 5.2 表格结构要求

**会议室表**：
- 会议室名称（文本字段）
- 会议室ID（可选，文本字段）
- 媒体附件（附件字段，可选）

**预订表**：
- 会议室名称（关联字段或文本字段）
- 会议标题（文本字段）
- 开始时间（日期时间字段）
- 结束时间（日期时间字段）
- 组织者（人员字段或文本字段，可选）
- 预订状态（单选字段，可选）

## 使用说明

### 首次使用

1. 安装并打开安卓应用
2. 点击「配置认证」按钮
3. 输入从飞书获取的 AppToken 和 PersonalBaseToken
4. 配置会议室表和预订表的字段映射
5. 保存配置，应用将自动加载会议室数据

### 数据刷新

- 应用每分钟自动刷新一次数据
- 手动刷新：点击刷新按钮（如果有）

### 视频播放

- 在会议室表中添加视频附件
- 配置「媒体附件字段」
- 应用将在会议室空闲时自动播放视频

## 故障排除

### 后端服务无法启动

1. 检查端口是否被占用
2. 检查 Node.js 版本（需要 18+）
3. 查看日志：`pm2 logs meetingroom-backend`

### 安卓应用无法连接后端

1. 检查网络连接
2. 确认后端服务地址配置正确
3. 检查防火墙设置
4. 确认使用 HTTPS（安卓 9+ 要求）

### 数据加载失败

1. 检查认证信息是否正确
2. 确认表格和字段配置正确
3. 检查后端服务日志
4. 确认飞书表格权限设置

### 视频无法播放

1. 检查视频格式（支持 MP4、WebM 等）
2. 确认附件字段配置正确
3. 检查网络连接
4. 确认视频 URL 未过期

## 安全建议

1. **使用 HTTPS**: 生产环境必须使用 HTTPS
2. **限制 CORS**: 配置 `CORS_ORIGIN` 只允许特定域名访问
3. **定期更换 Token**: PersonalBaseToken 建议定期更换
4. **访问控制**: 后端服务添加 IP 白名单（可选）
5. **日志清理**: 定期清理日志文件，避免敏感信息泄露

## 性能优化

1. **启用 Gzip**: Nginx 配置中启用 gzip 压缩
2. **使用 CDN**: 静态资源使用 CDN 加速（可选）
3. **数据库缓存**: 后端添加 Redis 缓存（可选）
4. **图片优化**: 视频和图片使用适当的压缩

## 更新维护

### 更新后端

```bash
cd backend
git pull
npm install
npm run build
pm2 restart meetingroom-backend
```

### 更新安卓应用

1. 更新代码
2. 重新构建 Web 资源：`npm run build`
3. 同步到安卓项目：`npx cap sync android`
4. 在 Android Studio 中重新构建 APK
5. 分发新版 APK 给用户

## 技术支持

- 飞书 BaseOpenSDK 文档：https://feishu.feishu.cn/docx/RlrpdAGwnoONCaxmIVQcD7MZnug
- Capacitor 文档：https://capacitorjs.com/docs
- 项目 Issues：（添加你的仓库地址）

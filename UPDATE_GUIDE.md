# 会议室看板 - 版本更新文档

## 目录
- [一、前端更新流程](#一前端更新流程)
- [二、后端更新流程](#二后端更新流程)
- [三、常见问题排查](#三常见问题排查)
- [四、版本管理建议](#四版本管理建议)

---

## 一、前端更新流程

### 1.1 修改代码
```bash
cd c:\Users\admin\Desktop\meetingroom_new
# 修改前端代码...
```

### 1.2 本地测试
```bash
# 启动开发服务器
npm run dev

# 浏览器访问
http://localhost:5173

# 测试功能是否正常
```

### 1.3 构建前端
```bash
npm run build
```

### 1.4 同步到 Android
```bash
npx cap sync android
```

### 1.5 构建 APK

#### Debug 版本（测试用）
```bash
cd android
.\gradlew.bat clean
.\gradlew.bat assembleDebug

# APK 位置
# android\app\build\outputs\apk\debug\app-debug.apk
```

#### Release 版本（正式发布）
```bash
cd android
.\gradlew.bat clean
.\gradlew.bat assembleRelease

# APK 位置
# android\app\build\outputs\apk\release\app-release.apk
```

### 1.6 安装新 APK

#### 方式一：ADB 安装
```powershell
# 1. 手机连接电脑（USB）
# 2. 启用 USB 调试模式
#    手机：设置 → 开发者选项 → USB 调试

# 3. 安装 APK
adb install -r android\app\build\outputs\apk\debug\app-debug.apk

# 4. 查看日志
adb logcat | findstr meetingroom
```

#### 方式二：手动安装
1. 将 APK 传输到手机（微信、文件传输等）
2. 在手机上找到 APK 文件
3. 点击安装
4. 允许未知来源（首次安装）
5. 等待安装完成

### 1.7 验证更新
1. 打开应用
2. 检查新功能是否正常
3. 检查是否能正常访问后端
4. 检查数据加载是否正常

---

## 二、后端更新流程

### 2.1 修改代码
```bash
cd c:\Users\admin\Desktop\meetingroom_new\backend
# 修改后端代码...
```

### 2.2 本地测试
```bash
npm run dev

# 测试 API 是否正常
curl http://localhost:3000/api/health
```

### 2.3 构建后端
```bash
npm run build
```

### 2.4 上传到服务器

#### 方式一：复制文件
```powershell
# 复制 backend 文件夹到服务器
Copy-Item -Recurse -Path "backend" -Destination "\\172.21.1.120\c$\Apps\meetingroom\backend"
```

#### 方式二：压缩上传
```powershell
# 1. 压缩
Compress-Archive -Path "backend" -DestinationPath "backend.zip"

# 2. 上传到服务器

# 3. 在服务器解压
Expand-Archive -Path "backend.zip" -DestinationPath "C:\Apps\meetingroom"
```

### 2.5 在服务器上更新

#### 1. 停止服务
```powershell
pm2 stop meetingroom
```

#### 2. 进入后端目录
```powershell
cd C:\Apps\meetingroom\backend
```

#### 3. 安装依赖（如果有新依赖）
```powershell
npm install --production
```

#### 4. 重新构建
```powershell
npm run build
```

#### 5. 启动服务
```powershell
pm2 start dist\index.js --name meetingroom
```

#### 6. 查看日志
```powershell
pm2 logs meetingroom
```

### 2.6 验证后端

#### 1. 测试健康检查
```powershell
curl http://localhost:3000/api/health
```

#### 2. 测试 API
```powershell
curl http://172.21.1.120:3000/api/health
```

#### 3. 检查服务状态
```powershell
pm2 status
```

---

## 三、常见问题排查

### 3.1 前端问题

#### 问题：应用无法访问后端
**原因分析**
- 网络配置问题
- 后端服务未启动
- 防火墙阻止

**解决方案**
1. 检查网络连接
   ```bash
   # 在设备浏览器中测试
   http://172.21.1.120:3000/api/health
   ```

2. 检查后端服务
   ```powershell
   pm2 status
   pm2 logs meetingroom
   ```

3. 检查防火墙
   ```powershell
   netsh advfirewall firewall show rule name="MeetingRoom Backend"
   ```

#### 问题：应用崩溃
**解决方案**
1. 使用 ADB 查看日志
   ```powershell
   adb logcat | findstr meetingroom
   ```

2. 在 Android Studio 中查看 Logcat

#### 问题：数据加载失败
**解决方案**
1. 检查认证信息是否正确
2. 检查表格配置是否正确
3. 查看网络请求日志

### 3.2 后端问题

#### 问题：服务启动失败
**解决方案**
1. 查看错误日志
   ```powershell
   pm2 logs meetingroom
   ```

2. 检查端口是否被占用
   ```powershell
   netstat -ano | findstr :3000
   ```

3. 检查依赖是否安装
   ```powershell
   npm install --production
   ```

#### 问题：PM2 守护进程错误
**解决方案**
1. 完全重置 PM2
   ```powershell
   pm2 kill
   pm2 delete all
   pm2 resurrect
   ```

2. 以管理员身份运行 PowerShell

#### 问题：无法访问 API
**解决方案**
1. 检查防火墙规则
   ```powershell
   netsh advfirewall firewall add rule name="MeetingRoom Backend" dir=in action=allow protocol=tcp localport=3000
   ```

2. 检查后端监听地址
   - 确保后端监听 `0.0.0.0:3000`
   - 不是 `localhost:3000`

---

## 四、版本管理建议

### 4.1 版本类型对比

| 版本类型 | 用途 | 性能 | 文件大小 | 代码混淆 | 签名 | 调试信息 |
|---------|------|------|---------|---------|------|---------|
| Debug | 开发/测试 | 一般 | 较大 | ❌ | ❌ | 完整 |
| Release | 正式发布 | 更好 | 较小 | ✅ 可选 | ✅ 必须 | 精简 |

### 4.2 版本更新策略

| 场景 | 推荐版本 | 更新频率 |
|------|----------|---------|
| 个人测试 | Debug | 随时 |
| 少量设备测试 | Debug | 每日 |
| 正式部署到平板 | Release | 按需 |
| 分发给同事 | Release | 按需 |

### 4.3 版本号管理

#### 当前版本号
```gradle
// android/app/build.gradle
versionCode 1
versionName "1.0"
```

#### 更新版本号
每次发布新版本时：
1. `versionCode` +1
2. `versionName` 递增（如 1.0 → 1.1）

### 4.4 签名管理

#### 生成签名密钥（只需一次）
```powershell
keytool -genkey -v -keystore meetingroom.keystore -alias meetingroom -keyalg RSA -keysize 2048 -validity 10000
```

#### 签名配置
```gradle
// android/app/build.gradle
signingConfigs {
    release {
        storeFile file('../../meetingroom.keystore')
        storePassword 'your_keystore_password'
        keyAlias 'meetingroom'
        keyPassword 'your_key_password'
    }
}
```

#### 安全提示
| 事项 | 说明 |
|------|------|
| 备份密钥文件 | `meetingroom.keystore` 必须妥善保存 |
| 记住密码 | 忘记密码无法找回 |
| 同一密钥 | 更新应用必须使用同一密钥 |

---

## 五、快速参考

### 5.1 前端快速更新
```bash
cd c:\Users\admin\Desktop\meetingroom_new
npm run build && npx cap sync android && cd android && .\gradlew.bat clean && .\gradlew.bat assembleDebug
```

### 5.2 后端快速更新
```powershell
# 在服务器上执行
cd C:\Apps\meetingroom\backend
pm2 stop meetingroom
npm install --production
npm run build
pm2 start dist\index.js --name meetingroom
pm2 logs meetingroom
```

### 5.3 常用命令

| 操作 | 命令 |
|------|------|
| 查看后端状态 | `pm2 status` |
| 查看后端日志 | `pm2 logs meetingroom` |
| 重启后端 | `pm2 restart meetingroom` |
| 停止后端 | `pm2 stop meetingroom` |
| 查看设备 | `adb devices` |
| 查看应用日志 | `adb logcat \| findstr meetingroom` |
| 安装 APK | `adb install -r app-debug.apk` |

---

## 六、环境配置

### 6.1 前端环境变量

#### 开发环境（.env）
```env
VITE_API_BASE_URL=http://172.21.1.120:3000/api
```

#### 生产环境（.env.production）
```env
VITE_API_BASE_URL=http://172.21.1.120:3000/api
```

### 6.2 后端环境变量

#### 开发环境（.env）
```env
PORT=3000
NODE_ENV=development
```

#### 生产环境（.env.production）
```env
PORT=3000
NODE_ENV=production
```

---

## 七、检查清单

### 7.1 前端更新检查清单
- [ ] 代码修改完成
- [ ] 本地测试通过
- [ ] 前端构建成功
- [ ] 同步到 Android 成功
- [ ] APK 生成成功
- [ ] APK 安装到设备
- [ ] 应用启动正常
- [ ] 功能测试通过
- [ ] 后端连接正常
- [ ] 数据加载正常

### 7.2 后端更新检查清单
- [ ] 代码修改完成
- [ ] 本地测试通过
- [ ] 后端构建成功
- [ ] 代码上传到服务器
- [ ] 依赖安装完成
- [ ] 后端构建成功
- [ ] 服务启动成功
- [ ] API 健康检查通过
- [ ] 防火墙配置正确
- [ ] 局域网访问正常

---

## 八、联系与支持

### 8.1 问题反馈
如遇到问题，请提供以下信息：
1. 操作系统版本
2. Node.js 版本
3. 错误信息截图
4. 相关日志

### 8.2 更新日志
建议记录每次更新的内容：
- 更新日期
- 更新内容
- 遇到的问题
- 解决方案

---

**文档版本：** v1.0
**最后更新：** 2026-02-05
**维护者：** MeetingRoom Team

import fs from 'fs';
import path from 'path';
import os from 'os';
/**
 * 清除视频缓存
 * DELETE /api/cache/video/:fileToken
 */
export async function clearVideoCache(req, res) {
    try {
        const { fileToken } = req.params;
        const cacheDir = path.join(os.tmpdir(), 'meetingroom-videos');
        if (!fs.existsSync(cacheDir)) {
            return res.json({
                code: 0,
                message: '缓存目录不存在',
                data: null,
            });
        }
        const files = fs.readdirSync(cacheDir);
        const matchingFiles = files.filter(file => file.startsWith(fileToken));
        let deletedCount = 0;
        for (const file of matchingFiles) {
            const filePath = path.join(cacheDir, file);
            try {
                fs.unlinkSync(filePath);
                deletedCount++;
            }
            catch (e) {
                console.warn(`删除缓存文件失败: ${file}`, e);
            }
        }
        res.json({
            code: 0,
            message: `已清除 ${deletedCount} 个缓存文件`,
            data: { deletedCount },
        });
    }
    catch (error) {
        console.error('清除视频缓存失败:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '清除视频缓存失败',
            data: null,
        });
    }
}
/**
 * 获取缓存状态
 * GET /api/cache/status
 */
export async function getCacheStatus(req, res) {
    try {
        const cacheDir = path.join(os.tmpdir(), 'meetingroom-videos');
        if (!fs.existsSync(cacheDir)) {
            return res.json({
                code: 0,
                message: 'success',
                data: {
                    totalFiles: 0,
                    totalSize: 0,
                    files: [],
                },
            });
        }
        const files = fs.readdirSync(cacheDir);
        const fileStats = files.map(file => {
            const filePath = path.join(cacheDir, file);
            const stat = fs.statSync(filePath);
            return {
                name: file,
                size: stat.size,
                modifiedTime: stat.mtime,
                age: Date.now() - stat.mtime.getTime(),
                expired: (Date.now() - stat.mtime.getTime()) > 24 * 60 * 60 * 1000,
            };
        });
        const totalSize = fileStats.reduce((sum, f) => sum + f.size, 0);
        res.json({
            code: 0,
            message: 'success',
            data: {
                totalFiles: files.length,
                totalSize,
                files: fileStats,
            },
        });
    }
    catch (error) {
        console.error('获取缓存状态失败:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '获取缓存状态失败',
            data: null,
        });
    }
}
/**
 * 提供本地缓存的视频文件
 * GET /api/cache/video/:fileToken
 */
export async function serveVideoCache(req, res) {
    try {
        const { fileToken } = req.params;
        // 构建缓存目录路径
        const cacheDir = path.join(os.tmpdir(), 'meetingroom-videos');
        // 查找匹配的文件
        const files = fs.readdirSync(cacheDir);
        const matchingFile = files.find(file => file.startsWith(fileToken));
        if (!matchingFile) {
            return res.status(404).json({
                code: 404,
                message: '视频文件未找到',
                data: null,
            });
        }
        const filePath = path.join(cacheDir, matchingFile);
        // 检查文件是否存在
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                code: 404,
                message: '视频文件不存在',
                data: null,
            });
        }
        // 获取文件信息
        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        // 获取文件扩展名以确定 MIME 类型
        const ext = path.extname(matchingFile).toLowerCase();
        const mimeTypes = {
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
            '.ogg': 'video/ogg',
            '.mov': 'video/quicktime',
            '.avi': 'video/x-msvideo',
            '.mkv': 'video/x-matroska',
        };
        const contentType = mimeTypes[ext] || 'video/mp4';
        // 处理 Range 请求（支持视频进度条）
        const range = req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = end - start + 1;
            res.status(206);
            res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Content-Length', chunksize);
            res.setHeader('Content-Type', contentType);
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            const stream = fs.createReadStream(filePath, { start, end });
            stream.pipe(res);
        }
        else {
            res.setHeader('Content-Length', fileSize);
            res.setHeader('Content-Type', contentType);
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
        }
    }
    catch (error) {
        console.error('提供视频文件失败:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '提供视频文件失败',
            data: null,
        });
    }
}
//# sourceMappingURL=videoController.js.map
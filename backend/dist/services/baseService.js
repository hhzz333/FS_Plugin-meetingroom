import { BaseClient } from '@lark-base-open/node-sdk';
/**
 * BaseOpenSDK 服务封装
 * 封装与飞书多维表格的交互逻辑
 */
export class BaseService {
    client;
    context;
    constructor(context) {
        this.context = context;
        this.client = new BaseClient({
            appToken: context.appToken,
            personalBaseToken: context.personalBaseToken,
        });
    }
    /**
     * 获取表格列表
     */
    async getTableList() {
        try {
            const response = await this.client.base.appTable.list();
            if (!response.data?.items) {
                return [];
            }
            return response.data.items.map((table) => ({
                id: table.table_id,
                name: table.name,
            }));
        }
        catch (error) {
            console.error('获取表格列表失败:', error);
            throw new Error('获取表格列表失败');
        }
    }
    /**
     * 获取表格字段列表
     */
    async getFieldList(tableId) {
        try {
            const response = await this.client.base.appTableField.list({
                path: {
                    table_id: tableId,
                },
            });
            if (!response.data?.items) {
                return [];
            }
            return response.data.items.map((field) => ({
                id: field.field_id,
                name: field.field_name,
                type: field.type,
                property: field.property,
            }));
        }
        catch (error) {
            console.error('获取字段列表失败:', error);
            throw new Error('获取字段列表失败');
        }
    }
    /**
     * 获取记录列表
     * @param tableId 表格 ID
     * @param viewId 视图 ID（可选）
     * @param filter 过滤条件（可选）
     */
    async getRecordList(tableId, viewId, filter) {
        try {
            const records = [];
            // 先获取字段列表，建立字段名称到字段 ID 的映射
            const fields = await this.getFieldList(tableId);
            const fieldNameToIdMap = new Map(fields.map(f => [f.name, f.id]));
            // 使用迭代器自动处理分页
            for await (const response of await this.client.base.appTableRecord.listWithIterator({
                path: {
                    table_id: tableId,
                },
                params: {
                    view_id: viewId,
                    filter: filter,
                    page_size: 500,
                },
            })) {
                if (response?.items) {
                    records.push(...response.items.map((record) => {
                        // 将字段名称转换为字段 ID
                        const fieldsWithId = {};
                        for (const [fieldName, fieldValue] of Object.entries(record.fields)) {
                            const fieldId = fieldNameToIdMap.get(fieldName);
                            if (fieldId) {
                                fieldsWithId[fieldId] = fieldValue;
                            }
                            else {
                                // 如果找不到对应的字段 ID，保留原始字段名称
                                fieldsWithId[fieldName] = fieldValue;
                            }
                        }
                        return {
                            id: record.record_id,
                            fields: fieldsWithId,
                            createdTime: record.created_time,
                            updatedTime: record.last_modified_time,
                        };
                    }));
                }
            }
            return records;
        }
        catch (error) {
            console.error('获取记录列表失败:', error);
            throw new Error('获取记录列表失败');
        }
    }
    /**
     * 获取单个记录
     */
    async getRecord(tableId, recordId) {
        try {
            const response = await this.client.base.appTableRecord.get({
                path: {
                    table_id: tableId,
                    record_id: recordId,
                },
            });
            if (!response.data?.record) {
                throw new Error('记录不存在');
            }
            const record = response.data.record;
            // 获取字段列表，建立字段名称到字段 ID 的映射
            const fields = await this.getFieldList(tableId);
            const fieldNameToIdMap = new Map(fields.map(f => [f.name, f.id]));
            // 将字段名称转换为字段 ID
            const fieldsWithId = {};
            for (const [fieldName, fieldValue] of Object.entries(record.fields || {})) {
                const fieldId = fieldNameToIdMap.get(fieldName);
                if (fieldId) {
                    fieldsWithId[fieldId] = fieldValue;
                }
                else {
                    fieldsWithId[fieldName] = fieldValue;
                }
            }
            return {
                id: record.record_id || '',
                fields: fieldsWithId,
                createdTime: record.created_time || 0,
                updatedTime: record.last_modified_time || 0,
            };
        }
        catch (error) {
            console.error('获取记录失败:', error);
            throw new Error('获取记录失败');
        }
    }
    /**
     * 获取单元格值
     */
    async getCellValue(tableId, recordId, fieldId) {
        try {
            const record = await this.getRecord(tableId, recordId);
            return record.fields[fieldId] ?? null;
        }
        catch (error) {
            console.error('获取单元格值失败:', error);
            throw new Error('获取单元格值失败');
        }
    }
    /**
     * 获取字段配置
     */
    async getFieldConfig(tableId, fieldId) {
        try {
            // 获取所有字段列表，然后找到匹配的字段
            const fields = await this.getFieldList(tableId);
            const field = fields.find(f => f.id === fieldId);
            return field || null;
        }
        catch (error) {
            console.error('获取字段配置失败:', error);
            throw new Error('获取字段配置失败');
        }
    }
    /**
     * 获取附件临时 URL
     * @param tableId 表格 ID
     * @param recordId 记录 ID
     * @param fieldId 字段 ID
     */
    async getAttachmentUrls(tableId, recordId, fieldId) {
        try {
            // 获取单元格值（附件字段）
            const cellValue = await this.getCellValue(tableId, recordId, fieldId);
            // 附件为空或格式不正确，返回空数组
            if (!cellValue || !Array.isArray(cellValue) || cellValue.length === 0) {
                return [];
            }
            // 收集所有 file_token
            const fileTokens = [];
            const fileMap = new Map();
            for (const file of cellValue) {
                if (file.file_token) {
                    fileTokens.push(file.file_token);
                    fileMap.set(file.file_token, file);
                }
            }
            if (fileTokens.length === 0) {
                return [];
            }
            // 下载视频文件到本地缓存
            const attachments = [];
            const fs = await import('fs');
            const path = await import('path');
            const os = await import('os');
            // 创建缓存目录
            const cacheDir = path.join(os.tmpdir(), 'meetingroom-videos');
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
            }
            for (const file of cellValue) {
                if (file.file_token) {
                    try {
                        // 构建 extra 参数
                        const extra = {
                            bitablePerm: {
                                tableId: tableId,
                                attachments: {
                                    [fieldId]: {
                                        [recordId]: [file.file_token]
                                    }
                                }
                            }
                        };
                        // 构建本地缓存文件路径
                        const cacheFileName = `${file.file_token}-${file.name || 'video'}`;
                        const cacheFilePath = path.join(cacheDir, cacheFileName);
                        // 检查缓存是否存在且未过期（24小时）
                        let useCache = false;
                        if (fs.existsSync(cacheFilePath)) {
                            const stats = fs.statSync(cacheFilePath);
                            const age = Date.now() - stats.mtime.getTime();
                            if (age < 24 * 60 * 60 * 1000) {
                                useCache = true;
                            }
                        }
                        if (!useCache) {
                            // 调用 drive.media.download 下载文件，带重试机制
                            let lastError;
                            let response;
                            for (let attempt = 1; attempt <= 3; attempt++) {
                                try {
                                    response = await this.client.drive.media.download({
                                        path: { file_token: file.file_token },
                                        params: { extra: JSON.stringify(extra) }
                                    });
                                    break; // 成功则跳出重试循环
                                }
                                catch (err) {
                                    lastError = err;
                                    // 检查是否是 "Data not ready" 错误
                                    if (err?.code === 1254607 || err?.msg?.includes('Data not ready')) {
                                        console.log(`文件 ${file.file_token} 数据未就绪，第 ${attempt} 次重试...`);
                                        if (attempt < 3) {
                                            // 等待 1 秒后重试
                                            await new Promise(resolve => setTimeout(resolve, 1000));
                                            continue;
                                        }
                                    }
                                    // 其他错误直接抛出
                                    throw err;
                                }
                            }
                            if (!response) {
                                throw lastError;
                            }
                            // 写入本地缓存
                            await response.writeFile(cacheFilePath);
                        }
                        // 构建本地访问 URL
                        const localUrl = `http://172.21.1.120:${process.env.PORT || 3000}/api/cache/video/${file.file_token}`;
                        attachments.push({
                            token: file.file_token,
                            name: file.name || '',
                            type: file.type || '',
                            size: file.size || 0,
                            url: localUrl,
                            tmpUrl: localUrl,
                            localPath: cacheFilePath,
                        });
                    }
                    catch (downloadError) {
                        console.warn(`下载文件 ${file.file_token} 失败:`, downloadError);
                        // 如果下载失败，使用原始的 tmp_url
                        attachments.push({
                            token: file.file_token,
                            name: file.name || '',
                            type: file.type || '',
                            size: file.size || 0,
                            url: file.tmp_url || file.url || '',
                            tmpUrl: file.tmp_url || file.url || '',
                        });
                    }
                }
            }
            return attachments;
        }
        catch (error) {
            // 附件加载失败时返回空数组，不抛出错误
            return [];
        }
    }
    /**
     * 批量获取记录（通过多次调用 get 实现）
     * @param tableId 表格 ID
     * @param recordIds 记录 ID 列表
     */
    async batchGetRecords(tableId, recordIds) {
        try {
            const records = [];
            // SDK 不支持批量获取记录，需要逐个获取
            for (const recordId of recordIds) {
                try {
                    const record = await this.getRecord(tableId, recordId);
                    records.push(record);
                }
                catch (error) {
                    console.warn(`获取记录 ${recordId} 失败:`, error);
                    // 继续获取其他记录
                }
            }
            return records;
        }
        catch (error) {
            console.error('批量获取记录失败:', error);
            throw new Error('批量获取记录失败');
        }
    }
    /**
     * 更新记录
     * @param tableId 表格 ID
     * @param recordId 记录 ID
     * @param fields 要更新的字段
     */
    async updateRecord(tableId, recordId, fields) {
        try {
            console.log('BaseService.updateRecord 调用:', { tableId, recordId, fields });
            const response = await this.client.base.appTableRecord.update({
                path: {
                    table_id: tableId,
                    record_id: recordId,
                },
                data: {
                    fields,
                },
            });
            console.log('BaseService.updateRecord 响应:', response);
            return {
                id: response.data?.record?.record_id || recordId,
                fields: response.data?.record?.fields || fields,
                createdTime: response.data?.record?.created_time ? new Date(response.data.record.created_time).getTime() : Date.now(),
                updatedTime: response.data?.record?.last_modified_time ? new Date(response.data.record.last_modified_time).getTime() : Date.now(),
            };
        }
        catch (error) {
            console.error('更新记录失败:', error);
            throw new Error(error.message || '更新记录失败');
        }
    }
    /**
     * 创建记录
     * @param tableId 表格 ID
     * @param fields 字段数据
     */
    async createRecord(tableId, fields) {
        try {
            const response = await this.client.base.appTableRecord.create({
                path: {
                    table_id: tableId,
                },
                data: {
                    fields,
                },
            });
            // 检查 SDK 响应中是否有错误码
            if (response.code !== undefined && response.code !== 0) {
                throw new Error(response.msg || '创建记录失败');
            }
            return {
                record_id: response.data?.record?.record_id || '',
            };
        }
        catch (error) {
            console.error('创建记录失败:', error);
            throw new Error(error.message || '创建记录失败');
        }
    }
}
export default BaseService;
//# sourceMappingURL=baseService.js.map
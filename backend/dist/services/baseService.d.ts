import type { TableInfo, FieldInfo, RecordInfo, AttachmentInfo, RequestContext } from '../types/index.js';
/**
 * BaseOpenSDK 服务封装
 * 封装与飞书多维表格的交互逻辑
 */
export declare class BaseService {
    private client;
    private context;
    constructor(context: RequestContext);
    /**
     * 获取表格列表
     */
    getTableList(): Promise<TableInfo[]>;
    /**
     * 获取表格字段列表
     */
    getFieldList(tableId: string): Promise<FieldInfo[]>;
    /**
     * 获取记录列表
     * @param tableId 表格 ID
     * @param viewId 视图 ID（可选）
     * @param filter 过滤条件（可选）
     */
    getRecordList(tableId: string, viewId?: string, filter?: string): Promise<RecordInfo[]>;
    /**
     * 获取单个记录
     */
    getRecord(tableId: string, recordId: string): Promise<RecordInfo>;
    /**
     * 获取单元格值
     */
    getCellValue(tableId: string, recordId: string, fieldId: string): Promise<any>;
    /**
     * 获取字段配置
     */
    getFieldConfig(tableId: string, fieldId: string): Promise<any>;
    /**
     * 获取附件临时 URL
     * @param tableId 表格 ID
     * @param recordId 记录 ID
     * @param fieldId 字段 ID
     */
    getAttachmentUrls(tableId: string, recordId: string, fieldId: string): Promise<AttachmentInfo[]>;
    /**
     * 批量获取记录（通过多次调用 get 实现）
     * @param tableId 表格 ID
     * @param recordIds 记录 ID 列表
     */
    batchGetRecords(tableId: string, recordIds: string[]): Promise<RecordInfo[]>;
    /**
     * 更新记录
     * @param tableId 表格 ID
     * @param recordId 记录 ID
     * @param fields 要更新的字段
     */
    updateRecord(tableId: string, recordId: string, fields: Record<string, any>): Promise<RecordInfo>;
    /**
     * 创建记录
     * @param tableId 表格 ID
     * @param fields 字段数据
     */
    createRecord(tableId: string, fields: Record<string, any>): Promise<{
        record_id: string;
    }>;
}
export default BaseService;
//# sourceMappingURL=baseService.d.ts.map
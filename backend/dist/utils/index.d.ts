/**
 * 延迟函数
 */
export declare function delay(ms: number): Promise<void>;
/**
 * 重试函数
 */
export declare function retry<T>(fn: () => Promise<T>, maxRetries?: number, delayMs?: number): Promise<T>;
/**
 * 格式化日期
 */
export declare function formatDate(date: Date, format?: string): string;
/**
 * 安全的 JSON 解析
 */
export declare function safeJsonParse<T>(str: string, defaultValue: T): T;
/**
 * 生成唯一 ID
 */
export declare function generateId(): string;
//# sourceMappingURL=index.d.ts.map
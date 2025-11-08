// biome-ignore-all lint/suspicious/noExplicitAny: any is used for compatibility
export interface ApiResponse<T = any> {
  code: number;
  message?: string;
  data?: T;
}

export interface ServerInfo {
  version: string;
  ariang: boolean;
  newVersion?: string;
  appUpdateMessage?: string;
}

// API 响应类型定义

/**
 * 操作响应（下载、暂停、恢复、删除等）
 * 注意：message 为可选，因为某些 API 可能不返回消息
 */
export interface OperationResponse extends ApiResponse<{ count?: number }> {
  message?: string;
  count?: number;
}

/**
 * M3U8 URLs 提取响应
 * 强制要求 data 存在，提供类型安全
 */
export interface M3u8UrlsResponse extends ApiResponse<Array<[string, string]>> {
  data: Array<[string, string]>;
}

/**
 * 队列状态数据（不是 API 响应格式，而是数据格式）
 */
export interface QueueStatus {
  queueLength: number;
  activeDownloads: string[];
  maxConcurrent: number;
}

/** @deprecated 使用 QueueStatus 代替 */
export type QueueStatusResponse = QueueStatus;

// biome-ignore-all lint/suspicious/noExplicitAny: any is used for compatibility
import type { ApiResponse as BaseApiResponse, ServerInfo as BaseServerInfo } from '@lzwme/m3u8-dl/contract';

export type { QueueStatus } from '@lzwme/m3u8-dl/contract';

export type ApiResponse<T = any> = BaseApiResponse<T>;

/** 服务端信息 + WebUI 本地的版本检查结果 */
export interface ServerInfo extends BaseServerInfo {
  newVersion?: string;
  appUpdateMessage?: string;
}

/** 操作响应（下载、暂停、恢复、删除等） */
export interface OperationResponse extends ApiResponse<{ count?: number }> {
  message?: string;
  count?: number;
}

/** M3U8 URLs 提取响应。强制要求 data 存在，提供类型安全 */
export interface M3u8UrlsResponse extends ApiResponse<Array<[string, string]>> {
  data: Array<[string, string]>;
}

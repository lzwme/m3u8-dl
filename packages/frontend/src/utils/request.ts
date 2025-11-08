// biome-ignore-all lint/suspicious/noExplicitAny: any is used for compatibility
import type { ApiResponse, OperationResponse, M3u8UrlsResponse, QueueStatus } from '@/types/api';
import type { DownloadConfig } from '@/types/config';
import type { DownloadTask } from '@/types/task';

const BASE_URL = '';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

function getHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  if (token) {
    headers.authorization = token;
  }
  return headers;
}

export async function request<T = any>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { method = 'GET', headers = {}, body } = options;
  const token = localStorage.getItem('token') || '';

  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      method,
      headers: { ...getHeaders(token), ...headers },
      body: typeof body === 'string' ? body : body ? JSON.stringify(body) : undefined,
    });

    const data: ApiResponse<T> = await response.json();

    if (data.code) {
      console.error(`[${url}] 请求失败:`, data.message);
      return data;
    }

    return data;
  } catch (error) {
    console.error(`请求失败: ${url}`, error);
    return {
      code: -1,
      message: error instanceof Error ? error.message : '请求失败',
    };
  }
}

export function get<T = any>(url: string): Promise<ApiResponse<T>> {
  return request<T>(url, { method: 'GET' });
}

export function post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
  return request<T>(url, { method: 'POST', body: data });
}

/**
 * 获取配置
 * @returns 配置对象，如果请求失败则返回空对象
 */
export async function fetchConfig(): Promise<DownloadConfig> {
  const result = await get<DownloadConfig>('/api/config');
  if (result.code === 0 && result.data) {
    return result.data;
  }
  return {} as DownloadConfig;
}

/**
 * 更新配置
 */
export async function updateConfig(config: Partial<DownloadConfig>): Promise<OperationResponse> {
  return post<never>('/api/config', config) as Promise<OperationResponse>;
}

/**
 * 获取任务列表
 * @returns 任务对象字典，key 为 URL，value 为任务信息
 */
export async function fetchTasks(): Promise<Record<string, DownloadTask>> {
  const result = await get<Record<string, DownloadTask>>('/api/tasks');
  // 确保返回的是任务字典，如果 data 为空则返回空对象
  if (result.code === 0 && result.data) {
    return result.data;
  }
  // 如果请求失败或 data 为空，返回空对象
  return {};
}

/**
 * 开始下载
 */
export async function startDownload(
  list: Array<{ url: string; filename?: string; saveDir?: string; headers?: string; ignoreSegments?: string }>
): Promise<OperationResponse> {
  return post<never>('/api/download', { list }) as Promise<OperationResponse>;
}

/**
 * 暂停下载
 */
export async function pauseDownload(urls: string[], all = false): Promise<OperationResponse> {
  return post<never>('/api/pause', { urls, all }) as Promise<OperationResponse>;
}

/**
 * 恢复下载
 */
export async function resumeDownload(urls: string[], all = false): Promise<OperationResponse> {
  return post<never>('/api/resume', { urls, all }) as Promise<OperationResponse>;
}

/**
 * 删除下载
 */
export async function deleteDownload(urls: string[], deleteCache = true, deleteVideo = true): Promise<OperationResponse> {
  return post<never>('/api/delete', { urls, deleteCache, deleteVideo }) as Promise<OperationResponse>;
}

/**
 * 获取 M3U8 URLs
 * @param url 视频播放页地址
 * @param headers 自定义请求头
 * @param subUrlRegex 子页面 URL 正则表达式（可选）
 * @returns M3U8 URLs 数组，格式为 [url, filename] 的元组数组
 */
export async function getM3u8Urls(url: string, headers?: string, subUrlRegex?: string): Promise<M3u8UrlsResponse> {
  return post<Array<[string, string]>>('/api/getM3u8Urls', { url, headers, subUrlRegex }) as Promise<M3u8UrlsResponse>;
}

/**
 * 获取队列状态
 */
export async function getQueueStatus(): Promise<QueueStatus> {
  const result = await get<QueueStatus>('/api/queue/status');
  if (result.code === 0 && result.data) {
    return result.data;
  }
  return {
    queueLength: 0,
    activeDownloads: [],
    maxConcurrent: 5,
  };
}

/**
 * 清空队列
 */
export async function clearQueue(): Promise<OperationResponse> {
  return post<never>('/api/queue/clear', {}) as Promise<OperationResponse>;
}

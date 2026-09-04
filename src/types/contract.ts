/**
 * 前后端传输契约：REST API 与 WebSocket 消息的数据结构。
 *
 * 这是服务端与 WebUI 之间的**唯一类型真相源**：
 * - 服务端：`src/server/download-server.ts` 直接使用；
 * - WebUI：`import type { ... } from '@lzwme/m3u8-dl/contract'`。
 *
 * 约束：本文件只能定义纯数据结构，禁止 import 后端实现模块
 * （如 `./m3u8.js`、`@lzwme/fe-utils`），否则 WebUI 侧将无法解析类型。
 */

/** 下载进度统计（传输形态）。服务端的 M3u8DLProgressStats 是其必填化超集 */
export interface DownloadStats {
  /** 开始下载的时间 */
  startTime?: number;
  /** 下载完成的时间 */
  endTime?: number;
  /** 下载进度百分比 */
  progress?: number;
  /** 总 ts 数量 */
  tsCount?: number;
  /** 已下载成功的 ts 数量 */
  tsSuccess?: number;
  /** 已下载失败的 ts 数量 */
  tsFailed?: number;
  /** 视频总时长 */
  duration?: number;
  /** 视频总大小 */
  size?: number;
  /** 已下载的大小 */
  downloadedSize?: number;
  /** 平均下载速度 */
  avgSpeed?: number;
  /** 平均下载速度描述 */
  avgSpeedDesc?: string;
  /** 实时下载速度 */
  speed?: number;
  /** 实时下载速度（格式化描述） */
  speedDesc?: string;
  /** 预估剩余时间 */
  remainingTime?: number;
  /** 本地 m3u8 文件路径 */
  localM3u8?: string;
  /** 本地视频文件路径（合并后的视频文件） */
  localVideo?: string;
  /** 本地保存的文件名 */
  filename?: string;
  /** 并发下载线程数 */
  threadNum?: number;
  /** 最新的错误信息 */
  errmsg?: string;
}

/** 任务状态 */
export type TaskStatus = 'pause' | 'resume' | 'done' | 'pending' | 'error';

/** 任务参数。为 M3u8DLOptions 的传输子集，避免 WebUI 依赖 Node 类型 */
export interface TaskOptions {
  filename?: string;
  url?: string;
  title?: string;
  saveDir?: string;
  ignoreSegments?: string;
  headers?: string;
}

/** 服务端下发到客户端的任务数据（CacheItem 去除内部字段后的形态） */
export interface TaskItem extends DownloadStats {
  /** 任务地址，同时作为任务的唯一标识 */
  url: string;
  status: TaskStatus;
  /** 当前任务的 ts 缓存目录 */
  cacheDir?: string;
  /** 用户设置的参数 */
  options?: TaskOptions;
  /** 格式化后实际下载使用的参数 */
  dlOptions?: TaskOptions;
}

/** 下载队列状态。`GET /api/queue/status` */
export interface QueueStatus {
  queueLength: number;
  activeDownloads: string[];
  maxConcurrent: number;
}

/** 服务端信息。WebSocket `serverInfo` 消息 */
export interface ServerInfo {
  version: string;
  ariang: boolean;
}

/** 服务端配置。`GET|POST /api/config`，为 webOptions 与 dlOptions 的扁平合并 */
export interface ServerConfig {
  threadNum: number;
  saveDir: string;
  delCache: boolean;
  convert: boolean;
  showPreview: boolean;
  showLocalPlay: boolean;
  maxDownloads: number;
  ffmpegPath: string;
  /** 代理模式。可选值：custom, system, disabled */
  proxyMode?: 'custom' | 'system' | 'disabled';
  proxyUrl?: string;
  noProxy?: string;
}

/** REST API 统一响应结构 */
export interface ApiResponse<T = unknown> {
  code: number;
  message?: string;
  data?: T;
}

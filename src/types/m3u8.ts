import type { IncomingHttpHeaders } from 'node:http';
import type { AnyObject, DownloadResult } from '@lzwme/fe-utils';
import type { WorkerPool } from '../lib/worker_pool';
import type { DownloadStats } from './contract.js';

/**
 * 分片容器类型
 * - `ts`：MPEG-TS 分片（传统 HLS）
 * - `fmp4`：fragmented MP4 分片（m4s/mp4），需配合 `EXT-X-MAP` 初始化段
 * - `unknown`：未能识别，按二进制拼接兜底处理
 */
export type M3u8ContainerType = 'ts' | 'fmp4' | 'unknown';

/** 字节区间。来源于 `EXT-X-BYTERANGE` 或 `EXT-X-MAP` 的 BYTERANGE 属性 */
export interface M3u8ByteRange {
  /** 字节长度 */
  length: number;
  /** 起始偏移量，默认为 0 */
  offset?: number;
}

/**
 * 初始化段信息，来源于 `EXT-X-MAP`（HLS v6+ / DASH fMP4 常见）
 * 初始化段（init segment）包含 `ftyp` + `moov`，是 fMP4 分片能够被解码和合并的前提
 */
export interface M3u8MapInfo {
  /** 初始化段的远程 url 地址 */
  uri: string;
  /** 初始化段本地保存路径 */
  tsOut: string;
  /** 字节范围。来源于 `EXT-X-MAP` 的 BYTERANGE 属性 */
  byterange?: M3u8ByteRange;
  /** 如果初始化段使用了加密算法，加密 key 的获取 uri */
  keyUri?: string;
  /** 文件大小(byte) */
  tsSize?: number;
  /** 初始化段的容器类型 */
  container?: M3u8ContainerType;
}

export interface TsItemInfo {
  /** m3u8 文件地址，可以用于唯一标记识别、缓存清理等 */
  m3u8: string;
  /** ts 文件次序 */
  index: number;
  /** 视频片段时长 */
  duration: number;
  /** 时间线(起点) */
  timeline: number;
  /** ts 文件下载 url 地址 */
  uri: string;
  /** 如果 ts 使用了加密算法，加密 key 的获取 uri */
  keyUri?: string;
  /** ts 文件下载保存路径 */
  tsOut: string;
  /** 字节区间。来源于 `EXT-X-BYTERANGE`，表示该分片位于 url 对应文件的指定字节区间 */
  byterange?: M3u8ByteRange;
  /** 下载成功的 ts 文件大小(byte) */
  tsSize?: number;
  /** 下载耗时(ms) */
  timeCost?: number;
  /** 开始下载的时间 */
  startTime?: number;
  /** 是否下载成功。成功为1，失败一次则减 1 */
  success?: number;
  // /** 是否忽略下载 */
  // ignore?: boolean;
}

export interface M3u8Info {
  /** ts 文件数量 */
  tsCount: number;
  /** 总时长 */
  duration: number;
  /** 加密相关信息 */
  crypto: { [uri: string]: M3u8Crypto };
  /** ts 文件列表 */
  data: TsItemInfo[];
  /** m3u8 文件信息 */
  manifest: AnyObject;
  /**
   * 初始化段信息(`EXT-X-MAP`)。
   * fMP4(m4s) 类型的分片必须依赖初始化段才能正确解码与合并
   */
  initSegment?: M3u8MapInfo;
  /**
   * 分片容器类型。
   * - `ts`：MPEG-TS 分片
   * - `fmp4`：fragmented MP4 分片(m4s/mp4)
   * - `unknown`：未能识别
   */
  container?: M3u8ContainerType;
}

export interface M3u8Crypto {
  /** AES 加密 IV */
  iv: NodeJS.ArrayBufferView | string; // 0x00000000000000000000000000000000,
  /** 获取到的密钥值(hex) */
  key: string | NodeJS.ArrayBufferView;
  /** 加密方法 */
  method: string;
  /** 密钥获取接口 */
  uri: string;
}

/**
 * 下载进度统计。
 *
 * 公共字段继承传输契约 `DownloadStats`，此处仅将运行期必有的字段收紧为必填，
 * 以保证与 WebUI 侧 `TaskItem` 的结构同源。
 */
export interface M3u8DLProgressStats extends DownloadStats {
  /** 开始下载的时间 */
  startTime: number;
  /** 下载进度百分比 */
  progress: number;
  /** 总 ts 数量 */
  tsCount: number;
  /** 已下载成功的 ts 数量 */
  tsSuccess: number;
  /** 已下载失败的 ts 数量 */
  tsFailed: number;
  /** 视频总时长 */
  duration: number;
  /** 已下载的视频时长 */
  durationDownloaded: number;
  /** 已下载的大小 */
  downloadedSize: number;
  /** 平均下载速度 */
  avgSpeed: number;
  /** 平均下载速度描述 */
  avgSpeedDesc: string;
  /** 实时下载速度 */
  speed: number;
  /** 实时下载速度（格式化描述） */
  speedDesc: string;
  /** 预估剩余时间 */
  remainingTime: number;
  /** 实际下载的 URL */
  url: string;
}

export type M3u8WorkerPool = WorkerPool<WorkerTaskInfo, { success: boolean; info: TsItemInfo; timeCost: number }>;

export interface M3u8DLOptions {
  debug?: boolean;
  /** 是否显示内置的进度信息。默认为 true */
  showProgress?: boolean;
  /** 当初始化完成、下载开始时回调 */
  onInited?: (stats: M3u8DLProgressStats, m3u8Info: M3u8Info, workPoll: M3u8WorkerPool) => void;
  /** 每当 ts 文件下载完成时回调，可用于自定义进度控制 */
  onProgress?: (finished: number, total: number, currentInfo: TsItemInfo, stats: M3u8DLProgressStats) => void | boolean;
  /** 下载完成时回调，主要用于内部多任务管理 */
  onComplete?: (result: M3u8DLResult) => void;
  /** 并发下载线程数。取决于服务器限制，过多可能会容易下载失败。一般建议不超过 8 个。默认为 cpu数 * 2，但不超过 8 */
  threadNum?: number;
  /** 最大并发下载任务数 */
  maxDownloads?: number;
  /** 下载优先级，数字越大优先级越高 */
  priority?: number;
  /** 要保存的文件名(路径) */
  filename?: string;
  /** 下载文件保存的路径。默认为当前目录 */
  saveDir?: string;
  /** 临时文件保存目录。默认为 cache/<md5(url)> */
  cacheDir?: string;
  /** 忽略的时间片段，单位为秒，多段以逗号分割。示例: 0-10,100-110 */
  ignoreSegments?: string;
  /** 下载成功后是否删除临时文件。默认为 true。保存临时文件可以在重复下载时识别缓存 */
  delCache?: boolean;
  /** 文件已存在时是否仍强制下载和生成。默认为 false，文件已存在则跳过 */
  force?: boolean;
  /** 下载 m3u8、ts 等文件时自定义请求 headers */
  headers?: IncomingHttpHeaders | string;
  /** 下载时是否启动本地资源播放（边下边看） */
  play?: boolean;
  /** 下载完毕后，是否合并转换为 mp4 或 ts 文件。默认为 true */
  convert?: boolean;
  /**
   * 下载类型。默认自动识别
   * - 'm3u8'：下载 m3u8 文件
   * - 'file'：下载普通文件
   * - 'parser'：下载 VideoParser 支持解析的平台视频文件
   */
  type?: 'm3u8' | 'file' | 'parser';
  /** ffmpeg 可执行文件路径。如果未指定，则尝试使用系统 PATH 中的 'ffmpeg' */
  ffmpegPath?: string;
  /** 语言。可选值：zh-CN, en */
  lang?: 'zh-CN' | 'en';
  /** 代理模式。可选值：custom, system, disabled */
  proxyMode?: 'custom' | 'system' | 'disabled';
  /** 代理地址。如果 proxyMode 为 'custom'，则必须指定 */
  proxyUrl?: string;
  /** 不使用代理的域名。多个域名用逗号分隔 */
  noProxy?: string;
}

export interface M3u8DLResult extends Partial<DownloadResult> {
  /** 下载进度统计 */
  stats?: M3u8DLProgressStats;
  /** 下载选项 */
  options?: M3u8DLOptions;
  /** m3u8 文件信息 */
  m3u8Info?: M3u8Info;
}

export interface WorkerTaskInfo {
  /** m3u8 文件地址 */
  url: string;
  /** ts 文件信息 */
  info: TsItemInfo;
  /** 加密相关信息 */
  crypto: M3u8Crypto;
  /** 下载选项 */
  options: M3u8DLOptions;
}

export interface CliOptions extends M3u8DLOptions {
  silent?: boolean;
  progress?: boolean;
}

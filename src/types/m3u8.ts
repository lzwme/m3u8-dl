/*
 * @Author: renxia
 * @Date: 2024-08-02 09:58:56
 * @LastEditors: renxia
 * @LastEditTime: 2025-05-08 16:24:52
 * @Description:
 */
/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="../../global.d.ts"/>

import type { IncomingHttpHeaders } from 'node:http';

export interface TsItemInfo {
  /** m3u8 文件地址，可以用于唯一标记识别、缓存清理等 */
  m3u8: string;
  /** ts 文件次序 */
  index: number;
  duration: number;
  timeline: number;
  /** ts 文件下载 url 地址 */
  uri: string;
  /** ts 文件下载保存路径 */
  tsOut: string;
  /** 下载成功的 ts 文件大小(byte) */
  tsSize?: number;
  /** 是否下载成功。成功为1，失败一次则减 1 */
  success?: number;
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

/** 下载进度统计 */
export interface M3u8DLProgressStats {
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
  /** 总时长 */
  duration: number;
  /** 下载已消耗的时长 */
  durationDownloaded: number;
  /** 已下载的大小 */
  downloadedSize: number;
  /** 平均下载速度 */
  speed: number;
  /** 下载速度（格式化描述） */
  speedDesc: string;
  /** 预估剩余时间 */
  remainingTime: number;
  /** 本地 m3u8 文件路径 */
  localM3u8: string;
}

export interface M3u8DLOptions {
  debug?: boolean;
  /** 是否显示内置的进度信息。默认为 true */
  showProgress?: boolean;
  /** 每当 ts 文件下载完成时回调，可用于自定义进度控制 */
  onProgress?: (finished: number, total: number, currentInfo: TsItemInfo, stats: M3u8DLProgressStats) => void;
  /** 并发下载线程数。取决于服务器限制，过多可能会容易下载失败。一般建议不超过 8 个。默认为 cpu数 * 2，但不超过 8 */
  threadNum?: number;
  /** 要保存的文件名(路径) */
  filename?: string;
  /** 下载文件保存的路径。默认为当前目录 */
  saveDir?: string;
  /** 临时文件保存目录。默认为 cache/<md5(url)> */
  cacheDir?: string;
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

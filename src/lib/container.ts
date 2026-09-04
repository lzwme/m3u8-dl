import { closeSync, openSync, readSync } from 'node:fs';
import type { M3u8ContainerType } from '../types/m3u8.js';

/** fMP4(CMAF/DASH/HLS fMP4) 常见的分片扩展名 */
const FMP4_EXT_LIST = ['.m4s', '.mp4', '.m4v', '.m4a', '.cmfv', '.cmfa', '.cmft', '.ismv', '.isma'];
/** MPEG-TS 常见的分片扩展名 */
const TS_EXT_LIST = ['.ts', '.m2ts', '.mts'];
/** ISO-BMFF(MP4 家族)常见的顶层 box 类型 */
const ISO_BMFF_BOX_LIST = new Set(['ftyp', 'styp', 'moov', 'moof', 'sidx', 'ssix', 'uuid', 'free', 'skip']);

/**
 * 依据 url 后缀推断分片容器类型。
 * 无法识别时返回 `unknown`（调用方一般按 MPEG-TS 处理以保持向后兼容）
 */
export function detectContainerType(uri = ''): M3u8ContainerType {
  const u = uri.toLowerCase().split(/[?#]/)[0];
  if (FMP4_EXT_LIST.some(e => u.endsWith(e))) return 'fmp4';
  if (TS_EXT_LIST.some(e => u.endsWith(e))) return 'ts';
  return 'unknown';
}

/**
 * 依据文件头魔数判断容器类型：
 * - ISO-BMFF（box size + box type）→ `fmp4`
 * - 0x47 同步字节（188/192/204 字节包长）→ `ts`
 */
export function detectContainerByHeader(buffer: Buffer | Uint8Array): M3u8ContainerType {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

  if (buf.byteLength >= 8) {
    // ISO-BMFF：4 字节 box size + 4 字节 box type
    if (ISO_BMFF_BOX_LIST.has(buf.subarray(4, 8).toString('latin1'))) return 'fmp4';
    // MPEG-TS：0x47 同步字节，且下一个 188 字节包仍为同步字节
    if (buf.byteLength >= 192 && buf[0] === 0x47 && buf[188] === 0x47) return 'ts';
  }

  return 'unknown';
}

/**
 * 读取本地文件头部判断容器类型。
 * 只读取文件头部若干字节，避免将整个大分片文件读入内存
 */
export function detectContainerByFile(filepath: string, size = 256): M3u8ContainerType {
  try {
    const fd = openSync(filepath, 'r');
    try {
      const buf = Buffer.alloc(size);
      const bytesRead = readSync(fd, buf, 0, size, 0);
      return detectContainerByHeader(buf.subarray(0, bytesRead));
    } finally {
      closeSync(fd);
    }
  } catch {
    return 'unknown';
  }
}

/** 分片缓存文件的扩展名 */
export function getSegmentExt(container: M3u8ContainerType = 'ts') {
  return container === 'fmp4' ? '.m4s' : '.ts';
}

/**
 * 最终输出文件的扩展名。
 * fMP4 即使没有 ffmpeg 也可以直接二进制拼接为可播放的 mp4；
 * MPEG-TS 在没有 ffmpeg 时只能拼接为 ts
 */
export function getOutputExt(container: M3u8ContainerType = 'ts', ffmpegSupport = true) {
  if (container !== 'fmp4' && !ffmpegSupport) return '.ts';
  return '.mp4';
}

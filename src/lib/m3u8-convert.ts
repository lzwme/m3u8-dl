import { createReadStream, createWriteStream, existsSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { execPromisfy, formatByteSize, mkdirp } from '@lzwme/fe-utils';
import { cyan, greenBright, magentaBright } from 'console-log-colors';
import type { M3u8ContainerType, M3u8DLOptions, M3u8Info, TsItemInfo } from '../types/m3u8';
import { detectContainerByFile, detectContainerType, getOutputExt } from './container';
import { getLang, t } from './i18n.js';
import { isSupportFfmpeg, logger } from './utils';

/** 合并上下文 */
export interface MergeContext {
  /** 下载选项 */
  options: M3u8DLOptions;
  /** m3u8 解析结果 */
  m3u8Info: M3u8Info;
  /** 已下载且存在的本地分片文件列表，按播放顺序排列 */
  files: string[];
  /** 最终输出文件路径 */
  filepath: string;
  /** ffmpeg 可执行文件路径 */
  ffmpegBin: string;
  /** ffmpeg 是否可用 */
  ffmpegSupport: boolean;
  /** 分片缓存目录，可用于存放中间产物 */
  cacheDir: string;
  /** 语言环境（由 m3u8Convert 统一解析），用于合并器内的 i18n 文案 */
  lang: string;
}

/**
 * 合并器（策略）接口。
 *
 * 不同容器类型的分片，其合并方式完全不同：
 * - MPEG-TS：可由 ffmpeg `concat` 解复用器直接拼接
 * - fMP4(m4s)：必须先拼接 `EXT-X-MAP` 初始化段(ftyp+moov)，否则无法解码
 *
 * 新增一种容器类型的支持时，只需实现并注册一个新的 `Merger`，无需改动主流程。
 */
export interface Merger {
  /** 合并器名称，唯一标识 */
  name: string;
  /** 适用的容器类型。`*` 表示适用于所有类型（一般用于兜底） */
  container: M3u8ContainerType | '*';
  /** 优先级，数值越大越优先。默认 0 */
  priority?: number;
  /** 当前场景是否可由该合并器处理 */
  support(ctx: MergeContext): boolean;
  /** 执行合并。成功返回生成的文件路径，失败返回空字符串 */
  merge(ctx: MergeContext): Promise<string>;
}

/**
 * 按顺序将多个文件二进制拼接为一个文件。
 * 先写入临时文件，全部成功后原子重命名，避免中途失败在目标路径留下半成品文件
 * （半成品会被 existsSync 短路，导致后续任务被误判为已完成）
 */
async function concatFiles(files: string[], output: string) {
  mkdirp(dirname(output));
  const tmpFile = `${output}.${Date.now()}.part`;
  const writeStream = createWriteStream(tmpFile);
  let writeError: Error | null = null;
  writeStream.once('error', (e: Error) => (writeError = e));

  try {
    for (const file of files) {
      await new Promise<void>((rs, rj) => {
        const readStream = createReadStream(file);
        readStream.once('error', rj);
        readStream.once('end', () => rs());
        readStream.pipe(writeStream, { end: false });
      });
      if (writeError) throw writeError;
    }

    await new Promise<void>((rs, rj) => {
      writeStream.end((err?: Error | null) => (err || writeError ? rj((err || writeError) as Error) : rs()));
    });

    renameSync(tmpFile, output);
    return output;
  } catch (e) {
    writeStream.destroy();
    if (existsSync(tmpFile)) unlinkSync(tmpFile);
    throw e;
  }
}

/** 执行 ffmpeg 命令（异步，避免阻塞事件循环导致服务端并发任务的进度推送停滞） */
async function execFfmpeg(cmd: string, ffmpegBin: string) {
  logger.debug('[ffmpeg]cmd:', cyan(cmd));
  const r = await execPromisfy(cmd);
  if (r.error) logger.warn(`[ffmpeg]执行失败，请确认 \`${ffmpegBin}\` 已正确安装并可用！`, r.stderr);
  return r;
}

/**
 * fMP4(m4s) 合并器。
 *
 * fMP4 分片的 `ftyp` + `moov` 位于 `EXT-X-MAP` 初始化段中，
 * 因此必须先将初始化段与全部分片顺序拼接，得到一个 fragmented MP4，
 * 再使用 ffmpeg 重新封装（remux）为标准的、支持边下边播(faststart)的 mp4。
 * 无 ffmpeg 时，拼接产物本身即为可播放的 mp4。
 */
export const fmp4Merger: Merger = {
  name: 'fmp4',
  container: 'fmp4',
  priority: 30,
  support: ctx => ctx.files.length > 0,
  async merge(ctx) {
    const { m3u8Info, filepath, cacheDir, ffmpegSupport, ffmpegBin, lang } = ctx;
    const initSegment = m3u8Info.initSegment;

    if (!initSegment?.tsOut || !existsSync(initSegment.tsOut)) {
      logger.error(t('download.status.initSegmentMissing', lang), initSegment?.uri || '');
      return '';
    }

    /** 拼接产物(fragmented MP4)。有 ffmpeg 时作为中间产物，否则直接作为最终文件 */
    const rawFile = ffmpegSupport ? resolve(cacheDir, `${Date.now()}-raw.mp4`) : filepath;

    await concatFiles([initSegment.tsOut, ...ctx.files], rawFile);
    logger.debug('[fmp4][concat]', rawFile, formatByteSize(statSync(rawFile).size));

    if (!ffmpegSupport) return rawFile;

    // -c copy 无损重新封装，将 fragmented MP4 转换为标准 mp4 并将 moov 前置
    const r = await execFfmpeg(`"${ffmpegBin}" -y -i "${rawFile}" -c copy -movflags +faststart "${filepath}"`, ffmpegBin);

    if (r.error || !existsSync(filepath)) {
      // 重新封装失败时，拼接产物本身仍可播放，降级使用它
      logger.warn(t('download.status.remuxFallback', lang));
      if (existsSync(rawFile)) renameSync(rawFile, filepath);
      return existsSync(filepath) ? filepath : '';
    }

    unlinkSync(rawFile);
    return filepath;
  },
};

/** MPEG-TS 合并器。依赖 ffmpeg 的 `concat` 解复用器 */
export const tsMerger: Merger = {
  name: 'ts',
  container: 'ts',
  priority: 20,
  support: ctx => ctx.ffmpegSupport && ctx.files.length > 0,
  async merge(ctx) {
    const { m3u8Info, filepath, cacheDir, ffmpegBin } = ctx;
    const ffconcatFile = resolve(cacheDir, 'ffconcat.txt');
    let filesAllArr = m3u8Info.data.filter(d => d.tsOut && existsSync(d.tsOut)).map(d => `file '${d.tsOut}'\nduration ${d.duration}`);

    if (process.platform === 'win32') filesAllArr = filesAllArr.map(d => d.replaceAll('\\', '/'));
    writeFileSync(ffconcatFile, `ffconcat version 1.0\n${filesAllArr.join('\n')}`);

    // ffmpeg -i nz.ts -c copy -map 0:v -map 0:a -bsf:a aac_adtstoasc nz.mp4
    const r = await execFfmpeg(
      `"${ffmpegBin}" -async 1 -y -f concat -safe 0 -i "${ffconcatFile}" -c:v copy -c:a copy -movflags +faststart -fflags +genpts -bsf:a aac_adtstoasc "${filepath}"`,
      ffmpegBin
    );

    if (!r.error) unlinkSync(ffconcatFile);

    return !r.error && existsSync(filepath) ? filepath : '';
  },
};

/** 兜底合并器：纯二进制拼接，不依赖 ffmpeg */
export const binaryMerger: Merger = {
  name: 'binary',
  container: '*',
  priority: 0,
  // 缺失初始化段时，fMP4 分片拼接产物无法解码，不产出无效文件
  support: ctx => ctx.files.length > 0 && !(ctx.m3u8Info.container === 'fmp4' && !ctx.m3u8Info.initSegment?.tsOut),
  async merge(ctx) {
    const { m3u8Info } = ctx;
    const initSegment = m3u8Info.initSegment;
    const files = initSegment?.tsOut && existsSync(initSegment.tsOut) ? [initSegment.tsOut, ...ctx.files] : ctx.files;

    // 纯二进制拼接的 MPEG-TS 流不能伪装成 mp4，按 ts 修正输出扩展名，避免产出不可播放的假 mp4
    const output = m3u8Info.container === 'fmp4' ? ctx.filepath : resolveOutputPath(ctx.filepath, 'ts', false);

    await concatFiles(files, output);
    return existsSync(output) ? output : '';
  },
};

/** 已注册的合并器，按优先级降序执行 */
const mergers: Merger[] = [fmp4Merger, tsMerger, binaryMerger].sort((a, b) => (b.priority || 0) - (a.priority || 0));

/**
 * 注册（或替换）一个合并器，用于扩展对新容器类型的支持。
 * 按 `priority` 降序排列，高优先级优先尝试
 */
export function registerMerger(merger: Merger) {
  const idx = mergers.findIndex(d => d.name === merger.name);
  if (idx > -1) mergers[idx] = merger;
  else mergers.push(merger);
  mergers.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  return mergers;
}

/** 获取已注册的合并器列表 */
export function getMergers() {
  return [...mergers];
}

/** 判断合并器是否适用于指定的容器类型 */
function matchContainer(merger: Merger, container: M3u8ContainerType) {
  if (merger.container === '*') return true;
  if (merger.container === container) return true;
  // 未能识别容器类型时，按 MPEG-TS 处理
  return container === 'unknown' && merger.container === 'ts';
}

/** 兼容入参：允许直接传入分片列表 */
function normalizeM3u8Info(m3u8Info: M3u8Info | TsItemInfo[]): M3u8Info {
  if (!Array.isArray(m3u8Info)) return { container: 'ts', ...m3u8Info };

  const first = m3u8Info.find(d => d.tsOut && existsSync(d.tsOut)) || m3u8Info[0];
  const container = first?.tsOut ? detectContainerByFile(first.tsOut) || detectContainerType(first.uri) : 'unknown';

  return {
    manifest: {},
    crypto: {},
    container,
    tsCount: m3u8Info.length,
    duration: +m3u8Info.reduce((a, b) => a + (b.duration || 0), 0).toFixed(2),
    data: m3u8Info,
  };
}

/** 依据容器类型与 ffmpeg 可用性，修正输出文件的扩展名 */
function resolveOutputPath(filepath: string, container: M3u8ContainerType, ffmpegSupport: boolean) {
  if (/\.ts$/i.test(filepath)) {
    // fMP4 不能输出为 ts
    if (container === 'fmp4') return filepath.replace(/\.ts$/i, '.mp4');
    return filepath;
  }

  if (/\.mp4$/i.test(filepath)) {
    // MPEG-TS 无 ffmpeg 时无法封装为 mp4
    if (container !== 'fmp4' && !ffmpegSupport) return filepath.replace(/\.mp4$/i, '.ts');
    return filepath;
  }

  if (extname(filepath)) return filepath;

  return `${filepath}${getOutputExt(container, ffmpegSupport)}`;
}

/**
 * 将已下载的分片合并转换为可播放的视频文件。
 *
 * 依据分片容器类型自动选择合并策略：
 * - `fmp4`：初始化段 + 分片拼接后重新封装为 mp4（无 ffmpeg 时直接输出拼接产物）
 * - `ts`：ffmpeg concat 解复用器封装为 mp4（无 ffmpeg 时二进制拼接为 ts）
 */
export async function m3u8Convert(options: M3u8DLOptions, m3u8Info: M3u8Info | TsItemInfo[]) {
  const lang = getLang(options.lang);
  const info = normalizeM3u8Info(m3u8Info);
  const container = info.container || 'ts';
  const ffmpegBin = options.ffmpegPath || 'ffmpeg';
  const ffmpegSupport = isSupportFfmpeg(ffmpegBin);

  let filepath = resolveOutputPath(resolve(options.saveDir || process.cwd(), options.filename || ''), container, ffmpegSupport);

  if ((!options.force && existsSync(filepath)) || !info.data.length) return filepath;

  const files = info.data.map(d => d.tsOut).filter(d => d && existsSync(d));
  if (!files.length) return '';

  logger.info(
    `Starting ${container === 'fmp4' ? 'merge fMP4(m4s) fragments into' : ffmpegSupport ? 'convert to mp4' : 'merge into ts'} file:`,
    greenBright(filepath)
  );
  mkdirp(dirname(filepath));

  const ctx: MergeContext = {
    options,
    m3u8Info: info,
    files,
    filepath,
    ffmpegBin,
    ffmpegSupport,
    cacheDir: dirname(files[0]),
    lang,
  };

  for (const merger of mergers) {
    if (!matchContainer(merger, container) || !merger.support(ctx)) continue;

    logger.debug('[m3u8Convert][merger]', merger.name, container);
    const result = await merger.merge(ctx).catch(e => {
      logger.error(`[m3u8Convert][${merger.name}]`, (e as Error)?.message || e);
      return '';
    });

    if (result && existsSync(result)) {
      filepath = result;
      logger.info(`File saved[${magentaBright(formatByteSize(statSync(filepath).size))}]:`, greenBright(filepath));
      return filepath;
    }

    logger.warn(`[m3u8Convert][${merger.name}]${t('download.status.mergeFailed', lang)}`);
  }

  return '';
}

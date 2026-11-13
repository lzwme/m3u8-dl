import { createWriteStream, existsSync, promises as fsPromises, unlinkSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { formatByteSize, formatTimeCost, md5, mkdirp } from '@lzwme/fe-utils';
import { blueBright, cyan, gray, greenBright, magentaBright, yellowBright } from 'console-log-colors';
import type { M3u8DLOptions, M3u8DLProgressStats, M3u8DLResult } from '../types/m3u8';
import type { VideoInfo } from '../types/video-parser.js';
import { getLang, t } from './i18n.js';
import { execFfmpeg } from './m3u8-convert.js';
import { formatHeaders, isSupportFfmpeg, logger, request } from './utils.js';

/** 单个分片的最小大小 */
const MIN_CHUNK_SIZE = 1024 * 1024;
/** 单个分片最多重试次数 */
const CHUNK_MAX_RETRY = 2;
/** 单次请求超时时间（毫秒） */
const REQUEST_TIMEOUT = 20000;

/**
 * 探测文件总大小。
 *
 * 平台的 CDN 往往不支持 HEAD（返回 404），因此改用 `Range: bytes=0-0` 请求，
 * 从响应头 `Content-Range` 中读取总大小。
 */
async function probeSize(url: string, headers: Record<string, string>) {
  const r = await request.get<Buffer>(
    url,
    null,
    { ...headers, range: 'bytes=0-0' },
    { rejectUnauthorized: false, timeout: REQUEST_TIMEOUT }
  );
  if (r.response.statusCode !== 206) return 0;
  const contentRange = String(r.response.headers['content-range'] || '');
  return Number(contentRange.split('/')[1]) || 0;
}

/** 是否为移动 CDN 节点（*.bilivideo.cn），这类节点的可用性通常不如标准 upos 节点 */
function isMcdnNode(url: string) {
  try {
    return new URL(url).hostname.endsWith('.bilivideo.cn');
  } catch {
    return false;
  }
}

/**
 * 并发分段下载（Range 请求）。
 *
 * 相比整包下载到内存，既能降低内存占用，又能利用多线程提升速度；
 * 同时支持备用地址兜底与分片级重试。
 */
async function downloadRanged(
  url: string,
  backupUrls: string[],
  filepath: string,
  headers: Record<string, string>,
  options: M3u8DLOptions,
  onProgress: (downloaded: number, total: number) => void
) {
  const urls = [url, ...backupUrls].filter(Boolean);

  // 逐个探测可用地址：CDN 会为每条流分配不同节点，部分节点可能不可达
  const probed: { url: string; size: number; cost: number }[] = [];
  for (const u of urls) {
    const start = Date.now();
    try {
      const size = await probeSize(u, headers);
      const cost = Date.now() - start;
      if (size) {
        probed.push({ url: u, size, cost });
        logger.debug('[dash]节点可用:', new URL(u).host, size, `${cost}ms`);
      }
    } catch (e) {
      logger.warn('[dash]节点不可用:', new URL(u).host, (e as Error).message);
    }
  }

  if (!probed.length) {
    // 服务器不支持分段下载：退化为整包流式下载
    logger.warn('[dash]服务器不支持分段下载，退化为整包下载');
    const { res } = await request.req(url, null, { headers, rejectUnauthorized: false, timeout: REQUEST_TIMEOUT }, false);
    await new Promise<void>((rs, rj) => {
      const out = createWriteStream(filepath);
      res.on('error', rj);
      out.on('error', rj);
      out.on('finish', () => rs());
      res.pipe(out);
    });
    const size = (await fsPromises.stat(filepath)).size;
    onProgress(size, size);
    return { size, isExist: false };
  }

  const total = probed[0].size;
  // 优先使用标准 upos 节点（*.bilivideo.com），其可用性通常优于 mcdn 节点（*.bilivideo.cn）
  const workingUrls = [...probed]
    .sort((a, b) => (isMcdnNode(a.url) ? 1 : 0) - (isMcdnNode(b.url) ? 1 : 0) || a.cost - b.cost)
    .map(d => d.url);

  // 已存在且大小一致时跳过
  if (existsSync(filepath) && !options.force) {
    const stat = await fsPromises.stat(filepath);
    if (stat.size === total) {
      onProgress(total, total);
      return { size: total, isExist: true };
    }
  }

  const parallelism = Math.max(1, Math.min(options.threadNum || 4, 8));
  const chunkCount = Math.max(1, Math.min(Math.ceil(total / MIN_CHUNK_SIZE), parallelism * 4));
  const chunkSize = Math.ceil(total / chunkCount);

  const handle = await fsPromises.open(filepath, 'w');
  let downloaded = 0;
  let cursor = 0;

  const downloadChunk = async (index: number) => {
    const start = index * chunkSize;
    const end = Math.min(start + chunkSize, total) - 1;

    let lastError: Error | null = null;
    for (const u of [...workingUrls]) {
      for (let retry = 0; retry < CHUNK_MAX_RETRY; retry++) {
        try {
          const r = await request.get<Buffer>(
            u,
            null,
            { ...headers, range: `bytes=${start}-${end}` },
            { rejectUnauthorized: false, timeout: REQUEST_TIMEOUT }
          );
          if (!r.buffer?.length) throw new Error('分片内容为空');
          await handle.write(r.buffer, 0, r.buffer.length, start);
          downloaded += r.buffer.length;
          onProgress(downloaded, total);
          return;
        } catch (e) {
          lastError = e as Error;
          logger.warn(`[dash]分片 ${index + 1}/${chunkCount} 下载失败(${new URL(u).host}):`, lastError.message);
        }
      }
      // 该节点连续失败，后续分片不再使用它
      const idx = workingUrls.indexOf(u);
      if (idx > -1) workingUrls.splice(idx, 1);
    }
    throw lastError || new Error(`分片 ${index + 1} 下载失败`);
  };

  const worker = async () => {
    while (true) {
      const index = cursor++;
      if (index >= chunkCount) return;
      await downloadChunk(index);
    }
  };

  try {
    await Promise.all(Array.from({ length: Math.min(parallelism, chunkCount) }, () => worker()));
  } finally {
    await handle.close();
  }

  return { size: total, isExist: false };
}

/**
 * 下载音视频分离的两条流并合并为一个文件。
 *
 * 典型场景是 B 站的 DASH 格式：视频流与音频流分开提供，需要用 ffmpeg 封装为一个 mp4。
 */
export async function dashDownload(info: VideoInfo, opts: M3u8DLOptions): Promise<M3u8DLResult> {
  const lang = getLang(opts.lang);
  const options: M3u8DLOptions = { saveDir: process.cwd(), showProgress: true, ...opts };
  const filename = options.filename || 'video.mp4';
  const filepath = resolve(options.saveDir || process.cwd(), filename);
  const cacheDir = options.cacheDir || resolve(process.cwd(), 'cache');
  const startTime = Date.now();

  const stats: M3u8DLProgressStats = {
    url: info.url,
    startTime,
    progress: 0,
    tsSuccess: 0,
    tsFailed: 0,
    tsCount: info.audioUrl ? 2 : 1,
    duration: 0,
    durationDownloaded: 0,
    downloadedSize: 0,
    avgSpeed: 0,
    avgSpeedDesc: '0B/s',
    speed: 0,
    speedDesc: '0B/s',
    remainingTime: 0,
    filename,
    localVideo: filepath,
  };

  logger.debug('[dash]dashDownload', info.url, info.audioUrl, filepath);
  if (options.onInited) options.onInited(stats, null, null);

  const headers = { referer: info.referer || info.url, ...formatHeaders(options.headers) };
  const videoFile = resolve(cacheDir, `${md5(info.url)}.video.m4s`);
  const audioFile = resolve(cacheDir, `${md5(info.audioUrl || '')}.audio.m4s`);

  /** 视频流占 90% 进度，音频流占 10% */
  let videoSize = 0;
  let audioSize = 0;
  let videoDownloaded = 0;
  let audioDownloaded = 0;

  const report = () => {
    const downloaded = videoDownloaded + audioDownloaded;
    const size = videoSize + audioSize;
    const percent = size ? (downloaded / size) * 100 : 0;
    const elapsed = Math.max(1, Date.now() - startTime);
    const speed = (downloaded / elapsed) * 1000;

    stats.progress = +percent.toFixed(2);
    stats.downloadedSize = downloaded;
    stats.size = size;
    stats.speed = speed;
    stats.speedDesc = `${formatByteSize(speed)}/s`;
    stats.remainingTime = speed > 0 ? Math.round((size - downloaded) / speed) : 0;

    if (options.showProgress) {
      const processBar = '='.repeat(Math.floor(stats.progress * 0.2)).padEnd(20, '-');
      logger.logInline(
        [
          `${stats.progress}% [${greenBright(processBar)}] `,
          `${blueBright(formatByteSize(stats.downloadedSize))} ${yellowBright(formatTimeCost(startTime))} ${magentaBright(stats.speedDesc)} `,
          stats.remainingTime ? `${cyan(formatTimeCost(Date.now() - stats.remainingTime))}` : '',
        ].join('')
      );
    }

    if (options.onProgress) options.onProgress(downloaded, size, null, stats);
  };

  try {
    mkdirp(cacheDir);
    logger.info(t('download.status.dashDownloading', lang), gray(info.url));

    const video = await downloadRanged(info.url, info.backupUrls || [], videoFile, headers, options, (downloaded, size) => {
      videoDownloaded = downloaded;
      videoSize = size;
      report();
    });

    if (info.audioUrl) {
      const audio = await downloadRanged(info.audioUrl, info.audioBackupUrls || [], audioFile, headers, options, (downloaded, size) => {
        audioDownloaded = downloaded;
        audioSize = size;
        report();
      });
      stats.tsSuccess = 2;
      logger.debug('[dash]audio size', audio.size);
    } else {
      stats.tsSuccess = 1;
    }

    const ffmpegBin = options.ffmpegPath || 'ffmpeg';
    if (!isSupportFfmpeg(ffmpegBin)) {
      const errmsg = t('download.status.ffmpegRequired', lang);
      logger.error(errmsg);
      stats.errmsg = errmsg;
      return { filepath: '', errmsg, stats, options };
    }

    logger.info(t('download.status.dashMerging', lang), greenBright(filepath));
    // 保存目录可能尚未创建（与 m3u8 合并流程保持一致）
    mkdirp(dirname(filepath));
    const mergeArgs = info.audioUrl
      ? `"${ffmpegBin}" -y -i "${videoFile}" -i "${audioFile}" -c copy -movflags +faststart "${filepath}"`
      : `"${ffmpegBin}" -y -i "${videoFile}" -c copy -movflags +faststart "${filepath}"`;
    const r = await execFfmpeg(mergeArgs, ffmpegBin);

    if (r.error || !existsSync(filepath)) {
      const errmsg = t('download.status.dashMergeFailed', lang);
      logger.error(errmsg, r.stderr || '');
      stats.errmsg = errmsg;
      return { filepath: '', errmsg, stats, options };
    }

    stats.endTime = Date.now();
    stats.progress = 100;
    logger.info('File saved:', greenBright(filepath));

    // 清理中间文件
    if (options.delCache !== false) {
      for (const f of [videoFile, audioFile]) {
        try {
          if (existsSync(f)) unlinkSync(f);
        } catch {
          // 清理失败不影响下载结果
        }
      }
    }

    return { filepath, size: video.size, stats, options };
  } catch (error) {
    const errmsg = t('download.status.downloadFailedWithMessage', lang, { message: (error as Error).message });
    logger.error(errmsg, gray(info.url));
    stats.errmsg = errmsg;
    return { filepath: '', errmsg, stats, options };
  }
}

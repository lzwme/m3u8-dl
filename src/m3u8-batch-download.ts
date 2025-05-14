/*
 * @Author: renxia lzwy0820@qq.com
 * @Date: 2024-07-30 08:57:58
 * @LastEditors: renxia
 * @LastEditTime: 2025-05-09 16:59:23
 * @FilePath: \m3u8-dl\src\m3u8-batch-download.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { existsSync, promises } from 'node:fs';
import { basename } from 'node:path';
import { m3u8Download, preDownLoad } from './lib/m3u8-download';
import { M3u8DLOptions, M3u8WorkerPool } from './types/m3u8';
import { logger } from './lib/utils';
import { VideoParser } from './video-parser';
import { gray, red } from 'console-log-colors';

async function formatUrls(urls: string[], options: M3u8DLOptions): Promise<Map<string, M3u8DLOptions>> {
  const taskset = new Map<string, M3u8DLOptions>();
  for (const url of urls) {
    if (!url) continue;
    if (existsSync(url)) {
      const content = await promises.readFile(url, 'utf8');
      if (content.includes('.m3u8')) {
        const list = content
          .split('\n')
          .filter(d => d.includes('.m3u8'))
          .map((href, idx) => {
            if (href.startsWith('http')) href = `${idx}|${href}`;
            return href;
          });
        const o = { ...options };
        if (!o.filename) o.filename = basename(url).split('.')[0];
        const t = await formatUrls(list, o);
        for (const d of t.entries()) taskset.set(d[0], d[1]);

        continue;
      }
    }

    taskset.set(url, options);
  }

  return taskset;
}

export async function m3u8BatchDownload(urls: string[], options: M3u8DLOptions) {
  const tasks = await formatUrls(urls, options);
  let workPoll: M3u8WorkerPool;

  return new Promise<boolean>(rs => {
    let preDLing = false;
    const run = () => {
      const [url, urlNext] = [...tasks.keys()];

      if (url) {
        const o = { ...tasks.get(url) };
        const onProgress = o.onProgress;
        const useVideoParser = VideoParser.getPlatform(url) !== null;

        tasks.delete(url);
        o.onInited = (s, _i, wp) => {
          if (workPoll) workPoll = wp;
          if (useVideoParser) {
            logger.info('视频解析完成：', s.filename, gray(s.url));
          }
        };
        o.onProgress = (finished, total, info, stats) => {
          if (onProgress) onProgress(finished, total, info, stats);
          if (!useVideoParser && !preDLing && urlNext && tasks.size && workPoll.freeNum > 1 && total - finished < options.threadNum) {
            logger.debug(
              '\n[预下载下一集]',
              'freeNum:',
              workPoll.freeNum,
              'totalNum:',
              workPoll.totalNum,
              'totalTask:',
              workPoll.totalTask,
              tasks.size
            );
            preDLing = true;
            preDownLoad(urlNext, options, workPoll).then(() => (preDLing = false));
          }
        };

        if (useVideoParser) {
          const vp = new VideoParser();
          vp.download(url, o).then(r => {
            if (r.code !== 0) {
              logger.error('下载失败：', red(r.message), gray(url));
            } else {
              if (r.data?.isExist) logger.info('文件已存在：', gray(r.data.filepath));
              logger.debug('下载完成：', gray(url), gray(r.data.filepath));
            }
            if (tasks.size === 0) {
              rs(r.data.filepath && existsSync(r.data.filepath));
            } else {
              run();
            }
          });
        } else {
          m3u8Download(url, o).then(r => (tasks.size === 0 ? rs(existsSync(r.filepath)) : run()));
        }
      }
    };
    run();
  }).then(d => {
    if (workPoll && workPoll.freeNum === workPoll.numThreads) workPoll.close();
    return d;
  });
}

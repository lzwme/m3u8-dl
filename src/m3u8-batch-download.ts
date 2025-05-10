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
      const [key, keyNext] = [...tasks.keys()];

      if (key) {
        const o = { ...tasks.get(key) };
        const onProgress = o.onProgress;

        tasks.delete(key);
        o.onInited = (_m3u8Info, wp) => (workPoll = wp);
        o.onProgress = (finished, total, info, stats) => {
          if (onProgress) onProgress(finished, total, info, stats);
          if (!preDLing && keyNext && tasks.size && workPoll.freeNum > 1 && total - finished < options.threadNum) {
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
            preDownLoad(keyNext, options, workPoll).then(() => (preDLing = false));
          }
        };

        m3u8Download(key, o).then(r => (tasks.size === 0 ? rs(existsSync(r.filepath)) : run()));
      }
    };
    run();
  }).then(d => {
    if (workPoll.freeNum === workPoll.numThreads) workPoll.close();
    return d;
  });
}

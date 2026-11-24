/*
 * @Author: renxia lzwy0820@qq.com
 * @Date: 2024-07-30 08:57:58
 * @LastEditors: renxia
 * @LastEditTime: 2025-05-30 10:16:45
 * @FilePath: \m3u8-dl\src\m3u8-batch-download.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { existsSync, promises } from 'node:fs';
import { basename } from 'node:path';
import { gray, red } from 'console-log-colors';
import { fileDownload } from './lib/file-download';
import { formatOptions } from './lib/format-options';
import { m3u8Download, preDownLoad, workPollPublic } from './lib/m3u8-download';
import { logger } from './lib/utils';
import type { M3u8DLOptions, M3u8DLResult, M3u8WorkerPool } from './types/m3u8';
import { VideoParser } from './video-parser';

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
            if (!href.startsWith('http')) return href;
            // 纯 URL 行无行内名称：未指定 --filename 时用「txt 文件名-行号」兜底
            const prefix = options.filename ? '' : `${basename(url).split('.')[0]}-`;
            return `${prefix}${idx}$${href}`;
          });
        const t = await formatUrls(list, { ...options });
        for (const d of t.entries()) taskset.set(d[0], d[1]);

        continue;
      }
    }

    const r = await formatOptions(url, options);
    taskset.set(r.url, r.options);
  }

  return taskset;
}

export async function m3u8BatchDownload(urls: string[], options: M3u8DLOptions) {
  const tasks = await formatUrls(urls, options);
  let workPoll: M3u8WorkerPool;

  return new Promise<boolean>(rs => {
    let preDLing = false;
    /** 进行中的预下载任务，用于在开始下一集前等待它结束 */
    let preDLTask: Promise<void> | null = null;
    const afterDownload = (r: M3u8DLResult, url: string) => {
      // --no-convert 时不产出合并文件，此时以「分片是否全部下载成功」作为完成依据
      const noConvertOk = r.options?.convert === false && !!r.stats?.tsSuccess && !r.stats?.tsFailed;
      const success = noConvertOk || (!!r.filepath && existsSync(r.filepath));

      if (success) {
        if (r.isExist) logger.info('文件已存在：', gray(r.filepath));
        logger.debug('下载完成：', gray(url), gray(r.filepath || ''));
      } else {
        logger.error('下载失败：', red(r.errmsg || '未知错误'), gray(url));
      }

      const next = () => {
        if (tasks.size === 0) rs(success);
        else run();
      };

      // 预下载仍在进行时先等它结束：否则下一集会对同一分片重复下载（两个 writer 写同一临时文件）
      if (preDLTask) {
        const pending = preDLTask;
        preDLTask = null;
        logger.debug('[预下载下一集]等待进行中的预下载完成');
        pending.then(next);
      } else {
        next();
      }
    };
    /** 下载流程抛错时统一走失败回调，避免 Promise 悬挂导致整个批任务不结束 */
    const onDownloadError = (error: unknown, url: string) => {
      afterDownload({ filepath: '', errmsg: (error as Error)?.message || String(error) }, url);
    };
    const run = () => {
      const [url, urlNext] = [...tasks.keys()];

      if (url) {
        const o = tasks.get(url);
        const onProgress = o.onProgress;

        tasks.delete(url);
        o.onInited = (s, _i, wp) => {
          workPoll = wp;
          if (o.type === 'parser') {
            logger.info('视频解析完成：', s.filename, gray(s.url));
          }
        };
        o.onProgress = (finished, total, info, stats) => {
          if (onProgress) onProgress(finished, total, info, stats);
          if (o.type === 'm3u8' && !preDLing && urlNext && tasks.size && workPoll?.freeNum > 1 && total - finished < o.threadNum) {
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
            // 用独立的公共池预下载：当前集的池会在本集结束时 close()，
            // 共用会让进行中的预下载任务被 terminate，留下 .part 残留文件
            preDLTask = preDownLoad(urlNext, options, workPollPublic, workPoll?.freeNum || 1)
              .catch(e => logger.warn('[预下载下一集]异常:', (e as Error)?.message || e))
              .finally(() => {
                preDLing = false;
              });
          }
        };

        if (o.type === 'parser') {
          VideoParser.download(url, o)
            .then(r => afterDownload(r, url))
            .catch(e => onDownloadError(e, url));
        } else if (o.type === 'file') {
          fileDownload(url, o)
            .then(r => afterDownload(r, url))
            .catch(e => onDownloadError(e, url));
        } else {
          m3u8Download(url, o)
            .then(r => afterDownload(r, url))
            .catch(e => onDownloadError(e, url));
        }
      }
    };
    run();
  }).then(d => {
    if (workPoll && workPoll.freeNum === workPoll.numThreads) workPoll.close();
    return d;
  });
}

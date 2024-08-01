import type { CliOptions, VideoDetails } from '../types';
import { stor } from './storage.js';
import { logger } from './utils.js';
import { m3u8BatchDownload } from '../m3u8-batch-download.js';
import { prompt } from 'enquirer';
import { cyanBright, color, greenBright, gray, green } from 'console-log-colors';
import { apiManage } from './search-api/ApiManage';

export async function VideoSerachAndDL(
  keyword: string,
  options: { url?: string[]; apidir?: string; remoteConfigUrl?: string },
  baseOpts: CliOptions
): Promise<void> {
  logger.debug(options, baseOpts);
  const cache = stor.get();
  const doDownload = async (info: Partial<VideoDetails>, urls: string[]) => {
    const p = await prompt<{ play: boolean }>({
      type: 'confirm',
      name: 'play',
      initial: baseOpts.play,
      message: `【${greenBright(info.vod_name)}】是否边下边播？`,
    });
    baseOpts.play = p.play;
    try {
      cache.latestSearchDL = {
        ...cache.latestSearchDL,
        info,
        urls,
        dlOptions: { filename: info.vod_name.replaceAll(' ', '_'), ...baseOpts },
      };
      stor.save({ latestSearchDL: cache.latestSearchDL });
      const r = await m3u8BatchDownload(cache.latestSearchDL.urls, cache.latestSearchDL.dlOptions);
      if (r) stor.set({ latestSearchDL: null });
    } catch (error) {
      logger.info('cachel download');
    }
  };

  if (cache.latestSearchDL?.urls) {
    const p = await prompt<{ k: boolean }>({
      type: 'confirm',
      name: 'k',
      initial: true,
      message: `存在上次未完成的下载【${greenBright(cache.latestSearchDL.info.vod_name)}】，是否继续？`,
    });

    if (p.k) {
      await doDownload(cache.latestSearchDL.info, cache.latestSearchDL.urls);
    } else {
      stor.set({ latestSearchDL: null });
    }
  }

  if (options.apidir && !apiManage.current) apiManage.load(options.apidir);
  if (options.url) {
    options.url.forEach(api => apiManage.add({ api, desc: api }));
  }

  await apiManage.select();

  await prompt<{ k: string }>({
    type: 'input',
    name: 'k',
    message: '请输入关键字',
    validate: value => value.length > 1,
    initial: keyword,
  }).then(v => (keyword = v.k));

  const sRes = await apiManage.search(keyword, apiManage.current);
  logger.debug(sRes);

  if (!sRes.length) {
    console.log(color.green(`[${keyword}]`), `没有搜到结果`);
    return VideoSerachAndDL(keyword, options, baseOpts);
  }

  const choices = sRes.map((d, idx) => ({
    name: d.vod_id,
    message: `${idx + 1}. [${d.type_name}] ${d.vod_name}`,
    hint: `${d.vod_remarks}(${d.vod_time})`,
  }));
  const answer1 = await prompt<{ vid: number }>({
    type: 'select',
    name: 'vid',
    pointer: '👉',
    message: `查找到了 ${color.greenBright(sRes.length)} 条结果，请选择：`,
    choices: choices.concat({ name: -1, message: greenBright('重新搜索'), hint: '' }) as never,
  } as never);

  if (answer1.vid === -1) return VideoSerachAndDL(keyword, options, baseOpts);

  const vResult = await apiManage.detail(sRes.find(d => d.vod_id == answer1.vid));
  if (!vResult) {
    logger.error('获取视频信息失败!');
    return VideoSerachAndDL(keyword, options, baseOpts);
  } else {
    const info = vResult.list[0];
    if (!info.vod_play_url) {
      logger.error('未获取到播放地址信息', info);
      return VideoSerachAndDL(keyword, options, baseOpts);
    }

    if (!info.vod_play_note || !String(info.vod_play_url).includes(info.vod_play_note)) {
      ['#', '$'].some(d => {
        if (info.vod_play_url.includes(d)) {
          info.vod_play_note = d;
          return true;
        }
        return true;
      });
    }

    const urls = info.vod_play_url
      .split(info.vod_play_note || '$')
      .find(d => d.includes('.m3u8'))
      .split('#');

    logger.debug(info, urls);
    const r = (key: keyof typeof info, desc: string) => (info[key] ? `  [${desc}] ${greenBright(info[key])}` : '');
    console.log(
      [
        `\n  [名称] ${cyanBright(info.vod_name)}`,
        r('vod_sub', '别名'),
        `  [更新] ${greenBright(info.vod_remarks)}(${gray(info.vod_time)})`,
        r('vod_total', '总集数'),
        r('type_name', '分类'),
        r('vod_class', '类别'),
        r('vod_writer', '作者'),
        r('vod_area', '地区'),
        r('vod_lang', '语言'),
        r('vod_year', '年份'),
        r('vod_douban_score', '评分'),
        r('vod_pubdate', '上映日期'),
        `\n${green((info.vod_content || info.vod_blurb).replace(/<\/?.+?>/g, ''))}\n`, // 描述
      ]
        .filter(Boolean)
        .join('\n'),
      '\n'
    );

    const answer = await prompt<{ url: string }>({
      type: 'select',
      name: 'url',
      choices: [
        { name: '1', message: green('全部下载') },
        { name: '-1', message: cyanBright('重新搜索') },
      ].concat(urls.map((d, i) => ({ name: d, message: `${i + 1}. ${d}` }))),
      message: `获取到了 ${color.magentaBright(urls.length)} 条视频下载地址，请选择：`,
    });

    if (answer.url !== '-1') {
      await doDownload(info, answer.url === '1' ? urls : [answer.url]);
    }

    return VideoSerachAndDL(keyword, options, baseOpts);
  }
}

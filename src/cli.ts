import { resolve } from 'node:path';
import { program } from 'commander';
import { cyanBright, color, greenBright, gray, green } from 'console-log-colors';
import { PackageJson, readJsonFileSync } from '@lzwme/fe-utils';
import { prompt } from 'enquirer';
import { logger } from './lib/utils.js';
import { m3u8BatchDownload } from './m3u8-batch-download';
import type { M3u8DLOptions } from './types/m3u8';
import { VideoSearch } from './lib/video-search.js';

interface POptions extends M3u8DLOptions {
  silent?: boolean;
  progress?: boolean;
}

const pkg = readJsonFileSync<PackageJson>(resolve(__dirname, '../package.json'));

process.on('unhandledRejection', (r, p) => {
  console.log('[退出]UnhandledPromiseRejection', r, p);
  process.exit();
});

process.on('SIGINT', signal => {
  logger.info('强制退出', signal);
  process.exit();
});

program
  .version(pkg.version, '-v, --version')
  .description(cyanBright(pkg.description))
  .argument('<m3u8Urls...>', 'm3u8 url。也可以是本地 txt 文件，指定一组 m3u8，适用于批量下载的场景')
  .option('--silent', `开启静默模式。`)
  .option('--debug', `开启调试模式。`)
  .option('-f, --filename <name>', `指定下载文件的保存名称。默认取 url md5 值。若指定了多个 url 地址，则会在末尾增加序号`)
  .option('-n, --thread-num <number>', `并发下载线程数。默认为 cpu * 2。可设置不同数值观察下载效果`)
  .option('-F, --force', `文件已存在时，是否仍继续下载和生成`)
  .option('--no-progress', `是否不打印进度信息`)
  .option('-p, --play', `是否边下边看`)
  .option('-C, --cache-dir <dirpath>', `临时文件保存目录。默认为 cache`)
  .option('-S, --save-dir <dirpath>', `下载文件保存的路径。默认为当前目录`)
  .option('--no-del-cache', `下载成功后是否删除临时文件。默认为 true。保存临时文件可以在重复下载时识别缓存`, true)
  .action(async (urls: string[]) => {
    const options = getOptions();
    logger.debug(urls, options);

    if (options.progress != null) options.showProgress = options.progress;

    if (urls.length > 0) {
      await m3u8BatchDownload(urls, options);
    } else program.help();
  });

program
  .command('search [keyword]')
  .alias('s')
  .option('-u,--url <api...>', '影视搜索的接口地址(m3u8采集站标准接口)')
  .description('m3u8视频在线搜索与下载')
  .action(async (keyword, options: { url?: string[] }) => {
    VideoSerachAndDL(keyword, options, getOptions());
  });

program.parse(process.argv);

function getOptions() {
  const options = program.opts<POptions>();
  if (options.debug) {
    logger.updateOptions({ levelType: 'debug' });
  } else if (options.silent) {
    logger.updateOptions({ levelType: 'silent' });
    options.progress = false;
  }
  return options;
}

async function VideoSerachAndDL(keyword: string, options: { url?: string[] }, baseOpts: POptions): Promise<void> {
  const vs = new VideoSearch();
  await vs.updateOptions({ api: options.url || [] });
  let apiUrl = vs.api[0];

  if (!options.url && vs.api.length > 0) {
    await prompt<{ k: string }>({
      type: 'select',
      name: 'k',
      message: '请选择 API 站点',
      choices: vs.api.map(d => ({ name: d, message: d })) as never,

      validate: value => value.length >= 1,
    }).then(v => (apiUrl = v.k));
  }

  await prompt<{ k: string }>({
    type: 'input',
    name: 'k',
    message: '请输入关键字',
    validate: value => value.length > 1,
    initial: keyword,
  }).then(v => (keyword = v.k));

  const sRes = await vs.search(keyword, apiUrl);
  logger.debug(sRes);
  if (!sRes.total) {
    console.log(color.green(`[${keyword}]`), `没有搜到结果`);
    return VideoSerachAndDL(keyword, options, baseOpts);
  }

  const choices = sRes.list.map((d, idx) => ({
    name: d.vod_id,
    message: `${idx + 1}. [${d.type_name}] ${d.vod_name}`,
    hint: `${d.vod_remarks}(${d.vod_time})`,
  }));
  const answer1 = await prompt<{ vid: number }>({
    type: 'select',
    name: 'vid',
    pointer: '👉',
    message: `查找到了 ${color.greenBright(sRes.list.length)} 条结果，请选择：`,
    choices: choices.concat({ name: -1, message: greenBright('重新搜索'), hint: '' }) as never,
  } as never);

  if (answer1.vid === -1) return VideoSerachAndDL(keyword, options, baseOpts);

  const vResult = await vs.getVideoList(answer1.vid, apiUrl);
  if (!vResult.list?.length) {
    logger.error('获取视频信息失败!', vResult.msg);
    return VideoSerachAndDL(keyword, options, baseOpts);
  } else {
    const info = vResult.list[0];
    const urls = info.vod_play_url
      .split(info.vod_play_note)
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
      const p = await prompt<{ play: boolean }>({
        type: 'confirm',
        name: 'play',
        initial: baseOpts.play,
        message: `【${greenBright(info.vod_name)}】是否边下边播？`,
      });
      baseOpts.play = p.play;
      await m3u8BatchDownload(answer.url === '1' ? urls : [answer.url], { filename: info.vod_name.replaceAll(' ', '_'), ...baseOpts });
    }

    return VideoSerachAndDL(keyword, options, baseOpts);
  }
}

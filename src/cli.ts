import { resolve } from 'node:path';
import { program } from 'commander';
import { cyanBright } from 'console-log-colors';
import { PackageJson, readJsonFileSync } from '@lzwme/fe-utils';
import { logger } from './lib/utils.js';
import { m3u8BatchDownload } from './m3u8-batch-download';
import type { CliOptions } from './types/m3u8';
import { VideoSerachAndDL } from './lib/video-search.js';

const pkg = readJsonFileSync<PackageJson>(resolve(__dirname, '../package.json'));

process.on('unhandledRejection', (r, p) => {
  console.log('[退出][unhandledRejection]', r, p);
  process.exit();
});

process.on('SIGINT', signal => {
  logger.info('[SIGINT]强制退出', signal);
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
  .option('-F, --force', `启用强制执行模式。文件已存在时，是否仍继续下载和生成`)
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
  .option('-F, --force', `是否强制`)
  .description('m3u8视频在线搜索与下载')
  .action(async (keyword, options: { url?: string[] }) => {
    VideoSerachAndDL(keyword, options, getOptions());
  });

program.parse(process.argv);

function getOptions() {
  const options = program.opts<CliOptions>();
  if (options.debug) {
    logger.updateOptions({ levelType: 'debug' });
  } else if (options.silent) {
    logger.updateOptions({ levelType: 'silent' });
    options.progress = false;
  }
  return options;
}

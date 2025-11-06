import { resolve } from 'node:path';
import { type PackageJson, readJsonFileSync } from '@lzwme/fe-utils';
import { program } from 'commander';
import { cyanBright } from 'console-log-colors';
import { logger } from './lib/utils.js';
import { VideoSerachAndDL } from './lib/video-search.js';
import { m3u8BatchDownload } from './m3u8-batch-download';
import type { CliOptions } from './types/m3u8';

const pkg = readJsonFileSync<PackageJson>(resolve(__dirname, '../package.json'));

process.on('unhandledRejection', r => {
  console.error(r);
  logger.info('[退出][unhandledRejection]', (r as Error).message);
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
  .option('--silent', '开启静默模式。')
  .option('--debug', '开启调试模式。')
  .option('-f, --filename <name>', '指定下载文件的保存名称。默认取 url md5 值。若指定了多个 url 地址，则会在末尾增加序号')
  .option('-n, --thread-num <number>', '并发下载线程数。默认为 cpu * 2。可设置不同数值观察下载效果')
  .option('-F, --force', '启用强制执行模式。文件已存在时，是否仍继续下载和生成')
  .option('--no-progress', '是否不打印进度信息')
  .option('-p, --play', '是否边下边看')
  .option('-C, --cache-dir <dirpath>', '临时文件保存目录。默认为 cache')
  .option('-S, --save-dir <dirpath>', '下载文件保存的路径。默认为当前目录')
  .option('--no-del-cache', '下载成功后是否删除临时文件。默认为 true。保存临时文件可以在重复下载时识别缓存')
  .option('--no-convert', '下载成功后，是否不合并转换为 mp4 文件。默认为 true。')
  .option('--use-ffmpeg-static', '是否使用内置的 ffmpeg-static 而不是系统安装的 ffmpeg')
  .option('-H, --headers <headers>', '自定义请求头。格式为 key1=value1\nkey2=value2')
  .option('-T, --type <type>', '指定下载类型。默认根据URL自动识别，如果是批量下载多个不同 URL 类型，请不要设置。可选值：m3u8, file, parser')
  .option('-I, --ignore-segments <time-segments>', '忽略的视频片段，用-分割起始时间点，多个用逗号分隔。如：0-10,20-30')
  .action(async (urls: string[]) => {
    const options = getOptions();
    logger.debug(urls, options);
    if (options.progress != null) options.showProgress = options.progress;
    delete options.progress;

    if (urls.length > 0) {
      await m3u8BatchDownload(urls, options).then(r => process.exit(r ? 0 : 1));
    } else program.help();
  });

program
  .command('server')
  .description('启动下载中心web服务')
  .option('-P, --port <port>', '指定web服务端口。默认为6600')
  .option('-t, --token <token>', '指定web服务密码（请求头authorization）。默认为空')
  .action((options: { port?: number; token?: string; debug?: boolean; cacheDir?: string }) => {
    const opts = getOptions();
    if (opts.debug) options.debug = true;
    if (opts.cacheDir) options.cacheDir = opts.cacheDir;
    logger.debug('[cli][server]', opts, options);

    import('./server/download-server.js').then(m => {
      new m.DLServer(options);
    });
  });

program
  .command('search [keyword]')
  .alias('s')
  .option('-u,--url <api...>', '影视搜索的接口地址(m3u8采集站标准接口)')
  .option('-d, --apidir <dirpath>', '指定自定义视频搜索 api 所在的目录或具体路径')
  // .option('-R,--remote-config-url <url>', '自定义远程配置加载地址。默认从主仓库配置读取')
  .description('m3u8视频在线搜索与下载')
  .action(async (keyword, options: { url?: string[]; remoteConfigUrl?: string }) => {
    await VideoSerachAndDL(keyword, options, getOptions());
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

import { resolve } from 'node:path';
import { type PackageJson, readJsonFileSync } from '@lzwme/fe-utils';
import { program } from 'commander';
import { cyanBright } from 'console-log-colors';
import { getLang, setLanguage, t } from './lib/i18n.js';
import { logger } from './lib/utils.js';
import { VideoSerachAndDL } from './lib/video-search.js';
import { m3u8BatchDownload } from './m3u8-batch-download';
import type { CliOptions } from './types/m3u8';

const pkg = readJsonFileSync<PackageJson>(resolve(__dirname, '../package.json'));

process.on('unhandledRejection', r => {
  console.error(r);
  const lang = getLang();
  logger.info(`[${t('common.exit', lang)}][unhandledRejection]`, (r as Error).message);
  process.exit();
});

process.on('SIGINT', signal => {
  const lang = getLang();
  logger.info(`[SIGINT]${t('common.exit', lang)}`, signal);
  process.exit();
});

// Initialize language before using t()
const initialLang = getLang();
setLanguage(initialLang);

program
  .version(pkg.version, '-v, --version')
  .description(cyanBright(pkg.description))
  .argument('<m3u8Urls...>', t('cli.command.download.description', initialLang))
  .option('--silent', t('cli.option.silent', initialLang))
  .option('--debug', t('cli.option.debug', initialLang))
  .option('-f, --filename <name>', t('cli.option.filename', initialLang))
  .option('-n, --thread-num <number>', t('cli.option.threadNum', initialLang))
  .option('-F, --force', t('cli.option.force', initialLang))
  .option('--no-progress', t('cli.option.noProgress', initialLang))
  .option('-p, --play', t('cli.option.play', initialLang))
  .option('-C, --cache-dir <dirpath>', t('cli.option.cacheDir', initialLang))
  .option('-S, --save-dir <dirpath>', t('cli.option.saveDir', initialLang))
  .option('--no-del-cache', t('cli.option.noDelCache', initialLang))
  .option('--no-convert', t('cli.option.noConvert', initialLang))
  .option('--ffmpeg-path <path>', t('cli.option.ffmpegPath', initialLang))
  .option('-H, --headers <headers>', t('cli.option.headers', initialLang))
  .option('-T, --type <type>', t('cli.option.type', initialLang))
  .option('-I, --ignore-segments <time-segments>', t('cli.option.ignoreSegments', initialLang))
  .option('--lang <lang>', t('cli.option.lang', initialLang))
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
  .description(t('cli.command.server.description', initialLang))
  .option('-P, --port <port>', t('cli.option.port', initialLang))
  .option('-t, --token <token>', t('cli.option.token', initialLang))
  .option('--lang <lang>', t('cli.option.lang', initialLang))
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
  .option('-u,--url <api...>', t('cli.option.url', initialLang))
  .option('-d, --apidir <dirpath>', t('cli.option.apidir', initialLang))
  .option('--lang <lang>', t('cli.option.lang', initialLang))
  // .option('-R,--remote-config-url <url>', '自定义远程配置加载地址。默认从主仓库配置读取')
  .description(t('cli.command.search.description', initialLang))
  .action(async (keyword, options: { url?: string[]; remoteConfigUrl?: string }) => {
    await VideoSerachAndDL(keyword, options, getOptions());
  });

program.parse(process.argv);

function getOptions() {
  const options = program.opts<CliOptions & { lang?: string }>();

  // Set global language if specified
  if (options.lang) {
    setLanguage(getLang(options.lang));
  }

  if (options.debug) {
    logger.updateOptions({ levelType: 'debug' });
  } else if (options.silent) {
    logger.updateOptions({ levelType: 'silent' });
    options.progress = false;
  }

  return options;
}

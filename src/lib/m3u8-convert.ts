import { readFileSync, promises, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from '@lzwme/fe-utils';
import { greenBright, cyan, magentaBright } from 'console-log-colors';
import type { M3u8DLOptions, TsItemInfo } from '../types/m3u8';
import { isSupportFfmpeg, logger } from './utils';
import { formatByteSize } from '@lzwme/fe-utils/cjs/common/helper';

export async function m3u8Convert(options: M3u8DLOptions, data: TsItemInfo[]) {
  let ffmpegSupport = isSupportFfmpeg();
  let filepath = resolve(options.saveDir, options.filename);

  if (!ffmpegSupport) filepath = filepath.replace(/\.mp4$/, '.ts');
  if (!options.force && existsSync(filepath)) return filepath;

  logger.info(`Starting ${ffmpegSupport ? 'convert to mp4' : 'merge into ts'} file:`, greenBright(filepath));

  if (ffmpegSupport) {
    const inputFilePath = resolve(options.cacheDir, 'input.txt');
    let filesAllArr = data.map(d => resolve(d.tsOut)).filter(d => existsSync(d));

    if (process.platform === 'win32') filesAllArr = filesAllArr.map(d => d.replaceAll('\\', '/'));
    await promises.writeFile(inputFilePath, 'ffconcat version 1.0\nfile ' + filesAllArr.join('\nfile '));

    let headersString = '';
    if (options.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        headersString += `-headers "${key}: ${value}" `;
      }
    }

    const cmd = `ffmpeg -y -f concat -safe 0 -i ${inputFilePath} -acodec copy -vcodec copy -bsf:a aac_adtstoasc ${headersString} "${filepath}"`;
    logger.debug('[convert to mp4]cmd:', cyan(cmd));
    const r = execSync(cmd);
    ffmpegSupport = !r.error;
    if (r.error) logger.error('Conversion to mp4 failed. Please confirm that `ffmpeg` is installed!', r.stderr);
  }

  if (!ffmpegSupport) {
    filepath = filepath.replace(/\.mp4$/, '.ts');
    await promises.writeFile(filepath, Buffer.concat(data.map(d => readFileSync(d.tsOut))));
  }

  if (!existsSync(filepath)) return '';

  logger.info(`File saved[${magentaBright(formatByteSize(statSync(filepath).size))}]:`, greenBright(filepath));

  return filepath;
}

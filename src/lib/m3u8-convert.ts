import { readFileSync, promises, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from '@lzwme/fe-utils';
import { greenBright, cyan } from 'console-log-colors';
import type { M3u8DLOptions, TsItemInfo } from '../type';
import { isSupportFfmpeg, logger } from './utils';

export async function m3u8Convert(options: M3u8DLOptions, data: TsItemInfo[]) {
  let ffmpegSupport = isSupportFfmpeg();
  let filepath = resolve(options.saveDir, options.filename);

  if (!options.force && existsSync(filepath)) return filepath;

  if (ffmpegSupport) {
    const inputFilePath = resolve(options.cacheDir, 'input.txt');
    const filesAllArr = data.map(d => resolve(d.tsOut)).filter(d => existsSync(d));
    await promises.writeFile(inputFilePath, 'ffconcat version 1.0\nfile ' + filesAllArr.join('\nfile '));

    const cmd = `ffmpeg -y -f concat -safe 0 -i ${inputFilePath} -acodec copy -vcodec copy -absf aac_adtstoasc ${filepath}`;
    logger.debug('[m3u8-to-mp4]cmd:', cyan(cmd));
    const r = execSync(cmd);
    ffmpegSupport = !r.error;
    if (r.error) logger.error('Conversion to mp4 failed. Please confirm that ffmpeg is installed!', r.stderr);
  }

  if (!ffmpegSupport) {
    filepath = filepath.replace('.mp4', '.ts');
    if (!options.force && existsSync(filepath)) return filepath;

    const buf = Buffer.concat(data.map(d => readFileSync(d.tsOut)));
    await promises.writeFile(filepath, buf);
  }

  logger.info(ffmpegSupport ? 'Generated mp4 file:' : 'Merged into ts file:', greenBright(filepath));
  return filepath;
}

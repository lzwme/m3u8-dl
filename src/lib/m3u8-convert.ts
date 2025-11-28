import { createWriteStream, existsSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { execSync, formatByteSize, mkdirp } from '@lzwme/fe-utils';
import { cyan, greenBright, magentaBright } from 'console-log-colors';
import type { M3u8DLOptions, TsItemInfo } from '../types/m3u8';
import { isSupportFfmpeg, logger } from './utils';

export async function m3u8Convert(options: M3u8DLOptions, data: TsItemInfo[]) {
  const ffmpegBin = options.ffmpegPath || 'ffmpeg';

  let ffmpegSupport = isSupportFfmpeg(ffmpegBin);
  let filepath = resolve(options.saveDir, options.filename);

  if (!ffmpegSupport) filepath = filepath.replace(/\.mp4$/, '.ts');
  if ((!options.force && existsSync(filepath)) || !data.length) return filepath;

  logger.info(`Starting ${ffmpegSupport ? 'convert to mp4' : 'merge into ts'} file:`, greenBright(filepath));
  mkdirp(dirname(filepath));

  if (ffmpegSupport) {
    const ffconcatFile = resolve(dirname(data[0].tsOut), 'ffconcat.txt');
    let filesAllArr = data.filter(d => existsSync(d.tsOut)).map(d => `file '${d.tsOut}'\nduration ${d.duration}`);

    if (process.platform === 'win32') filesAllArr = filesAllArr.map(d => d.replaceAll('\\', '/'));
    writeFileSync(ffconcatFile, `ffconcat version 1.0\n${filesAllArr.join('\n')}`);

    // ffmpeg -i nz.ts -c copy -map 0:v -map 0:a -bsf:a aac_adtstoasc nz.mp4
    // const cmd = `"${ffmpegBin}" -async 1 -y -f concat -safe 0 -i "${ffconcatFile}" -acodec copy -vcodec copy -bsf:a aac_adtstoasc "${filepath}"`;
    const cmd = `"${ffmpegBin}" -async 1 -y -f concat -safe 0 -i "${ffconcatFile}" -c:v copy -c:a copy -movflags +faststart -fflags +genpts -bsf:a aac_adtstoasc "${filepath}"`;
    logger.debug('[convert to mp4]cmd:', cyan(cmd));
    const r = execSync(cmd);
    ffmpegSupport = !r.error;
    if (r.error) logger.error(`Conversion to mp4 failed. Please confirm that \`${ffmpegBin}\` is installed and available!`, r.stderr);
    else unlinkSync(ffconcatFile);
  }

  if (!ffmpegSupport) {
    filepath = filepath.replace(/\.mp4$/, '.ts');
    const filteWriteStream = createWriteStream(filepath);
    for (const d of data) {
      const err = await new Promise(rs => filteWriteStream.write(readFileSync(d.tsOut), e => rs(e)));
      if (err) logger.error(`Write file failed: ${d.tsOut}`, err);
    }
    filteWriteStream.end();
  }

  if (!existsSync(filepath)) return '';

  logger.info(`File saved[${magentaBright(formatByteSize(statSync(filepath).size))}]:`, greenBright(filepath));

  return filepath;
}

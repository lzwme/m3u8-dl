import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createReadStream, createWriteStream, existsSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { formatByteSize, mkdirp } from '@lzwme/fe-utils';
import { cyan, greenBright, magentaBright } from 'console-log-colors';
import type { M3u8DLOptions, TsItemInfo } from '../types/m3u8';
import { isSupportFfmpeg, logger } from './utils';

function formatCommand(ffmpegBin: string, args: string[]) {
  return [ffmpegBin, ...args].map(arg => (/[\s"]/u.test(arg) ? `"${arg.replaceAll('"', '\\"')}"` : arg)).join(' ');
}

async function runFfmpeg(ffmpegBin: string, args: string[]) {
  return await new Promise<{ error?: Error; stderr: string }>(resolve => {
    const child = spawn(ffmpegBin, args, {
      stdio: ['ignore', 'ignore', 'pipe'],
      windowsHide: true,
    });
    let stderr = '';
    let settled = false;
    const finish = (result: { error?: Error; stderr: string }) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    child.stderr?.setEncoding('utf8');
    child.stderr?.on('data', (chunk: string) => {
      stderr = `${stderr}${chunk}`.slice(-8_000);
    });
    child.once('error', error => finish({ error, stderr }));
    child.once('close', code => {
      if (code === 0) finish({ stderr });
      else finish({ error: new Error(`ffmpeg exited with code ${code}`), stderr });
    });
  });
}

async function appendTsFiles(filepath: string, data: TsItemInfo[]) {
  const filteWriteStream = createWriteStream(filepath);

  for (const d of data) {
    if (!existsSync(d.tsOut)) continue;

    const error = await new Promise<Error | null>(resolve => {
      const readStream = createReadStream(d.tsOut);
      const onError = (err: Error) => {
        cleanup();
        resolve(err);
      };
      const onEnd = () => {
        cleanup();
        resolve(null);
      };
      const cleanup = () => {
        readStream.off('error', onError);
        filteWriteStream.off('error', onError);
        readStream.off('end', onEnd);
      };

      readStream.once('error', onError);
      filteWriteStream.once('error', onError);
      readStream.once('end', onEnd);
      readStream.pipe(filteWriteStream, { end: false });
    });

    if (error) logger.error(`Write file failed: ${d.tsOut}`, error);
  }

  filteWriteStream.end();
  await once(filteWriteStream, 'finish');
}

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

    const args = [
      '-hide_banner',
      '-loglevel',
      'error',
      '-nostats',
      '-async',
      '1',
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      ffconcatFile,
      '-c:v',
      'copy',
      '-c:a',
      'copy',
      '-movflags',
      '+faststart',
      '-fflags',
      '+genpts',
      '-bsf:a',
      'aac_adtstoasc',
      filepath,
    ];
    logger.debug('[convert to mp4]cmd:', cyan(formatCommand(ffmpegBin, args)));

    try {
      const r = await runFfmpeg(ffmpegBin, args);
      ffmpegSupport = !r.error;
      if (r.error) {
        if (existsSync(filepath)) unlinkSync(filepath);
        logger.error(`Conversion to mp4 failed with \`${ffmpegBin}\`.`, r.stderr || r.error.message);
      }
    } finally {
      if (existsSync(ffconcatFile)) unlinkSync(ffconcatFile);
    }
  }

  if (!ffmpegSupport) {
    filepath = filepath.replace(/\.mp4$/, '.ts');
    await appendTsFiles(filepath, data);
  }

  if (!existsSync(filepath)) return '';

  logger.info(`File saved[${magentaBright(formatByteSize(statSync(filepath).size))}]:`, greenBright(filepath));

  return filepath;
}

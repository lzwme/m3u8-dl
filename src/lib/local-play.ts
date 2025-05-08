import { execSync, findFreePort, mkdirp } from '@lzwme/fe-utils';
import { color } from 'console-log-colors';
import { createReadStream, existsSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { logger } from './utils.js';
import type { TsItemInfo } from '../types/m3u8.js';

/**
 * 边下边看
 */
export async function localPlay(m3u8Info: TsItemInfo[]) {
  if (!m3u8Info?.length) return null;

  const cacheDir = dirname(m3u8Info[0].tsOut);
  const cacheDirname = basename(cacheDir);
  const cacheFilepath = toLocalM3u8(m3u8Info);
  const filename = basename(cacheFilepath);
  const info = await createLocalServer(dirname(cacheDir));

  const playUrl = `https://lzw.me/x/m3u8-player?url=${encodeURIComponent(`${info.origin}/${cacheDirname}/${filename}`)}`;
  const cmd = `${process.platform === 'win32' ? 'start' : 'open'} ${playUrl}`;
  execSync(cmd);

  return info;
}

export function toLocalM3u8(m3u8Info: TsItemInfo[], m3u8FilePath = '', host = '') {
  const cacheDir = dirname(m3u8Info[0].tsOut);
  const cacheDirname = basename(cacheDir);

  if (!m3u8FilePath) m3u8FilePath = resolve(cacheDir, `${cacheDirname}.m3u8`);
  if (existsSync(m3u8FilePath)) return m3u8FilePath;

  const m3u8ContentList = [
    `#EXTM3U`,
    `#EXT-X-VERSION:3`,
    `#EXT-X-ALLOW-CACHE:YES`,
    `#EXT-X-TARGETDURATION:${Math.max(...m3u8Info.map(d => d.duration))}`,
    `#EXT-X-MEDIA-SEQUENCE:0`,
    // `#EXT-X-KEY:METHOD=AES-128,URI="/api/aes/enc.key"`,
  ];

  if (host && !host.endsWith('/')) host += '/';

  m3u8Info.forEach(d => {
    if (d.tsOut) m3u8ContentList.push(`#EXTINF:${Number(d.duration).toFixed(6)},`, `${host}${basename(d.tsOut)}`);
  });

  m3u8ContentList.push(`#EXT-X-ENDLIST`);

  const m3u8Content = m3u8ContentList.join('\n');
  const ext = extname(m3u8FilePath);
  if (ext !== '.m3u8') m3u8FilePath = m3u8FilePath.replace(ext, '') + '.m3u8';
  m3u8FilePath = resolve(cacheDir, m3u8FilePath);
  mkdirp(cacheDir);
  writeFileSync(m3u8FilePath, m3u8Content, 'utf8');

  return m3u8FilePath;
}

async function createLocalServer(baseDir: string) {
  baseDir = resolve(baseDir);

  const port = await findFreePort();
  const origin = `http://localhost:${port}`;
  const server = createServer((req, res) => {
    const filename = join(baseDir, decodeURIComponent(req.url));
    logger.debug('[req]', req.url, filename);

    if (existsSync(filename)) {
      const stats = statSync(filename);
      const ext = extname(filename);

      if (stats.isFile()) {
        if (ext === '.m3u8') res.setHeader('Cache-Control', 'no-cache');

        res.writeHead(200, {
          'Last-Modified': stats.mtime.toUTCString(),
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Origin': '*',
          'Content-Length': String(stats.size),
          'Content-Type': ext === '.ts' ? 'video/mp2t' : ext === '.m3u8' ? 'application/vnd.apple.mpegurl' : 'text/plain',
        });

        createReadStream(filename).pipe(res);
        return;
      } else if (stats.isDirectory()) {
        const html = readdirSync(filename).map(fname => {
          const rpath = resolve(filename, fname).replace(baseDir, '');
          return `<li><a href="${rpath}">${rpath}</a></li>`;
        });

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<ol>${html.join('')}</ol>`);
        return;
      }
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }).listen(port, () => {
    console.log();
    logger.info('Created Local Server:', color.greenBright(origin));
  });

  return { port, origin, server };
}

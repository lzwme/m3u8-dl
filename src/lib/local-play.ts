import { execSync, findFreePort, md5 } from '@lzwme/fe-utils';
import { color } from 'console-log-colors';
import { createReadStream, existsSync, promises, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { logger } from './utils';
import { M3u8DLOptions, TsItemInfo } from '../type';

/**
 * 边下边看
 */
export async function localPlay(m3u8Info: TsItemInfo[], _options: M3u8DLOptions) {
  if (!m3u8Info?.length) return null;

  const cacheDir = dirname(m3u8Info[0].tsOut);
  const info = await createLocalServer(cacheDir);
  const filename = md5(cacheDir).slice(0, 8) + `.m3u8`;

  await toLocalM3u8(m3u8Info, resolve(cacheDir, filename), info.origin);

  const playUrl = `https://lzw.me/x/m3u8-player?url=${encodeURIComponent(`${info.origin}/${filename}`)}`;
  const cmd = `${process.platform === 'win32' ? 'start' : 'open'} ${playUrl}`;
  execSync(cmd);

  return info;
}

export async function toLocalM3u8(m3u8Info: TsItemInfo[], filepath: string, host = '') {
  const m3u8ContentList = [
    `#EXTM3U`,
    `#EXT-X-VERSION:3`,
    `#EXT-X-ALLOW-CACHE:YES`,
    `#EXT-X-TARGETDURATION:${Math.max(...m3u8Info.map(d => d.duration))}`,
    `#EXT-X-MEDIA-SEQUENCE:0`,
    // `#EXT-X-KEY:METHOD=AES-128,URI="/api/aes/enc.key"`,
  ];

  m3u8Info.forEach(d => {
    if (d.tsOut) m3u8ContentList.push(`#EXTINF:${Number(d.duration).toFixed(6)},`, `${host}/${basename(d.tsOut)}`);
  });

  m3u8ContentList.push(`#EXT-X-ENDLIST`);

  const m3u8Content = m3u8ContentList.join('\n');
  await promises.writeFile(filepath, m3u8Content, 'utf8');
}

async function createLocalServer(baseDir: string) {
  const port = await findFreePort();
  const origin = `http://localhost:${port}`;
  const server = createServer((req, res) => {
    const filename = join(baseDir, req.url);
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
      }
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }).listen(port, () => {
    logger.info('Created Local Server:', color.greenBright(origin));
  });

  return { port, origin, server };
}

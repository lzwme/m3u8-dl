import { existsSync, promises } from 'node:fs';
import { basename } from 'node:path';
import { m3u8Download } from './lib/m3u8-download';
import { M3u8DLOptions } from './type';

export async function m3u8BatchDownload(urls: string[], options: M3u8DLOptions) {
  for (const url of urls) {
    if (existsSync(url)) {
      const content = await promises.readFile(url, 'utf8');
      if (content.includes('.m3u8')) {
        const list = content
          .split('\n')
          .filter(d => d.includes('.m3u8'))
          .map((href, idx) => {
            if (href.startsWith('http')) href = `${idx}|${href}`;
            return href;
          });

        if (!options.filename) options.filename = basename(url).split('.')[0];
        await m3u8BatchDownload(list, options);
        continue;
      }
    }

    await m3u8Download(url, options);
  }
}

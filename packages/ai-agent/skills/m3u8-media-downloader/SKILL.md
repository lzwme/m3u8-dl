---
name: m3u8-media-downloader
description: Use @lzwme/m3u8-dl for media download and video info parsing. Use when the user mentions video/music download (m3u8/HLS/mp4/mp3 or 抖音/皮皮虾/微博视频), or 获取视频信息、解析视频链接, and a video/music URL is present.
---

# m3u8-downloader

Download m3u8/mp4 video and mp3/music, support 抖音、皮皮虾、微博 sharing links. Multi-thread download, WebUI, batch and Node API.

Example:

> 使用 m3u8-downloader skill 获取该视频详情：https://v.douyin.com/CW1iv0GeSJM/

## Main capabilities

- **m3u8/HLS & mp4** — download and merge to mp4 (ffmpeg required for ts→mp4)
- **Music** — mp3/m4a from m3u8/stream sources
- **抖音/皮皮虾/微博** — parse or download sharing links

## CLI

```bash
npx @lzwme/m3u8-dl <urls...> [options]
npx @lzwme/m3u8-dl info <url>        # 解析视频信息
npx @lzwme/m3u8-dl server            # 启动 WebUI (http://localhost:6600)
```

### Key options

| Option | Description |
|--------|-------------|
| `-f, --filename <name>` | Output filename |
| `-n, --thread-num <n>` | Download threads (default: 4) |
| `-S, --save-dir <dir>` | Save directory |
| `-T, --type <type>` | `m3u8` (default) \| `parser` \| `web` |
| `-H, --headers <json>` | Custom request headers |
| `--ffmpeg-path <path>` | ffmpeg path (for mp4 conversion) |

### Quick examples

```bash
# Basic download
npx @lzwme/m3u8-dl https://example.com/video.m3u8 -f "My Video" -S ./downloads

# 抖音/皮皮虾/微博 sharing link
# parser and download video
npx @lzwme/m3u8-dl "https://v.douyin.com/xxxxx/" --type parser
# parser and print info
npx @lzwme/m3u8-dl info "https://h5.pipix.com/xxxxx"

# With name: "name|url"
npx @lzwme/m3u8-dl "Episode 1|https://example.com/ep1.m3u8"

# Batch: file with one "filename$url" per line
npx @lzwme/m3u8-dl series-list.txt -f "Series Name"

# Extract m3u8 from web page
npx @lzwme/m3u8-dl "https://example.com/play/123" --type web
```

## WebUI

```bash
npx @lzwme/m3u8-dl server [-P <port>] [-t <token>]
# Env: DS_PORT, DS_SECRET, DS_SAVE_DIR, DS_CACHE_DIR, DS_FFMPEG_PATH
```
Open http://localhost:6600 to manage tasks in browser.

## Node API

```ts
import { m3u8Download, VideoParser, m3u8BatchDownload } from '@lzwme/m3u8-dl';

// Download m3u8/mp4
await m3u8Download(url, { filename: 'video', saveDir: './downloads' });

// Parse 抖音/皮皮虾/微博
const parser = new VideoParser();
const info = await parser.parse('https://v.douyin.com/xxxxx/');
await parser.download(info, { saveDir: './downloads' });

// Batch download
await m3u8BatchDownload(['name1$url1', 'name2$url2'], { saveDir: './downloads' });
```

## Scenario guide

| Scenario | CLI | Node API |
|----------|-----|----------|
| m3u8/mp4 URL | `npx @lzwme/m3u8-dl <url>` | `m3u8Download(url)` |
| 抖音/皮皮虾/微博 | `--type parser` or `info <url>` | `VideoParser.parse()` |
| Web page with m3u8 | `--type web` | `getM3u8Urls()` |
| Batch download | `"name\|url"` or file | `m3u8BatchDownload()` |
| mp4 conversion | Requires ffmpeg | Set `ffmpegPath` |

## LINKS

- https://github.com/lzwme/m3u8-dl/tree/main/packages/ai-agent/skills/m3u8-media-downloader

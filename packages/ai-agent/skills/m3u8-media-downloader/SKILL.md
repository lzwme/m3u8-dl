---
name: m3u8-media-downloader
description: Use @lzwme/m3u8-dl for media download and video info parsing. Use when the user mentions video/music download (m3u8/HLS/mp4/mp3 or 抖音/皮皮虾/微博/B站视频), or 获取视频信息、解析视频链接, and a video/music URL is present.
version: "1.9.0"
author: "renxia (https://lzw.me)"
license: "MIT"
repository: "https://github.com/lzwme/m3u8-dl"
metadata:
  {
    "openclaw":
      {
        "emoji": "🎞️",
        "requires": { "bins": ["m3u8dl", "ffmpeg"] },
        "install":
          [
            {
              "id": "node",
              "kind": "node",
              "formula": "@lzwme/m3u8-dl@1.9.0",
              "bins": ["m3u8dl"],
              "label": "Install m3u8-downloader CLI (node)",
            },
          ],
      },
  }
---

# m3u8-downloader

Download m3u8/mp4 video and mp3/music, support 抖音、皮皮虾、微博、B站 sharing links. Multi-thread download, WebUI, batch and Node API.

Example:

> 使用 m3u8-media-downloader 下载抖音视频/获取该视频详情：https://v.douyin.com/CW1iv0GeSJM/

## Main capabilities

- **m3u8/HLS & mp4** — download and merge to mp4 (ffmpeg required for ts→mp4)
- **Music** — mp3/m4a from m3u8/stream sources
- **抖音/皮皮虾/微博/B站** — parse or download sharing links (Bilibili DASH streams are merged into mp4, ffmpeg required)

## CLI

```bash
# 推荐方式：固定版本执行
m3u8dl <urls...> [options]
m3u8dl info <url>        # 解析视频信息
m3u8dl server            # 启动 WebUI (http://localhost:6600)
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
m3u8dl https://example.com/video.m3u8 -f "My Video" -S ./downloads

# 抖音/皮皮虾/微博/B站 sharing link
# parser and download video
m3u8dl "https://v.douyin.com/xxxxx/" --type parser
# parser and print info
m3u8dl info "https://h5.pipix.com/xxxxx"
# Bilibili BV id / b23.tv short link (DASH audio+video merged into mp4)
m3u8dl "https://www.bilibili.com/video/BV1x411c7mD" --type parser

# With name: "name|url"
m3u8dl "Episode 1|https://example.com/ep1.m3u8"

# Batch: file with one "filename$url" per line
m3u8dl series-list.txt -f "Series Name"

# Extract m3u8 from web page
m3u8dl "https://example.com/play/123" --type web
```

## WebUI

```bash
m3u8dl server [-P <port>] [-t <token>]
# Optional env vars for customization: DS_PORT, DS_SECRET, DS_SAVE_DIR, DS_CACHE_DIR, DS_FFMPEG_PATH
```
Open http://localhost:6600 to manage tasks in browser.

## Security Considerations

> ⚠️ **Important Security Notice**

- **Version Pinning**: This skill uses pinned version `@1.9.0` to prevent execution of different code on each run
- **Code Review**: Inspect the package via `npm view @lzwme/m3u8-dl@1.9.0` or [GitHub](https://github.com/lzwme/m3u8-dl) before execution
- **Sandbox Environment**: Run download tasks in an isolated environment with restricted filesystem permissions
- **ffmpeg Installation**: Ensure ffmpeg is installed from official or trusted sources only
- **Sensitive Variables**: `DS_SECRET` is sensitive - configure carefully to protect WebUI access
- **Legal Compliance**: Ensure downloads comply with local laws and source site terms of service

## Node API

```ts
import { m3u8Download, VideoParser, m3u8BatchDownload } from '@lzwme/m3u8-dl';

// Download m3u8/mp4
await m3u8Download(url, { filename: 'video', saveDir: './downloads' });

// Parse 抖音/皮皮虾/微博/B站
const parser = new VideoParser();
const info = await parser.parse('https://v.douyin.com/xxxxx/');
await parser.download(info, { saveDir: './downloads' });

// Batch download
await m3u8BatchDownload(['name1$url1', 'name2$url2'], { saveDir: './downloads' });
```

## Scenario guide

| Scenario | CLI | Node API |
|----------|-----|----------|
| m3u8/mp4 URL | `m3u8dl <url>` | `m3u8Download(url)` |
| 抖音/皮皮虾/微博/B站 | `--type parser` or `info <url>` | `VideoParser.parse()` |
| Web page with m3u8 | `--type web` | `getM3u8Urls()` |
| Batch download | `"name\|url"` or file | `m3u8BatchDownload()` |
| mp4 conversion | Requires ffmpeg | Set `ffmpegPath` |

## LINKS

- source: https://github.com/lzwme/m3u8-dl/tree/main/packages/ai-agent/skills/m3u8-media-downloader

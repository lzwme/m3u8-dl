[![@lzwme/m3u8-dl](https://nodei.co/npm/@lzwme/m3u8-dl.png)][npm-url]

# @lzwme/m3u8-dl

[![NPM version][npm-badge]][npm-url]
[![node version][node-badge]][node-url]
![license MIT](https://img.shields.io/github/license/lzwme/m3u8-dl)

[![build status](https://github.com/lzwme/m3u8-dl/actions/workflows/node-ci.yml/badge.svg)](https://github.com/lzwme/m3u8-dl/actions/workflows/node-ci.yml)
[![npm download][download-badge]][download-url]
[![GitHub issues][issues-badge]][issues-url]
[![GitHub forks][forks-badge]][forks-url]
[![GitHub stars][stars-badge]][stars-url]

一个 m3u8 文件视频批量下载工具。

![](./examples/img/m3u8dl-search-demo.png)

## 功能特性(Features)

- 多线程下载。线程池模式的多线程下载。
- `边下边播模式`。支持使用已下载的 ts 缓存文件在线播放。
- 支持指定多个 m3u8 地址批量下载。
- 支持缓存续传。下载失败会保留缓存，重试时只下载失败的片段。
- 支持常见的 AES 加密视频流解密。
- 自动转换为 mp4。**需全局安装 [ffmpeg](https://ffmpeg.org/download.html)**
- 支持指定采集站标准 API，以命令行交互的方式搜索和下载。
- `[NEW!]` 新增下载中心，支持启动为 webui 服务方式进行下载管理。
- `[NEW!]` 新增支持抖音、微博视频分享地址解析及无水印下载。

## 安装(Install)

```bash
npm i -g @lzwme/m3u8-dl
m3u8dl -h
```

或者使用 `npx`：

```bash
npx @lzwme/m3u8-dl -h
```

## Useage

提示：如需要下载并转换为 `mp4` 视频格式，您需全局安装 [ffmpeg](https://ffmpeg.org/download.html)。

### 命令行方式(Command Line Interface)

```bash
m3u8dl --help
```

#### 下载指定 URL 的 m3u8 文件：

```bash
m3u8dl https://lzw.me/x/m3u8-player/test.m3u8
```

#### 批量下载示例一：

```bash
# 下载多个文件：
m3u8dl "第1集｜https://s.xlzys.com/play/zbqMZYRb/index.m3u8" "第2集｜https://s.xlzys.com/play/PdyJXrwe/index.m3u8" --filename "三体"
```

#### 批量下载示例二：

新建文件 `三体.txt`，内容格式：

```txt
第1集$https://s.xlzys.com/play/zbqMZYRb/index.m3u8
第2集$https://s.xlzys.com/play/PdyJXrwe/index.m3u8
第3集$https://s.xlzys.com/play/oeE6x9Ka/index.m3u8
```

然后执行如下命令：

```bash
m3u8dl 三体.txt
```

提示：可创建并指定多个 txt 文件实现对多个影视剧集的一键批量下载。

#### 指定采集站 API 搜索并下载

```bash
m3u8dl search -h

# 指定采集站 API url 地址（会缓存），然后按提示操作
m3u8dl s -u https://jyzyapi.com/provide/vod/
```

**声明：** 以上仅作示例，请自行搜索查找可用的采集站 API。本工具仅用作技术研究学习，不提供任何具体资源类信息。

### 命令行方式启动 webui

```bash
# 安装 server 需要的依赖
npm i -g express ws
# 启动 server
m3u8dl server -p 6600
```

然后浏览器访问： http://localhost:6600

![](examples/img/m3u8dl-server-webui.jpg)

### API 调用

```ts
import { m3u8Download } from '@lzwme/m3u8-dl';

// 示例：单文件下载
m3u8Download('test/t.m3u8', { debug: true, filenmae: '测试视频' });

// 示例：批量下载
const fileList = ['第一集$$test/t.m3u8'];
for (const filepath of fileList) {
  const r = await m3u8Download(filepath, { debug: true, filenmae: '测试视频' });
  console.log('文件已下载：', r.filepath);
}
```

## 基于 Docker 部署

基于 docker 命令：

```bash
# docker pull ghcr.io/lzwme/m3u8-dl:latest
docker pull lzwme/m3u8dl-dl:latest

docker run --rm -it \
  -v ./cache:/app/cache \
  -v ./downloads:/app/downloads \
  -p 6600:6600 \
  lzwme/m3u8dl-server:latest
```

也可以基于 [docker-compose.yml](./docker/docker-compose.yml) 部署：

```yml
services:
  web:
    image: renxia/m3u8-dl:latest
    volumes:
      - ./downloads:/app/downloads
      - ./cache:/app/cache
    ports:
      - '6600:6600'
    environment:
      DS_PORT: '6600'
      DS_SAVE_DIR: '/app/downloads'
      DS_CACHE_DIR: '/app/cache'
      DS_DEBUG: ''
    # command: >
    #   sh -c "node cjs/server/index.js"
    restart: unless-stopped
```

部署成功后，浏览器访问 http://dockerip:6600 即可。

**注：** docker 部署模式同时包含了 [AriaNg](https://github.com/mayswind/AriaNg) 静态资源。

## 开发(Development)

本地二次开发：

```bash
git clone git@github.com:lzwme/m3u8-dl.git
pnpm install
pnpm dev
# npm link
```

或者 [fork](https://github.com/lzwme/m3u8-dl/fork) 本项目进行代码贡献。

**欢迎贡献想法与代码。**

## References

- [ffmpeg download](https://ffmpeg.org/download.html)
- [m3u8-multi-thread-downloader](https://github.com/sahadev/m3u8Downloader)
- [m3u8Utils](https://github.com/liupishui/m3u8Utils)

## License

`@lzwme/m3u8-dl` is released under the MIT license.

该插件由[志文工作室](https://lzw.me)开发和维护。

[stars-badge]: https://img.shields.io/github/stars/lzwme/m3u8-dl.svg
[stars-url]: https://github.com/lzwme/m3u8-dl/stargazers
[forks-badge]: https://img.shields.io/github/forks/lzwme/m3u8-dl.svg
[forks-url]: https://github.com/lzwme/m3u8-dl/network
[issues-badge]: https://img.shields.io/github/issues/lzwme/m3u8-dl.svg
[issues-url]: https://github.com/lzwme/m3u8-dl/issues
[npm-badge]: https://img.shields.io/npm/v/@lzwme/m3u8-dl.svg?style=flat-square
[npm-url]: https://npmjs.com/package/@lzwme/m3u8-dl
[node-badge]: https://img.shields.io/badge/node.js-%3E=_14.18.0-green.svg?style=flat-square
[node-url]: https://nodejs.org/download/
[download-badge]: https://img.shields.io/npm/dm/@lzwme/m3u8-dl.svg?style=flat-square
[download-url]: https://npmjs.com/package/@lzwme/m3u8-dl
[bundlephobia-url]: https://bundlephobia.com/result?p=@lzwme/m3u8-dl@latest
[bundlephobia-badge]: https://badgen.net/bundlephobia/minzip/@lzwme/m3u8-dl@latest

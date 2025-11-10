# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.6.0-0](https://github.com/lzwme/m3u8-dl/compare/v1.5.0...v1.6.0-0) (2025-11-10)


### Features

* add completed tasks page with sorting and search functionality ([4fc51d2](https://github.com/lzwme/m3u8-dl/commit/4fc51d20cb5d732a0c41664ca61849169053a50b))
* add fullscreen video player with playlist ([efd3cef](https://github.com/lzwme/m3u8-dl/commit/efd3cefb78ad414379a96da439909a2e7f5e3c99))
* add support for END-60 format in ignoreSegments ([892a8c9](https://github.com/lzwme/m3u8-dl/commit/892a8c990a48cd3794eba6bf9688d7b8d037675d))
* add web browser module and improve download dialog ([57aa26e](https://github.com/lzwme/m3u8-dl/commit/57aa26ebb6a707c081fdda792e76d34980065dee))

## [1.5.0](https://github.com/lzwme/m3u8-dl/compare/v1.4.3...v1.5.0) (2025-11-07)


### Features

* **ffmpeg:** add option to use built-in ffmpeg-static ([e387da1](https://github.com/lzwme/m3u8-dl/commit/e387da121d38a6c22c1f9c7c7405ff8cfc1e731a))
* **ffmpeg:** change option to use global ffmpeg instead of built-in ([f2151af](https://github.com/lzwme/m3u8-dl/commit/f2151afbfb7a91453b6d165c3bf232dd9b1f14e1))

### [1.4.3](https://github.com/lzwme/m3u8-dl/compare/v1.4.2...v1.4.3) (2025-08-29)


### Bug Fixes

* 修复 Safari 上边看边播异常的问题 ([598e288](https://github.com/lzwme/m3u8-dl/commit/598e288a01e25443cd26f522514cd9350e89a767))
* **ui:** 页面中创建 WebSocket 时，https 协议访问时应使用 wss ([9f2f464](https://github.com/lzwme/m3u8-dl/commit/9f2f464a54879c3042a49922e600cef6ed32944b))

### [1.4.2](https://github.com/lzwme/m3u8-dl/compare/v1.4.1...v1.4.2) (2025-07-20)

### [1.4.1](https://github.com/lzwme/m3u8-dl/compare/v1.4.0...v1.4.1) (2025-07-09)


### Bug Fixes

* localplay api 参数增加encode处理 ([912dfa9](https://github.com/lzwme/m3u8-dl/commit/912dfa90699b0767285a7ebed42f3e0e7883ac88))
* **server:** 修复页面下载填入的headers不生效问题；从页面提取m3u8地址支持读取headers设置 ([2cf0427](https://github.com/lzwme/m3u8-dl/commit/2cf04278df85160e8a372b5d1953ffa997dc2986))

## [1.4.0](https://github.com/lzwme/m3u8-dl/compare/v1.3.1...v1.4.0) (2025-06-27)


### Features

* 新增getM3u8Urls方法，支持从网站播放页提取地址 ([211ee36](https://github.com/lzwme/m3u8-dl/commit/211ee36cd908393fe670e079ede2084dff80885a))

### [1.3.1](https://github.com/lzwme/m3u8-dl/compare/v1.3.0...v1.3.1) (2025-06-19)


### Bug Fixes

* 修复视频播放失败的问题；DLServer 增加 limitFileAccess 参数，支持配置 localplay 是否允许访问外部目录文件 ([b195b3f](https://github.com/lzwme/m3u8-dl/commit/b195b3f81960d498635d0b390ac0d03a2d424881))

## [1.3.0](https://github.com/lzwme/m3u8-dl/compare/v1.2.2...v1.3.0) (2025-06-15)


### Features

* 新增 ignoreSegments 参数，支持忽略下载指定的视频时间片段 (close [#7](https://github.com/lzwme/m3u8-dl/issues/7)) ([324698f](https://github.com/lzwme/m3u8-dl/commit/324698ff2d687620a501102bd0968c0c2d586790))
* 支持 Electron 打包为 PC 安装客户端 ([456b285](https://github.com/lzwme/m3u8-dl/commit/456b2859ad59ea50bcb4906ccf3757b55e1a3694))

### [1.2.2](https://github.com/lzwme/m3u8-dl/compare/v1.2.1...v1.2.2) (2025-06-10)

### [1.2.1](https://github.com/lzwme/m3u8-dl/compare/v1.2.0...v1.2.1) (2025-06-02)

## [1.2.0](https://github.com/lzwme/m3u8-dl/compare/v1.1.3...v1.2.0) (2025-05-20)


### Features

* 支持 mp4、mkv 等格式文件下载 ([a5ce1e6](https://github.com/lzwme/m3u8-dl/commit/a5ce1e6c3b71802a518c90f95a1bc5d209f060f3))

### [1.1.3](https://github.com/lzwme/m3u8-dl/compare/v1.1.2...v1.1.3) (2025-05-18)


### Bug Fixes

* 修复web界面删除视频后列表不会立即更新的问题 ([a9d6c50](https://github.com/lzwme/m3u8-dl/commit/a9d6c509f2476a25d325a4f213706ea7c428e3b6))

### [1.1.2](https://github.com/lzwme/m3u8-dl/compare/v1.1.1...v1.1.2) (2025-05-18)

### [1.1.1](https://github.com/lzwme/m3u8-dl/compare/v1.1.0...v1.1.1) (2025-05-17)


### Bug Fixes

* 修复页面进度不更新的问题 ([ba57a7d](https://github.com/lzwme/m3u8-dl/commit/ba57a7d69877b79217e2291db2fdfca3b965e890))

## [1.1.0](https://github.com/lzwme/m3u8-dl/compare/v1.0.0...v1.1.0) (2025-05-17)


### Features

* 新增 video-parser 模块，支持抖音、微博视频分享地址解析 ([5f7a9fe](https://github.com/lzwme/m3u8-dl/commit/5f7a9febd850021c37b28627478fd003811e20a3))
* **server:** 支持设置访问密码(token) ([574a9f8](https://github.com/lzwme/m3u8-dl/commit/574a9f80b3403a7f9e1fd8c67b4021a8a5f2e6b3))

## [1.0.0](https://github.com/lzwme/m3u8-dl/compare/v0.0.10...v1.0.0) (2025-05-10)


### Features

* 新增 docker 构建脚本，支持 docker 部署 ([3dd7916](https://github.com/lzwme/m3u8-dl/commit/3dd79166f91120c91e35d56a63831b23dec4c352))
* 新增 server 和 webui，支持在浏览器中管理下载 ([f704da2](https://github.com/lzwme/m3u8-dl/commit/f704da2d5b738fad477b0bc7a8d4893143eada9b))

### [0.0.10](https://github.com/lzwme/m3u8-dl/compare/v0.0.9...v0.0.10) (2025-05-06)


### Bug Fixes

* 修复合并为大文件 ts 时内存不足导致失败的问题 (close [#5](https://github.com/lzwme/m3u8-dl/issues/5)) ([2fab6a6](https://github.com/lzwme/m3u8-dl/commit/2fab6a6c318fb2daf2d6d809d9b88fcc5d454903))

### [0.0.9](https://github.com/lzwme/m3u8-dl/compare/v0.0.8...v0.0.9) (2024-07-29)


### Bug Fixes

* 修复存在 iv 配置时 AES 解密失败的问题 ([56780eb](https://github.com/lzwme/m3u8-dl/commit/56780eb095b432aa83ffa739bdd00465352dedf3))

### [0.0.8](https://github.com/lzwme/m3u8-dl/compare/v0.0.7...v0.0.8) (2024-04-20)


### Features

* add headers to ffmpeg cmd ([21a9cf4](https://github.com/lzwme/m3u8-dl/commit/21a9cf49cba9c6cd19ce3f7a33169aa00cf7fd8b))


### Bug Fixes

* update -absf ffmpeg argument to -bsf:a ([944ad65](https://github.com/lzwme/m3u8-dl/commit/944ad6520bf2da6a5f4fda4dec7efcd33cc856be))

### [0.0.7](https://github.com/lzwme/m3u8-dl/compare/v0.0.6...v0.0.7) (2024-02-23)


### Bug Fixes

* 更新默认远程配置加载URL ([b39deb4](https://github.com/lzwme/m3u8-dl/commit/b39deb412fc7ab0de72d0e1ee655bd34146ea4ef))
* 修复文件名包含空格时转换为mp4失败的问题 ([a3728ed](https://github.com/lzwme/m3u8-dl/commit/a3728ed902f4eb04145a3295bca5c4bd4d29b2f6))
* 修复下载结束不会自动退出的问题 ([1acc9ea](https://github.com/lzwme/m3u8-dl/commit/1acc9ea1714d62488e2a4df987252d1cda26decc))

### [0.0.6](https://github.com/lzwme/m3u8-dl/compare/v0.0.5...v0.0.6) (2023-08-16)


### Bug Fixes

* 修复获取播放地址分隔符为空时会报错的问题 ([e99bfa8](https://github.com/lzwme/m3u8-dl/commit/e99bfa8b9767e7a68b489b5e456bf884d7d73436))

### [0.0.5](https://github.com/lzwme/m3u8-dl/compare/v0.0.4...v0.0.5) (2023-07-06)


### Features

* 视频搜索增强缓存能力，支持缓存并继续最近一次未完成的下载 ([52a8ca3](https://github.com/lzwme/m3u8-dl/commit/52a8ca35d0dac7c1980268cfe96996b1814b1ebc))

### [0.0.4](https://github.com/lzwme/m3u8-dl/compare/v0.0.3...v0.0.4) (2023-05-18)


### Bug Fixes

* 修复windows下ffmpeg合成mp4失败的问题 ([fefd97c](https://github.com/lzwme/m3u8-dl/commit/fefd97caf5bc6d52038e5bebdb8ebe5e67bb11a5))
* preDownLoad 预下载增加异常处理 ([88cd3c7](https://github.com/lzwme/m3u8-dl/commit/88cd3c722c8910d5b9f2e1887866b75183f57b7c))

### [0.0.3](https://github.com/lzwme/m3u8-dl/compare/v0.0.2...v0.0.3) (2023-05-03)


### Features

* 新增 VideoSearch 视频搜索类型 ([6dc4592](https://github.com/lzwme/m3u8-dl/commit/6dc4592bbf87bc20a252ddf48abda1df848d18f3))

### [0.0.2](https://github.com/lzwme/m3u8-dl/compare/v0.0.1...v0.0.2) (2023-02-05)


### Features

* 新增 play 参数，支持边下边播模式 ([a61860a](https://github.com/lzwme/m3u8-dl/commit/a61860ab8819ad5ccd75a79770e99fbd68569e9a))

### 0.0.1 (2023-01-27)

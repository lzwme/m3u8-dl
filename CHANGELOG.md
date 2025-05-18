# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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

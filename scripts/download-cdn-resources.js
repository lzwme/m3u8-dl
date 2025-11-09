#!/usr/bin/env node

/**
 * 下载 CDN 静态资源到本地
 * 用于 electron 和 docker 构建场景下的本地化加载
 *
 * 功能：
 * 1. 解析 index.html 和 play.html 中引用的 zstatic.net CDN 资源
 * 2. 下载这些资源到 client/local/cdn 目录下
 * 3. 保持原有的目录结构
 */

const { concurrency, mkdirp } = require('@lzwme/fe-utils');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// 配置
const ROOT_DIR = path.resolve(__dirname, '..');
const CLIENT_DIR = path.join(ROOT_DIR, 'client');
const CDN_DIR = path.join(CLIENT_DIR, 'local', 'cdn');
const HTML_FILES = [
  path.join(CLIENT_DIR, 'index.html'),
  path.join(CLIENT_DIR, 'play.html'),
];

// zstatic.net CDN 基础 URL
const ZSTATIC_CDN_BASE = 'https://s4.zstatic.net/ajax/libs/';
// Cloudflare CDNJS 基础 URL
const CDNJS_BASE = 'https://cdnjs.cloudflare.com/ajax/libs/';
// 默认并发数
const DEFAULT_CONCURRENCY = 5;
// 检查是否在 GitHub CI 环境
const IS_GITHUB_CI = process.env.GITHUB_CI === '1' || process.env.CI === 'true';

/**
 * 从 HTML 内容中提取所有 zstatic.net 的资源 URL
 */
function extractCDNUrls(htmlContent) {
  const urls = new Set();

  // 匹配所有 zstatic.net 的 URL（包括在 script、link 标签和 JavaScript 代码中的）
  // 匹配模式：https://s4.zstatic.net/ajax/libs/...
  const urlPattern = /https:\/\/s4\.zstatic\.net\/ajax\/libs\/[^\s"'`<>]+/g;
  const matches = htmlContent.match(urlPattern);

  if (matches) {
    matches.forEach(match => {
      // 清理 URL，移除可能的引号、换行等
      const cleanUrl = match.replace(/['"`\s]+$/, '');
      if (cleanUrl.startsWith(ZSTATIC_CDN_BASE)) {
        urls.add(cleanUrl);
      }
    });
  }

  return Array.from(urls);
}

/**
 * 将 zstatic.net URL 转换为 Cloudflare CDNJS URL
 * 例如：https://s4.zstatic.net/ajax/libs/hls.js/1.5.18/hls.min.js
 * 转换为：https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.18/hls.min.js
 */
function convertToCdnjsUrl(zstaticUrl) {
  const libsIndex = new URL(zstaticUrl).pathname.indexOf('/ajax/libs/');
  if (libsIndex === -1) return zstaticUrl; // 如果不是 zstatic.net 格式，返回原 URL

  return zstaticUrl.replace(ZSTATIC_CDN_BASE, CDNJS_BASE);
}

/**
 * 从 CDN URL 获取本地文件路径
 * 例如：https://s4.zstatic.net/ajax/libs/hls.js/1.5.18/hls.min.js
 * 转换为：client/local/cdn/hls.js/1.5.18/hls.min.js
 *
 * 注意：此函数接收的 cdnUrl 始终是原始的 zstatic.net URL
 */
function getLocalPath(cdnUrl) {
  const url = new URL(cdnUrl);
  // 提取 /ajax/libs/ 之后的部分
  const libsIndex = url.pathname.indexOf('/ajax/libs/');
  if (libsIndex === -1) {
    throw new Error(`Invalid CDN URL: ${cdnUrl}`);
  }

  const relativePath = url.pathname.substring(libsIndex + '/ajax/libs/'.length);
  return path.join(CDN_DIR, relativePath);
}

/**
 * 下载文件（使用 fetch API）
 */
async function downloadFile(url, destPath) {
  const destDir = path.dirname(destPath);

  if (fs.existsSync(destPath)) {
      console.log(`  ✓ 已存在，跳过: ${path.relative(ROOT_DIR, destPath)}`);
      return;
    }

  // 在 GitHub CI 环境下，将 zstatic.net URL 转换为 Cloudflare CDNJS URL
  let downloadUrl = url;
  if (IS_GITHUB_CI && url.startsWith(ZSTATIC_CDN_BASE)) {
    downloadUrl = convertToCdnjsUrl(url);
    console.log(`  [CI] 使用 cdnjs: ${downloadUrl}`);
  }

  try {
    const response = await fetch(downloadUrl, {  method: 'GET',  redirect: 'follow' });

    if (!response.ok) {
      throw new Error(`下载失败: ${response.status} ${response.statusText}`);
    }

    // 将响应转换为 Buffer
    const arrayBuffer = await response.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);

    // 如果是 JS 或 CSS 文件，移除 sourceMap 引用
    const ext = path.extname(destPath).toLowerCase();
    if (ext === '.js' || ext === '.css') {
      let content = buffer.toString('utf-8');
      // 移除 sourceMap 引用（匹配 //# sourceMappingURL= 或 /*# sourceMappingURL= */）
      content = content.replace(/\/\/# sourceMappingURL=.*$/gm, '');
      content = content.replace(/\/\*# sourceMappingURL=.*?\*\//g, '');
      // 移除末尾的空白行
      content = content.replace(/\n+$/, '');
      buffer = Buffer.from(content, 'utf-8');
    }

    // 写入文件
    mkdirp(destDir);
    fs.writeFileSync(destPath, buffer);

    console.log(`  ✓ 下载完成: ${path.relative(ROOT_DIR, destPath)}`);
  } catch (error) {
    // 如果下载失败，删除可能创建的不完整文件
    if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
    // 在错误信息中包含实际使用的 URL
    const errorMsg = downloadUrl !== url
      ? `${error.message} (实际下载 URL: ${downloadUrl})`
      : error.message;
    throw new Error(errorMsg);
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('开始下载 CDN 静态资源...\n');

  mkdirp(CDN_DIR);

  // 收集所有需要下载的 URL
  const allUrls = new Set();

  // 读取并解析 HTML 文件
  for (const htmlFile of HTML_FILES) {
    if (!fs.existsSync(htmlFile)) {
      console.warn(`⚠ 警告: 文件不存在 ${path.relative(ROOT_DIR, htmlFile)}`);
      continue;
    }

    console.log(`解析文件: ${path.relative(ROOT_DIR, htmlFile)}`);
    const htmlContent = fs.readFileSync(htmlFile, 'utf-8');
    const urls = extractCDNUrls(htmlContent);

    if (urls.length > 0) {
      console.log(`  找到 ${urls.length} 个 CDN 资源:`);
      urls.forEach(url => {
        console.log(`    - ${url}`);
        allUrls.add(url);
      });
    } else {
      console.log(`  未找到 CDN 资源`);
    }
    console.log();
  }

  if (allUrls.size === 0) {
    console.log('未找到需要下载的 CDN 资源');
    return;
  }

  console.log(`\n共找到 ${allUrls.size} 个唯一的 CDN 资源，开始下载...\n`);

  // 创建下载任务列表
  const downloadTasks = Array.from(allUrls).map((url) => {
    return async () => {
      try {
        const localPath = getLocalPath(url);
        await downloadFile(url, localPath);
      } catch (error) {
        console.error(`  ✗ 下载失败: ${url}`);
        console.error(`    错误: ${error.message}`);
        throw error;
      }
    };
  });

  try {
    // 使用 concurrency 控制并发下载，默认并发数为 5
    await concurrency(downloadTasks, DEFAULT_CONCURRENCY);
    console.log(`\n✓ 所有资源下载完成！`);
    console.log(`  资源保存在: ${path.relative(ROOT_DIR, CDN_DIR)}`);
  } catch (error) {
    console.error(`\n✗ 下载过程中出现错误`);
    process.exit(1);
  }
}

// 执行主函数
if (require.main === module) {
  main().catch((error) => {
    console.error('执行失败:', error);
    process.exit(1);
  });
}

module.exports = { main, extractCDNUrls, getLocalPath, downloadFile, convertToCdnjsUrl };

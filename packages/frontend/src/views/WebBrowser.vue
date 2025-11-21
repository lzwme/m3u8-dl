<template>
  <Layout>
    <div class="p-1 md:p-2">
      <WebBrowser @batch-download="handleBatchDownload" />
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import Layout from '@/components/Layout.vue';
import WebBrowser, { type M3u8CaptureItem } from '@/components/WebBrowser.vue';
import type { DownloadTaskOptions } from '@/types/task';

// 注入全局显示下载对话框的方法
const showGlobalNewDownload = inject<(data?: DownloadTaskOptions) => void>('showGlobalNewDownload');

function handleBatchDownload(items: Array<M3u8CaptureItem>) {
  let firstHost = '';
  let isSameHost = true;
  // 将多个链接以换行分隔，格式为 url | title
  const downloadUrls = items.map((item) => {
    if (isSameHost) {
      const host = new URL(item.url).host;
      if (!firstHost) firstHost = host;
      else if (firstHost !== host) isSameHost = false;
    }

    if (item.title) return `${item.url} | ${item.title}`;
    return item.url;
  }).join('\n');

  // 使用全局方法打开对话框并填充链接
  if (showGlobalNewDownload) {
    showGlobalNewDownload({
      url: downloadUrls,
      headers: isSameHost ? items.find(item => item.headers)?.headers || '' : '',
    });
  }
}
</script>

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
import WebBrowser from '@/components/WebBrowser.vue';

// 注入全局显示下载对话框的方法
const showGlobalNewDownload = inject<(data?: { url?: string; title?: string }) => void>('showGlobalNewDownload');

function handleBatchDownload(items: Array<{ url: string; title: string }>) {
  // 将多个链接以换行分隔，格式为 url | title
  const downloadUrls = items.map((item) => {
    if (item.title) {
      return `${item.url} | ${item.title}`;
    }
    return item.url;
  }).join('\n');

  // 使用全局方法打开对话框并填充链接
  if (showGlobalNewDownload) {
    showGlobalNewDownload({
      url: downloadUrls,
    });
  }
}
</script>

<template>
  <Layout>
    <div class="p-1 md:p-2">
      <WebBrowser @batch-download="handleBatchDownload" />
      <NewDownloadDialog
        :visible="showDialog"
        :initial-data="dialogInitialData"
        @close="handleCloseDialog"
      />
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Layout from '@/components/Layout.vue';
import WebBrowser from '@/components/WebBrowser.vue';
import NewDownloadDialog from '@/components/NewDownloadDialog.vue';

const showDialog = ref(false);
const dialogInitialData = ref<{ url?: string; title?: string } | undefined>(undefined);

function handleBatchDownload(items: Array<{ url: string; title: string }>) {
  // 将多个链接以换行分隔，格式为 url | title
  const downloadUrls = items.map((item) => {
    if (item.title) {
      return `${item.url} | ${item.title}`;
    }
    return item.url;
  }).join('\n');

  // 打开对话框并填充链接
  dialogInitialData.value = {
    url: downloadUrls,
  };
  showDialog.value = true;
}

function handleCloseDialog() {
  showDialog.value = false;
  dialogInitialData.value = undefined;
}
</script>

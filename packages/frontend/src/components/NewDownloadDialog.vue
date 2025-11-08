<template>
  <div v-if="visible" class="fixed inset-0 modal-overlay flex items-center justify-center z-50"
    @click.self="close">
    <div class="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl text-center w-full font-semibold">新建下载</h2>
        <button @click="close" class="text-gray-500 hover:text-gray-700">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="text-left">
        <div class="flex flex-row gap-4">
          <input v-model="playUrl" type="text" placeholder="[实验性]输入视频播放页地址，尝试提取m3u8下载链接" autocomplete="off"
            class="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <div class="flex flex-row gap-1">
            <button @click="extractUrls" :disabled="extracting"
              class="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none disabled:opacity-50">
              {{ extracting ? '解析中...' : '提取' }}
            </button>
          </div>
        </div>

        <div class="mt-4">
          <input v-model="subUrlRegex" class="w-full p-2 border rounded-lg focus:ring-blue-500"
            placeholder="[实验性](可选)播放页链接特征规则" />
          <p class="mt-1 text-sm text-gray-500">用于从视频列表页准确识别播放地址。如：play/845-1-。支持 * 通配符（会被转换为 .+）</p>
        </div>

        <div class="mt-4">
          <label class="block text-sm font-bold text-gray-700 mb-1">视频链接（每行一个，支持m3u8地址及抖音、微博、皮皮虾视频分享链接）</label>
          <textarea v-model="downloadUrls" class="w-full p-2 border rounded-lg focus:ring-blue-500" rows="3"
            placeholder="格式： URL | 名称(可选)、名称 | URL"></textarea>
        </div>

        <div class="mt-4">
          <div class="flex flex-row gap-2 items-center">
            <label class="block text-sm font-bold text-gray-700 mb-1">视频名称</label>
            <input v-model="filename" class="flex-1 p-2 border rounded-lg focus:border-blue-500"
              placeholder="请输入视频名称(可选)" />
          </div>
          <p class="ml-2 mt-1 text-sm text-gray-500">若输入多个链接，将依次以"视频名称+第N集"命名</p>
        </div>

        <div class="mt-4 flex flex-row gap-2 items-center">
          <label class="block text-sm font-bold text-gray-700 mb-1">保存位置</label>
          <input v-model="saveDir" class="flex-1 p-2 border rounded-lg focus:ring-blue-500" placeholder="请输入保存路径" />
        </div>

        <div class="mt-4">
          <label class="block text-sm font-bold text-gray-700 mb-1">删除时间片段（适用于移除广告片段的情况）</label>
          <input v-model="ignoreSegments" class="w-full p-2 border rounded-lg focus:ring-blue-500"
            placeholder="以-分割起止时间，多个以逗号分隔。示例：0-10,20-100" />
        </div>

        <div class="mt-4">
          <label class="block text-sm font-bold text-gray-700 mb-1">自定义请求头</label>
          <textarea v-model="headers" class="w-full p-2 border rounded-lg focus:ring-blue-500" rows="3"
            placeholder="每行一个（微博视频须设置 Cookie），格式：Key: Value。例如：&#10;Referer: https://example.com&#10;Cookie: token=123"></textarea>
        </div>
      </div>

      <div class="flex justify-end space-x-4 mt-6">
        <button @click="close" class="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg border">
          取消
        </button>
        <button @click="handleSubmit" :disabled="submitting" class="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
          {{ submitting ? '提交中...' : '开始下载' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { getM3u8Urls, startDownload } from '@/utils/request';
import { toast } from '@/utils/toast';
import { optimizeTitle, urlsTextFormat } from '@/utils/formatTitle';
import { useConfigStore } from '@/stores/config';
import { useTasksStore } from '@/stores/tasks';

const props = defineProps<{
  visible: boolean;
  initialData?: {
    url?: string;
    title?: string;
  };
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const configStore = useConfigStore();
const tasksStore = useTasksStore();

const playUrl = ref('');
const downloadUrls = ref('');
const filename = ref('');
const saveDir = ref(configStore.config.saveDir || '');
const ignoreSegments = ref('');
const headers = ref('');
const subUrlRegex = ref('');
const extracting = ref(false);
const submitting = ref(false);

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      saveDir.value = configStore.config.saveDir || '';
      // 如果有初始数据，填充表单
      if (props.initialData) {
        if (props.initialData.url) {
          // 处理 URL，如果包含 title，则优化 title
          const urlText = props.initialData.url;
          // 检查是否包含 | 分隔符（格式：url | title）
          if (urlText.includes('|')) {
            const lines = urlsTextFormat(urlText).map(({url, name})=> {
              return name ? `${url} | ${optimizeTitle(name)}` : url ;
            });
            downloadUrls.value = lines.join('\n');
          } else {
            downloadUrls.value = urlText;
          }
        }
      }
    } else {
      // 重置表单
      playUrl.value = '';
      downloadUrls.value = '';
      filename.value = '';
      ignoreSegments.value = '';
      headers.value = '';
      subUrlRegex.value = '';
    }
  }
);

async function extractUrls() {
  const url = playUrl.value.trim();
  if (!/^https?:/.test(url)) {
    toast({ text: '请输入正确的 URL 地址', type: 'error' });
    return;
  }

  extracting.value = true;
  try {
    const result = await getM3u8Urls(
      url,
      headers.value.trim(),
      subUrlRegex.value.trim() || undefined
    );
    if (result.code === 0 && Array.isArray(result.data) && result.data.length > 0) {
      downloadUrls.value = result.data.map((d: [string, string]) => d.join(' | ')).join('\n');
      toast({ text: result.message || `解析完成！获取到 ${result.data.length} 个地址`, type: 'success' });
    } else {
      toast({ text: result.message || '解析失败，未找到 M3U8 地址', type: 'error' });
    }
  } catch (error) {
    toast({ text: `解析失败: ${error instanceof Error ? error.message : '未知错误'}`, type: 'error' });
  } finally {
    extracting.value = false;
  }
}

function close() {
  emit('close');
}

async function handleSubmit() {
  const urlsText = downloadUrls.value.trim();
  if (!urlsText) {
    toast({ text: '请输入至少一个 M3U8 链接', type: 'error' });
    return;
  }

  // 解析链接和文件名
  const urls = urlsTextFormat(urlsText);

  // 验证链接格式
  if (!urls.length) {
    toast({ text: '请输入正确的 M3U8 链接', type: 'error' });
    return;
  }

  let finalSaveDir = saveDir.value;
  if (urls.length > 1 && filename.value && !finalSaveDir.includes(filename.value)) {
    if (!finalSaveDir) finalSaveDir = configStore.config.saveDir;
    finalSaveDir = finalSaveDir.replace(/\/?$/, '') + '/' + filename.value;
  }

  const downloadList = urls.map((item, idx) => ({
    url: item.url,
    filename: item.name || (filename.value ? `${filename.value}${urls.length > 1 ? `第${idx + 1}集` : ''}` : ''),
    saveDir: finalSaveDir,
    headers: headers.value.trim() || undefined,
    ignoreSegments: ignoreSegments.value.trim() || undefined,
  }));

  // 内置下载逻辑处理
  submitting.value = true;
  try {
    // 更新任务状态
    downloadList.forEach((item) => {
      if (!/\.html?$/.test(item.url)) {
        tasksStore.updateTask(item.url, {
          status: 'resume',
          progress: 0,
          speed: 0,
          remainingTime: 0,
          size: 0,
        });
      }
    });

    // 提交下载请求
    const result = await startDownload(downloadList);
    if (!result.code) {
      toast({ text: result.message || '批量下载已开始', type: 'success' });
      close();
    } else {
      toast({ text: result.message || '下载失败', type: 'error' });
    }
  } catch (error) {
    console.error('批量下载失败:', error);
    toast({ text: `下载失败: ${error instanceof Error ? error.message : '未知错误'}`, type: 'error' });
  } finally {
    submitting.value = false;
  }
}
</script>

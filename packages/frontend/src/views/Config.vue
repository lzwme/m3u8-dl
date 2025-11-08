<template>
  <Layout @new-download="() => { }">
    <div class="p-1 md:p-2">
      <div class="space-y-6">
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <h2 class="text-xl font-semibold mb-6">下载设置</h2>
          <form @submit.prevent="handleUpdateConfig" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">单任务并发下载线程数</label>
                <input v-model.number="configStore.config.threadNum" type="number" min="0" max="16"
                  class="w-full p-2 border rounded-lg focus:ring-blue-500" placeholder=" 请输入线程数（1-16）" />
                <p class="mt-1 text-sm text-gray-500">
                  建议不超过 8 个，对单个服务器的并发请求数过多可能会导致被封 IP
                </p>
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">最多同时下载视频数</label>
                <input v-model.number="configStore.config.maxDownloads" type="number" min="1" max="10"
                  class="w-full p-2 border rounded-lg focus:ring-blue-500" placeholder="请输入最大并发下载数（1-10）" />
                <p class="mt-1 text-sm text-gray-500">最多同时下载任务数量，默认为 3</p>
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">视频保存目录</label>
                <div class="flex">
                  <input v-model="configStore.config.saveDir" type="text"
                    class="w-full p-2 border rounded-lg focus:ring-blue-500" placeholder="请输入保存目录路径" />
                </div>
                <p class="mt-1 text-sm text-gray-500">默认为当前目录下 downloads 文件夹</p>
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">下载完成后删除ts分片缓存</label>
                <div class="flex items-center mt-2">
                  <label class="inline-flex items-center">
                    <input v-model="configStore.config.delCache" type="checkbox"
                      class="form-checkbox h-5 w-5 text-blue-500 rounded focus:ring-blue-500" />
                    <span class="ml-2 text-gray-700">删除分片文件</span>
                  </label>
                </div>
                <p class="mt-1 text-sm text-gray-500">保存临时文件可以在重复下载时识别缓存</p>
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">下载完成后转换格式</label>
                <div class="flex items-center mt-2">
                  <label class="inline-flex items-center">
                    <input v-model="configStore.config.convert" type="checkbox"
                      class="form-checkbox h-5 w-5 text-blue-500 rounded focus:ring-blue-500" />
                    <span class="ml-2 text-gray-700">合并转换为 MP4/TS 文件</span>
                  </label>
                </div>
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">显示预览按钮</label>
                <div class="flex items-center mt-2">
                  <label class="inline-flex items-center">
                    <input v-model="configStore.config.showPreview" type="checkbox"
                      class="form-checkbox h-5 w-5 text-blue-500 rounded focus:ring-blue-500" />
                    <span class="ml-2 text-gray-700">在下载列表中显示预览按钮</span>
                  </label>
                </div>
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">显示边下边播按钮</label>
                <div class="flex items-center mt-2">
                  <label class="inline-flex items-center">
                    <input v-model="configStore.config.showLocalPlay" type="checkbox"
                      class="form-checkbox h-5 w-5 text-blue-500 rounded focus:ring-blue-500" />
                    <span class="ml-2 text-gray-700">在下载列表中显示边下边播按钮</span>
                  </label>
                </div>
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">ffmpeg 可执行文件路径</label>
                <input v-model="configStore.config.ffmpegPath" type="text"
                  class="w-full p-2 border rounded-lg focus:ring-blue-500" placeholder="留空则使用系统 PATH 中的 ffmpeg" />
                <p class="mt-1 text-sm text-gray-500">指定 ffmpeg 可执行文件的完整路径。如果留空，则尝试使用系统 PATH 环境变量中的 ffmpeg</p>
              </div>
            </div>

            <div class="flex justify-end space-x-4">
              <button type="submit" class="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg">
                保存配置
              </button>
            </div>
          </form>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-6">本地设置</h2>
          <form @submit.prevent="handleUpdateLocalConfig" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">访问密码</label>
                <div class="flex">
                  <input v-model="token" type="password" maxlength="256"
                    class="w-full p-2 border rounded-lg focus:ring-blue-500" placeholder="请输入访问密码" />
                </div>
                <p class="mt-1 text-sm text-gray-500">若服务端设置了访问密码(token)，请在此输入</p>
              </div>
            </div>

            <div class="flex justify-end space-x-4">
              <button type="submit" class="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg">
                保存配置
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Layout from '@/components/Layout.vue';
import { useConfigStore } from '@/stores/config';
import { useWebSocket } from '@/composables/useWebSocket';
import { toast } from '@/utils/toast';

const configStore = useConfigStore();
const token = ref(configStore.token || '');

const { connect } = useWebSocket('');

onMounted(async () => {
  await configStore.loadConfig();
  token.value = configStore.token || localStorage.getItem('token') || '';
});

async function handleUpdateConfig() {
  const result = await configStore.updateConfig();
  toast({
    text: result.message || '配置已更新',
    type: result.code ? 'error' : 'success',
  });
}

async function handleUpdateLocalConfig() {
  const isUpdated = token.value !== configStore.token;
  if (!isUpdated) return;

  let finalToken = token.value;
  if (finalToken) {
    // 使用全局的 md5 函数（通过 CDN 加载）
    if (typeof window !== 'undefined' && (window as any).md5) {
      finalToken = (window as any).md5(finalToken).slice(0, 8);
    } else {
      // 如果没有 md5，使用简单的 base64 编码
      finalToken = btoa(finalToken).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
    }
  }

  configStore.token = finalToken;
  if (finalToken) {
    localStorage.setItem('token', finalToken);
    const configLoaded = await configStore.loadConfig();
    if (configLoaded) {
      connect();
    }
  } else {
    localStorage.removeItem('token');
  }
  toast({ text: '本地配置已更新', type: 'success' });
}
</script>

<style scoped>
input[type="checkbox"] {
  min-width: 20px;
}
</style>

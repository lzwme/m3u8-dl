<template>
  <Layout @new-download="() => { }">
    <div class="p-1 md:p-2">
      <div class="space-y-6">
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <h2 class="text-xl font-semibold mb-6">{{ $t('config.downloadSettings') }}</h2>
          <form @submit.prevent="handleUpdateConfig" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">{{ $t('config.threadNum') }}</label>
                <input v-model.number="configStore.config.threadNum" type="number" min="0" max="16"
                  class="w-full p-2 border rounded-lg focus:ring-blue-500" :placeholder="$t('config.threadNumPlaceholder')" />
                <p class="mt-1 text-sm text-gray-500">
                  {{ $t('config.threadNumHint') }}
                </p>
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">{{ $t('config.maxDownloads') }}</label>
                <input v-model.number="configStore.config.maxDownloads" type="number" min="1" max="10"
                  class="w-full p-2 border rounded-lg focus:ring-blue-500" :placeholder="$t('config.maxDownloadsPlaceholder')" />
                <p class="mt-1 text-sm text-gray-500">{{ $t('config.maxDownloadsHint') }}</p>
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">{{ $t('config.saveDir') }}</label>
                <div class="flex">
                  <input v-model="configStore.config.saveDir" type="text"
                    class="w-full p-2 border rounded-lg focus:ring-blue-500" :placeholder="$t('config.saveDirPlaceholder')" />
                </div>
                <p class="mt-1 text-sm text-gray-500">{{ $t('config.saveDirHint') }}</p>
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">{{ $t('config.ffmpegPath') }}</label>
                <input v-model="configStore.config.ffmpegPath" type="text"
                  class="w-full p-2 border rounded-lg focus:ring-blue-500" :placeholder="$t('config.ffmpegPathPlaceholder')" />
                <p class="mt-1 text-sm text-gray-500">{{ $t('config.ffmpegPathHint') }}</p>
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">{{ $t('config.delCache') }}</label>
                <div class="flex items-center mt-2">
                  <label class="inline-flex items-center">
                    <input v-model="configStore.config.delCache" type="checkbox"
                      class="form-checkbox h-5 w-5 text-blue-500 rounded focus:ring-blue-500" />
                    <span class="ml-2 text-gray-700">{{ $t('config.delCacheLabel') }}</span>
                  </label>
                </div>
                <p class="mt-1 text-sm text-gray-500">{{ $t('config.delCacheHint') }}</p>
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">{{ $t('config.convert') }}</label>
                <div class="flex items-center mt-2">
                  <label class="inline-flex items-center">
                    <input v-model="configStore.config.convert" type="checkbox"
                      class="form-checkbox h-5 w-5 text-blue-500 rounded focus:ring-blue-500" />
                    <span class="ml-2 text-gray-700">{{ $t('config.convertLabel') }}</span>
                  </label>
                </div>
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">{{ $t('config.showPreview') }}</label>
                <div class="flex items-center mt-2">
                  <label class="inline-flex items-center">
                    <input v-model="configStore.config.showPreview" type="checkbox"
                      class="form-checkbox h-5 w-5 text-blue-500 rounded focus:ring-blue-500" />
                    <span class="ml-2 text-gray-700">{{ $t('config.showPreviewLabel') }}</span>
                  </label>
                </div>
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">{{ $t('config.showLocalPlay') }}</label>
                <div class="flex items-center mt-2">
                  <label class="inline-flex items-center">
                    <input v-model="configStore.config.showLocalPlay" type="checkbox"
                      class="form-checkbox h-5 w-5 text-blue-500 rounded focus:ring-blue-500" />
                    <span class="ml-2 text-gray-700">{{ $t('config.showLocalPlayLabel') }}</span>
                  </label>
                </div>
              </div>


              <!-- 代理模式选择 -->
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">{{ $t('config.proxyMode') }}</label>
                <select v-model="configStore.config.proxyMode"
                  class="w-full p-2 border rounded-lg focus:ring-blue-500">
                  <option value="disabled">{{ $t('config.proxyModeDisabled') }}</option>
                  <option value="system">{{ $t('config.proxyModeSystem') }}</option>
                  <option value="custom">{{ $t('config.proxyModeCustom') }}</option>
                </select>
                <p class="mt-1 text-sm text-gray-500">{{ $t('config.proxyModeHint') }}</p>
              </div>

              <!-- 仅在选择自定义代理时显示代理URL输入框 -->
              <div v-if="configStore.config.proxyMode === 'custom'">
                <label class="block text-sm font-bold text-gray-700 mb-1">{{ $t('config.proxyUrl') }}</label>
                <input v-model="configStore.config.proxyUrl" type="text"
                  class="w-full p-2 border rounded-lg focus:ring-blue-500" :placeholder="$t('config.proxyUrlPlaceholder')" />
                <p class="mt-1 text-sm text-gray-500">{{ $t('config.proxyUrlHint') }}</p>
              </div>

              <!-- 仅在非禁用代理模式时显示 NO_PROXY 输入框 -->
              <div v-if="configStore.config.proxyMode !== 'disabled'">
                <label class="block text-sm font-bold text-gray-700 mb-1">{{ $t('config.noProxy') }}</label>
                <input v-model="configStore.config.noProxy" type="text"
                  class="w-full p-2 border rounded-lg focus:ring-blue-500" :placeholder="$t('config.noProxyPlaceholder')" />
                <p class="mt-1 text-sm text-gray-500">{{ $t('config.noProxyHint') }}</p>
              </div>

            </div>

            <div class="flex justify-end space-x-4">
              <button type="submit" class="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg">
                {{ $t('config.save') }}
              </button>
            </div>
          </form>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-6">{{ $t('config.localConfig') }}</h2>
          <form @submit.prevent="handleUpdateLocalConfig" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">{{ $t('config.token') }}</label>
                <div class="flex">
                  <input v-model="token" type="password" maxlength="256"
                    class="w-full p-2 border rounded-lg focus:ring-blue-500" :placeholder="$t('config.tokenPlaceholder')" />
                </div>
                <p class="mt-1 text-sm text-gray-500">{{ $t('config.tokenHint') }}</p>
              </div>
            </div>

            <div class="flex justify-end space-x-4">
              <button type="submit" class="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg">
                {{ $t('config.save') }}
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
import { useI18n } from 'vue-i18n';
import Layout from '@/components/Layout.vue';
import { useConfigStore } from '@/stores/config';
import { useWebSocket } from '@/composables/useWebSocket';
import { toast } from '@/utils/toast';

const { t } = useI18n();

const configStore = useConfigStore();
const token = ref(configStore.token || '');

const { connect } = useWebSocket('');

onMounted(async () => {
  await configStore.loadConfig();
  token.value = configStore.token || localStorage.getItem('token') || '';

  // 如果代理模式未设置，初始化为 disabled
  if (!configStore.config.proxyMode) {
    configStore.config.proxyMode = 'disabled';
  }
});

async function handleUpdateConfig() {
  // 验证：当代理模式为 custom 时，proxyUrl 必须填写
  if (configStore.config.proxyMode === 'custom' && !configStore.config.proxyUrl?.trim()) {
    toast({
      text: t('config.proxyUrlRequired'),
      type: 'error',
    });
    return;
  }

  const result = await configStore.updateConfig();
  toast({
    text: result.message || t('config.configUpdated'),
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
  toast({ text: t('config.localConfigUpdated'), type: 'success' });
}
</script>

<style scoped>
input[type="checkbox"] {
  min-width: 20px;
}
</style>

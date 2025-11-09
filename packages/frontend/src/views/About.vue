<template>
  <Layout @new-download="() => {}">
    <div class="p-1 md:p-2">
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-semibold mb-6 text-center">{{ $t('about.title') }}</h2>
      <div class="space-y-6">
        <div>
          <h3 class="text-lg font-medium text-green-700 mb-2">{{ $t('about.projectInfo') }}</h3>
          <div class="bg-gray-50 p-4 rounded-lg">
            <p class="text-gray-600 mb-2"><strong>{{ $t('about.license') }}：</strong>MIT</p>
            <p class="text-gray-600 mb-2">
              <strong>{{ $t('about.author') }}：</strong
              ><a href="https://lzw.me" target="_blank" rel="noopener" class="text-blue-500 hover:text-blue-600"
                >renxia</a
              >
            </p>
            <p class="text-gray-600 mb-2">
              <strong>{{ $t('about.github') }}：</strong>
              <a
                href="https://github.com/lzwme/m3u8-dl.git"
                target="_blank"
                rel="noopener"
                class="text-blue-500 hover:text-blue-600"
                >https://github.com/lzwme/m3u8-dl.git</a
              >
            </p>
            <p class="text-gray-600">
              <strong>{{ $t('about.issues') }}：</strong>
              <a
                href="https://github.com/lzwme/m3u8-dl/issues"
                target="_blank"
                rel="noopener"
                class="text-blue-500 hover:text-blue-600"
              >
                https://github.com/lzwme/m3u8-dl/issues</a
              >
            </p>
            <p class="text-gray-600">
              <strong>{{ $t('about.currentVersion') }}：</strong>
              <a
                href="https://github.com/lzwme/m3u8-dl/release"
                target="_blank"
                rel="noopener"
                class="text-blue-500 hover:text-blue-600"
              >
                {{ serverInfo.version }}</a
              >
            </p>
            <p class="text-gray-600">
              <strong>{{ $t('about.checkVersion') }}：</strong>
              <button
                v-if="!serverInfo.appUpdateMessage"
                @click="checkNewVersion"
                class="px-2 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded"
              >
                <i class="fas fa-check mr-1"></i>{{ $t('about.checkVersion') }}
              </button>
              <span v-if="serverInfo.newVersion" class="text-blue-600"
                >{{ $t('about.newVersionFound', { version: serverInfo.newVersion }) }}</span
              >
              <span v-if="serverInfo.appUpdateMessage" class="text-green-600">{{
                serverInfo.appUpdateMessage
              }}</span>
            </p>
          </div>
        </div>

        <div>
          <h3 class="text-lg font-medium text-green-700 mb-2">{{ $t('about.projectDescription') }}</h3>
          <p class="text-gray-600">
            <a
              href="https://github.com/lzwme/m3u8-dl"
              target="_blank"
              rel="noopener"
              class="text-blue-500 hover:text-blue-600"
              >@lzwme/m3u8-dl</a
            >
            {{ $t('about.projectDescriptionText') }}
          </p>
        </div>

        <div>
          <h3 class="text-lg font-medium text-green-700 mb-2">{{ $t('about.features') }}</h3>
          <ul class="list-disc list-inside text-gray-600 space-y-2">
            <li>{{ $t('about.feature1') }}</li>
            <li>{{ $t('about.feature2') }}</li>
            <li>{{ $t('about.feature3') }}</li>
            <li>{{ $t('about.feature4') }}</li>
            <li>{{ $t('about.feature5') }}</li>
            <li>{{ $t('about.feature6') }}</li>
            <li>{{ $t('about.feature7') }}</li>
            <li>{{ $t('about.feature8') }}</li>
          </ul>
        </div>

        <div>
          <h3 class="text-lg font-medium text-green-700 mb-2">{{ $t('about.installation') }}</h3>
          <div class="bg-gray-50 p-4 rounded-lg">
            <p class="text-gray-600 mb-2">{{ $t('about.globalInstall') }}</p>
            <pre
              class="bg-gray-800 text-gray-100 p-3 rounded-lg overflow-x-auto"
            >npm i -g @lzwme/m3u8-dl<br>m3u8dl -h</pre>
            <p class="text-gray-600 mt-4 mb-2">{{ $t('about.useNpx') }}</p>
            <pre class="bg-gray-800 text-gray-100 p-3 rounded-lg overflow-x-auto">npx @lzwme/m3u8-dl -h</pre>
          </div>
        </div>

        <div>
          <h3 class="text-lg font-medium text-green-700 mb-2">{{ $t('about.docker') }}</h3>
          <div class="bg-gray-50 p-4 rounded-lg">
            <p class="text-gray-600 mb-2">{{ $t('about.dockerCommand') }}</p>
            <pre
              class="bg-gray-800 text-gray-100 p-3 rounded-lg overflow-x-auto"
            >docker run -d --name m3u8-dl -p 6600:6600 -v ./downloads:/app/downloads -v ./cache:/app/cache lzwme/m3u8-dl</pre>
            <p class="text-gray-600 mt-4 mb-2">{{ $t('about.dockerCompose') }}</p>
            <pre class="bg-gray-800 text-gray-100 p-3 rounded-lg overflow-x-auto">version: '3'
services:
  m3u8-dl:
    image: lzwme/m3u8-dl
    container_name: m3u8-dl
    ports:
      - "6600:6600"
    volumes:
      - ./downloads:/app/downloads
      - ./cache:/app/cache
    restart: unless-stopped</pre>
            <p class="text-gray-600 mt-4">
              {{ $t('about.dockerDeployComplete', { url: 'http://localhost:6600' }) }}
            </p>
          </div>
        </div>
      </div>
    </div>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import Layout from '@/components/Layout.vue';
import { useServerStore } from '@/stores/server';
import { toast } from '@/utils/toast';
import { formatSpeed, formatSize } from '@/utils/format';

const { t } = useI18n();

const serverStore = useServerStore();
const serverInfo = computed(() => serverStore.serverInfo);

async function checkNewVersion() {
  try {
    const response = await fetch('https://registry.npmmirror.com/@lzwme/m3u8-dl/latest');
    const r = await response.json();
    if (r.version) {
      if (r.version === serverInfo.value.version) {
        toast({ text: t('about.latestVersion', { version: r.version }), type: 'success' });
      } else {
        serverStore.updateServerInfo({ newVersion: r.version });
        if (window.electron) {
          window.electron.ipc.send('checkForUpdate');
        } else {
          toast({
            text: t('about.newVersionAvailable', { version: r.version, url: 'https://github.com/lzwme/m3u8-dl/releases' }),
            type: 'success',
            duration: 10000,
          });
        }
      }
    }
  } catch (error) {
    console.error('检查新版本失败:', error);
    toast({
      text: t('about.versionCheckFailed', { error: error instanceof Error ? error.message : t('error.unknownError') }),
      type: 'error',
    });
  }
}

onMounted(() => {
  if (window.electron) {
    const ipc = window.electron.ipc;
    ipc.on('downloadProgress', (data: any) => {
      console.log('downloadProgress', data);
      serverStore.updateServerInfo({
        appUpdateMessage: `下载中：${Number(data.percent).toFixed(2)}% [${formatSpeed(data.bytesPerSecond)}] [${formatSize(data.transferred)}/${formatSize(data.total)}]`,
      });
    });
  }
});
</script>

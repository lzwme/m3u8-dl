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
                @click="handleCheckVersion"
                class="px-2 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded"
              >
                <i class="fas fa-check mr-1"></i>{{ $t('about.checkVersion') }}
              </button>
              <span v-if="serverInfo.newVersion" class="text-red-600 ml-2"
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
          <h3 class="text-lg font-medium text-green-700 mb-4">{{ $t('about.features') }}</h3>

          <div class="space-y-4">
            <!-- 核心下载功能 -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="text-base font-semibold text-gray-800 mb-3">{{ $t('about.coreFeatures') }}</h4>
              <ul class="list-disc list-inside text-gray-600 space-y-1.5 text-sm">
                <li>{{ $t('about.coreFeature1') }}</li>
                <li>{{ $t('about.coreFeature2') }}</li>
                <li>{{ $t('about.coreFeature3') }}</li>
                <li>{{ $t('about.coreFeature4') }}</li>
                <li>{{ $t('about.coreFeature5') }}</li>
                <li>{{ $t('about.coreFeature6') }}</li>
                <li>{{ $t('about.coreFeature7') }}</li>
                <li>{{ $t('about.coreFeature8') }}</li>
              </ul>
            </div>

            <!-- WebUI 下载管理 -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="text-base font-semibold text-gray-800 mb-3">{{ $t('about.webUIFeatures') }}</h4>
              <ul class="list-disc list-inside text-gray-600 space-y-1.5 text-sm">
                <li>{{ $t('about.webUIFeature1') }}</li>
                <li>{{ $t('about.webUIFeature2') }}</li>
                <li>{{ $t('about.webUIFeature3') }}</li>
                <li>{{ $t('about.webUIFeature4') }}</li>
                <li>{{ $t('about.webUIFeature5') }}</li>
                <li>{{ $t('about.webUIFeature6') }}</li>
              </ul>
            </div>

            <!-- 视频解析功能 -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="text-base font-semibold text-gray-800 mb-3">{{ $t('about.parserFeatures') }}</h4>
              <ul class="list-disc list-inside text-gray-600 space-y-1.5 text-sm">
                <li>{{ $t('about.parserFeature1') }}</li>
                <li>{{ $t('about.parserFeature2') }}</li>
                <li>{{ $t('about.parserFeature3') }}</li>
              </ul>
            </div>

            <!-- 智能提取功能 -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="text-base font-semibold text-gray-800 mb-3">{{ $t('about.extractFeatures') }}</h4>
              <ul class="list-disc list-inside text-gray-600 space-y-1.5 text-sm">
                <li>{{ $t('about.extractFeature1') }}</li>
                <li>{{ $t('about.extractFeature2') }}</li>
                <li>{{ $t('about.extractFeature3') }}</li>
              </ul>
            </div>

            <!-- 视频搜索功能 -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="text-base font-semibold text-gray-800 mb-3">{{ $t('about.searchFeatures') }}</h4>
              <ul class="list-disc list-inside text-gray-600 space-y-1.5 text-sm">
                <li>{{ $t('about.searchFeature1') }}</li>
                <li>{{ $t('about.searchFeature2') }}</li>
              </ul>
            </div>

            <!-- 多种使用方式 -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="text-base font-semibold text-gray-800 mb-3">{{ $t('about.usageFeatures') }}</h4>
              <ul class="list-disc list-inside text-gray-600 space-y-1.5 text-sm">
                <li>{{ $t('about.usageFeature1') }}</li>
                <li>{{ $t('about.usageFeature2') }}</li>
                <li>{{ $t('about.usageFeature3') }}</li>
                <li>{{ $t('about.usageFeature4') }}</li>
                <li>{{ $t('about.usageFeature5') }}</li>
              </ul>
            </div>

            <!-- 国际化支持 -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="text-base font-semibold text-gray-800 mb-3">{{ $t('about.i18nFeatures') }}</h4>
              <ul class="list-disc list-inside text-gray-600 space-y-1.5 text-sm">
                <li>{{ $t('about.i18nFeature1') }}</li>
                <li>{{ $t('about.i18nFeature2') }}</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-lg font-medium text-green-700 mb-2">{{ $t('about.installation') }}</h3>
          <div class="bg-gray-50 p-4 rounded-lg space-y-4">
            <div>
              <p class="text-gray-600 mb-2">{{ $t('about.globalInstall') }}</p>
              <pre
                class="bg-gray-800 text-gray-100 p-3 rounded-lg overflow-x-auto text-sm"
              >npm i -g @lzwme/m3u8-dl<br>m3u8dl -h</pre>
            </div>
            <div>
              <p class="text-gray-600 mb-2">{{ $t('about.useNpx') }}</p>
              <pre class="bg-gray-800 text-gray-100 p-3 rounded-lg overflow-x-auto text-sm">npx @lzwme/m3u8-dl -h</pre>
            </div>
            <div>
              <p class="text-gray-600 mb-2">{{ $t('about.desktopApp') }}</p>
              <p class="text-gray-600 mb-2 text-sm">{{ $t('about.desktopAppText') }}</p>
              <ul class="list-disc list-inside text-gray-600 space-y-1 text-sm ml-2">
                <li>
                  <a
                    :href="$t('about.desktopAppLink1')"
                    target="_blank"
                    rel="noopener"
                    class="text-blue-500 hover:text-blue-600"
                    >{{ $t('about.desktopAppLink1') }}</a
                  >
                </li>
                <li>
                  <a
                    :href="$t('about.desktopAppLink2')"
                    target="_blank"
                    rel="noopener"
                    class="text-blue-500 hover:text-blue-600"
                    >{{ $t('about.desktopAppLink2') }}</a
                  >
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-lg font-medium text-green-700 mb-2">{{ $t('about.docker') }}</h3>
          <div class="bg-gray-50 p-4 rounded-lg space-y-4">
            <div>
              <p class="text-gray-600 mb-2">{{ $t('about.dockerCommand') }}</p>
              <pre
                class="bg-gray-800 text-gray-100 p-3 rounded-lg overflow-x-auto text-sm"
              >docker run -d --name m3u8-dl -p 6600:6600 -v ./downloads:/app/downloads -v ./cache:/app/cache lzwme/m3u8-dl</pre>
            </div>
            <div>
              <p class="text-gray-600 mb-2">{{ $t('about.dockerCompose') }}</p>
              <pre class="bg-gray-800 text-gray-100 p-3 rounded-lg overflow-x-auto text-sm">version: '3'
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
            </div>
            <p class="text-gray-600 text-sm">
              {{ $t('about.dockerDeployComplete', { url: 'http://localhost:6600' }) }}
            </p>
          </div>
        </div>

        <div>
          <h3 class="text-lg font-medium text-green-700 mb-2">{{ $t('about.captureScript') }}</h3>
          <div class="bg-gray-50 p-4 rounded-lg space-y-4">
            <div>
              <p class="text-gray-600 mb-2">{{ $t('about.captureScriptDescription') }}</p>
            </div>
            <div>
              <p class="text-gray-600 mb-2 font-semibold">{{ $t('about.captureScriptInstall') }}</p>
              <ol class="list-decimal list-inside text-gray-600 space-y-2 text-sm ml-2">
                <li>
                  {{ $t('about.captureScriptInstallStep1') }}
                  <a
                    href="https://violentmonkey.github.io/"
                    target="_blank"
                    rel="noopener"
                    class="text-blue-500 hover:text-blue-600"
                    >Violentmonkey</a
                  >
                  {{ $t('about.captureScriptInstallStep1Or') }}
                  <a
                    href="https://www.tampermonkey.net/"
                    target="_blank"
                    rel="noopener"
                    class="text-blue-500 hover:text-blue-600"
                    >Tampermonkey</a
                  >
                </li>
                <li>
                  {{ $t('about.captureScriptInstallStep2') }}
                  <ul class="list-disc list-inside ml-4 mt-1 space-y-1">
                    <li>{{ $t('about.captureScriptInstallStep2a') }}</li>
                    <li>{{ $t('about.captureScriptInstallStep2b') }}</li>
                    <li>
                      {{ $t('about.captureScriptInstallStep2c') }}
                      <ul class="list-disc list-inside ml-4 mt-1 space-y-1">
                        <li>
                          {{ $t('about.captureScriptInstallStep2cOption1') }}
                          <a
                            href="https://raw.githubusercontent.com/lzwme/m3u8-dl/refs/heads/main/client/m3u8-capture.user.js"
                            target="_blank"
                            rel="noopener"
                            class="text-blue-500 hover:text-blue-600"
                            >https://raw.githubusercontent.com/lzwme/m3u8-dl/refs/heads/main/client/m3u8-capture.user.js</a
                          >
                          <span class="text-gray-500 text-xs ml-1">({{ $t('about.captureScriptInstallStep2cOption1Note') }})</span>
                        </li>
                        <li>
                          {{ $t('about.captureScriptInstallStep2cOption2') }}
                          <a
                            :href="`${localScriptUrl}/m3u8-capture.user.js`"
                            target="_blank"
                            rel="noopener"
                            class="text-blue-500 hover:text-blue-600"
                            >{{ localScriptUrl }}/m3u8-capture.user.js</a
                          >
                        </li>
                      </ul>
                    </li>
                  </ul>
                </li>
                <li>
                  {{ $t('about.captureScriptInstallStep3') }}
                  <ul class="list-disc list-inside ml-4 mt-1 space-y-1">
                    <li>{{ $t('about.captureScriptInstallStep3a') }}</li>
                    <li>{{ $t('about.captureScriptInstallStep3b') }}</li>
                    <li>{{ $t('about.captureScriptInstallStep3c') }}</li>
                  </ul>
                </li>
              </ol>
            </div>
            <div>
              <p class="text-gray-600 mb-2 font-semibold">{{ $t('about.captureScriptFeatures') }}</p>
              <ul class="list-disc list-inside text-gray-600 space-y-1.5 text-sm ml-2">
                <li>{{ $t('about.captureScriptFeature1') }}</li>
                <li>{{ $t('about.captureScriptFeature2') }}</li>
                <li>{{ $t('about.captureScriptFeature3') }}</li>
                <li>
                  {{ $t('about.captureScriptFeature4') }}
                  <ul class="list-disc list-inside ml-4 mt-1 space-y-1">
                    <li>{{ $t('about.captureScriptFeature4a') }}</li>
                    <li>{{ $t('about.captureScriptFeature4b') }}</li>
                  </ul>
                </li>
              </ul>
            </div>
            <div>
              <p class="text-gray-600 mb-2 font-semibold">{{ $t('about.captureScriptUsage') }}</p>
              <ol class="list-decimal list-inside text-gray-600 space-y-1.5 text-sm ml-2">
                <li>{{ $t('about.captureScriptUsageStep1') }}</li>
                <li>{{ $t('about.captureScriptUsageStep2') }}</li>
                <li>{{ $t('about.captureScriptUsageStep3') }}</li>
                <li>{{ $t('about.captureScriptUsageStep4') }}</li>
                <li>{{ $t('about.captureScriptUsageStep5') }}</li>
              </ol>
            </div>
            <div>
              <p class="text-gray-600 mb-2 font-semibold">{{ $t('about.captureScriptExcludeRules') }}</p>
              <p class="text-gray-600 mb-2 text-sm">{{ $t('about.captureScriptExcludeRulesHint') }}</p>
              <pre class="bg-gray-800 text-gray-100 p-3 rounded-lg overflow-x-auto text-sm">localhost:6600
127.0.0.1
/example\.com/
admin</pre>
            </div>
            <p class="text-gray-600 text-sm">
              {{ $t('about.captureScriptTip') }}
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
import Layout from '@/components/Layout.vue';
import { useServerStore } from '@/stores/server';
import { useVersionCheck } from '@/composables/useVersionCheck';
import { formatSpeed, formatSize } from '@/utils/format';

const serverStore = useServerStore();
const serverInfo = computed(() => serverStore.serverInfo);
const { checkNewVersion } = useVersionCheck();
const localScriptUrl = computed(() => window.location.origin);

async function handleCheckVersion() {
  await checkNewVersion(true);
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

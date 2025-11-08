<template>
  <Layout @new-download="() => {}">
    <div class="p-1 md:p-2">
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-semibold mb-6 text-center">关于项目</h2>
      <div class="space-y-6">
        <div>
          <h3 class="text-lg font-medium text-green-700 mb-2">项目信息</h3>
          <div class="bg-gray-50 p-4 rounded-lg">
            <p class="text-gray-600 mb-2"><strong>许可证：</strong>MIT</p>
            <p class="text-gray-600 mb-2">
              <strong>作者：</strong
              ><a href="https://lzw.me" target="_blank" rel="noopener" class="text-blue-500 hover:text-blue-600"
                >renxia</a
              >
            </p>
            <p class="text-gray-600 mb-2">
              <strong>GitHub：</strong>
              <a
                href="https://github.com/lzwme/m3u8-dl.git"
                target="_blank"
                rel="noopener"
                class="text-blue-500 hover:text-blue-600"
                >https://github.com/lzwme/m3u8-dl.git</a
              >
            </p>
            <p class="text-gray-600">
              <strong>问题反馈：</strong>
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
              <strong>当前版本：</strong>
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
              <strong>检测版本：</strong>
              <button
                v-if="!serverInfo.appUpdateMessage"
                @click="checkNewVersion"
                class="px-2 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded"
              >
                <i class="fas fa-check mr-1"></i>检测新版本
              </button>
              <span v-if="serverInfo.newVersion" class="text-blue-600"
                >发现新版本！[{{ serverInfo.newVersion }}]</span
              >
              <span v-if="serverInfo.appUpdateMessage" class="text-green-600">{{
                serverInfo.appUpdateMessage
              }}</span>
            </p>
          </div>
        </div>

        <div>
          <h3 class="text-lg font-medium text-green-700 mb-2">项目简介</h3>
          <p class="text-gray-600">
            <a
              href="https://github.com/lzwme/m3u8-dl"
              target="_blank"
              rel="noopener"
              class="text-blue-500 hover:text-blue-600"
              >@lzwme/m3u8-dl</a
            >
            是一个功能强大的 m3u8 文件视频批量下载工具，支持多线程下载、边下边播、缓存续传等特性。
          </p>
        </div>

        <div>
          <h3 class="text-lg font-medium text-green-700 mb-2">主要特性</h3>
          <ul class="list-disc list-inside text-gray-600 space-y-2">
            <li>多线程下载：采用线程池模式的多线程下载</li>
            <li>边下边播模式：支持使用已下载的 ts 缓存文件在线播放</li>
            <li>批量下载：支持指定多个 m3u8 地址批量下载</li>
            <li>缓存续传：下载失败会保留缓存，重试时只下载失败的片段</li>
            <li>加密支持：支持常见的 AES 加密视频流解密</li>
            <li>格式转换：支持自动转换为 mp4（需安装 ffmpeg）</li>
            <li>搜索功能：支持指定采集站标准 API，以命令行交互的方式搜索和下载</li>
            <li>WebUI：提供下载中心，支持启动为 webui 服务方式进行下载管理</li>
          </ul>
        </div>

        <div>
          <h3 class="text-lg font-medium text-green-700 mb-2">安装使用</h3>
          <div class="bg-gray-50 p-4 rounded-lg">
            <p class="text-gray-600 mb-2">全局安装：</p>
            <pre
              class="bg-gray-800 text-gray-100 p-3 rounded-lg overflow-x-auto"
            >npm i -g @lzwme/m3u8-dl<br>m3u8dl -h</pre>
            <p class="text-gray-600 mt-4 mb-2">使用 npx：</p>
            <pre class="bg-gray-800 text-gray-100 p-3 rounded-lg overflow-x-auto">npx @lzwme/m3u8-dl -h</pre>
          </div>
        </div>

        <div>
          <h3 class="text-lg font-medium text-green-700 mb-2">Docker 部署</h3>
          <div class="bg-gray-50 p-4 rounded-lg">
            <p class="text-gray-600 mb-2">使用 Docker 命令运行：</p>
            <pre
              class="bg-gray-800 text-gray-100 p-3 rounded-lg overflow-x-auto"
            >docker run -d --name m3u8-dl -p 6600:6600 -v ./downloads:/app/downloads -v ./cache:/app/cache lzwme/m3u8-dl</pre>
            <p class="text-gray-600 mt-4 mb-2">使用 docker-compose 运行：</p>
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
              部署完成后，访问
              <a href="http://localhost:6600" target="_blank" rel="noopener" class="text-blue-500 hover:text-blue-600"
                >http://localhost:6600</a
              >
              即可使用 WebUI 界面。
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
import { toast } from '@/utils/toast';
import { formatSpeed, formatSize } from '@/utils/format';

const serverStore = useServerStore();
const serverInfo = computed(() => serverStore.serverInfo);

async function checkNewVersion() {
  try {
    const response = await fetch('https://registry.npmmirror.com/@lzwme/m3u8-dl/latest');
    const r = await response.json();
    if (r.version) {
      if (r.version === serverInfo.value.version) {
        toast({ text: `已是最新版本，无需更新[${r.version}]`, type: 'success' });
      } else {
        serverStore.updateServerInfo({ newVersion: r.version });
        if (window.electron) {
          window.electron.ipc.send('checkForUpdate');
        } else {
          toast({
            text: `发现新版本[${r.version}]，请前往 https://github.com/lzwme/m3u8-dl/releases 下载最新版本`,
            type: 'success',
            duration: 10000,
          });
        }
      }
    }
  } catch (error) {
    console.error('检查新版本失败:', error);
    toast({
      text: `版本检查失败：${error instanceof Error ? error.message : '未知错误'}`,
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

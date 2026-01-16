<template>
  <div v-if="visible" class="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-2 sm:p-4" @click.self="close">
    <div class="bg-white rounded-lg p-3 sm:p-6 max-w-4xl w-full max-h-[98vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-2 sm:mb-6">
        <h2 class="text-base sm:text-lg text-center w-full font-semibold">{{ $t('newDownload.title') }}</h2>
        <button @click="close" class="text-gray-500 hover:text-gray-700 p-1.5 sm:p-2">
          <i class="fas fa-times text-sm sm:text-base"></i>
        </button>
      </div>

      <div class="text-left space-y-2 sm:space-y-6">
        <!-- 主要下载区域 -->
        <div class="space-y-4">
          <!-- 视频链接输入 - 核心功能区域 -->
          <div class="relative">
            <div class="absolute -top-0.5 -left-0.5 sm:-top-2 sm:-left-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full z-10">
              <i class="fas fa-star sm:mr-1 text-[10px] sm:text-xs"></i>
              <span class="hidden sm:inline">{{ $t('newDownload.coreFeature') }}</span>
            </div>
            <div
              class="bg-gradient-to-br from-blue-50 via-white to-indigo-50 border border-blue-200 rounded-lg sm:border-2 sm:rounded-xl p-2.5 sm:p-5 shadow-md sm:shadow-lg"
            >
              <div class="flex items-center mb-2 sm:mb-3">
                <div
                  class="w-7 h-7 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-2 sm:mr-3 shadow-md"
                >
                  <i class="fas fa-link text-white text-xs sm:text-base"></i>
                </div>
                <div class="flex-1">
                  <label class="block text-xs sm:text-sm sm:text-base font-bold text-gray-800">
                    {{ $t('newDownload.videoLinks') }}
                    <span
                      v-if="uniqueLineCount > 2"
                      class="text-[10px] sm:text-xs sm:text-sm text-blue-600 font-normal ml-1 sm:ml-2 bg-blue-100 px-0.5 sm:px-2 py-0.5 sm:py-1 rounded-full"
                    >
                      {{ $t('newDownload.unitCount', { count: uniqueLineCount }) }}
                    </span>
                  </label>
                  <p class="text-xs text-gray-600 mt-0.5 sm:block">{{ $t('newDownload.videoLinksDesc') }}</p>
                </div>
              </div>
              <textarea
                v-model="downloadUrls"
                class="w-full p-2 sm:p-4 border border-gray-200 sm:border-2 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-xs sm:text-sm font-mono transition-all duration-200"
                rows="3 sm:rows-5"
                :placeholder="$t('newDownload.videoLinksPlaceholder')"
              ></textarea>
              <div class="mt-1.5 sm:mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-0">
                <div class="flex items-center space-x-1.5 sm:space-x-3">
                  <p class="text-xs text-gray-600 flex items-center">
                    <i class="fas fa-info-circle text-blue-500 mr-1"></i>
                    <span class="sm:inline">{{ $t('newDownload.videoLinksHint') }}</span>
                  </p>
                  <button @click="showUrlHelp = !showUrlHelp" class="text-xs text-blue-500 hover:text-blue-700 transition-colors p-1" title="{{ $t('newDownload.formatHelp') }}">
                    <i class="fas fa-question-circle"></i>
                    <span class="hidden sm:inline ml-1">{{ $t('newDownload.formatHelp') }}</span>
                  </button>
                </div>
                <div class="flex items-center space-x-1 sm:space-x-2">
                  <button
                    v-if="downloadUrls.trim()"
                    @click="smartFormatUrls"
                    class="text-xs text-green-600 hover:text-green-800 transition-colors whitespace-nowrap p-1"
                    :title="$t('newDownload.formatButton')"
                  >
                    <i class="fas fa-magic"></i>
                    <span class="sm:inline ml-1">{{ $t('newDownload.formatButton') }}</span>
                  </button>
                  <button
                    v-if="downloadUrls.trim()"
                    @click="downloadUrls = ''"
                    class="text-xs text-red-500 hover:text-red-700 transition-colors whitespace-nowrap p-1"
                    :title="$t('newDownload.clearButton')"
                  >
                    <i class="fas fa-times-circle"></i>
                    <span class="sm:inline ml-1">{{ $t('newDownload.clearButton') }}</span>
                  </button>
                </div>
              </div>

              <!-- 格式帮助提示 -->
            <transition
              enter-active-class="transition-all duration-300 ease-out"
              enter-from-class="opacity-0 transform -translate-y-4"
              enter-to-class="opacity-100 transform translate-y-0"
              leave-active-class="transition-all duration-200 ease-in"
              leave-from-class="opacity-100 transform translate-y-0"
              leave-to-class="opacity-0 transform -translate-y-4"
            >
                <div v-if="showUrlHelp" class="mt-1.5 p-1.5 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p class="text-[10px] sm:text-xs text-blue-800 font-medium mb-1 sm:mb-2">
                    <i class="fas fa-info-circle mr-1"></i>
                    {{ $t('newDownload.urlHelpTitle') }}
                  </p>
                  <ul class="text-[10px] sm:text-xs text-blue-700 space-y-0.5 sm:space-y-1 ml-2 sm:ml-4">
                    <li>{{ $t('newDownload.urlHelpM3u8') }}</li>
                    <li>{{ $t('newDownload.urlHelpUrlName') }}</li>
                    <li>{{ $t('newDownload.urlHelpNameUrl') }}</li>
                    <li>{{ $t('newDownload.urlHelpShare') }}</li>
                  </ul>
                </div>
              </transition>
            </div>
          </div>

          <!-- 基本配置区域 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            <!-- 视频信息 -->
            <div class="bg-white border border-gray-200 rounded-lg p-2.5 sm:p-4 shadow-sm">
              <div class="flex items-center mb-1.5 sm:mb-3">
                <div class="w-5 h-5 sm:w-8 sm:h-8 bg-green-100 rounded-lg flex items-center justify-center mr-1.5 sm:mr-3">
                  <i class="fas fa-video text-green-600 text-[10px] sm:text-sm"></i>
                </div>
                <h3 class="text-[10px] sm:text-sm font-bold text-gray-700">{{ $t('newDownload.videoName') }}</h3>
              </div>
              <div class="space-y-1.5 sm:space-y-3">
                <div>
                  <!-- <label class="block text-xs font-medium text-gray-600 mb-0.5 sm:mb-1">{{ $t('newDownload.videoName') }}</label> -->
                  <input
                    v-model="filename"
                    class="w-full p-1.5 sm:p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xs sm:text-sm"
                    :placeholder="$t('newDownload.videoNamePlaceholder')"
                  />
                </div>
              </div>
              <p class="mt-1 sm:mt-2 text-xs text-gray-500 bg-green-50 p-1 sm:p-2 rounded border border-green-100">
                <i class="fas fa-lightbulb text-green-500 mr-1 text-[10px]"></i>
                <span class="sm:inline">{{ $t('newDownload.videoNameHint') }}</span>
              </p>
            </div>

            <!-- 存储设置 -->
            <div class="bg-white border border-gray-200 rounded-lg p-2.5 sm:p-4 shadow-sm">
              <div class="flex items-center mb-1.5 sm:mb-3">
                <div class="w-5 h-5 sm:w-8 sm:h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-1.5 sm:mr-3">
                  <i class="fas fa-folder text-yellow-600 text-[10px] sm:text-sm"></i>
                </div>
                <h3 class="text-[10px] sm:text-sm font-bold text-gray-700">{{ $t('newDownload.storageSettings') }}</h3>
              </div>
              <div class="space-y-1.5 sm:space-y-3">
                <div>
                  <div class="flex items-center justify-between mb-0.5 sm:mb-1">
                    <label class="block text-xs font-medium text-gray-600">{{ $t('newDownload.saveDir') }}</label>
                    <button
                      @click="saveDir = configStore.config.saveDir || ''"
                      class="text-xs text-blue-500 hover:text-blue-700 transition-colors p-1"
                      :title="$t('newDownload.resetToDefault')"
                    >
                      <i class="fas fa-undo"></i>
                      <span class="sm:inline ml-1">{{ $t('newDownload.reset') }}</span>
                    </button>
                  </div>
                  <input
                    v-model="saveDir"
                    class="w-full p-1.5 sm:p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-xs sm:text-sm"
                    :placeholder="$t('newDownload.saveDirPlaceholder')"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 基本设置区域 - 可折叠 -->
          <Collapse
            :title="$t('newDownload.basicSettings')"
            icon="fas fa-sliders-h"
            icon-bg-class="bg-gray-600"
            wrapper-class=""
            button-class="hover:bg-white/50"
            content-class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-2"
            :default-expanded="true"
            section-key="basic_settings"
            v-model:expanded="showBasicSettings"
          >
            <div>
              <div class="flex items-center justify-between mb-0.5 sm:mb-1">
                <label class="block text-xs font-medium text-gray-600">{{ $t('newDownload.headers') }}</label>
                <div class="flex items-center space-x-1.5 sm:space-x-2">
                  <select
                    @change="applyQuickHeader($event)"
                    class="text-xs border border-gray-300 rounded px-1.5 sm:px-2 py-1 focus:ring-2 focus:ring-gray-500"
                  >
                    <option value="">{{ $t('newDownload.quickTemplate') }}</option>
                    <option v-for="template in quickHeaders" :key="template.name" :value="template.value">
                      {{ template.name }}
                    </option>
                  </select>
                </div>
              </div>
              <textarea
                v-model="headers"
                class="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white text-xs font-mono"
                rows="3 sm:rows-4"
                :placeholder="$t('newDownload.headersPlaceholder')"
              ></textarea>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-0.5 sm:mb-1">{{ $t('newDownload.ignoreSegments') }}</label>
              <input
                v-model="ignoreSegments"
                class="w-full p-1.5 sm:p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white text-xs sm:text-sm"
                :placeholder="$t('newDownload.ignoreSegmentsPlaceholder')"
              />
              <p class="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-gray-500">
                <i class="fas fa-scissors text-gray-400 mr-1 text-[10px]"></i>
                <span class="sm:inline">{{ $t('newDownload.ignoreSegmentsHint') }}</span>
              </p>
            </div>
          </Collapse>
        </div>

        <!-- 高级选项区域 - 可折叠 -->
        <div class="mt-3 sm:mt-4">
          <Collapse
            :title="$t('newDownload.advancedOptions')"
            icon="fas fa-sliders-h"
            icon-bg-class="bg-gray-600"
            wrapper-class=""
            button-class="hover:bg-white/50"
            content-class="grid grid-cols-1 sm:grid-cols-1 gap-3 sm:gap-4 mt-2"
            :default-expanded="false"
            section-key="advanced_options"
            v-model:expanded="showAdvanced"
          >
            <!-- URL 抓取功能 -->
            <div class="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg overflow-hidden shadow-sm">
              <div class="flex items-center mb-2 sm:mb-3 p-2">
                <div class="w-7 h-7 sm:w-8 sm:h-8 bg-amber-500 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                  <i class="fas fa-search text-white text-[10px] sm:text-sm"></i>
                </div>
                <h4 class="text-xs sm:text-sm font-bold text-gray-700">{{ $t('newDownload.urlExtraction') }}</h4>
              </div>
              <div class="bg-white p-2.5 sm:p-3 space-y-2.5 sm:space-y-3 border border-amber-100">
                <div class="flex flex-col sm:flex-row gap-2">
                  <input
                    v-model="playUrl"
                    type="text"
                    :placeholder="$t('newDownload.playUrl')"
                    autocomplete="off"
                    class="flex-1 border border-gray-300 rounded-lg px-2.5 sm:px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-xs sm:text-sm"
                  />
                  <button
                    @click="extractUrls"
                    :disabled="extracting"
                    class="px-3 sm:px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-all duration-200 transform hover:scale-105 disabled:transform-none text-xs sm:text-sm"
                  >
                    <i class="fas fa-download mr-1 sm:mr-2"></i>
                    {{ extracting ? $t('newDownload.extracting') : $t('newDownload.extract') }}
                  </button>
                </div>
                <div>
                  <input
                    v-model="subUrlRegex"
                    class="w-full p-1.5 sm:p-2 border border-gray-300 rounded-lg focus:ring-amber-500 bg-white text-xs sm:text-sm"
                    :placeholder="$t('newDownload.subUrlRegex')"
                  />
                  <p class="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-gray-600 flex items-start">
                    <i class="fas fa-lightbulb text-amber-400 mr-1 mt-0.5 text-[10px]"></i>
                    <span class="sm:inline">{{ $t('newDownload.subUrlRegexHint') }}</span>
                  </p>
                </div>
              </div>
            </div>
          </Collapse>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row sm:justify-end sm:space-x-4 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t space-y-2 sm:space-y-0">
        <button @click="close" class="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg border text-xs sm:text-sm">
          {{ $t('common.cancel') }}
        </button>
        <button
          @click="handleSubmit"
          :disabled="submitting"
          class="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
        >
          {{ submitting ? $t('newDownload.submitting') : $t('newDownload.startDownload') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getM3u8Urls, startDownload } from '@/utils/request';
import { toast } from '@/utils/toast';
import { optimizeTitle, urlsTextFormat } from '@/utils/formatTitle';
import { useConfigStore } from '@/stores/config';
import { useTasksStore } from '@/stores/tasks';
import type { DownloadTaskOptions } from '@/types/task';
import Collapse from './Collapse.vue';

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  initialData?: DownloadTaskOptions;
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
const showAdvanced = ref(false);
const showBasicSettings = ref(true);

// 智能提示相关
const showUrlHelp = ref(false);
const quickHeaders = computed(() => [
  { name: t('newDownload.headerWeibo'), value: 'Referer: https://weibo.com/\nCookie: ' },
  { name: t('newDownload.headerDouyin'), value: 'Referer: https://www.douyin.com/\nUser-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)' },
  {
    name: t('newDownload.headerBili'),
    value: 'Referer: https://www.bilibili.com/\nUser-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
]);

// 计算去重后的非空行数
const uniqueLineCount = computed(() => {
  const lines = downloadUrls.value
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  const uniqueLines = new Set(lines);
  return uniqueLines.size;
});

watch(
  () => props.visible,
  visible => {
    if (visible) {
      // 如果有初始数据，填充表单
      if (props.initialData) {
        if (props.initialData.url) {
          // 处理 URL，如果包含 title，则优化 title
          const urlText = props.initialData.url;
          // 检查是否包含 | 分隔符（格式：url | title）
          if (urlText.includes('|')) {
            const lines = urlsTextFormat(urlText).map(({ url, name }) => {
              return name ? `${url} | ${optimizeTitle(name)}` : url;
            });
            downloadUrls.value = lines.join('\n');
          } else {
            downloadUrls.value = urlText;
          }
        }
        if (props.initialData.title) {
          filename.value = props.initialData.title;
        }
        if (props.initialData.saveDir) {
          saveDir.value = props.initialData.saveDir;
        }
        if (props.initialData.ignoreSegments) {
          ignoreSegments.value = props.initialData.ignoreSegments;
        }
        if (props.initialData.headers) {
          headers.value = props.initialData.headers;
          if (typeof headers.value === 'object') {
            headers.value = JSON.stringify(headers.value, null, 2);
          }
        }
      }
    } else {
      // 重置表单
      playUrl.value = '';
      downloadUrls.value = '';
      filename.value = '';
      ignoreSegments.value = '';
      // headers.value = ''; // 不清空，保留上次输入的 headers
      subUrlRegex.value = '';
      saveDir.value = configStore.config.saveDir || '';
      showAdvanced.value = false;
      // showBasicSettings 不重置，保持用户偏好
    }
  }
);

async function extractUrls() {
  const url = playUrl.value.trim();
  if (!/^https?:/.test(url)) {
    toast({ text: t('toast.enterValidUrl'), type: 'error' });
    return;
  }

  extracting.value = true;
  try {
    const result = await getM3u8Urls(url, headers.value.trim(), subUrlRegex.value.trim() || undefined);
    if (result.code === 0 && Array.isArray(result.data) && result.data.length > 0) {
      downloadUrls.value = result.data.map((d: [string, string]) => d.join(' | ')).join('\n');
      toast({ text: result.message || t('toast.extractSuccess', { count: result.data.length }), type: 'success' });
    } else {
      toast({ text: result.message || t('toast.extractFailed'), type: 'error' });
    }
  } catch (error) {
    toast({ text: t('toast.extractError', { error: error instanceof Error ? error.message : t('error.unknownError') }), type: 'error' });
  } finally {
    extracting.value = false;
  }
}

function close() {
  emit('close');
}


function smartFormatUrls() {
  const urls = downloadUrls.value.trim();
  if (!urls) return;

  try {
    const lines = urls
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.includes('http'));
    const formatted = lines.map(line => {
      // 如果已经包含分隔符，保持原样
      if (line.includes('|')) return line;

      // 尝试识别URL格式并添加合理的名称
      if (line.includes('m3u8')) {
        const match = line.match(/\/([^\/]+)\.m3u8/);
        if (match) return `${line} | ${match[1]}`;
      }
      return line;
    });

    downloadUrls.value = formatted.join('\n');
    toast({ text: t('newDownload.formatSuccess'), type: 'success' });
  } catch (error) {
    toast({ text: t('newDownload.formatFailed'), type: 'error' });
  }
}

function applyQuickHeader(event: Event) {
  const target = event.target as HTMLSelectElement;
  if (target.value) {
    headers.value = target.value;
    toast({ text: t('newDownload.templateApplied'), type: 'success' });
  }
}

async function handleSubmit() {
  const urlsText = downloadUrls.value.trim();
  if (!urlsText) {
    toast({ text: t('newDownload.enterM3u8Link'), type: 'error' });
    return;
  }

  // 解析链接和文件名
  const urls = urlsTextFormat(urlsText);

  // 验证链接格式
  if (!urls.length) {
    toast({ text: t('newDownload.enterValidM3u8Link'), type: 'error' });
    return;
  }

  let finalSaveDir = saveDir.value;
  if (urls.length > 1 && filename.value && !finalSaveDir.includes(filename.value)) {
    if (!finalSaveDir) finalSaveDir = configStore.config.saveDir;
    finalSaveDir = finalSaveDir.replace(/\/?$/, '') + '/' + filename.value;
  }

  const downloadList = urls.map((item, idx) => ({
    url: item.url,
    filename: item.name || (filename.value ? `${filename.value}${urls.length > 1 ? t('taskItem.episode', { index: idx + 1 }) : ''}` : ''),
    saveDir: finalSaveDir,
    headers: headers.value.trim() || undefined,
    ignoreSegments: ignoreSegments.value.trim() || undefined,
  }));

  // 内置下载逻辑处理
  submitting.value = true;
  try {
    // 更新任务状态
    downloadList.forEach(item => {
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
      toast({ text: result.message || t('toast.downloadStarted'), type: 'success' });
      close();
    } else {
      toast({ text: result.message || t('toast.downloadFailed'), type: 'error' });
    }
  } catch (error) {
    console.error('批量下载失败:', error);
    toast({ text: `${t('toast.downloadFailed')}: ${error instanceof Error ? error.message : t('error.unknownError')}`, type: 'error' });
  } finally {
    submitting.value = false;
  }
}

// 暴露方法供外部调用（用于自动开始下载）
defineExpose({
  handleSubmit,
});
</script>

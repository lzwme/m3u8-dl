<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h1 class="text-5xl font-bold text-gray-900 mb-6 animate-on-scroll fade-up bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          {{ t('download.title') }}
        </h1>
        <p class="text-xl text-gray-600 max-w-2xl mx-auto animate-on-scroll fade-up" data-delay="200">
          {{ t('download.client.subtitle') }}
        </p>
      </div>

      <!-- Download Client Section -->
      <div class="mb-16">

        <!-- System Detection -->
        <div v-if="detectedSystem" class="animate-on-scroll fade-up bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-xl p-3 md:p-6 mb-8 shadow-lg hover:shadow-xl transition-all duration-300">
          <div class="flex items-center space-x-4">
            <div class="text-primary-600 text-3xl animate-pulse">
              <i v-if="detectedSystem.platform === 'win'" class="fab fa-windows"></i>
              <i v-else-if="detectedSystem.platform === 'mac'" class="fab fa-apple"></i>
              <i v-else-if="detectedSystem.platform === 'linux'" class="fab fa-linux"></i>
              <i v-else class="fas fa-desktop"></i>
            </div>
            <div>
              <p class="text-sm text-primary-700 font-medium">{{ t('download.detectedSystem') }}</p>
              <p class="text-lg font-bold text-primary-900">{{ detectedSystem.name }}</p>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-16 animate-on-scroll fade-up">
          <div class="inline-block relative">
            <div class="w-16 h-16 border-4 border-primary-200 rounded-full"></div>
            <div class="w-16 h-16 border-4 border-primary-600 rounded-full animate-spin border-t-transparent absolute top-0"></div>
          </div>
          <p class="mt-6 text-gray-600 text-lg">{{ t('download.loading') }}</p>
          <div class="mt-4 flex justify-center space-x-2">
            <div class="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style="animation-delay: 0s;"></div>
            <div class="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style="animation-delay: 0.1s;"></div>
            <div class="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style="animation-delay: 0.2s;"></div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="animate-on-scroll fade-up bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-8 mb-8 shadow-lg">
          <div class="flex items-center space-x-4">
            <div class="text-red-600 text-3xl animate-pulse"><i class="fas fa-exclamation-triangle"></i></div>
            <div class="flex-1">
              <p class="font-semibold text-red-900 text-lg">{{ t('download.error.title') }}</p>
              <p class="text-sm text-red-700 mt-1">{{ error }}</p>
            </div>
          </div>
          <button
            @click="fetchReleases"
            class="mt-6 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <i class="fas fa-redo mr-2"></i>
            {{ t('download.error.retry') }}
          </button>
        </div>

        <!-- Latest Release -->
        <div v-else-if="releases.length > 0" class="space-y-8">
        <div v-for="release in releases" :key="release.id">
          <!-- Version Info -->
          <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-900 mb-2">{{ release.tag_name }}</h2>
            <p class="text-gray-600">
              {{ t('download.releases.publishedAt') }}：{{ formatDate(release.published_at) }}
            </p>
          </div>

          <!-- Recommended Download -->
          <div v-if="recommendedAsset" class="mb-12 animate-on-scroll scale-up">
            <div class="relative bg-gradient-to-br from-primary-500 via-primary-600 to-blue-700 border-2 border-primary-400 rounded-2xl p-4 sm:p-8 shadow-2xl overflow-hidden group">
              <!-- 背景装饰 -->
              <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
              <div class="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 group-hover:scale-150 transition-transform duration-700" style="animation-delay: 0.2s;"></div>

              <div class="relative z-10">
                <div class="mb-6">
                  <p class="text-sm font-semibold text-primary-100 mb-6 animate-pulse">{{ t('download.recommended.title') }}</p>
                  <div class="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-6">
                    <div class="text-4xl sm:text-5xl text-white group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      <i :class="getAssetIcon(recommendedAsset.name)"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <span
                        class="text-xl sm:text-2xl font-bold text-white block mb-3 break-words"
                      >
                        {{ recommendedAsset.name }}
                      </span>
                      <div class="flex flex-wrap gap-x-6 gap-y-2 text-sm text-primary-100">
                        <span class="flex items-center">
                          <i class="fas fa-tag mr-2"></i>
                          {{ t('download.recommended.version') }}：<span class="font-bold text-white">{{ release.tag_name }}</span>
                        </span>
                        <span class="flex items-center">
                          <i class="fas fa-calendar mr-2"></i>
                          {{ t('download.recommended.releaseDate') }}：<span class="font-bold text-white">{{ formatDateShort(release.published_at) }}</span>
                        </span>
                        <span class="flex items-center">
                          <i class="fas fa-file mr-2"></i>
                          {{ t('download.recommended.size') }}：<span class="font-bold text-white">{{ formatFileSize(recommendedAsset.size) }}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="mt-6">
                  <a
                    :href="getProxyDownloadUrl(recommendedAsset.browser_download_url)"
                    class="group/btn relative inline-flex items-center justify-center bg-white text-primary-600 px-6 py-3 sm:px-10 sm:py-4 rounded-xl font-bold hover:bg-primary-50 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 overflow-hidden text-sm sm:text-base w-full sm:w-auto"
                    download
                  >
                    <span class="relative z-10 flex items-center">
                      <i class="fas fa-download mr-2 sm:mr-3 group-hover/btn:animate-bounce"></i>
                      {{ t('download.recommended.downloadButton') }}
                    </span>
                    <div class="absolute inset-0 bg-gradient-to-r from-primary-50 to-white opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Download List -->
          <div class="bg-white rounded-xl shadow-lg overflow-hidden animate-on-scroll fade-up" data-delay="200">
            <div class="bg-gradient-to-r from-gray-50 to-gray-100 p-3 md:p-6">
              <h3 class="text-2xl font-bold text-gray-900">{{ t('download.releases.downloadFiles') }}</h3>
            </div>
            <div class="p-6 space-y-3 overflow-y-auto">
              <div
                v-for="(asset, index) in filteredAssets(release.assets)"
                :key="asset.id"
                class="group download-item relative overflow-hidden rounded-lg border border-gray-200 hover:border-primary-300 transition-all duration-300 animate-on-scroll fade-up"
                :data-delay="index * 50"
                :class="{ 'bg-gradient-to-r from-primary-50 to-blue-50 border-primary-300 shadow-md': isRecommendedAsset(asset), 'bg-gray-50 hover:bg-white': !isRecommendedAsset(asset) }"
              >
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-4 gap-3">
                  <div class="flex items-center space-x-4 flex-1 min-w-0">
                    <div class="text-2xl sm:text-3xl text-primary-600 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      <i :class="getAssetIcon(asset.name)"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <span
                        class="font-semibold text-gray-900 break-words sm:truncate block text-base sm:text-lg"
                      >
                        {{ asset.name }}
                      </span>
                      <div class="flex items-center gap-4 mt-1 flex-wrap">
                        <p class="text-sm text-gray-500 flex items-center">
                          <i class="fas fa-file mr-1"></i>
                          {{ formatFileSize(asset.size) }}
                        </p>
                        <span v-if="isRecommendedAsset(asset)" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-600 text-white">
                          <i class="fas fa-star mr-1"></i>
                          推荐
                        </span>
                      </div>
                    </div>
                  </div>
                  <a
                    :href="getProxyDownloadUrl(asset.browser_download_url)"
                    class="sm:ml-4 w-full sm:w-auto group relative overflow-hidden bg-primary-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg hover:bg-primary-800 transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 whitespace-nowrap text-sm sm:text-base text-center sm:text-left"
                    download
                  >
                    <span class="relative z-10 flex items-center justify-center sm:justify-start">
                      <i class="fas fa-download mr-2 group-hover:animate-bounce"></i>
                      {{ t('download.releases.download') }}
                    </span>
                    <div class="absolute inset-0 bg-gradient-to-r from-primary-700 to-primary-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

        <!-- Empty State -->
        <div v-else class="text-center py-12">
          <p class="text-gray-600">{{ t('download.releases.noReleases') }}</p>
        </div>
      </div>

      <!-- CLI Installation Section -->
      <div class="mb-16 bg-white rounded-xl shadow-lg overflow-hidden animate-on-scroll fade-up">
        <div class="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white p-4 sm:p-8 relative overflow-hidden">
          <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div class="relative z-10">
            <div class="flex items-center gap-4 mb-3">
              <div class="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <i class="fas fa-terminal text-2xl"></i>
              </div>
              <h2 class="text-3xl font-bold">{{ t('download.cli.title') }}</h2>
            </div>
            <p class="text-blue-100 text-lg">{{ t('download.cli.subtitle') }}</p>
          </div>
        </div>
        <div class="p-4 sm:p-8">
          <p class="text-gray-700 text-lg mb-8">{{ t('download.cli.description') }}</p>

          <div class="space-y-6 mb-8">
            <div class="group bg-gradient-to-r from-gray-50 to-white p-3 md:p-6 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-300 hover-lift">
              <div class="flex items-center mb-3">
                <div class="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
                  NPM
                </div>
                <h3 class="text-xl font-semibold text-gray-900 ml-4">{{ t('download.cli.npm.title') }}</h3>
              </div>
              <pre class="bg-gray-900 text-green-400 p-3 md:p-6 rounded-lg overflow-x-auto text-sm font-mono shadow-inner"><code>npm install -g @lzwme/m3u8-dl</code></pre>
            </div>

            <div class="group bg-gradient-to-r from-gray-50 to-white p-3 md:p-6 rounded-xl border border-gray-200 hover:border-blue-400 transition-all duration-300 hover-lift">
              <div class="flex items-center mb-3">
                <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
                  Yarn
                </div>
                <h3 class="text-xl font-semibold text-gray-900 ml-4">{{ t('download.cli.yarn.title') }}</h3>
              </div>
              <pre class="bg-gray-900 text-green-400 p-3 md:p-6 rounded-lg overflow-x-auto text-sm font-mono shadow-inner"><code>yarn global add @lzwme/m3u8-dl</code></pre>
            </div>

            <div class="group bg-gradient-to-r from-gray-50 to-white p-3 md:p-6 rounded-xl border border-gray-200 hover:border-blue-500 transition-all duration-300 hover-lift">
              <div class="flex items-center mb-3">
                <div class="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
                  PNPM
                </div>
                <h3 class="text-xl font-semibold text-gray-900 ml-4">{{ t('download.cli.pnpm.title') }}</h3>
              </div>
              <pre class="bg-gray-900 text-green-400 p-3 md:p-6 rounded-lg overflow-x-auto text-sm font-mono shadow-inner"><code>pnpm add -g @lzwme/m3u8-dl</code></pre>
            </div>
          </div>

          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 md:p-6 border border-blue-200 shadow-md">
            <div class="flex items-center mb-3">
              <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <i class="fas fa-play text-sm"></i>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 ml-3">{{ t('download.cli.usage.title') }}</h3>
            </div>
            <pre class="bg-gray-900 text-green-400 p-3 md:p-6 rounded-lg overflow-x-auto text-sm font-mono shadow-inner"><code>m3u8dl "https://example.com/video.m3u8"</code></pre>
          </div>
        </div>
      </div>

      <!-- Docker Deployment Section -->
      <div class="mb-16 bg-white rounded-xl shadow-lg overflow-hidden animate-on-scroll fade-up">
        <div class="bg-gradient-to-r from-green-600 via-green-700 to-emerald-700 text-white p-4 sm:p-8 relative overflow-hidden">
          <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div class="relative z-10">
            <div class="flex items-center gap-4 mb-3">
              <div class="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <i class="fab fa-docker text-3xl"></i>
              </div>
              <h2 class="text-3xl font-bold">{{ t('download.docker.title') }}</h2>
            </div>
            <p class="text-green-100 text-lg">{{ t('download.docker.subtitle') }}</p>
          </div>
        </div>
        <div class="p-6">
          <p class="text-gray-700 mb-6">{{ t('download.docker.description') }}</p>

          <div class="space-y-4 mb-6">
            <div class="border-l-4 border-green-500 pl-4">
              <h3 class="font-semibold text-gray-900 mb-2">{{ t('download.docker.dockerRun.title') }}</h3>
              <pre class="bg-gray-900 text-green-400 p-3 rounded overflow-x-auto text-sm whitespace-pre"><code>docker run -d -p 6600:6600 --name m3u8-dl lzwme/m3u8-dl</code></pre>
            </div>
            <div class="border-l-4 border-green-500 pl-4">
              <h3 class="font-semibold text-gray-900 mb-2">{{ t('download.docker.dockerCompose.title') }}</h3>
              <pre class="bg-gray-900 text-green-400 p-3 rounded overflow-x-auto text-sm whitespace-pre"><code>docker-compose up -d</code></pre>
              <p class="text-sm text-gray-600 mt-2">
                {{ t('download.docker.dockerCompose.fileSource') }}：
                <a
                  href="https://github.com/lzwme/m3u8-dl/raw/refs/heads/main/docker/docker-compose.yml"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-green-600 hover:text-green-700 underline break-all"
                >
                  https://github.com/lzwme/m3u8-dl/raw/refs/heads/main/docker/docker-compose.yml
                </a>
              </p>
            </div>
          </div>

          <div class="bg-green-50 rounded-lg p-2 sm:p-4 border border-green-200">
            <h3 class="font-semibold text-gray-900 mb-2">{{ t('download.docker.access.title') }}</h3>
            <p class="text-gray-700 text-sm">{{ t('download.docker.access.desc') }}</p>
          </div>
        </div>
      </div>

      <!-- Browser Extension Section -->
      <div class="mt-16 bg-white rounded-xl shadow-lg overflow-hidden animate-on-scroll fade-up">
        <div class="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white p-4 sm:p-8 relative overflow-hidden">
          <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div class="relative z-10">
            <div class="flex items-center gap-4 mb-3">
              <div class="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <i class="fas fa-puzzle-piece text-3xl"></i>
              </div>
              <h2 class="text-3xl font-bold">{{ t('download.browserExtension.title') }}</h2>
            </div>
            <p class="text-purple-100 text-lg">{{ t('download.browserExtension.subtitle') }}</p>
          </div>
        </div>
        <div class="p-6">
          <p class="text-gray-700 mb-6">{{ t('download.browserExtension.description') }}</p>

          <!-- Features -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div class="bg-primary-50 p-2 sm:p-4 rounded-lg border border-primary-200">
              <div class="flex items-start space-x-3">
                <i class="fas fa-magic text-primary-600 text-xl mt-1"></i>
                <div>
                  <h3 class="font-semibold text-gray-900 mb-1">{{ t('download.browserExtension.features.autoCapture.title') }}</h3>
                  <p class="text-sm text-gray-600">{{ t('download.browserExtension.features.autoCapture.desc') }}</p>
                </div>
              </div>
            </div>

            <div class="bg-primary-50 p-2 sm:p-4 rounded-lg border border-primary-200">
              <div class="flex items-start space-x-3">
                <i class="fas fa-tag text-primary-600 text-xl mt-1"></i>
                <div>
                  <h3 class="font-semibold text-gray-900 mb-1">{{ t('download.browserExtension.features.videoNameExtract.title') }}</h3>
                  <p class="text-sm text-gray-600">{{ t('download.browserExtension.features.videoNameExtract.desc') }}</p>
                </div>
              </div>
            </div>

            <div class="bg-primary-50 p-2 sm:p-4 rounded-lg border border-primary-200">
              <div class="flex items-start space-x-3">
                <i class="fas fa-external-link-alt text-primary-600 text-xl mt-1"></i>
                <div>
                  <h3 class="font-semibold text-gray-900 mb-1">{{ t('download.browserExtension.features.jumpToDownload.title') }}</h3>
                  <p class="text-sm text-gray-600">{{ t('download.browserExtension.features.jumpToDownload.desc') }}</p>
                </div>
              </div>
            </div>

            <div class="bg-primary-50 p-2 sm:p-4 rounded-lg border border-primary-200">
              <div class="flex items-start space-x-3">
                <i class="fas fa-filter text-primary-600 text-xl mt-1"></i>
                <div>
                  <h3 class="font-semibold text-gray-900 mb-1">{{ t('download.browserExtension.features.exclusionRules.title') }}</h3>
                  <p class="text-sm text-gray-600">{{ t('download.browserExtension.features.exclusionRules.desc') }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Installation Steps -->
          <div class="bg-gray-50 rounded-lg p-3 md:p-6 mb-6">
            <h3 class="text-xl font-bold text-gray-900 mb-4">{{ t('download.browserExtension.installation.title') }}</h3>
            <div class="space-y-4">
              <div class="bg-white p-2 sm:p-4 rounded-lg">
                <div class="flex items-start space-x-3">
                  <div class="flex-shrink-0 w-7 h-7 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                  <div class="flex-1">
                    <h4 class="font-semibold text-gray-900 mb-1">{{ t('download.browserExtension.installation.step1.title') }}</h4>
                    <p class="text-sm text-gray-600 mb-2">{{ t('download.browserExtension.installation.step1.desc') }}</p>
                    <ul class="list-disc list-inside space-y-1 text-sm text-gray-600">
                      <li v-for="(option, index) in installationOptions" :key="index">{{ option }}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="bg-white p-2 sm:p-4 rounded-lg">
                <div class="flex items-start space-x-3">
                  <div class="flex-shrink-0 w-7 h-7 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                  <div class="flex-1">
                    <h4 class="font-semibold text-gray-900 mb-1">{{ t('download.browserExtension.installation.step2.title') }}</h4>
                    <p class="text-sm text-gray-600 mb-2">{{ t('download.browserExtension.installation.step2.desc') }}</p>
                    <a
                      :href="t('download.browserExtension.installation.step2.link')"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm"
                    >
                      <i class="fas fa-external-link-alt"></i>
                      <span class="break-all">{{ t('download.browserExtension.installation.step2.link') }}</span>
                    </a>
                  </div>
                </div>
              </div>

              <div class="bg-white p-2 sm:p-4 rounded-lg">
                <div class="flex items-start space-x-3">
                  <div class="flex-shrink-0 w-7 h-7 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                  <div class="flex-1">
                    <h4 class="font-semibold text-gray-900 mb-1">{{ t('download.browserExtension.installation.step3.title') }}</h4>
                    <p class="text-sm text-gray-600">{{ t('download.browserExtension.installation.step3.desc') }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Usage Example -->
          <div class="bg-primary-50 rounded-lg p-3 md:p-6 border border-primary-200">
            <h3 class="text-xl font-bold text-gray-900 mb-4">{{ t('download.browserExtension.usage.title') }}</h3>
            <ol class="space-y-3">
              <li v-for="(step, index) in usageSteps" :key="index" class="flex items-start space-x-3">
                <div class="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{{ index + 1 }}</div>
                <p class="text-gray-700 flex-1 text-sm">{{ step }}</p>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSEO } from '@/composables/useSEO';
import { useProxyUrl } from '@/composables/useProxy';
import { useScrollAnimations } from '@/composables/useScrollAnimations';
import { locales } from '@/i18n';
import { detectSystem, type DetectedSystem } from '@/utils/detect-system';

const { t, locale } = useI18n();
const { getProxyUrl } = useProxyUrl();

// 获取当前语言的选项数组
const installationOptions = computed(() => {
  const currentLocale = locales[locale.value as keyof typeof locales];
  return currentLocale?.download?.browserExtension?.installation?.step1?.options || [];
});

// 获取使用步骤数组
const usageSteps = computed(() => {
  const currentLocale = locales[locale.value as keyof typeof locales];
  return currentLocale?.download?.browserExtension?.usage?.steps || [];
});

interface GitHubAsset {
  id: number;
  name: string;
  size: number;
  browser_download_url: string;
  content_type: string;
}

interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  prerelease: boolean;
  assets: GitHubAsset[];
}

const releases = ref<GitHubRelease[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const detectedSystem = ref<DetectedSystem | null>(null);

// 计算推荐下载文件（优先选择 exe、dmg 文件）
const recommendedAsset = computed(() => {
  if (releases.value.length === 0) return null;
  const release = releases.value[0];
  const recommendedAssets = release.assets.filter((asset) => isRecommendedAsset(asset));

  if (recommendedAssets.length === 0) return null;

  // 优先选择 exe 或 dmg 文件
  const exeOrDmg = recommendedAssets.find((asset) => {
    const name = asset.name.toLowerCase();
    return name.endsWith('.exe') || name.endsWith('.dmg');
  });

  return exeOrDmg || recommendedAssets[0];
});

const GITHUB_REPO = 'lzwme/m3u8-dl';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const CACHE_KEY = 'm3u8-dl-latest-release';
const CACHE_DURATION = 60 * 60 * 1000; // 1小时（毫秒）

// 使用通用代理方法（仅在中文语言模式下添加代理前缀）
const getProxyDownloadUrl = getProxyUrl;

// 判断资源是否推荐
function isRecommendedAsset(asset: GitHubAsset): boolean {
  if (!detectedSystem.value) return false;

  const name = asset.name.toLowerCase();
  const { platform, arch } = detectedSystem.value;

  // Windows
  if (platform === 'win') {
    if (arch === 'x64') {
      return (
        name.includes('win') &&
        (name.includes('x64') || name.includes('win_x64') || name.includes('win-x64') || name.endsWith('.exe'))
      );
    } else if (arch === 'ia32') {
      return (
        name.includes('win') &&
        (name.includes('ia32') || name.includes('win_ia32') || name.includes('win-ia32') || name.includes('x86'))
      );
    }
  }

  // macOS
  if (platform === 'mac') {
    if (arch === 'arm64') {
      return (
        (name.includes('mac') || name.includes('darwin') || name.includes('osx')) &&
        (name.includes('arm64') || name.includes('darwin-arm64') || name.includes('mac-arm64') || name.includes('m1') || name.includes('m2') || name.includes('m3'))
      );
    } else {
      return (
        (name.includes('mac') || name.includes('darwin') || name.includes('osx')) &&
        (name.includes('x64') || name.includes('darwin-x64') || name.includes('mac-x64') || name.endsWith('.dmg'))
      );
    }
  }

  // Linux
  if (platform === 'linux') {
    if (arch === 'arm64') {
      return name.includes('linux') && (name.includes('arm64') || name.includes('aarch64'));
    } else {
      return (
        name.includes('linux') &&
        (name.includes('x64') || name.includes('amd64') || name.includes('appimage') || name.endsWith('.deb') || name.endsWith('.rpm'))
      );
    }
  }

  return false;
}

// 获取资源图标（返回 Font Awesome 图标类名）
function getAssetIcon(filename: string): string {
  const name = filename.toLowerCase();
  if (name.endsWith('.exe')) return 'fas fa-file-code';
  if (name.endsWith('.dmg')) return 'fas fa-compact-disc';
  if (name.endsWith('.appimage')) return 'fas fa-box';
  if (name.endsWith('.deb')) return 'fas fa-box';
  if (name.endsWith('.rpm')) return 'fas fa-box';
  if (name.endsWith('.zip')) return 'fas fa-file-archive';
  if (name.endsWith('.tar.gz')) return 'fas fa-box';
  return 'fas fa-file';
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// 格式化日期
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// 格式化短日期（YYYY-MM-DD）
function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// 过滤不需要的文件（如 .blockmap, .yml 等）并排序
function filteredAssets(assets: GitHubAsset[]): GitHubAsset[] {
  const excludePatterns = ['.blockmap', '.yml', '.yaml', '.txt', '.md'];
  const filtered = assets.filter((asset) => {
    const name = asset.name.toLowerCase();
    return !excludePatterns.some((pattern) => name.endsWith(pattern));
  });

  // 排序：当前系统推荐的文件优先，exe/dmg 优先级更高
  return filtered.sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();

    const aIsRecommended = isRecommendedAsset(a);
    const bIsRecommended = isRecommendedAsset(b);

    const aIsExeOrDmg = aName.endsWith('.exe') || aName.endsWith('.dmg');
    const bIsExeOrDmg = bName.endsWith('.exe') || bName.endsWith('.dmg');

    // 1. 当前系统推荐的文件排在最前面
    if (aIsRecommended && !bIsRecommended) return -1;
    if (!aIsRecommended && bIsRecommended) return 1;

    // 2. 在推荐文件中，exe/dmg 优先级更高
    if (aIsRecommended && bIsRecommended) {
      if (aIsExeOrDmg && !bIsExeOrDmg) return -1;
      if (!aIsExeOrDmg && bIsExeOrDmg) return 1;
    }

    // 3. 在非推荐文件中，exe/dmg 也优先
    if (!aIsRecommended && !bIsRecommended) {
      if (aIsExeOrDmg && !bIsExeOrDmg) return -1;
      if (!aIsExeOrDmg && bIsExeOrDmg) return 1;
    }

    // 4. 其他情况按字母顺序排序
    return a.name.localeCompare(b.name);
  });
}

// 获取缓存的发布信息
function getCachedRelease(): GitHubRelease | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);

    if (Date.now() - timestamp < CACHE_DURATION) return data;
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch (err) {
    console.error('Failed to read cache:', err);
    return null;
  }
}

// 保存发布信息到缓存
function setCachedRelease(release: GitHubRelease) {
  try {
    const cacheData = {
      data: release,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (err) {
    console.error('Failed to save cache:', err);
  }
}

// 获取 GitHub Latest Release
async function fetchReleases() {
  loading.value = true;
  error.value = null;

  // 先检查缓存
  const cachedRelease = getCachedRelease();
  if (cachedRelease) {
    releases.value = [cachedRelease];
    loading.value = false;
    return;
  }

  try {
    const response = await fetch(GITHUB_API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: GitHubRelease = await response.json();

    // 只显示有资源的版本
    if (data.assets && data.assets.length > 0) {
      releases.value = [data];
      // 保存到缓存
      setCachedRelease(data);
    } else {
      releases.value = [];
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '未知错误';
    console.error('Failed to fetch releases:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  detectedSystem.value = detectSystem();
  fetchReleases();

  useSEO({
    title: t('download.title'),
    description: t('download.description'),
    keywords: 'm3u8下载,下载客户端,Windows下载,Mac下载,Linux下载,M3U8-DL下载',
    type: 'website',
  });

  // 使用滚动动画
  useScrollAnimations();
});
</script>

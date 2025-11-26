<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <div v-if="showLegacyBrowserWarning" style="background-color: #ca8a04; color: white; padding: 0.5rem 1rem; text-align: center; position: fixed; top: 0; left: 0; right: 0; z-index: 60;">
      <p style="font-size: 1.2rem; font-weight: 500;">
        {{ t('common.browserWarning') }}
        <button @click="showLegacyBrowserWarning = false" style="margin-left: 1rem; text-decoration: underline; cursor: pointer;color:#222" onmouseover="this.style.color='#f00'" onmouseout="this.style.color='#222'">{{ t('common.close') }}</button>
      </p>
    </div>
    <header class="bg-neutral/95 backdrop-blur-sm text-white sticky top-0 z-50 shadow-lg transition-all duration-300" :class="{ 'bg-neutral/98': isScrolled }">
      <div class="container mx-auto px-2 py-3 sm:px-4">
        <div class="flex items-center justify-between">
          <router-link to="/" class="group flex items-center text-white font-bold text-xl space-x-2 hover:text-secondary transition-all duration-300 flex-shrink-0">
            <div class="relative overflow-hidden rounded-lg">
              <img :src="`${baseUrl}logo.png`" alt="M3U8-DL" class="h-8 w-8 group-hover:scale-110 transition-transform duration-300" />
              <div class="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <span class="hidden lg:inline bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent group-hover:from-secondary group-hover:to-white transition-all duration-300">M3U8-DL</span>
          </router-link>
          <nav class="flex-1 flex justify-end">
            <ul class="flex flex-row items-center gap-0.5 sm:gap-2 md:gap-3 lg:gap-4 text-sm md:text-base font-medium flex-wrap justify-end">
              <li class="nav-item">
                <router-link
                  to="/"
                  class="group relative flex items-center gap-2 px-2 md:px-3 py-2 rounded-lg hover:bg-white/10 transition-all duration-300 overflow-hidden"
                  active-class="bg-white/10 text-secondary"
                  :title="t('common.home')"
                >
                  <span class="relative z-10 flex items-center gap-2">
                    <i class="fas fa-home group-hover:animate-bounce transition-all duration-300"></i>
                    <span class="hidden lg:inline">{{ t('common.home') }}</span>
                  </span>
                  <div class="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </router-link>
              </li>
              <li class="nav-item">
                <router-link
                  to="/download"
                  class="group relative flex items-center gap-2 px-2 md:px-3 py-2 rounded-lg hover:bg-white/10 transition-all duration-300 overflow-hidden"
                  active-class="bg-white/10 text-secondary"
                  :title="t('common.download')"
                >
                  <span class="relative z-10 flex items-center gap-2">
                    <i class="fas fa-download group-hover:animate-bounce transition-all duration-300"></i>
                    <span class="hidden lg:inline">{{ t('common.download') }}</span>
                  </span>
                  <div class="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </router-link>
              </li>
              <li class="nav-item">
                <a
                  href="../api"
                  class="group relative flex items-center gap-2 px-2 md:px-3 py-2 rounded-lg hover:bg-white/10 transition-all duration-300 overflow-hidden"
                  :title="t('common.api')"
                  target="_blank"
                >
                  <span class="relative z-10 flex items-center gap-2">
                    <i class="fas fa-code group-hover:rotate-12 transition-transform duration-300"></i>
                    <span class="hidden lg:inline">{{ t('common.api') }}</span>
                  </span>
                  <div class="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </a>
              </li>
              <li class="nav-item">
                <a
                  href="https://m3u8-player.lzw.me/"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group relative flex items-center gap-2 px-2 md:px-3 py-2 rounded-lg hover:bg-white/10 transition-all duration-300 overflow-hidden"
                  :title="t('common.player')"
                >
                  <span class="relative z-10 flex items-center gap-2">
                    <i class="fas fa-video group-hover:animate-pulse transition-all duration-300"></i>
                    <span class="hidden lg:inline">{{ t('common.player') }}</span>
                  </span>
                  <div class="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </a>
              </li>
              <li class="nav-item">
                <a
                  href="https://m3u8-downloader.lzw.me/"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group relative flex items-center gap-2 px-2 md:px-3 py-2 rounded-lg hover:bg-white/10 transition-all duration-300 overflow-hidden"
                  :title="t('common.online')"
                >
                  <span class="relative z-10 flex items-center gap-2">
                    <i class="fas fa-cloud-download-alt group-hover:animate-pulse transition-all duration-300"></i>
                    <span class="hidden lg:inline">{{ t('common.online') }}</span>
                  </span>
                  <div class="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </a>
              </li>
              <li class="nav-item">
                <a
                  href="https://github.com/lzwme/m3u8-dl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group relative flex items-center gap-2 px-2 md:px-3 py-2 rounded-lg hover:bg-white/10 transition-all duration-300 overflow-hidden"
                  :title="t('common.github')"
                >
                  <span class="relative z-10 flex items-center gap-2">
                    <i class="fab fa-github group-hover:rotate-12 transition-transform duration-300"></i>
                    <span class="hidden lg:inline">{{ t('common.github') }}</span>
                  </span>
                  <div class="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </a>
              </li>
              <li>
                <LanguageSwitcher />
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>

    <main>
      <router-view v-slot="{ Component, route }">
        <transition
          :name="(route.meta.transitionName as string) || 'page'"
          mode="out-in"
          appear
        >
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </main>

    <footer class="bg-gray-900 text-gray-300 mt-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 class="text-white font-semibold mb-4">{{ t('footer.about.title') }}</h3>
            <p class="text-sm">
              {{ t('footer.about.description') }}
            </p>
          </div>
          <div>
            <h3 class="text-white font-semibold mb-4">{{ t('footer.links.title') }}</h3>
            <ul class="space-y-2 text-sm">
              <li>
                <a href="https://github.com/lzwme/m3u8-dl" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors">
                  {{ t('footer.links.github') }}
                </a>
              </li>
              <li>
                <a href="https://www.npmjs.com/package/@lzwme/m3u8-dl" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors">
                  {{ t('footer.links.npm') }}
                </a>
              </li>
              <li>
                <router-link to="/download" class="hover:text-white transition-colors">
                  {{ t('footer.links.download') }}
                </router-link>
              </li>
            </ul>
          </div>
          <div>
            <h3 class="text-white font-semibold mb-4">{{ t('footer.license.title') }}</h3>
            <p class="text-sm">{{ t('footer.license.text') }}</p>
            <p class="text-sm mt-2">{{ t('footer.license.copyright') }}</p>
          </div>
        </div>
      </div>
    </footer>
    <BackToTop />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import LanguageSwitcher from './components/LanguageSwitcher.vue';
import BackToTop from './components/BackToTop.vue';

const { t } = useI18n();
const baseUrl = import.meta.env.BASE_URL;
const isScrolled = ref(false);
const showLegacyBrowserWarning = ref(false);

// 检查浏览器版本
const checkBrowserVersion = () => {
  const ua = navigator.userAgent;
  // 检测 Chrome/Chromium 内核
  const chromeMatch = ua.match(/Chrome\/(\d+)/);
  if (chromeMatch && chromeMatch[1]) {
    const version = parseInt(chromeMatch[1], 10);
    // 如果版本小于 100，显示警告
    if (version < 100) {
      showLegacyBrowserWarning.value = true;
    }
  }
};

// 滚动检测
const handleScroll = () => {
  isScrolled.value = window.scrollY > 50;
};

onMounted(() => {
  checkBrowserVersion();
  window.addEventListener('scroll', handleScroll);
  handleScroll(); // 初始检查
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

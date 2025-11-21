<template>
  <div class="relative">
    <!-- 粒子背景 -->
    <ParticleBackground />

    <!-- 动画人物特效 -->
    <AnimatedCharacters />

    <!-- Hero Section -->
    <section class="gradient-animated text-white pt-12 md:pt-20 relative z-10">
      <GlowEffect>
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center">
            <div class="mb-4 md:mb-6">
              <h1 class="text-4xl md:text-5xl lg:text-7xl font-bold mb-4 md:mb-6 animate-on-scroll fade-up">
                <TypewriterEffect
                  :text="typewriterTexts"
                  :speed="100"
                  :delay-between-texts="2000"
                  :loop="true"
                />
              </h1>
            </div>
            <p class="text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 text-primary-100 max-w-4xl mx-auto animate-on-scroll fade-up" data-delay="200">
              {{ t('home.hero.subtitle') }}
            </p>
            <div class="flex justify-center space-x-4 md:space-x-6 animate-on-scroll fade-up" data-delay="400">
              <router-link to="/download"
                class="group relative overflow-hidden bg-white text-primary-600 px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 active:scale-95 glow-effect ripple-effect">
                <span class="relative z-10 flex items-center gap-2">
                  <i class="fas fa-download group-hover:animate-bounce"></i>
                  {{ t('home.hero.download') }}
                </span>
              </router-link>
              <a href="https://github.com/lzwme/m3u8-dl" target="_blank" rel="noopener noreferrer"
                class="group relative overflow-hidden bg-primary-700/80 backdrop-blur-sm text-white px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold border border-primary-400/30 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 active:scale-95 hover:bg-primary-600/90 glow-effect">
                <span class="relative z-10 flex items-center gap-2">
                  <i class="fab fa-github group-hover:animate-pulse"></i>
                  {{ t('home.hero.viewSource') }}
                </span>
              </a>
            </div>

            <!-- 装饰性元素 -->
            <div class="mt-8 md:mt-12 animate-on-scroll fade-up" data-delay="600">
              <div class="flex justify-center space-x-4 md:space-x-8 text-primary-200">
                <div class="text-center floating" style="animation-delay: 0s;">
                  <div class="text-3xl md:text-4xl mb-1 md:mb-2">🧠</div>
                  <p class="text-xs md:text-sm">{{ t('home.hero.features.smartExtract') }}</p>
                </div>
                <div class="text-center floating" style="animation-delay: 0.5s;">
                  <div class="text-3xl md:text-4xl mb-1 md:mb-2">▶️</div>
                  <p class="text-xs md:text-sm">{{ t('home.hero.features.streamingPlayback') }}</p>
                </div>
                <div class="text-center floating" style="animation-delay: 1s;">
                  <div class="text-3xl md:text-4xl mb-1 md:mb-2">💾</div>
                  <p class="text-xs md:text-sm">{{ t('home.hero.features.cacheResume') }}</p>
                </div>
                <div class="text-center floating" style="animation-delay: 1.5s;">
                  <div class="text-3xl md:text-4xl mb-1 md:mb-2">⚡</div>
                  <p class="text-xs md:text-sm">{{ t('home.hero.features.fastDownload') }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </GlowEffect>
    </section>

    <!-- Features Section -->
    <section class="pt-12 md:pt-20 bg-gradient-to-b from-white to-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl md:text-4xl font-bold text-center mb-10 md:mb-16 text-gray-900 animate-on-scroll fade-up">
          {{ t('home.features.title') }}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          <div class="feature-card group animate-on-scroll fade-up" data-delay="0">
            <div class="relative overflow-hidden bg-gradient-to-br from-primary-50 to-white p-8 rounded-xl border border-primary-100 hover:border-primary-300 transition-all duration-300 hover-lift hover-3d">
              <div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary-200/20 to-transparent rounded-bl-full"></div>
              <div class="relative z-10">
                <div class="text-primary-600 text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <i class="fas fa-rocket"></i>
                </div>
                <h3 class="text-xl font-bold mb-3 text-gray-900 group-hover:text-primary-600 transition-colors">
                  {{ t('home.features.multiThread.title') }}
                </h3>
                <p class="text-gray-600 leading-relaxed">
                  {{ t('home.features.multiThread.desc') }}
                </p>
              </div>
            </div>
          </div>

          <div class="feature-card group animate-on-scroll fade-up" data-delay="100">
            <div class="relative overflow-hidden bg-gradient-to-br from-secondary/10 to-white p-8 rounded-xl border border-secondary/20 hover:border-secondary/40 transition-all duration-300 hover-lift hover-3d">
              <div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-secondary/20 to-transparent rounded-bl-full"></div>
              <div class="relative z-10">
                <div class="text-secondary text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <i class="fas fa-play-circle"></i>
                </div>
                <h3 class="text-xl font-bold mb-3 text-gray-900 group-hover:text-secondary transition-colors">
                  {{ t('home.features.playWhileDownload.title') }}
                </h3>
                <p class="text-gray-600 leading-relaxed">
                  {{ t('home.features.playWhileDownload.desc') }}
                </p>
              </div>
            </div>
          </div>

          <div class="feature-card group animate-on-scroll fade-up" data-delay="200">
            <div class="relative overflow-hidden bg-gradient-to-br from-accent/10 to-white p-8 rounded-xl border border-accent/20 hover:border-accent/40 transition-all duration-300 hover-lift hover-3d">
              <div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-accent/20 to-transparent rounded-bl-full"></div>
              <div class="relative z-10">
                <div class="text-accent text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <i class="fas fa-box"></i>
                </div>
                <h3 class="text-xl font-bold mb-3 text-gray-900 group-hover:text-accent transition-colors">
                  {{ t('home.features.batchDownload.title') }}
                </h3>
                <p class="text-gray-600 leading-relaxed">
                  {{ t('home.features.batchDownload.desc') }}
                </p>
              </div>
            </div>
          </div>

          <div class="feature-card group animate-on-scroll fade-up" data-delay="300">
            <div class="relative overflow-hidden bg-gradient-to-br from-red-50 to-white p-8 rounded-xl border border-red-100 hover:border-red-300 transition-all duration-300 hover-lift hover-3d">
              <div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-100/50 to-transparent rounded-bl-full"></div>
              <div class="relative z-10">
                <div class="text-red-600 text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <i class="fas fa-lock"></i>
                </div>
                <h3 class="text-xl font-bold mb-3 text-gray-900 group-hover:text-red-600 transition-colors">
                  {{ t('home.features.aesSupport.title') }}
                </h3>
                <p class="text-gray-600 leading-relaxed">
                  {{ t('home.features.aesSupport.desc') }}
                </p>
              </div>
            </div>
          </div>

          <div class="feature-card group animate-on-scroll fade-up" data-delay="400">
            <div class="relative overflow-hidden bg-gradient-to-br from-yellow-50 to-white p-8 rounded-xl border border-yellow-100 hover:border-yellow-300 transition-all duration-300 hover-lift hover-3d">
              <div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-100/50 to-transparent rounded-bl-full"></div>
              <div class="relative z-10">
                <div class="text-yellow-600 text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <i class="fas fa-redo"></i>
                </div>
                <h3 class="text-xl font-bold mb-3 text-gray-900 group-hover:text-yellow-600 transition-colors">
                  {{ t('home.features.resumeFromCache.title') }}
                </h3>
                <p class="text-gray-600 leading-relaxed">
                  {{ t('home.features.resumeFromCache.desc') }}
                </p>
              </div>
            </div>
          </div>

          <div class="feature-card group animate-on-scroll fade-up" data-delay="500">
            <div class="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-white p-8 rounded-xl border border-indigo-100 hover:border-indigo-300 transition-all duration-300 hover-lift hover-3d">
              <div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-100/50 to-transparent rounded-bl-full"></div>
              <div class="relative z-10">
                <div class="text-indigo-600 text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <i class="fas fa-globe"></i>
                </div>
                <h3 class="text-xl font-bold mb-3 text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {{ t('home.features.webui.title') }}
                </h3>
                <p class="text-gray-600 leading-relaxed">
                  {{ t('home.features.webui.desc') }}
                </p>
              </div>
            </div>
          </div>

          <div class="feature-card group animate-on-scroll fade-up" data-delay="600">
            <div class="relative overflow-hidden bg-gradient-to-br from-purple-50 to-white p-8 rounded-xl border border-purple-100 hover:border-purple-300 transition-all duration-300 hover-lift hover-3d">
              <div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-100/50 to-transparent rounded-bl-full"></div>
              <div class="relative z-10">
                <div class="text-purple-600 text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <i class="fas fa-video"></i>
                </div>
                <h3 class="text-xl font-bold mb-3 text-gray-900 group-hover:text-purple-600 transition-colors">
                  {{ t('home.features.videoParse.title') }}
                </h3>
                <p class="text-gray-600 leading-relaxed">
                  {{ t('home.features.videoParse.desc') }}
                </p>
              </div>
            </div>
          </div>

          <div class="feature-card group animate-on-scroll fade-up" data-delay="700">
            <div class="relative overflow-hidden bg-gradient-to-br from-pink-50 to-white p-8 rounded-xl border border-pink-100 hover:border-pink-300 transition-all duration-300 hover-lift hover-3d">
              <div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-pink-100/50 to-transparent rounded-bl-full"></div>
              <div class="relative z-10">
                <div class="text-pink-600 text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <i class="fas fa-search"></i>
                </div>
                <h3 class="text-xl font-bold mb-3 text-gray-900 group-hover:text-pink-600 transition-colors">
                  {{ t('home.features.smartExtract.title') }}
                </h3>
                <p class="text-gray-600 leading-relaxed">
                  {{ t('home.features.smartExtract.desc') }}
                </p>
              </div>
            </div>
          </div>

          <div class="feature-card group animate-on-scroll fade-up" data-delay="800">
            <div class="relative overflow-hidden bg-gradient-to-br from-cyan-50 to-white p-8 rounded-xl border border-cyan-100 hover:border-cyan-300 transition-all duration-300 hover-lift hover-3d">
              <div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-100/50 to-transparent rounded-bl-full"></div>
              <div class="relative z-10">
                <div class="text-cyan-600 text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <i class="fas fa-desktop"></i>
                </div>
                <h3 class="text-xl font-bold mb-3 text-gray-900 group-hover:text-cyan-600 transition-colors">
                  {{ t('home.features.multipleWays.title') }}
                </h3>
                <p class="text-gray-600 leading-relaxed">
                  {{ t('home.features.multipleWays.desc') }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Usage Section -->
    <section class="pt-12 md:pt-20 bg-gradient-to-br from-gray-50 to-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-10 md:mb-16">
          <h2 class="text-3xl md:text-4xl font-bold mb-4 text-gray-900 animate-on-scroll fade-up">
            {{ t('home.usage.title') }}
          </h2>
            <p class="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto animate-on-scroll fade-up" data-delay="200">
              {{ t('home.usage.subtitle') }}
            </p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div class="usage-card animate-on-scroll fade-up" data-delay="0">
            <div class="relative overflow-hidden bg-gradient-to-br from-gray-50 to-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover-lift group">
              <div class="absolute top-4 right-4">
                <div class="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              </div>
              <div class="flex items-center mb-6">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <i class="fas fa-terminal text-xl"></i>
                </div>
                <h3 class="text-xl font-bold ml-4 text-gray-900">{{ t('home.usage.cli.title') }}</h3>
              </div>
              <pre class="bg-gray-900 text-green-400 p-6 rounded-lg overflow-x-auto text-sm shadow-inner"><code class="font-mono">npm install -g @lzwme/m3u8-dl
m3u8dl "https://example.com/video.m3u8"</code></pre>
              <div class="mt-4 flex items-center text-blue-600">
                <i class="fas fa-bolt mr-2"></i>
                <span class="text-sm font-medium">{{ t('home.usage.cli.description') }}</span>
              </div>
            </div>
          </div>

          <div class="usage-card animate-on-scroll fade-up" data-delay="100">
            <div class="relative overflow-hidden bg-gradient-to-br from-purple-50 to-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover-lift group">
              <div class="absolute top-4 right-4">
                <div class="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              </div>
              <div class="flex items-center mb-6">
                <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <i class="fas fa-code text-xl"></i>
                </div>
                <h3 class="text-xl font-bold ml-4 text-gray-900">{{ t('home.usage.api.title') }}</h3>
              </div>
              <pre class="bg-gray-900 text-green-400 p-6 rounded-lg overflow-x-auto text-sm shadow-inner"><code class="font-mono">import { downloadM3u8 } from '@lzwme/m3u8-dl';

await downloadM3u8('https://example.com/video.m3u8');</code></pre>
              <div class="mt-4 flex items-center text-purple-600">
                <i class="fas fa-bolt mr-2"></i>
                <span class="text-sm font-medium">{{ t('home.usage.api.description') }}</span>
              </div>
            </div>
          </div>

          <div class="usage-card animate-on-scroll fade-up" data-delay="200">
            <div class="relative overflow-hidden bg-gradient-to-br from-green-50 to-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover-lift group">
              <div class="absolute top-4 right-4">
                <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div class="flex items-center mb-6">
                <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <i class="fas fa-globe text-xl"></i>
                </div>
                <h3 class="text-xl font-bold ml-4 text-gray-900">{{ t('home.usage.web.title') }}</h3>
              </div>
              <pre class="bg-gray-900 text-green-400 p-6 rounded-lg overflow-x-auto text-sm shadow-inner"><code class="font-mono">m3u8dl server
# 访问 http://localhost:6600</code></pre>
              <div class="mt-4 flex items-center text-green-600">
                <i class="fas fa-bolt mr-2"></i>
                <span class="text-sm font-medium">{{ t('home.usage.web.description') }}</span>
              </div>
            </div>
          </div>

          <div class="usage-card animate-on-scroll fade-up" data-delay="300">
            <div class="relative overflow-hidden bg-gradient-to-br from-cyan-50 to-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover-lift group">
              <div class="absolute top-4 right-4">
                <div class="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              </div>
              <div class="flex items-center mb-6">
                <div class="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <i class="fab fa-docker text-xl"></i>
                </div>
                <h3 class="text-xl font-bold ml-4 text-gray-900">{{ t('home.usage.docker.title') }}</h3>
              </div>
              <pre class="bg-gray-900 text-green-400 p-6 rounded-lg overflow-x-auto text-sm shadow-inner"><code class="font-mono">docker-compose up -d
# 访问 http://localhost:6600</code></pre>
              <div class="mt-4 flex items-center text-cyan-600">
                <i class="fas fa-bolt mr-2"></i>
                <span class="text-sm font-medium">{{ t('home.usage.docker.description') }}</span>
              </div>
            </div>
          </div>

          <div class="usage-card animate-on-scroll fade-up" data-delay="400">
            <div class="relative overflow-hidden bg-gradient-to-br from-orange-50 to-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover-lift group">
              <div class="absolute top-4 right-4">
                <div class="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              </div>
              <div class="flex items-center mb-6">
                <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <i class="fas fa-download text-xl"></i>
                </div>
                <h3 class="text-xl font-bold ml-4 text-gray-900">{{ t('home.usage.client.title') }}</h3>
              </div>
              <p class="text-gray-600 mb-6">{{ t('home.usage.client.description') }}</p>
              <router-link :to="t('home.usage.client.link')"
                class="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                <i class="fas fa-download"></i>
                <span>{{ t('home.usage.client.linkText') }}</span>
              </router-link>
            </div>
          </div>

          <div class="usage-card animate-on-scroll fade-up" data-delay="500">
            <div class="relative overflow-hidden bg-gradient-to-br from-pink-50 to-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover-lift group">
              <div class="absolute top-4 right-4">
                <div class="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
              </div>
              <div class="flex items-center mb-6">
                <div class="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <i class="fas fa-cloud text-xl"></i>
                </div>
                <h3 class="text-xl font-bold ml-4 text-gray-900">{{ t('home.usage.online.title') }}</h3>
              </div>
              <p class="text-gray-600 mb-6">{{ t('home.usage.online.description') }}</p>
              <a :href="t('home.usage.online.link')" target="_blank" rel="noopener noreferrer"
                class="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                <i class="fas fa-external-link-alt"></i>
                <span>{{ t('home.usage.online.linkText') }}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Browser Extension Section -->
    <section class="py-12 md:py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-8 md:mb-12">
          <h2 class="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">{{ t('home.browserExtension.title') }}</h2>
          <p class="text-lg md:text-xl text-gray-600 mb-2">{{ t('home.browserExtension.subtitle') }}</p>
          <p class="text-gray-600 max-w-3xl mx-auto">{{ t('home.browserExtension.description') }}</p>
        </div>

        <!-- Features -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
          <div class="bg-primary-50 p-6 rounded-lg border border-primary-200">
            <div class="text-primary-600 text-3xl mb-3"><i class="fas fa-magic"></i></div>
            <h3 class="text-lg font-semibold mb-2 text-gray-900">{{
              t('home.browserExtension.features.autoCapture.title') }}</h3>
            <p class="text-sm text-gray-600">{{ t('home.browserExtension.features.autoCapture.desc') }}</p>
          </div>

          <div class="bg-primary-50 p-6 rounded-lg border border-primary-200">
            <div class="text-primary-600 text-3xl mb-3"><i class="fas fa-tag"></i></div>
            <h3 class="text-lg font-semibold mb-2 text-gray-900">{{
              t('home.browserExtension.features.videoNameExtract.title') }}</h3>
            <p class="text-sm text-gray-600">{{ t('home.browserExtension.features.videoNameExtract.desc') }}</p>
          </div>

          <div class="bg-primary-50 p-6 rounded-lg border border-primary-200">
            <div class="text-primary-600 text-3xl mb-3"><i class="fas fa-external-link-alt"></i></div>
            <h3 class="text-lg font-semibold mb-2 text-gray-900">{{
              t('home.browserExtension.features.jumpToDownload.title') }}</h3>
            <p class="text-sm text-gray-600">{{ t('home.browserExtension.features.jumpToDownload.desc') }}</p>
          </div>

          <div class="bg-primary-50 p-6 rounded-lg border border-primary-200">
            <div class="text-primary-600 text-3xl mb-3"><i class="fas fa-filter"></i></div>
            <h3 class="text-lg font-semibold mb-2 text-gray-900">{{
              t('home.browserExtension.features.exclusionRules.title') }}</h3>
            <p class="text-sm text-gray-600">{{ t('home.browserExtension.features.exclusionRules.desc') }}</p>
          </div>
        </div>

        <!-- Installation Steps -->
        <div class="bg-gray-50 rounded-xl p-6 md:p-8 mb-8">
          <h3 class="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 text-center">{{ t('home.browserExtension.installation.title')
            }}</h3>
          <div class="space-y-4 md:space-y-6">
            <div class="bg-white p-4 md:p-6 rounded-lg shadow-sm">
              <div class="flex items-start space-x-4">
                <div
                  class="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  1</div>
                <div class="flex-1">
                  <h4 class="text-lg font-semibold text-gray-900 mb-2">{{
                    t('home.browserExtension.installation.step1.title') }}</h4>
                  <p class="text-gray-600 mb-3">{{ t('home.browserExtension.installation.step1.desc') }}</p>
                  <ul class="list-disc list-inside space-y-1 text-sm text-gray-600">
                    <li v-for="(option, index) in installationOptions" :key="index">{{ option }}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="bg-white p-4 md:p-6 rounded-lg shadow-sm">
              <div class="flex items-start space-x-4">
                <div
                  class="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  2</div>
                <div class="flex-1">
                  <h4 class="text-lg font-semibold text-gray-900 mb-2">{{
                    t('home.browserExtension.installation.step2.title') }}</h4>
                  <p class="text-gray-600 mb-3">{{ t('home.browserExtension.installation.step2.desc') }}</p>
                  <a :href="t('home.browserExtension.installation.step2.link')" target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
                    <i class="fas fa-external-link-alt"></i>
                    <span>{{ t('home.browserExtension.installation.step2.link') }}</span>
                  </a>
                </div>
              </div>
            </div>

            <div class="bg-white p-4 md:p-6 rounded-lg shadow-sm">
              <div class="flex items-start space-x-4">
                <div
                  class="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  3</div>
                <div class="flex-1">
                  <h4 class="text-lg font-semibold text-gray-900 mb-2">{{
                    t('home.browserExtension.installation.step3.title') }}</h4>
                  <p class="text-gray-600">{{ t('home.browserExtension.installation.step3.desc') }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Usage Example -->
        <div class="bg-primary-50 rounded-xl p-6 md:p-8 border border-primary-200">
          <h3 class="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 text-center">{{ t('home.browserExtension.usage.title') }}
          </h3>
          <ol class="space-y-3 md:space-y-4 max-w-2xl mx-auto">
            <li v-for="(step, index) in usageSteps" :key="index" class="flex items-start space-x-4">
              <div
                class="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {{ index + 1 }}</div>
              <p class="text-gray-700 flex-1">{{ step }}</p>
            </li>
          </ol>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-12 md:py-20 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-2xl md:text-3xl font-bold mb-4 md:mb-6">{{ t('home.cta.title') }}</h2>
        <p class="text-lg md:text-xl mb-6 md:mb-8 text-primary-100">
          {{ t('home.cta.subtitle') }}
        </p>
        <router-link to="/download"
          class="inline-block bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors shadow-lg">
          {{ t('home.cta.button') }}
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSEO } from '@/composables/useSEO';
import { useScrollAnimations } from '@/composables/useScrollAnimations';
import { locales } from '@/i18n';
import ParticleBackground from '@/components/ParticleBackground.vue';
import AnimatedCharacters from '@/components/AnimatedCharacters.vue';
import GlowEffect from '@/components/GlowEffect.vue';
import TypewriterEffect from '@/components/TypewriterEffect.vue';

const { t, tm, locale } = useI18n();

// 使用滚动动画
useScrollAnimations();

// 打字机效果文本
const typewriterTexts = computed(() => {
  return tm('home.hero.typewriter') as unknown as string[];
});

// 获取当前语言的选项数组
const installationOptions = computed(() => {
  const currentLocale = locales[locale.value as keyof typeof locales];
  return currentLocale?.home?.browserExtension?.installation?.step1?.options || [];
});

// 获取使用步骤数组
const usageSteps = computed(() => {
  const currentLocale = locales[locale.value as keyof typeof locales];
  return currentLocale?.home?.browserExtension?.usage?.steps || [];
});

onMounted(() => {
  useSEO({
    title: t('home.title'),
    description: t('home.description'),
    keywords: t('home.keywords'),
    type: 'website',
  });
});
</script>

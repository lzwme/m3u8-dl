<template>
  <div class="app-layout">
    <button class="menu-toggle" @click="toggleSidebar">
      <i class="fas" :class="sidebarCollapsed ? 'fa-bars' : 'fa-times'"></i>
    </button>
    <div class="sidebar p-4" :class="{ show: !sidebarCollapsed }">
      <div class="mb-8">
        <div class="flex items-center mb-4">
          <img src="/logo.png" alt="M3U8 下载器" class="w-8 h-8 mr-2" />
          <h1 class="text-xl font-bold text-gray-800">M3U8 下载器</h1>
        </div>
        <button
          @click="showNewDownload"
          class="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg flex items-center justify-center transition-colors"
        >
          <i class="fas fa-plus mr-2"></i>新建下载
        </button>
      </div>
      <nav class="space-y-2">
        <button
          @click="switchSection('download')"
          class="nav-item w-full p-3 rounded-lg flex items-center"
          :class="{ active: activeSection === 'download' }"
        >
          <i class="fas fa-download mr-3"></i>下载管理
        </button>
        <button
          @click="switchSection('completed')"
          class="nav-item w-full p-3 rounded-lg flex items-center"
          :class="{ active: activeSection === 'completed' }"
        >
          <i class="fas fa-check-circle mr-3"></i>已完成
        </button>
        <button
          @click="switchSection('config')"
          class="nav-item w-full p-3 rounded-lg flex items-center"
          :class="{ active: activeSection === 'config' }"
        >
          <i class="fas fa-cog mr-3"></i>配置设置
        </button>
        <button
          @click="switchSection('about')"
          class="nav-item w-full p-3 rounded-lg flex items-center"
          :class="{ active: activeSection === 'about' }"
        >
          <i class="fas fa-info-circle mr-3"></i>关于项目
        </button>
        <button @click="openAriang" class="nav-item w-full p-3 rounded-lg flex items-center">
          <i class="fas fa-link mr-3"></i>Ariang
        </button>
      </nav>
    </div>
    <div class="main-content" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useServerStore } from '@/stores/server';

const router = useRouter();
const route = useRoute();
const serverStore = useServerStore();

const sidebarCollapsed = ref(window.innerWidth <= 768);
const activeSection = ref('download');

const emit = defineEmits<{
  (e: 'new-download'): void;
}>();

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}

function switchSection(section: string) {
  console.log('[Layout] switchSection 被调用，section:', section, '当前路径:', route.path);
  if (section === 'ariang') {
    openAriang();
    return;
  }

  const targetPath = `/${section}`;
  console.log('[Layout] 准备导航到:', targetPath);

  // 如果已经在目标路径，直接返回
  if (route.path === targetPath) {
    console.log('[Layout] 已在目标路径，跳过导航');
    activeSection.value = section;
    return;
  }

  activeSection.value = section;

  // 使用 nextTick 确保状态更新后再导航
  router.push(targetPath).then(() => {
    console.log('[Layout] 导航成功，当前路径:', route.path, '当前名称:', route.name);
    // 确保 activeSection 与路由同步
    if (route.name) {
      activeSection.value = route.name as string;
    }
  }).catch((err) => {
    // 忽略导航重复的错误
    if (err.name !== 'NavigationDuplicated') {
      console.error('[Layout] 路由导航失败:', err);
    } else {
      console.log('[Layout] 导航重复，已忽略');
    }
  });

  if (window.innerWidth <= 768) {
    sidebarCollapsed.value = true;
  }
}

function openAriang() {
  const serverInfo = serverStore.serverInfo;
  const ariangUrl = serverInfo.ariang ? './ariang/' : 'http://lzw.me/x/ariang/';
  window.open(ariangUrl);
}

function showNewDownload() {
  emit('new-download');
}

function handleResize() {
  if (window.innerWidth > 768) {
    sidebarCollapsed.value = false;
  } else {
    sidebarCollapsed.value = true;
  }
}

watch(
  () => route.name,
  (name) => {
    if (name) {
      activeSection.value = name as string;
    }
  },
  { immediate: true }
);

// 监听路由路径变化，确保导航正确
watch(
  () => route.path,
  (path) => {
    if (path.startsWith('/download')) {
      activeSection.value = 'download';
    } else if (path.startsWith('/completed')) {
      activeSection.value = 'completed';
    } else if (path.startsWith('/config')) {
      activeSection.value = 'config';
    } else if (path.startsWith('/about')) {
      activeSection.value = 'about';
    }
  },
  { immediate: true }
);

onMounted(() => {
  window.addEventListener('resize', handleResize);
  handleResize();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.app-layout {
  position: relative;
  min-height: 100vh;
}

.main-content {
  transition: margin-left 0.3s ease, width 0.3s ease;
  margin-left: 16rem;
  width: calc(100% - 16rem);
  padding: 0.25rem;
}

.main-content.sidebar-collapsed {
  margin-left: 0;
  width: 100%;
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0 !important;
    width: 100% !important;
    padding: 0.25rem;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .main-content {
    margin-left: 12rem;
    width: calc(100% - 12rem);
  }

  .sidebar {
    width: 12rem;
  }
}
</style>

<style>
/* 全局样式，因为 sidebar 和 menu-toggle 需要全局作用 */
.sidebar {
  background-color: #fff;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 16rem;
  z-index: 1;
}

.menu-toggle {
  display: none;
  position: fixed;
  top: 1rem;
  left: 1rem;
  z-index: 51;
  padding: 0.5rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 42px;
  height: 42px;
  cursor: pointer;
}

.nav-item {
  transition: all 0.3s ease;
}

.nav-item:hover {
  background-color: #f0f0f0;
  transform: translateX(4px);
}

.nav-item.active {
  background-color: #e6f3ff;
  color: #1890ff;
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }

  .sidebar.show {
    transform: translateX(0);
  }

  .menu-toggle {
    display: block !important;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .sidebar {
    width: 12rem;
  }
}
</style>

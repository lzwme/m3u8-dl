import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

const FAVORITES_KEY = 'm3u8-dl-favorites';
const CACHE_DURATION = 60 * 1000; // 1分钟（毫秒）

// 内存缓存（使用 Set 存储）
interface Cache {
  data: Set<string>;
  timestamp: number;
}

// 缓存
let cache: Cache | null = null;

export const useFavoritesStore = defineStore('favorites', () => {
  // 响应式状态：收藏列表的 Set
  const favoritesSet = ref<Set<string>>(new Set());

  /**
   * 从 localStorage 读取收藏列表
   */
  function readFavoritesFromStorage(): string[] {
    try {
      const favorites = localStorage.getItem(FAVORITES_KEY);
      if (!favorites) return [];
      return JSON.parse(favorites) as string[];
    } catch (error) {
      console.error('读取收藏列表失败:', error);
      return [];
    }
  }

  /**
   * 更新缓存
   */
  function updateCache(data: Set<string>): void {
    cache = { data, timestamp: Date.now() };
  }

  /**
   * 清除缓存（强制下次从 localStorage 读取）
   */
  function clearCache(): void {
    cache = null;
  }

  /**
   * 加载收藏列表（从 localStorage 或缓存）
   */
  function loadFavorites(): void {
    const now = Date.now();

    // 检查缓存是否有效
    if (cache && now - cache.timestamp < CACHE_DURATION) {
      favoritesSet.value = cache.data;
      return;
    }

    // 缓存无效或不存在，从 localStorage 读取
    const favoritesArray = readFavoritesFromStorage();
    const newSet = new Set(favoritesArray);
    favoritesSet.value = newSet;
    updateCache(newSet);
  }

  /**
   * 保存收藏列表到 localStorage
   */
  function saveFavorites(): void {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favoritesSet.value)));
      updateCache(favoritesSet.value);
    } catch (error) {
      console.error('保存收藏列表失败:', error);
      clearCache();
    }
  }

  /**
   * 检查任务是否已收藏
   * 使用 Set.has() 实现 O(1) 时间复杂度
   */
  function isFavorite(url: string): boolean {
    return favoritesSet.value.has(url);
  }

  /**
   * 添加收藏
   * 使用 Set.add() 实现 O(1) 时间复杂度
   */
  function addFavorite(url: string): void {
    if (!favoritesSet.value.has(url)) {
      favoritesSet.value.add(url);
      // 重新赋值以触发响应式更新
      favoritesSet.value = new Set(favoritesSet.value);
      saveFavorites();
    }
  }

  /**
   * 取消收藏
   * 使用 Set.delete() 实现 O(1) 时间复杂度
   */
  function removeFavorite(url: string): void {
    if (favoritesSet.value.has(url)) {
      favoritesSet.value.delete(url);
      // 重新赋值以触发响应式更新
      favoritesSet.value = new Set(favoritesSet.value);
      saveFavorites();
    }
  }

  /**
   * 切换收藏状态
   */
  function toggleFavorite(url: string): boolean {
    if (favoritesSet.value.has(url)) {
      removeFavorite(url);
      return false;
    }
    addFavorite(url);
    return true;
  }

  /**
   * 获取所有收藏的 URL 列表
   */
  const favorites = computed(() => {
    return Array.from(favoritesSet.value);
  });

  // 初始化时加载收藏列表
  loadFavorites();

  return {
    favorites,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    loadFavorites,
  };
});

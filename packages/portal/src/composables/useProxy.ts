import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const GH_PROXY_URL = 'https://gh-proxy.org/';

/**
 * 根据当前语言判断是否为 GitHub 链接添加代理前缀
 * 仅在中文语言模式下添加代理前缀
 *
 * @param url - 原始 URL
 * @returns 处理后的 URL（中文模式下添加代理前缀，其他语言保持原样）
 */
export function useProxyUrl() {
  const { locale } = useI18n();

  const isChinese = computed(() => {
    return locale.value === 'zh-CN';
  });

  /**
   * 为 GitHub 链接添加代理前缀（仅在中文语言模式下）
   */
  const getProxyUrl = (url: string): string => {
    if (!url) return url;

    // 仅在中文语言模式下添加代理前缀
    if (!isChinese.value) return url;

    // 如果是 GitHub 的链接，添加代理前缀
    if (url.includes('github.com') || url.includes('githubusercontent.com')) {
      return `${GH_PROXY_URL}${url}`;
    }

    return url;
  };

  return {
    getProxyUrl,
    isChinese,
  };
}

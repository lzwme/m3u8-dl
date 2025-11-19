import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

const SITE_URL = 'https://m3u8-downloader.lzw.me/portal'; // 实际部署域名
const SITE_NAME = 'M3U8-DL';
const BASE_URL = import.meta.env.BASE_URL || './';

interface SEOData {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  type?: string;
}

export function useSEO(data: SEOData) {
  const route = useRoute();
  const { locale } = useI18n();

  const currentUrl = computed(() => {
    // route.path 已经包含了 base 路径（/portal/），所以直接使用
    const path = route.path === '/' || route.path === BASE_URL.slice(0, -1) ? '' : route.path;
    return `${SITE_URL}${path}`;
  });

  const alternateUrls = computed(() => {
    const path = route.path === '/' || route.path === BASE_URL.slice(0, -1) ? '' : route.path;
    return {
      'zh-CN': `${SITE_URL}${path}`,
      en: `${SITE_URL}${path}`,
    };
  });

  function updateMetaTags() {
    // 更新基础 meta 标签
    updateMetaTag('title', data.title);
    updateMetaTag('description', data.description);
    if (data.keywords) {
      updateMetaTag('keywords', data.keywords);
    }

    // Open Graph
    updateMetaTag('og:title', data.title, 'property');
    updateMetaTag('og:description', data.description, 'property');
    updateMetaTag('og:type', data.type || 'website', 'property');
    updateMetaTag('og:url', currentUrl.value, 'property');
    updateMetaTag('og:image', data.image || `${SITE_URL}${BASE_URL}logo.svg`, 'property');
    updateMetaTag('og:site_name', SITE_NAME, 'property');
    updateMetaTag('og:locale', locale.value === 'zh-CN' ? 'zh_CN' : 'en_US', 'property');

    // Twitter Card
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', data.title);
    updateMetaTag('twitter:description', data.description);
    updateMetaTag('twitter:image', data.image || `${SITE_URL}${BASE_URL}logo.svg`);

    // 语言切换链接 (hreflang)
    updateHreflangTags(alternateUrls.value);

    // 结构化数据 (JSON-LD)
    updateStructuredData(data);
  }

  function updateMetaTag(name: string, content: string, attribute: 'name' | 'property' = 'name') {
    let tag = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attribute, name);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  }

  function updateHreflangTags(urls: Record<string, string>) {
    // 移除旧的 hreflang 标签
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(tag => tag.remove());

    // 添加当前语言
    const currentLink = document.createElement('link');
    currentLink.setAttribute('rel', 'alternate');
    currentLink.setAttribute('hreflang', locale.value);
    currentLink.setAttribute('href', currentUrl.value);
    document.head.appendChild(currentLink);

    // 添加其他语言
    Object.entries(urls).forEach(([lang, url]) => {
      if (lang !== locale.value) {
        const link = document.createElement('link');
        link.setAttribute('rel', 'alternate');
        link.setAttribute('hreflang', lang);
        link.setAttribute('href', url);
        document.head.appendChild(link);
      }
    });

    // 添加 x-default
    const defaultLink = document.createElement('link');
    defaultLink.setAttribute('rel', 'alternate');
    defaultLink.setAttribute('hreflang', 'x-default');
    defaultLink.setAttribute('href', currentUrl.value);
    document.head.appendChild(defaultLink);
  }

  function updateStructuredData(data: SEOData) {
    // 移除旧的 JSON-LD
    document.querySelectorAll('script[type="application/ld+json"]').forEach(tag => tag.remove());

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: SITE_NAME,
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Windows, macOS, Linux',
      description: data.description,
      url: currentUrl.value,
      author: {
        '@type': 'Person',
        name: 'lzwme',
        url: 'https://m3u8-downloader.lzw.me',
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '100',
      },
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
  }

  // 监听路由和语言变化
  watch(
    [() => route.path, locale],
    () => {
      updateMetaTags();
    },
    { immediate: true }
  );

  return {
    updateMetaTags,
    currentUrl,
    alternateUrls,
  };
}

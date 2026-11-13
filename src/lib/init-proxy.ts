import type { M3u8DLOptions } from '../types';
import { logger } from './utils';

/**
 * global-agent 运行时挂载到 globalThis.GLOBAL_AGENT 上的代理控制器结构。
 *
 * global-agent v4 自带类型定义，但其包入口只导出 bootstrap / createGlobalProxyAgent，
 * 不导出代理控制器类型（v3 时代由 @types/global-agent 提供），因此这里自行声明，避免依赖包内部类型。
 */
interface ProxyAgentController {
  HTTP_PROXY: string | null | undefined;
  HTTPS_PROXY: string | null | undefined;
  NO_PROXY: string | null | undefined;
}

/** 初始化失败 N 次后续忽略代理配置 */
let initializFailedTimes = 3;

/**
 * 初始化代理
 */
export async function initProxy(options: M3u8DLOptions) {
  if (!initializFailedTimes && !options.force) return;

  // 根据代理模式来初始化
  try {
    const g = global as unknown as { GLOBAL_AGENT: ProxyAgentController };
    let globalAgent = g.GLOBAL_AGENT;

    if (!globalAgent) {
      // 代理未初始化且为禁用状态，则直接返回
      if (options.proxyMode === 'disabled') return;
      // 为系统代理模式，但未设置环境变量，则直接返回
      if (options.proxyMode === 'system' && !process.env.HTTP_PROXY && !process.env.HTTPS_PROXY) return;

      const globalAgentModule = await import('global-agent');
      const ok = globalAgentModule.bootstrap();
      if (ok) globalAgent = g.GLOBAL_AGENT;
    }

    if (options.proxyMode !== 'disabled' && options.noProxy) {
      options.noProxy = options.noProxy.replaceAll('\n', ',').trim();
    }

    if (options.proxyMode === 'custom' && options.proxyUrl) {
      // 自定义代理模式
      globalAgent.HTTP_PROXY = options.proxyUrl;
      globalAgent.HTTPS_PROXY = options.proxyUrl;
      globalAgent.NO_PROXY = options.noProxy;
      logger.info('Custom proxy enabled:', options.proxyUrl);
    } else if (options.proxyMode === 'disabled') {
      globalAgent.HTTP_PROXY = undefined;
      globalAgent.HTTPS_PROXY = undefined;
      globalAgent.NO_PROXY = undefined;
      // 关闭代理
      logger.info('Proxy disabled');
    } else {
      // } else if (options.proxyMode === 'system') {
      // 默认为使用系统代理，但支持自定义代理过滤
      globalAgent.HTTP_PROXY = process.env.HTTP_PROXY;
      globalAgent.HTTPS_PROXY = process.env.HTTPS_PROXY;
      globalAgent.NO_PROXY = options.noProxy || process.env.NO_PROXY;

      logger.info('System proxy enabled');
    }
  } catch (error) {
    logger.error('Failed to initialize proxy:', error);
    logger.warn('Please install global-agent to enable proxy support: npm install global-agent');
    initializFailedTimes--;
  }
}

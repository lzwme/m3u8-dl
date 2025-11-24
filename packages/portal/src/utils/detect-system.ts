export interface DetectedSystem {
  name: string;
  icon: string;
  platform: string;
  arch: string;
}

interface NavigatorUAData {
  brands: { brand: string; version: string }[];
  mobile: boolean;
  platform: string;
  architecture?: string;
  bitness?: string;
  getHighEntropyValues?: (hints: string[]) => Promise<Record<string, unknown>>;
}

declare global {
  interface Navigator {
    userAgentData?: NavigatorUAData;
  }
}

/**
 * 检测当前系统
 * @returns
 */
export function detectSystem(): DetectedSystem | null {
  if (typeof navigator === 'undefined') return null;

  const ua = navigator.userAgent.toLowerCase();
  // navigator.platform is deprecated but still works as a fallback
  const navPlatform = (navigator.userAgentData?.platform || navigator.platform || '').toLowerCase();

  let osName = '';
  let osIcon = '';
  let osPlatform = '';
  let osArch = 'x64'; // 默认架构

  // 1. iOS (iPhone/iPad/iPod) & iPadOS 桌面模式
  // iPadOS 13+ 在桌面模式下 UA 表现为 Mac，但 maxTouchPoints > 0
  const isIOS = /iphone|ipad|ipod/.test(ua) || (navPlatform.includes('mac') && navigator.maxTouchPoints > 1);

  if (isIOS) {
    osName = ua.includes('ipad') || (navPlatform.includes('mac') && navigator.maxTouchPoints > 1) ? 'iPadOS' : 'iOS';
    osIcon = '🍎'; // 或者使用手机图标 📱
    osPlatform = 'ios';
    osArch = 'arm64'; // iOS 设备几乎都是 arm64
  }
  // 2. Android
  else if (ua.includes('android') || navPlatform.includes('android')) {
    osName = 'Android';
    osIcon = '🤖';
    osPlatform = 'android';

    if (ua.includes('arm64') || ua.includes('aarch64')) {
      osArch = 'arm64';
    } else if (ua.includes('x86_64') || ua.includes('amd64')) {
      osArch = 'x64'; // 模拟器常见
    } else if (ua.includes('arm') || ua.includes('armeabi')) {
      osArch = 'arm'; // 32位 arm
    } else {
      osArch = 'arm64'; // 现代 Android 默认推断为 arm64
    }
  }
  // 3. macOS
  else if (navPlatform.includes('mac') || ua.includes('macintosh') || ua.includes('mac os x')) {
    osName = 'macOS';
    osIcon = '🍎';
    osPlatform = 'mac';

    // 尝试通过 userAgentData 检测
    if (navigator.userAgentData?.architecture === 'arm') {
      osArch = 'arm64';
    } else if (ua.includes('arm64') || ua.includes('aarch64') || ua.includes('m1') || ua.includes('m2')) {
      // 虽然浏览器通常混淆为 Intel，但部分环境可能暴露
      osArch = 'arm64';
    } else {
      // 现代 macOS 浏览器即使在 Apple Silicon 上也常伪装成 Intel x64 以兼容旧网站
      // 这里无法准确通过 JS 区分 Intel Mac 和 Apple Silicon Mac
      // 默认为 x64 (Rosetta 2 可以运行 x64 应用)
      osArch = 'x64';
    }
  }
  // 4. Windows
  else if (navPlatform.includes('win') || ua.includes('windows')) {
    osName = 'Windows';
    osIcon = '🪟';
    osPlatform = 'win';

    if (ua.includes('wow64') || ua.includes('win64') || ua.includes('x64')) {
      osArch = 'x64';
    } else if (ua.includes('arm64')) {
      osArch = 'arm64'; // Windows on ARM
    } else {
      osArch = 'ia32'; // 32位
    }
  }
  // 5. Linux (最后检测，避免覆盖 Android)
  else if (navPlatform.includes('linux') || ua.includes('linux') || ua.includes('x11')) {
    osName = 'Linux';
    osIcon = '🐧';
    osPlatform = 'linux';

    if (ua.includes('arm64') || ua.includes('aarch64')) {
      osArch = 'arm64';
    } else if (ua.includes('arm') || ua.includes('armv7')) {
      osArch = 'arm';
    }
  } else {
    return null;
  }

  return {
    name: `${osName} (${osArch})`,
    icon: osIcon,
    platform: osPlatform,
    arch: osArch,
  };
}

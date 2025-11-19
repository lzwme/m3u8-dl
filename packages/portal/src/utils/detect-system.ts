export interface DetectedSystem {
  name: string;
  icon: string;
  platform: string;
  arch: string;
}

/**
 * 检测当前系统
 * @returns
 */
export function detectSystem(): DetectedSystem | null {
  const userAgent = navigator.userAgent.toLowerCase();
  // @ts-expect-error - navigator.platform is deprecated but still works
  let platform = (navigator.userAgentData?.platform || navigator.platform || '').toLowerCase();
  if (!platform) {
    // 从 userAgent 中推断平台信息
    if (userAgent.includes('win')) platform = 'win';
    else if (userAgent.includes('mac')) platform = 'mac';
    else if (userAgent.includes('linux')) platform = 'linux';
    else if (userAgent.includes('android')) platform = 'android';
    else if (userAgent.includes('iphone') || userAgent.includes('ipad')) platform = 'ios';
  }

  // 检测操作系统
  let osName = '';
  let osIcon = '';
  let osPlatform = '';
  let osArch = '';

  // Windows 检测
  if (platform.includes('win') || userAgent.includes('windows')) {
    osName = 'Windows';
    osIcon = '🪟';
    osPlatform = 'win';
    // 检测架构 - Windows 64位通常包含 WOW64 或 Win64
    if (userAgent.includes('wow64') || userAgent.includes('win64') || userAgent.includes('x64')) {
      osArch = 'x64';
    } else {
      osArch = 'ia32';
    }
  }
  // macOS 检测
  else if (platform.includes('mac') || userAgent.includes('mac')) {
    osName = 'macOS';
    osIcon = '🍎';
    osPlatform = 'mac';
    // macOS 架构检测
    // 使用 navigator.userAgentData 如果可用（Chrome/Edge）
    if (typeof navigator !== 'undefined' && 'userAgentData' in navigator) {
      const uaData = navigator.userAgentData as { platform: string; architecture: string };
      if (uaData.platform?.includes('arm') || uaData.architecture === 'arm') {
        osArch = 'arm64';
      } else {
        osArch = 'x64';
      }
    } else if (userAgent.includes('arm') || userAgent.includes('aarch64')) {
      osArch = 'arm64';
    } else {
      osArch = 'x64';
    }
  }
  // Linux 检测
  else if (platform.includes('linux') || userAgent.includes('linux')) {
    osName = 'Linux';
    osIcon = '🐧';
    osPlatform = 'linux';
    // Linux 架构检测
    if (userAgent.includes('arm') || userAgent.includes('aarch64')) {
      osArch = 'arm64';
    } else if (userAgent.includes('x86_64') || userAgent.includes('amd64')) {
      osArch = 'x64';
    } else {
      osArch = 'x64'; // 默认 x64
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

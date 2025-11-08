/**
 * 格式化文件大小
 */
export function formatSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  }
  if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * 格式化速度
 */
export function formatSpeed(speed: number): string {
  if (speed < 1024) {
    return `${speed} B/s`;
  }
  if (speed < 1024 * 1024) {
    return `${(speed / 1024).toFixed(2)} KB/s`;
  }
  if (speed < 1024 * 1024 * 1024) {
    return `${(speed / (1024 * 1024)).toFixed(2)} MB/s`;
  }
  return `${(speed / (1024 * 1024 * 1024)).toFixed(2)} GB/s`;
}

/**
 * 格式化时间
 */
export function formatTimeCost(seconds: number): string {
  seconds /= 1000;
  if (seconds < 60) {
    return `${seconds}秒`;
  }
  if (seconds < 60 * 60) {
    return `${(seconds / 60).toFixed(2)}分钟`;
  }
  if (seconds < 60 * 60 * 24) {
    return `${(seconds / (60 * 60)).toFixed(2)}小时`;
  }
  return `${(seconds / (60 * 60 * 24)).toFixed(2)}天`;
}

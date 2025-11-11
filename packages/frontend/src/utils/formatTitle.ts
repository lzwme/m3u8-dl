/**
 * 优化 title，移除非影视名称之外的内容
 * @param title 原始标题
 * @returns 优化后的标题
 */
export function optimizeTitle(title: string): string {
  if (!title) return '';

  let optimized = title.trim();

  // 1. 匹配《》中间的部分（中文书名号）
  const matchBookTitle = optimized.match(/《([^》]+)》/);
  if (matchBookTitle) {
    optimized = matchBookTitle[1];
  }

  // 2. 匹配【】中间的部分（中文方括号）
  const matchBracket = optimized.match(/【([^】]+)】/);
  if (matchBracket) {
    optimized = matchBracket[1];
  }

  // 3. 以 - 分隔，取前缀（通常前面是影视名称）
  if (optimized.includes(' - ')) {
    const parts = optimized.split(' - ');
    optimized = parts[0].trim();
  } else if (optimized.includes('-')) {
    // 处理单个 - 的情况，但要避免是日期格式（如 2024-01-01）
    const parts = optimized.split('-');
    if (parts.length === 2 && !/^\d{4}-\d{2}-\d{2}/.test(optimized)) {
      optimized = parts[0].trim();
    }
  }

  // 4. 移除常见的后缀内容
  // 移除 "第X集"、"第X话"、"EP X" 等集数信息（保留在最后，因为可能是有用的）
  // optimized = optimized.replace(/\s*第?\d+[集话期]/g, '');
  // optimized = optimized.replace(/\s*EP\s*\d+/gi, '');
  // optimized = optimized.replace(/\s*Episode\s*\d+/gi, '');

  // 5. 移除常见的网站标识、平台标识
  optimized = optimized.replace(/\s*-\s*(在线观看|免费观看|高清|HD|1080P|720P|4K)/gi, '');
  optimized = optimized.replace(/\s*\[.*?\]/g, ''); // 移除方括号内容
  optimized = optimized.replace(/\s*\(.*?\)/g, ''); // 移除圆括号内容（但要小心，可能包含重要信息）

  // 6. 移除常见的后缀词
  optimized = optimized.replace(/\s*(完整版|未删减版|国语版|粤语版|中字|无字幕|高清版|标清版)$/gi, '');

  // 7. 清理多余空格
  optimized = optimized.replace(/\s+/g, ' ').trim();

  // 8. 如果优化后为空，返回原值
  if (!optimized) {
    return title.trim();
  }

  return optimized;
}

/**
 * 格式化 urlsText，将 urlsText 转换为 url 和 name 的数组
 * @param urlsText 原始 urlsText
 * @returns url 和 name 的数组
 */
export function urlsTextFormat(urlsText: string) {
  const items = String(urlsText || '')
    .split('\n')
    .map(line => {
      const parts = line.split(/[\s|$]+/).map(s => s.trim());
      let url = parts[0];
      let name = parts[1] || '';
      if (name.startsWith('http')) {
        [name, url] = [url, name];
      }
      return { url, name };
    })
    .filter(item => item.url.startsWith('http'));

  // 统计每个 name 出现的次数
  const nameCountMap = new Map<string, number>();
  items.forEach(item => {
    nameCountMap.set(item.name, (nameCountMap.get(item.name) || 0) + 1);
  });

  // 对于重复的 name，从第二个开始添加后缀
  const nameIndexMap = new Map<string, number>();
  return items.map(item => {
    const count = nameCountMap.get(item.name) || 0;
    if (count > 1) {
      const index = (nameIndexMap.get(item.name) || 0) + 1;
      nameIndexMap.set(item.name, index);
      if (index > 1) {
        return { ...item, name: `${item.name} (${index})` };
      }
    }
    return item;
  });
}

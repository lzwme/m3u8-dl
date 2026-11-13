import { createHash } from 'node:crypto';
import { getRetry } from '../../../lib/utils.js';

/**
 * WBI 混淆表
 *
 * 取自 B 站前端，用于由 `img_key + sub_key` 派生 `mixin_key`。
 * B 站不定期更换密钥表，接口报 -403 时需同步更新此处。
 */
const MIXIN_KEY_ENC_TAB = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16,
  24, 55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4, 11, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34, 44, 52,
];

/** 密钥缓存有效期（1 小时） */
const KEY_CACHE_TTL = 60 * 60 * 1000;

let cachedKey: { mixinKey: string; time: number } | null = null;

/** 由 `img_key + sub_key` 派生 `mixin_key` */
export function getMixinKey(orig: string) {
  return MIXIN_KEY_ENC_TAB.map(n => orig[n])
    .join('')
    .slice(0, 32);
}

/**
 * 获取 WBI 签名密钥。
 *
 * 未登录时 nav 接口会返回 `code: -101`，但依然会返回 `wbi_img`，
 * 因此此处不校验业务状态码，只关心密钥是否可用。
 */
export async function getWbiMixinKey(headers?: Record<string, string>) {
  if (cachedKey && Date.now() - cachedKey.time < KEY_CACHE_TTL) return cachedKey.mixinKey;

  const { data } = await getRetry<{ data?: { wbi_img?: { img_url?: string; sub_url?: string } } }>(
    'https://api.bilibili.com/x/web-interface/nav',
    headers
  );

  const wbiImg = data?.data?.wbi_img;
  if (!wbiImg?.img_url || !wbiImg?.sub_url) throw new Error('获取 B 站 WBI 密钥失败');

  const imgKey = wbiImg.img_url.split('/').pop()?.split('.')[0] || '';
  const subKey = wbiImg.sub_url.split('/').pop()?.split('.')[0] || '';
  if (!imgKey || !subKey) throw new Error('解析 B 站 WBI 密钥失败');

  const mixinKey = getMixinKey(imgKey + subKey);
  cachedKey = { mixinKey, time: Date.now() };
  return mixinKey;
}

/**
 * 为请求参数附加 WBI 签名（`wts` 时间戳 + `w_rid` 签名）
 *
 * 算法：参数按 key 排序 → 过滤 `!'()*` 字符 → 拼接为 query → 追加 mixin_key → MD5
 */
export function encWbi<T extends Record<string, string | number>>(params: T, mixinKey: string) {
  const wts = Math.round(Date.now() / 1000);
  const signed: Record<string, string | number> = { ...params, wts };
  const query = Object.keys(signed)
    .sort()
    .map(key => {
      const value = String(signed[key]).replace(/[!'()*]/g, '');
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join('&');
  const w_rid = createHash('md5')
    .update(query + mixinKey)
    .digest('hex');
  return { ...signed, w_rid };
}

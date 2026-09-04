import { createDecipheriv } from 'node:crypto';
import type { M3u8Crypto } from '../types/m3u8.js';
import { getLang, t } from './i18n.js';
import { logger } from './utils.js';

/**
 * 支持「整段解密」的加密方式。
 *
 * HLS 的 `SAMPLE-AES` / `SAMPLE-AES-CTR` 属于样本级加密（NAL/样本内部加密），
 * 与 `AES-128`（整段 CBC 加密）的处理方式完全不同，不能使用整段解密，
 * 直接套用会导致数据损坏，因此这里做显式区分。
 */
const WHOLE_SEGMENT_CRYPTO_METHODS = new Set(['AES-128']);

/** 已提示过「不支持的加密方式」的 key uri，避免每个分片重复刷屏 */
const unsupportedCryptoWarned = new Set<string>();

/** 判断指定的加密方式是否支持整段解密 */
export function isWholeSegmentCrypto(method?: string) {
  return !!method && WHOLE_SEGMENT_CRYPTO_METHODS.has(method.toUpperCase());
}

/**
 * 对分片数据进行解密。
 * 仅 `AES-128` 走整段 CBC 解密；其它方式(如 SAMPLE-AES)原样返回。
 *
 * 注意：解密失败会直接抛出错误，由上层(tsDownload)按分片下载失败处理并重试，
 * 而不是把解密失败的密文当作成功结果落盘。
 */
export function decryptSegmentData<T extends Buffer | Uint8Array>(data: T, cryptoInfo?: M3u8Crypto): Buffer {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);

  if (!cryptoInfo?.key) return buf;

  if (!isWholeSegmentCrypto(cryptoInfo.method)) {
    if (!unsupportedCryptoWarned.has(cryptoInfo.uri)) {
      unsupportedCryptoWarned.add(cryptoInfo.uri);
      logger.warn(t('download.status.unsupportedCrypto', getLang()), cryptoInfo.method);
    }
    return buf;
  }

  const iv = cryptoInfo.iv || new Uint8Array(16);
  const cipherName = `${cryptoInfo.method}-cbc`.toLowerCase();
  const decipher = createDecipheriv(cipherName, cryptoInfo.key as NodeJS.ArrayBufferView, iv as NodeJS.ArrayBufferView);

  return Buffer.concat([decipher.update(buf), decipher.final()]);
}

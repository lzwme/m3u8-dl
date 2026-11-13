import { getRetry } from '../../../lib/utils.js';
import { encWbi, getWbiMixinKey } from './wbi.js';

export const BILI_API = 'https://api.bilibili.com';
export const BILI_REFERER = 'https://www.bilibili.com/';
export const BILI_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** DASH 格式：音视频分离 */
export const FNVAL_DASH = 16;
/** DASH + 4K 分辨率 */
export const FNVAL_DASH_4K = 16 | 128;
/** MP4(durl) 格式：音视频已合并为单个文件 */
export const FNVAL_MP4 = 1;

export interface BiliApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;
}

export interface BiliPage {
  cid: number;
  page: number;
  part: string;
  duration: number;
}

export interface BiliVideoInfo {
  bvid: string;
  aid: number;
  cid: number;
  title: string;
  part: string;
  duration: number;
  owner: string;
  mid: number;
  cover: string;
  pages: BiliPage[];
  view: number;
  like: number;
  pubdate: number;
}

/** DASH 中的一条流 */
export interface BiliStream {
  id: number;
  codecs: string;
  bandwidth: number;
  width?: number;
  height?: number;
  baseUrl?: string;
  base_url?: string;
  backupUrl?: string[];
  backup_url?: string[];
}

/** durl 中的一个文件 */
export interface BiliDurl {
  url: string;
  size: number;
  length: number;
  backup_url?: string[];
}

export interface BiliPlayUrl {
  quality: number;
  accept_quality: number[];
  dash?: { video?: BiliStream[]; audio?: BiliStream[] };
  durl?: BiliDurl[];
}

/** 解析出的取流结果 */
export interface BiliStreams {
  /** 视频流地址 */
  videoUrl: string;
  /** 音频流地址（DASH 音视频分离时存在） */
  audioUrl?: string;
  /** 视频流备用地址，主地址失效时重试 */
  backupUrls: string[];
  /** 音频流备用地址 */
  audioBackupUrls: string[];
  /** 实际清晰度 id */
  quality: number;
}

/** 请求 B 站接口并校验业务状态码 */
async function biliGet<T>(url: string, headers: Record<string, string>): Promise<T> {
  const { data } = await getRetry<BiliApiResponse<T>>(url, headers);
  if (!data) throw new Error('B 站接口返回为空');
  if (data.code !== 0) throw new Error(data.message || `B 站接口请求失败(code=${data.code})`);
  return data.data as T;
}

/** view 接口返回的原始结构（仅声明用到的字段） */
interface BiliViewData {
  bvid?: string;
  aid?: number;
  cid?: number;
  title?: string;
  duration?: number;
  pubdate?: number;
  pic?: string;
  owner?: { mid?: number; name?: string };
  stat?: { view?: number; like?: number };
  pages?: Array<{ cid?: number; page?: number; part?: string; duration?: number }>;
}

/** 获取视频信息（标题、分P、UP 主等），该接口无需签名 */
export async function getVideoInfo(bvid: string, headers: Record<string, string>): Promise<BiliVideoInfo> {
  const data = await biliGet<BiliViewData>(`${BILI_API}/x/web-interface/view?bvid=${bvid}`, headers);

  const pages: BiliPage[] = (data.pages || []).map((p, idx) => ({
    cid: p.cid || 0,
    page: p.page || idx + 1,
    part: p.part || '',
    duration: p.duration || 0,
  }));

  return {
    bvid: data.bvid || bvid,
    aid: data.aid || 0,
    cid: data.cid || pages[0]?.cid || 0,
    title: data.title || '',
    part: pages[0]?.part || '',
    duration: data.duration || 0,
    owner: data.owner?.name || '',
    mid: data.owner?.mid || 0,
    cover: data.pic || '',
    pages,
    view: data.stat?.view || 0,
    like: data.stat?.like || 0,
    pubdate: data.pubdate || 0,
  };
}

/** 从流信息中取出可用的地址列表 */
function getStreamUrls(stream: BiliStream) {
  const primary = stream.baseUrl || stream.base_url || '';
  const backups = stream.backupUrl || stream.backup_url || [];
  return { primary, backups };
}

/**
 * 选择视频流。
 *
 * 优先 H.264(avc1) —— 兼容性最好，合并进 mp4 后各端都能播放；
 * 其次 H.265(hvc1)；再退而求其次取任意编码（可能为 AV1）。
 * 同清晰度下按码率从高到低选择。
 */
function pickVideoStream(streams: BiliStream[]) {
  const ranked = [...streams].sort((a, b) => {
    const codecWeight = (s: BiliStream) => (s.codecs?.startsWith('avc1') ? 2 : s.codecs?.startsWith('hvc1') ? 1 : 0);
    const codecDiff = codecWeight(b) - codecWeight(a);
    if (codecDiff !== 0) return codecDiff;
    if (b.id !== a.id) return b.id - a.id;
    return (b.bandwidth || 0) - (a.bandwidth || 0);
  });
  return ranked[0];
}

/** 选择音频流：取码率最高的 AAC */
function pickAudioStream(streams: BiliStream[]) {
  const aac = streams.filter(s => s.codecs?.startsWith('mp4a'));
  const pool = aac.length ? aac : streams;
  return [...pool].sort((a, b) => (b.bandwidth || 0) - (a.bandwidth || 0))[0];
}

/**
 * 获取 DASH 音视频分离流。
 *
 * @param useWbi 是否使用 WBI 签名接口（登录后画质更高，未登录时会被限流到 480P）
 */
export async function getDashStreams(
  bvid: string,
  cid: number,
  headers: Record<string, string>,
  useWbi: boolean
): Promise<BiliStreams | null> {
  const baseParams = { bvid, cid, qn: useWbi ? 120 : 80, fnval: useWbi ? FNVAL_DASH_4K : FNVAL_DASH, fnver: 0, fourk: 1 };

  let playUrl: BiliPlayUrl;
  if (useWbi) {
    const mixinKey = await getWbiMixinKey(headers);
    const signed = encWbi(baseParams, mixinKey);
    const qs = Object.entries(signed)
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    playUrl = await biliGet<BiliPlayUrl>(`${BILI_API}/x/player/wbi/playurl?${qs}`, headers);
  } else {
    // 未登录时，旧接口配合 try_look=1 可拿到 1080P（实测），WBI 接口则会被限制到 480P
    const qs = new URLSearchParams({ ...baseParams, try_look: '1' } as unknown as Record<string, string>).toString();
    playUrl = await biliGet<BiliPlayUrl>(`${BILI_API}/x/player/playurl?${qs}`, headers);
  }

  const videos = playUrl.dash?.video || [];
  const audios = playUrl.dash?.audio || [];
  if (!videos.length) return null;

  const video = pickVideoStream(videos);
  const audio = pickAudioStream(audios);
  const videoUrls = getStreamUrls(video);
  if (!videoUrls.primary) return null;

  const audioUrls = audio ? getStreamUrls(audio) : { primary: '', backups: [] };

  return {
    videoUrl: videoUrls.primary,
    audioUrl: audioUrls.primary || undefined,
    backupUrls: videoUrls.backups,
    audioBackupUrls: audioUrls.backups,
    quality: video.id,
  };
}

/** 获取 MP4(durl) 单文件流：音视频已合并，无需二次合并 */
export async function getDurlStream(bvid: string, cid: number, headers: Record<string, string>): Promise<BiliStreams | null> {
  const qs = new URLSearchParams({ bvid, cid: String(cid), qn: '80', fnval: String(FNVAL_MP4), fnver: '0', fourk: '1' }).toString();
  const playUrl = await biliGet<BiliPlayUrl>(`${BILI_API}/x/player/playurl?${qs}`, headers);

  const durl = playUrl.durl?.[0];
  if (!durl?.url) return null;

  return {
    videoUrl: durl.url,
    backupUrls: durl.backup_url || [],
    audioBackupUrls: [],
    quality: playUrl.quality || 0,
  };
}

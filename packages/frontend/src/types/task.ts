export type TaskStatus = 'resume' | 'pending' | 'pause' | 'error' | 'done';

export interface DownloadTask {
  url: string;
  filename?: string;
  localVideo?: string;
  localM3u8?: string;
  status: TaskStatus;
  progress?: number;
  speed?: number;
  speedDesc?: string;
  avgSpeedDesc?: string;
  remainingTime?: number;
  downloadedSize?: number;
  duration?: number;
  size?: number;
  tsCount?: number;
  tsSuccess?: number;
  tsFailed?: number;
  threadNum?: number;
  startTime?: number;
  endTime?: number;
  errmsg?: string;
  showName?: string;
  dlOptions?: DownloadTaskOptions;
  options?: DownloadTaskOptions;
}

export interface DownloadTaskOptions {
  filename?: string;
  url?: string;
  title?: string;
  saveDir?: string;
  ignoreSegments?: string;
  headers?: string;
}

export interface QueueStatus {
  queueLength: number;
  activeDownloads: string[];
  maxConcurrent: number;
}

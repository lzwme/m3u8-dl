import type { TaskItem } from '@lzwme/m3u8-dl/contract';

/** 保留旧命名，避免改动所有引用处 */
export type { QueueStatus, TaskItem, TaskOptions as DownloadTaskOptions, TaskStatus } from '@lzwme/m3u8-dl/contract';

/**
 * WebUI 任务数据 = 服务端下发的 `TaskItem` + 本地派生字段。
 *
 * 类型源头在后端 `src/types/contract.ts`，新增或修改任务字段应改那里，不要在此重复声明。
 */
export interface DownloadTask extends TaskItem {
  /** 展示名称。由 filename / dlOptions.filename / localVideo / url 推导，仅 WebUI 使用 */
  showName?: string;
}

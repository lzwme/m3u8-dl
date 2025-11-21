/** 媒体链接项 */
export interface MediaLink {
  url: string;
  title: string;
  type: string;
  pageUrl: string;
  timestamp: number;
  headers?: string;
}

/** 链接数据（用于 iframe 通信） */
export interface LinkData extends MediaLink {}

/** 面板位置 */
export interface PanelPosition {
  x: number;
  y: number;
}

/** 事件坐标 */
export interface EventCoordinates {
  x: number;
  y: number;
}

/** 拖动偏移量 */
export interface DragOffset {
  x: number;
  y: number;
}

/** SweetAlert2 目标设置函数类型 */
export type SetSwalTargetFn = (target: HTMLElement) => void;

/** SweetAlert2 目标获取函数类型 */
export type GetSwalTargetFn = () => HTMLElement;

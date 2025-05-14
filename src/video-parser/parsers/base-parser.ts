import type { ApiResponse, VideoInfo } from '../../types';

export abstract class BaseParser {
  protected static success<T>(data: T): ApiResponse<T> {
    return {
      code: 0,
      message: 'success',
      data,
    };
  }

  protected static error(code: number, message: string): ApiResponse<null> {
    return {
      code,
      message,
      data: null,
    };
  }

  public static parse(_url: string, _headers: Record<string, string> = {}): Promise<ApiResponse<VideoInfo>> {
    return Promise.resolve(this.success<VideoInfo>(null));
  }
}

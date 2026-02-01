/**
 * 日志工具 - 支持开发和生产环境的不同日志行为
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogConfig {
  enabled: boolean;
  includeStackTrace: boolean;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * 调试日志 - 仅在开发环境输出
   */
  debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      if (data !== undefined) {
        console.log(`[DEBUG] ${message}`, data);
      } else {
        console.log(`[DEBUG] ${message}`);
      }
    }
  }

  /**
   * 信息日志
   */
  info(message: string, data?: any): void {
    if (this.isDevelopment) {
      if (data !== undefined) {
        console.log(`[INFO] ${message}`, data);
      } else {
        console.log(`[INFO] ${message}`);
      }
    }
  }

  /**
   * 警告日志
   */
  warn(message: string, data?: any): void {
    if (this.isDevelopment) {
      if (data !== undefined) {
        console.warn(`[WARN] ${message}`, data);
      } else {
        console.warn(`[WARN] ${message}`);
      }
    }
  }

  /**
   * 错误日志 - 开发环境打印，生产环境可发送到错误跟踪服务
   */
  error(message: string, error?: any): void {
    if (this.isDevelopment) {
      if (error !== undefined) {
        console.error(`[ERROR] ${message}`, error);
      } else {
        console.error(`[ERROR] ${message}`);
      }
    } else {
      // 生产环境：发送到错误跟踪服务（如 Sentry、LogRocket 等）
      // TODO: 集成错误跟踪服务
      console.error(`[ERROR] ${message}`);
    }
  }

  /**
   * API 请求日志 - 不包含敏感数据
   */
  apiRequest(method: string, endpoint: string, clientId?: string): void {
    if (this.isDevelopment) {
      console.log(`[API] ${method} ${endpoint}`, clientId ? `Client: ${clientId}` : '');
    }
  }

  /**
   * API 成功响应日志
   */
  apiSuccess(method: string, endpoint: string, result?: string): void {
    if (this.isDevelopment) {
      console.log(`[API] ${method} ${endpoint} - Success`, result || '');
    }
  }

  /**
   * API 错误响应日志
   */
  apiError(method: string, endpoint: string, error: any): void {
    console.error(`[API ERROR] ${method} ${endpoint}`, error);
  }
}

export const logger = new Logger();

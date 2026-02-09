/**
 * Feishu (Lark) WebSocket Long Connection Service
 *
 * Provides a clean interface for Feishu event subscription via WebSocket
 */

import * as Lark from '@larksuiteoapi/node-sdk';
import type { FeishuConfig, EventHandler } from './types';
import { logger } from '@/lib/logger';

/**
 * Feishu Long Connection Service
 *
 * Handles WebSocket connection to Feishu open platform
 * and dispatches events to registered handlers
 */
export class FeishuLongConnection {
  private client: Lark.Client;
  private wsClient: Lark.WSClient;
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  private isRunning = false;

  constructor(private config: FeishuConfig) {
    this.client = new Lark.Client({
      appId: config.appId,
      appSecret: config.appSecret,
    });

    // Create WS client with minimal configuration
    this.wsClient = new Lark.WSClient({
      appId: config.appId,
      appSecret: config.appSecret,
      loggerLevel: this.mapLogLevel(config.logLevel || 'info'),
    });
  }

  /**
   * Register an event handler
   *
   * @param eventType - Feishu event type (e.g., 'im.message.receive_v1')
   * @param handler - Async callback function
   */
  on<T = any>(eventType: string, handler: EventHandler<T>): this {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler as EventHandler);

    logger.debug(`[Feishu] Registered handler for event: ${eventType}`);
    return this;
  }

  /**
   * Start the WebSocket long connection
   *
   * This method will block until the connection is closed
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('[Feishu] Long connection is already running');
      return;
    }

    this.isRunning = true;
    logger.info('[Feishu] Starting WebSocket long connection...');

    try {
      this.wsClient.start({
        eventDispatcher: new Lark.EventDispatcher({}).register({
          // Register all event types
          ...this.buildEventHandlers(),
        }),
      });

      logger.info('[Feishu] Long connection started successfully');
    } catch (error) {
      logger.error('[Feishu] Failed to start long connection', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop the WebSocket long connection
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    logger.info('[Feishu] Stopping WebSocket long connection...');
    this.isRunning = false;
    // WS Client doesn't have a direct stop method, the connection
    // will be terminated when the process ends
  }

  /**
   * Get the API client for sending messages and calling APIs
   */
  get apiClient(): Lark.Client {
    return this.client;
  }

  /**
   * Send a text message to a chat
   *
   * @param chatId - Target chat ID
   * @param text - Message content
   */
  async sendTextMessage(chatId: string, text: string): Promise<void> {
    try {
      await this.client.im.v1.message.create({
        params: {
          receive_id_type: 'chat_id',
        },
        data: {
          receive_id: chatId,
          content: JSON.stringify({ text }),
          msg_type: 'text',
        },
      });

      logger.debug(`[Feishu] Sent text message to chat: ${chatId}`);
    } catch (error) {
      logger.error('[Feishu] Failed to send message', error);
      throw error;
    }
  }

  /**
   * Send a card message to a chat
   *
   * @param chatId - Target chat ID
   * @param card - Card content object
   */
  async sendCardMessage(chatId: string, card: any): Promise<void> {
    try {
      await this.client.im.v1.message.create({
        params: {
          receive_id_type: 'chat_id',
        },
        data: {
          receive_id: chatId,
          content: JSON.stringify(card),
          msg_type: 'interactive',
        },
      });

      logger.debug(`[Feishu] Sent card message to chat: ${chatId}`);
    } catch (error) {
      logger.error('[Feishu] Failed to send card message', error);
      throw error;
    }
  }

  /**
   * Build event handlers object for EventDispatcher
   */
  private buildEventHandlers(): Record<string, (data: any) => Promise<void>> {
    const handlers: Record<string, (data: any) => Promise<void>> = {};

    for (const [eventType, callbacks] of this.eventHandlers.entries()) {
      handlers[eventType] = async (data: any) => {
        logger.info(`[Feishu] Received event: ${eventType}`, {
          eventType,
          data: JSON.stringify(data).substring(0, 500),
        });

        // Execute all registered handlers for this event
        for (const handler of callbacks) {
          try {
            await Promise.resolve(handler(data));
          } catch (error) {
            logger.error(`[Feishu] Handler error for event: ${eventType}`, error);
            // Don't throw, continue processing other handlers
          }
        }
      };
    }

    return handlers;
  }

  /**
   * Map log level string to Lark LoggerLevel enum
   */
  private mapLogLevel(level: string): Lark.LoggerLevel {
    const levelMap: Record<string, Lark.LoggerLevel> = {
      debug: Lark.LoggerLevel.debug,
      info: Lark.LoggerLevel.info,
      warn: Lark.LoggerLevel.warn,
      error: Lark.LoggerLevel.error,
    };

    return levelMap[level] || Lark.LoggerLevel.info;
  }
}

/**
 * Factory function to create a Feishu long connection service
 *
 * @param config - Feishu configuration
 * @returns FeishuLongConnection instance
 */
export function createFeishuConnection(config: FeishuConfig): FeishuLongConnection {
  return new FeishuLongConnection(config);
}

/**
 * Create Feishu connection from environment variables
 *
 * Expects FEISHU_APP_ID and FEISHU_APP_SECRET to be set
 *
 * @returns FeishuLongConnection instance
 */
export function createFeishuConnectionFromEnv(): FeishuLongConnection {
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error(
      'Missing Feishu credentials. Please set FEISHU_APP_ID and FEISHU_APP_SECRET environment variables.'
    );
  }

  return new FeishuLongConnection({
    appId,
    appSecret,
    logLevel: (process.env.FEISHU_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
  });
}

/**
 * Feishu (Lark) Long Connection Service
 *
 * Complete SDK for Feishu WebSocket event subscription
 *
 * @example
 * ```typescript
 * import { createFeishuConnectionFromEnv, FEISHU_EVENTS } from '@/lib/feishu';
 *
 * const connection = createFeishuConnectionFromEnv();
 *
 * connection.on(FEISHU_EVENTS.MESSAGE_RECEIVE_V1, async (data) => {
 *   console.log('收到消息:', data);
 *   await connection.sendTextMessage(data.message.chat_id, '你好！');
 * });
 *
 * await connection.start();
 * ```
 */

export * from './types';
export * from './client';
export * from './handlers';

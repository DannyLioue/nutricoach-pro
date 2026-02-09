/**
 * Feishu (Lark) Event Handlers
 *
 * Common event handlers for Feishu events
 */

import type { P2MessageReceiveV1, ChatMemberAddV1, ChatMemberDeleteV1 } from './types';
import type { FeishuLongConnection } from './client';

/**
 * Common event types
 */
export const FEISHU_EVENTS = {
  /**
   * Message received event
   */
  MESSAGE_RECEIVE_V1: 'im.message.receive_v1',

  /**
   * Member added to chat
   */
  CHAT_MEMBER_ADD_V1: 'im.chat.member.add_v1',

  /**
   * Member removed from chat
   */
  CHAT_MEMBER_DELETE_V1: 'im.chat.member.delete_v1',

  /**
   * Bot added to chat
   */
  CHAT_BOT_ADD_V1: 'im.chat.bot.add_v1',

  /**
   * Message read receipt
   */
  MESSAGE_READ_V1: 'im.message.read_v1',
} as const;

/**
 * Setup common handlers for a Feishu connection
 *
 * @param connection - FeishuLongConnection instance
 * @param options - Handler options
 */
export function setupCommonHandlers(
  connection: FeishuLongConnection,
  options: {
    /**
     * Auto-reply handler for text messages
     */
    onMessage?: (data: P2MessageReceiveV1) => Promise<void> | void;

    /**
     * Member added handler
     */
    onMemberAdd?: (data: ChatMemberAddV1) => Promise<void> | void;

    /**
     * Member removed handler
     */
    onMemberRemove?: (data: ChatMemberDeleteV1) => Promise<void> | void;

    /**
     * Whether to log all events
     */
    logEvents?: boolean;
  }
): void {
  // Message receive handler
  connection.on(FEISHU_EVENTS.MESSAGE_RECEIVE_V1, async (data: P2MessageReceiveV1) => {
    try {
      const content = parseMessageContent(data.message.content);
      const senderName = data.sender.sender_id.user_id;
      const text = content?.text || '';

      if (options.logEvents) {
        console.log(`[Feishu] 收到消息: ${senderName}: ${text}`);
      }

      if (options.onMessage) {
        await options.onMessage(data);
      }
    } catch (error) {
      console.error('[Feishu] 处理消息失败:', error);
    }
  });

  // Member added handler
  if (options.onMemberAdd) {
    connection.on(FEISHU_EVENTS.CHAT_MEMBER_ADD_V1, options.onMemberAdd);
  }

  // Member removed handler
  if (options.onMemberRemove) {
    connection.on(FEISHU_EVENTS.CHAT_MEMBER_DELETE_V1, options.onMemberRemove);
  }
}

/**
 * Parse message content string to object
 *
 * @param contentString - JSON string from message.content
 * @returns Parsed content object
 */
export function parseMessageContent(contentString: string): any {
  try {
    return JSON.parse(contentString);
  } catch (error) {
    console.error('[Feishu] Failed to parse message content:', error);
    return { text: contentString };
  }
}

/**
 * Create a simple auto-reply handler
 *
 * @param replyFn - Function that generates reply text
 * @returns Event handler function
 */
export function createAutoReplyHandler(
  replyFn: (message: P2MessageReceiveV1) => string | Promise<string>
): (data: P2MessageReceiveV1) => Promise<void> {
  return async (data: P2MessageReceiveV1) => {
    const reply = await Promise.resolve(replyFn(data));
    // Note: connection parameter would need to be passed through
    console.log('[Feishu] 自动回复:', reply);
  };
}

/**
 * Create an echo bot handler (repeats back what user said)
 *
 * @returns Event handler function
 */
export function createEchoHandler(
  connection: FeishuLongConnection
): (data: P2MessageReceiveV1) => Promise<void> {
  return async (data: P2MessageReceiveV1) => {
    const content = parseMessageContent(data.message.content);
    const text = content?.text || data.message.content;

    await connection.sendTextMessage(
      data.message.chat_id,
      `你说: ${text}`
    );
  };
}

/**
 * Create a welcome message handler for new members
 *
 * @param welcomeMessage - Welcome message text
 * @returns Event handler function
 */
export function createWelcomeHandler(
  connection: FeishuLongConnection,
  welcomeMessage: string = '欢迎加入群聊！'
): (data: ChatMemberAddV1) => Promise<void> {
  return async (data: ChatMemberAddV1) => {
    for (const user of data.users) {
      if (user.member_type === 'user') {
        await connection.sendTextMessage(
          data.chat_id,
          `@_user welcomeMessage`
        );
      }
    }
  };
}

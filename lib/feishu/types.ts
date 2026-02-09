/**
 * Feishu (Lark) Event Types
 *
 * Type definitions for Feishu/Lark events
 */

/**
 * Message receive event data (v1.0)
 */
export interface P2MessageReceiveV1 {
  /**
   * Event type identifier
   */
  event_type: string;

  /**
   * Message sender information
   */
  sender: {
    sender_id: {
      user_id: string;
    };
    sender_type: 'user' | 'app' | 'bot';
    tenant_key: string;
  };

  /**
   * Message content
   */
  message: {
    message_id: string;
    chat_id: string;
    chat_type: string;
    content: string; // JSON string, need to parse
    message_type: string;
    create_time: string;
    updated?: string;
    parent_id?: string;
    root_id?: string;
    position?: number;
  };
}

/**
 * Chat member add event data
 */
export interface ChatMemberAddV1 {
  event_type: string;
  operator: {
    operator_id: {
      user_id: string;
    };
    operator_type: string;
  };
  chat_id: string;
  users: Array<{
    user_id: string;
    member_type: string;
  }>;
  invite_code?: string;
}

/**
 * Chat member delete event data
 */
export interface ChatMemberDeleteV1 {
  event_type: string;
  operator: {
    operator_id: {
      user_id: string;
    };
    operator_type: string;
  };
  chat_id: string;
  users: Array<{
    user_id: string;
    member_type: string;
  }>;
}

/**
 * Bot added to chat event
 */
export interface ChatBotAddV1 {
  event_type: string;
  operator: {
    operator_id: {
      user_id: string;
    };
  };
  chat_id: string;
  bot: {
    open_id: string;
    app_id: string;
    name: string;
    avatar?: string;
  };
}

/**
 * Message content structure (when message_type is 'text')
 */
export interface MessageContent {
  text: string;
  /**
   * Additional fields for rich content
   */
  [key: string]: any;
}

/**
 * Feishu configuration
 */
export interface FeishuConfig {
  appId: string;
  appSecret: string;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Event handler callback type
 */
export type EventHandler<T = any> = (data: T) => Promise<void> | void;

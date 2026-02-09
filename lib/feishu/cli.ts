#!/usr/bin/env node
/**
 * Feishu (Lark) Long Connection CLI
 *
 * Command-line interface for starting Feishu WebSocket long connection
 *
 * Usage:
 *   node lib/feishu/cli.ts
 *   FEISHU_APP_ID=xxx FEISHU_APP_SECRET=xxx node lib/feishu/cli.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { createFeishuConnectionFromEnv, createFeishuConnection } from './client';
import { setupCommonHandlers, createEchoHandler, FEISHU_EVENTS } from './handlers';
import type { FeishuConfig } from './types';

/**
 * Default configuration (can be overridden by environment variables)
 */
const DEFAULT_CONFIG: FeishuConfig = {
  appId: process.env.FEISHU_APP_ID || '',
  appSecret: process.env.FEISHU_APP_SECRET || '',
  logLevel: (process.env.FEISHU_LOG_LEVEL as any) || 'info',
};

/**
 * Main function to start the Feishu long connection service
 */
async function main() {
  console.log('=================================');
  console.log('  Feishu Long Connection Service');
  console.log('=================================\n');

  // Check configuration
  const config = loadConfig();
  validateConfig(config);

  console.log('📋 配置信息:');
  console.log(`   App ID: ${maskSensitive(config.appId)}`);
  console.log(`   App Secret: ${maskSensitive(config.appSecret)}`);
  console.log(`   Log Level: ${config.logLevel}\n`);

  // Create connection
  const connection = createFeishuConnection(config);

  // Setup handlers based on environment mode
  const mode = process.env.FEISHU_MODE || 'echo';

  console.log(`🤖 启动模式: ${mode}\n`);

  switch (mode) {
    case 'echo':
      setupEchoMode(connection);
      break;

    case 'log':
      setupLogOnlyMode(connection);
      break;

    case 'auto':
      setupAutoReplyMode(connection);
      break;

    default:
      console.log(`⚠️  未知模式: ${mode}, 使用回声模式`);
      setupEchoMode(connection);
  }

  // Handle graceful shutdown
  setupShutdownHandlers(connection);

  // Start connection (blocks until stopped)
  console.log('🚀 启动长连接...\n');

  try {
    await connection.start();
  } catch (error) {
    console.error('❌ 启动失败:', error);
    process.exit(1);
  }
}

/**
 * Load configuration from environment or use defaults
 */
function loadConfig(): FeishuConfig {
  return DEFAULT_CONFIG;
}

/**
 * Validate required configuration
 */
function validateConfig(config: FeishuConfig): void {
  const errors: string[] = [];

  if (!config.appId) {
    errors.push('缺少 FEISHU_APP_ID 环境变量');
  }

  if (!config.appSecret) {
    errors.push('缺少 FEISHU_APP_SECRET 环境变量');
  }

  if (errors.length > 0) {
    console.error('❌ 配置错误:');
    errors.forEach((err) => console.error(`   - ${err}`));
    console.error('\n请设置以下环境变量:');
    console.error('   export FEISHU_APP_ID=your_app_id');
    console.error('   export FEISHU_APP_SECRET=your_app_secret');
    console.error('\n或运行:');
    console.error('   FEISHU_APP_ID=xxx FEISHU_APP_SECRET=xxx node lib/feishu/cli.ts\n');
    process.exit(1);
  }
}

/**
 * Setup echo mode (repeats user messages)
 */
function setupEchoMode(connection: InstanceType<typeof import('./client').FeishuLongConnection>): void {
  console.log('📢 回声模式 - 我会重复你说的话\n');

  const { createEchoHandler } = require('./handlers');
  connection.on(FEISHU_EVENTS.MESSAGE_RECEIVE_V1, createEchoHandler(connection));
}

/**
 * Setup log-only mode (just logs events)
 */
function setupLogOnlyMode(connection: InstanceType<typeof import('./client').FeishuLongConnection>): void {
  console.log('📝 日志模式 - 只记录事件，不回复\n');

  connection.on(FEISHU_EVENTS.MESSAGE_RECEIVE_V1, async (data: any) => {
    const content = JSON.parse(data.message.content);
    console.log(`[消息] ${data.sender.sender_id.user_id}: ${content.text || '(非文本消息)'}`);
  });

  connection.on(FEISHU_EVENTS.CHAT_MEMBER_ADD_V1, async (data: any) => {
    console.log(`[成员加群] ${data.users.length} 位成员加入群聊 ${data.chat_id}`);
  });

  connection.on(FEISHU_EVENTS.CHAT_MEMBER_DELETE_V1, async (data: any) => {
    console.log(`[成员离群] ${data.users.length} 位成员离开群聊 ${data.chat_id}`);
  });
}

/**
 * Setup auto-reply mode
 */
function setupAutoReplyMode(connection: InstanceType<typeof import('./client').FeishuLongConnection>): void {
  console.log('💬 自动回复模式 - 自动回复消息\n');

  connection.on(FEISHU_EVENTS.MESSAGE_RECEIVE_V1, async (data: any) => {
    const content = JSON.parse(data.message.content);
    const text = content?.text || '';

    const responses = [
      `收到你的消息: ${text}`,
      `你说: "${text}"，我已收到！`,
      `👍 确认收到: ${text}`,
    ];

    const reply = responses[Math.floor(Math.random() * responses.length)];
    await connection.sendTextMessage(data.message.chat_id, reply);
  });
}

/**
 * Setup graceful shutdown handlers
 */
function setupShutdownHandlers(connection: InstanceType<typeof import('./client').FeishuLongConnection>): void {
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received, shutting down gracefully...`);
    connection.stop();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

/**
 * Mask sensitive information for logging
 */
function maskSensitive(value: string): string {
  if (!value) return '(not set)';
  if (value.length <= 8) return '*'.repeat(value.length);
  return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
}

// Run main function
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

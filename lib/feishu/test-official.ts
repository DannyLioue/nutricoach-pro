#!/usr/bin/env node
/**
 * 测试官方 SDK 示例
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import * as Lark from '@larksuiteoapi/node-sdk';

const baseConfig = {
  appId: process.env.FEISHU_APP_ID!,
  appSecret: process.env.FEISHU_APP_SECRET!
};

const client = new Lark.Client(baseConfig);

const wsClient = new Lark.WSClient({
  ...baseConfig,
  loggerLevel: Lark.LoggerLevel.info
});

console.log('=================================');
console.log('  官方 SDK 测试');
console.log('=================================');
console.log(`App ID: ${baseConfig.appId}`);
console.log(`App Secret: ${baseConfig.appSecret.substring(0, 8)}...`);
console.log('');

wsClient.start({
  eventDispatcher: new Lark.EventDispatcher({}).register({
    'im.message.receive_v1': async (data: any) => {
      const { message } = data;
      console.log('收到消息:', JSON.stringify(message, null, 2));

      // Echo 回复
      const content = JSON.parse(message.content);
      await client.im.v1.message.create({
        params: {
          receive_id_type: 'chat_id'
        },
        data: {
          receive_id: message.chat_id,
          content: JSON.stringify({ text: `你说: ${content.text}` }),
          msg_type: 'text'
        }
      });
    }
  })
});

// 处理退出
process.on('SIGTERM', () => {
  console.log('\n收到 SIGTERM，退出...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n收到 SIGINT，退出...');
  process.exit(0);
});

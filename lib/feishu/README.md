# 飞书 (Feishu/Lark) 长连接服务

完整的飞书开放平台 WebSocket 长连接事件订阅服务 SDK。

## 功能特性

- 🔄 **WebSocket 长连接** - 稳定的全双工通信通道
- 🎯 **事件订阅** - 支持所有飞书事件类型
- 🔐 **内置加密** - 无需处理验签解密
- 🚀 **快速接入** - 本地开发无需公网 IP
- 📝 **TypeScript** - 完整类型支持
- 🛠️ **开箱即用** - 预设常用事件处理器

## 快速开始

### 1. 安装依赖

SDK 已安装: `@larksuiteoapi/node-sdk`

### 2. 配置环境变量

```bash
export FEISHU_APP_ID="cli_xxxxxxxxxxxxx"
export FEISHU_APP_SECRET="your_app_secret"
export FEISHU_LOG_LEVEL="info"  # 可选: debug | info | warn | error
export FEISHU_MODE="echo"  # 可选: echo | log | auto
```

### 3. 启动服务

```bash
# 使用环境变量启动
node lib/feishu/cli.ts

# 或直接在命令行设置
FEISHU_APP_ID=xxx FEISHU_APP_SECRET=xxx node lib/feishu/cli.ts
```

### 4. 飞书开放平台配置

1. 登录 [飞书开放平台](https://open.feishu.cn/)
2. 进入企业自建应用
3. **事件与回调** > **事件配置**
4. 添加事件: `im.message.receive_v1`
5. **订阅方式** 选择 **"使用长连接接收事件"**
6. 确保本地服务已启动后保存

## 运行模式

### Echo 模式 (默认)
重复用户的消息:
```
FEISHU_MODE=echo node lib/feishu/cli.ts
```

### Log 模式
只记录事件，不回复:
```
FEISHU_MODE=log node lib/feishu/cli.ts
```

### Auto 模式
随机自动回复:
```
FEISHU_MODE=auto node lib/feishu/cli.ts
```

## 编程使用

### 基础用法

```typescript
import { createFeishuConnectionFromEnv, FEISHU_EVENTS } from '@/lib/feishu';

async function start() {
  const connection = createFeishuConnectionFromEnv();

  // 监听消息事件
  connection.on(FEISHU_EVENTS.MESSAGE_RECEIVE_V1, async (data) => {
    const { sender, message } = data;
    const content = JSON.parse(message.content);

    console.log(`收到消息: ${sender.sender_id.user_id}: ${content.text}`);

    // 回复消息
    await connection.sendTextMessage(message.chat_id, '收到！');
  });

  // 启动长连接
  await connection.start();
}

start();
```

### 自定义配置

```typescript
import { createFeishuConnection } from '@/lib/feishu';

const connection = createFeishuConnection({
  appId: 'cli_xxxxxxxxxxxxx',
  appSecret: 'your_app_secret',
  logLevel: 'debug',
});
```

### 监听多种事件

```typescript
import { FEISHU_EVENTS } from '@/lib/feishu';

// 消息接收
connection.on(FEISHU_EVENTS.MESSAGE_RECEIVE_V1, async (data) => {
  console.log('收到消息', data);
});

// 成员加群
connection.on(FEISHU_EVENTS.CHAT_MEMBER_ADD_V1, async (data) => {
  console.log('成员加群', data);
  const userIds = data.users.map(u => u.user_id);
  await connection.sendTextMessage(data.chat_id, `欢迎 ${userIds.join(', ')}!`);
});

// 成员离群
connection.on(FEISHU_EVENTS.CHAT_MEMBER_DELETE_V1, async (data) => {
  console.log('成员离群', data);
});
```

### 使用预设处理器

```typescript
import { setupCommonHandlers, createEchoHandler, createWelcomeHandler } from '@/lib/feishu';

setupCommonHandlers(connection, {
  onMessage: async (data) => {
    const content = JSON.parse(data.message.content);
    await connection.sendTextMessage(
      data.message.chat_id,
      `你说: ${content.text}`
    );
  },
  onMemberAdd: createWelcomeHandler(connection, '欢迎加入！'),
  logEvents: true,
});
```

### 发送卡片消息

```typescript
await connection.sendCardMessage(chatId, {
  header: {
    title: '标题',
    template: 'blue',
  },
  elements: [
    {
      tag: 'div',
      text: {
        tag: 'lark_md',
        content: '**卡片内容**',
      },
    },
  ],
});
```

## 可用事件类型

| 事件类型 | 常量 | 说明 |
|---------|------|------|
| 接收消息 | `FEISHU_EVENTS.MESSAGE_RECEIVE_V1` | 收到文本/图片/卡片消息 |
| 成员加群 | `FEISHU_EVENTS.CHAT_MEMBER_ADD_V1` | 新成员加入群聊 |
| 成员离群 | `FEISHU_EVENTS.CHAT_MEMBER_DELETE_V1` | 成员离开群聊 |
| 机器人被添加 | `FEISHU_EVENTS.CHAT_BOT_ADD_V1` | 机器人被添加到群聊 |
| 消息已读 | `FEISHU_EVENTS.MESSAGE_READ_V1` | 消息已读回执 |

## API 参考

### FeishuLongConnection

| 方法 | 说明 |
|------|------|
| `on(eventType, handler)` | 注册事件处理器 |
| `start()` | 启动 WebSocket 长连接 |
| `stop()` | 停止连接 |
| `apiClient` | 获取 API 客户端实例 |
| `sendTextMessage(chatId, text)` | 发送文本消息 |
| `sendCardMessage(chatId, card)` | 发送卡片消息 |

## 重要限制

1. **仅支持企业自建应用** - 不支持商店应用
2. **3秒超时** - 事件处理必须在 3 秒内完成
3. **最多 50 个连接** - 每个应用最多 50 个并发连接
4. **集群推送** - 多客户端时随机只有一个收到消息
5. **需要公网访问** - 服务器需要能访问公网

## 获取凭证

1. 登录 [飞书开放平台](https://open.feishu.cn/)
2. 创建企业自建应用
3. **凭证与基础信息** > **应用凭证**
4. 复制 `App ID` 和 `App Secret`

## 故障排查

### 连接失败 - 错误码 1000040346 (system busy)

**原因**: 飞书开放平台未配置长连接订阅方式

**解决步骤**:

1. 登录 [飞书开放平台](https://open.feishu.cn/)
2. 进入 **企业自建应用** > 选择你的应用
3. 找到 **事件与回调** > **事件配置**
4. 添加需要订阅的事件，例如：
   - `im.message.receive_v1` (接收消息)
5. **重要**: 在 **订阅方式** 中，选择 **"使用长连接接收事件"**
6. 保存配置
7. 重启本地服务

**截图位置**:
```
开发者后台
  ↓
事件与回调
  ↓
事件配置
  ↓
订阅方式 → 选择 "使用长连接接收事件"
```

### 连接失败 - PingInterval 错误

**原因**: SDK WebSocket 配置问题

**解决**: 已在代码中配置 `wsOptions`，如仍有问题可尝试：
- 升级 SDK: `npm update @larksuiteoapi/node-sdk`
- 检查 Node.js 版本 (建议 >= 18)

### 收不到事件
- 确认在开放后台已订阅事件
- 确认订阅方式选择的是"使用长连接接收事件"
- 检查事件类型是否正确
- 确认机器人已被添加到群聊

### 处理超时
- 确保事件处理逻辑在 3 秒内完成
- 使用异步操作避免阻塞
- 添加 try-catch 捕获错误

## 许可证

MIT License

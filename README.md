# NutriCoach Pro - 营养师智能分析平台

> 专为营养师打造的 AI 驱动健康管理平台

## 功能特性

- **客户管理** - 完整的客户档案管理
- **体检报告分析** - AI 自动识别和分析体检指标
- **智能建议生成** - 个性化饮食、运动和生活方式建议
- **报告导出** - 生成专业的 PDF 健康报告

## 技术栈

- **前端**: Next.js 15 + TypeScript + Tailwind CSS
- **后端**: Next.js API Routes + Prisma ORM
- **数据库**: PostgreSQL
- **AI**: Google Gemini 3.0 Pro
- **认证**: NextAuth.js

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env.local` 并填写配置：

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
GEMINI_API_KEY="..."
```

### 3. 初始化数据库

```bash
npx prisma db push
```

### 4. 运行开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 项目结构

```
nutricoach-pro/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 认证页面
│   ├── (dashboard)/       # 主应用页面
│   └── api/               # API Routes
├── components/            # React 组件
├── lib/                   # 工具库
│   ├── ai/               # AI 服务
│   └── db/               # 数据库
├── types/                # TypeScript 类型
└── prisma/               # 数据库模型
```

## 开发计划

详见 [claude.md](./claude.md)

## License

MIT

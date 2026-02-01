# NutriCoach Pro - 营养师智能分析平台

> 专为注册营养师 (RD) 打造的 AI 驱动健康管理平台，基于医学营养治疗 (MNT) 标准提供专业营养干预服务

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)

---

## 功能特性

### 客户管理
- 完整的客户档案管理（基本信息、健康问题、过敏史、疾病史）
- 客户列表与搜索功能
- 咨询记录管理
- 饮食记录追踪

### 体检报告分析
- 支持 PDF、图片 (JPG/PNG/HEIC) 格式
- AI 自动识别体检指标（血常规、血生化、激素水平等）
- 基于循证医学的健康风险评估
- 人体成分分析（BMI、BMR、TDEE）
- 异常指标解读与干预建议

### 营养干预方案
- **个性化饮食建议**
  - 基于体检结果定制的宏量营养素目标
  - 红绿灯食物分类系统
  - 一日膳食计划
  - 营养素补充建议

- **运动处方**
  - 有氧运动方案（含心率区间计算）
  - 力量训练计划
  - 柔韧性训练建议
  - 配套运动视频推荐

- **生活方式干预**
  - 睡眠管理
  - 饮水建议
  - 压力管理策略

### 饮食照片分析
- 拍照记录饮食，AI 自动识别食物
- 合规性评估（对比营养干预方案）
- 营养成分分析
- 改进建议生成
- **支持文字描述** - 无需拍照，可直接文字描述

### 周饮食汇总
- 每周饮食合规性总结
- 详细的营养摄入分析
- 食物摄入趋势追踪
- 问题餐次识别
- SMART 目标设定

### 报告导出
- 生成专业 PDF 报告
- 支持中文内容
- 移动端优化格式
- 一键分享给客户

---

## 技术栈

### 前端
| 技术 | 版本 | 用途 |
|------|------|------|
| **Next.js** | 16.1.1 | 全栈框架 (App Router + Turbopack) |
| **TypeScript** | 5.x | 类型安全 |
| **Tailwind CSS** | 3.x | 样式框架 |
| **shadcn/ui** | Latest | UI 组件库 |
| **Recharts** | 2.x | 数据可视化 |
| **React Hook Form** | 7.x | 表单管理 |

### 后端
| 技术 | 版本 | 用途 |
|------|------|------|
| **Next.js API Routes** | 16.1.1 | 服务端 API |
| **Prisma ORM** | 6.19.1 | 数据库 ORM |
| **PostgreSQL/SQLite** | - | 数据库 |

### AI & OCR
| 技术 | 版本 | 用途 |
|------|------|------|
| **Google Gemini** | 2.5 Pro | 主 AI 模型（多模态） |
| **Google Gemini** | 2.5 Flash | 快速视觉分析 |
| **Vercel AI SDK** | 4.x | AI 集成框架 |

### 认证
| 技术 | 用途 |
|------|------|
| **NextAuth.js** | 身份认证 |

---

## 项目结构

```
nutricoach-pro/
├── app/                              # Next.js App Router
│   ├── (auth)/                      # 认证页面
│   ├── (dashboard)/                 # 主应用页面
│   │   ├── clients/                 # 客户管理
│   │   │   ├── [id]/                # 客户详情
│   │   │   │   ├── consultations/   # 咨询记录
│   │   │   │   ├── meal-groups/     # 食谱组
│   │   │   │   ├── diet-photos/     # 饮食照片
│   │   │   │   ├── weekly-diet-summary/ # 周饮食汇总
│   │   │   │   └── recommendations/ # 营养建议
│   │   │   └── page.tsx            # 客户列表
│   │   ├── analysis/                # 体检报告分析
│   │   └── dashboard/               # 仪表盘
│   └── api/                         # API Routes
│       ├── clients/                 # 客户相关 API
│       ├── recommendations/         # 建议生成 API
│       └── reports/                 # 报告上传 API
├── components/                      # React 组件
│   ├── ui/                          # shadcn/ui 基础组件
│   ├── analysis/                    # 分析相关组件
│   ├── consultation/                # 咨询记录组件
│   ├── diet-records/                # 饮食记录组件
│   ├── recommendations/             # 建议展示组件
│   ├── weekly-diet-summary/         # 周汇总组件
│   ├── pdf/                         # PDF 生成组件
│   └── layout/                      # 布局组件
├── lib/                             # 工具库
│   ├── ai/                          # AI 服务
│   │   ├── gemini.ts               # Gemini API 集成
│   │   └── prompts.ts              # AI 提示词模板
│   ├── pdf/                         # PDF 生成
│   ├── auth/                        # 认证工具
│   ├── storage/                     # 文件存储
│   └── utils/                       # 工具函数
├── types/                           # TypeScript 类型
├── prisma/                          # 数据库模型
│   └── schema.prisma
└── docs/                            # 项目文档
```

---

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件：

```env
# 数据库
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Gemini AI
GEMINI_API_KEY="your-gemini-api-key"
```

### 3. 初始化数据库

```bash
npx prisma generate
npx prisma db push
```

### 4. 运行开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

---

## 开发计划

### 已完成 ✅

- [x] 用户认证系统
- [x] 客户管理功能
- [x] 体检报告上传与分析
- [x] AI 营养建议生成
- [x] 饮食照片分析（支持照片和文字描述）
- [x] 周饮食汇总
- [x] 咨询记录管理
- [x] PDF 报告导出
- [x] 移动端优化

### 进行中 🚧

- [ ] 数据可视化增强
- [ ] 更多运动视频集成
- [ ] 客户端查看功能

### 计划中 📋

- [ ] 移动端 App
- [ ] 营养师社区功能
- [ ] 在线支付集成
- [ ] 数据备份与同步

---

## 数据库模型

主要数据模型：

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  clients       Client[]
}

model Client {
  id               String   @id @default(cuid())
  userId           String
  name             String
  gender           Gender
  birthDate        DateTime
  height           Float
  weight           Float
  activityLevel    ActivityLevel
  allergies        String[]
  medicalHistory   String[]
  preferences      String?
  healthConcerns   String?
  userRequirements String?

  reports          Report[]
  recommendations  Recommendation[]
  consultations    Consultation[]
  dietPhotos       DietPhoto[]
  mealGroups       DietPhotoMealGroup[]
  weeklySummaries  WeeklyDietSummary[]
}

model Report {
  id              String   @id @default(cuid())
  clientId        String
  fileUrl         String
  fileName        String
  fileType        String
  extractedData   Json
  analysis        Json?
  uploadedAt      DateTime @default(now())
}

model Recommendation {
  id              String   @id @default(cuid())
  clientId        String
  type            RecType
  content         Json
  generatedAt     DateTime @default(now())
}

model DietPhoto {
  id              String   @id @default(cuid())
  clientId        String
  mealGroupId     String?
  imageUrl        String
  analysis        String?
  analyzedAt      DateTime?
  uploadedAt      DateTime @default(now())
}

model DietPhotoMealGroup {
  id                String   @id @default(cuid())
  clientId          String
  name              String
  date              String
  mealType          String?
  textDescription   String?
  combinedAnalysis  String?
  totalScore        Int?
  overallRating     String?
  photos            DietPhoto[]
}

model Consultation {
  id              String   @id @default(cuid())
  clientId        String
  date            DateTime
  notes           String
  audioFileUrl    String?
  imageFiles      Json?
  analysis        Json?
}

model WeeklyDietSummary {
  id              String   @id @default(cuid())
  clientId        String
  weekStartDate   String
  weekEndDate     String
  summary         String
  generatedAt     DateTime @default(now())
}
```

---

## AI 提示词工程

项目使用专业的注册营养师 (RD) 标准提示词，遵循：

- **循证医学 (Evidence-Based Medicine)**: 所有建议基于临床研究证据
- **医学营养治疗 (MNT)**: 提供可量化、可执行的干预方案
- **数据完整性**: 缺失数据必须标记
- **计算透明化**: 所有数值计算展示公式

详见 `lib/ai/prompts.ts`

---

## 常见问题

### Q: 如何切换数据库？

修改 `.env.local` 中的 `DATABASE_URL`：

```bash
# SQLite (开发环境)
DATABASE_URL="file:./dev.db"

# PostgreSQL (生产环境)
DATABASE_URL="postgresql://user:password@host:port/database"
```

### Q: 如何配置 Gemini API？

1. 访问 [Google AI Studio](https://aistudio.google.com/)
2. 创建 API Key
3. 添加到 `.env.local` 的 `GEMINI_API_KEY`

### Q: PDF 导出中文显示问题？

项目使用思源黑体 (Noto Sans SC) 确保中文正确显示。字体文件位于 `public/fonts/`。

---

## 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## License

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 联系方式

- 项目主页: [GitHub Repository]
- 问题反馈: [Issues]

---

**NutriCoach Pro** - 让专业营养服务更高效 🥗💪

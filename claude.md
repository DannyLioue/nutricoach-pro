# 营养师智能分析平台 (NutriCoach Pro)

## 项目概述

为专业营养师打造的智能分析平台，通过上传客户体检报告和资料，利用 AI 自动生成全面的饮食和运动建议。

**最新功能**：
- **运动方案管理**：版本化运动处方，支持 AI 评估与调整
- **饮食照片合规性评估**：基于营养干预方案的饮食照片分析
- **咨询记录管理**：多媒体咨询内容记录与 AI 分析
- **周饮食汇总**：自定义日期范围的饮食汇总分析
- **多 AI 模型支持**：支持 Google Gemini、OpenAI、Anthropic 等多个 AI 提供商
- **任务断点续传**：长时间 AI 任务支持进度追踪和断点续传

---

## 核心功能

### 1. 客户管理
- 添加/编辑客户档案（年龄、性别、身高、体重、活动水平、过敏史、疾病史）
- 客户列表与搜索
- 历史记录追踪
- 支持用户需求（减重/增肌/改善睡眠等）和运动详情（器材/环境/经验）

### 2. 体检报告分析
- 支持上传格式：PDF、图片（JPG/PNG）、Excel
- OCR 识别体检报告关键指标：
  - 血常规（血红蛋白、白细胞等）
  - 血生化（血糖、血脂、肝肾功能）
  - 激素水平（甲状腺、胰岛素等）
  - 维生素/矿物质水平
- AI 异常值检测与健康风险评估

### 3. 智能建议生成
- **饮食建议**：基于体检结果、过敏史、偏好自动生成
  - 营养素补充建议
  - 食物推荐与禁忌
  - 一周/一月膳食计划
- **运动建议**：根据体能状况、目标定制
  - 运动类型（有氧/力量/柔韧）
  - 强度与频率
  - 注意事项
- **生活方式建议**：睡眠、饮水、压力管理

### 4. 运动方案管理（新功能）
- **模板库**：预设减重、增肌、康复、健康改善等运动方案模板
- **AI 生成**：基于客户信息和体检报告生成个性化运动处方
- **版本管理**：支持方案版本化，保留历史版本
- **执行记录**：关联运动记录，自动计算达成率
- **AI 评估**：基于执行数据评估方案效果，生成调整建议
- **方案对比**：直观对比不同版本的方案差异

### 5. 饮食照片与合规性评估
- **照片上传**：支持上传饮食照片（JPG/PNG）
- **AI 分析**：识别食物种类、分量、营养结构
- **合规性评估**：基于营养干预方案评估饮食合规性
- **红绿灯分类**：绿灯（推荐）、黄灯（控制）、红灯（避免）
- **改进建议**：提供具体的增减改建议

### 6. 咨询记录管理
- **多媒体支持**：图片、文本文件上传
- **AI 分析**：自动分析咨询内容，提取关键信息
- **结构化输出**：生成结构化的咨询报告

### 7. 报告导出
- 生成专业 PDF 报告
- 支持自定义模板
- 移动端友好的横版 PDF
- 一键分享给客户

---

## 当前技术栈

### 前端

| 技术 | 用途 | 理由 |
|------|------|------|
| **Next.js 16.1.1** | 全栈框架 | App Router + API Routes |
| **TypeScript** | 类型安全 | 大型项目必备 |
| **Tailwind CSS** | 样式 | 快速开发、响应式 |
| **shadcn/ui** | 组件库 | 美观、可定制、基于 Radix UI |
| **React Hook Form** | 表单管理 | 性能好、验证简单 |
| **Zod** | Schema 验证 | 与 React Hook Form 无缝集成 |
| **Recharts** | 数据可视化 | 体检报告图表展示 |
| **React Dropzone** | 文件上传 | 支持拖拽上传 |
| **Tesseract.js** | OCR 前端处理 | 客户端初步识别 |

### 后端

| 技术 | 用途 | 理由 |
|------|------|------|
| **Next.js API Routes** | 服务端 API | 与前端同仓库，开发效率高 |
| **Prisma** | ORM | 类型安全、迁移管理 |
| **PostgreSQL** | 主数据库 | 关系型、支持复杂查询 |
| **Drizzle ORM**（备选） | 轻量级 ORM | 性能更好、更简单 |

### AI & OCR

| 技术 | 用途 | 理由 |
|------|------|------|
| **Google Gemini 2.5 Pro** | 主 AI 模型 | 复杂分析与结构化输出 |
| **GPT-4o**（备选） | 复杂分析 | 理解能力更强 |
| **Tesseract.js** | 本地 OCR | 免费离线处理 |
| **Azure Form Recognizer**（高级） | 专业文档 OCR | 表格提取精准 |

### 文件存储

| 技术 | 用途 |
|------|------|
| **Uploadthing / Vercel Blob** | 文件上传托管 |
| **Cloudinary R2**（备选） | 低成本存储 |

### 认证

| 技术 | 用途 |
|------|------|
| **NextAuth.js** | 身份认证 |
| **Clerk**（快速方案） | 开箱即用 |

### 部署

| 技术 | 用途 |
|------|------|
| **Vercel** | 前端托管 |
| **Supabase** | 数据库托管（含 PostgreSQL） |

---

## 项目结构

```
nutricoach-pro/
├── app/                       # Next.js App Router
│   ├── (auth)/               # 认证相关页面
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/          # 主应用页面
│   │   ├── clients/          # 客户管理
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx              # 客户详情
│   │   │   │   ├── edit/
│   │   │   │   ├── exercise-records/     # 运动记录
│   │   │   │   ├── consultations/        # 咨询记录
│   │   │   │   └── diet-photos/          # 饮食照片
│   │   ├── analysis/         # 体检报告分析
│   │   ├── recommendations/  # 建议生成
│   │   └── settings/         # 设置
│   └── api/                  # API Routes
│       ├── clients/
│       │   └── [id]/
│       │       ├── exercise-plans/        # 运动方案 API
│       │       │   ├── route.ts           # GET/POST
│       │       │   ├── [planId]/          # 方案详情
│       │       │   │   ├── route.ts       # GET/PUT/DELETE
│       │       │   │   ├── evaluate/      # AI 评估
│       │       │   │   ├── revise/        # AI 调整
│       │       │   │   └── compare/       # 版本对比
│       │       │   └── current/           # 当前方案
│       │       ├── exercise-records/      # 运动记录 API
│       │       ├── consultations/         # 咨询记录 API
│       │       ├── diet-photos/           # 饮食照片 API
│       │       └── weekly-diet-summary/   # 饮食汇总 API
│       ├── recommendations/  # 建议生成 API
│       ├── reports/          # 报告管理 API
│       └── dashboard/
│           └── todos/        # 待办事项 API
│
├── components/
│   ├── ui/                   # shadcn/ui 基础组件
│   ├── exercise-plans/       # 运动方案组件（新）
│   │   ├── ExercisePlansList.tsx
│   │   ├── ExercisePlanDetail.tsx
│   │   ├── ExercisePlanCreateForm.tsx
│   │   ├── ExercisePlanEvaluate.tsx
│   │   ├── ExercisePlanRevise.tsx
│   │   └── ExercisePlanCompare.tsx
│   ├── exercise-records/     # 运动记录组件
│   │   ├── ExerciseRecordForm.tsx
│   │   ├── ExerciseRecordCard.tsx
│   │   └── ExerciseTimelineView.tsx
│   ├── recommendations/      # 建议展示组件
│   ├── consultation/         # 咨询记录组件
│   ├── diet-records/         # 饮食记录组件
│   └── layout/               # 布局组件
│
├── lib/
│   ├── ai/                   # AI 服务集成
│   │   ├── prompts.ts        # 提示词模板（大幅扩展）
│   │   └── model-config.ts   # AI 模型配置
│   ├── exercise-plans/       # 运动方案库（新）
│   │   └── templates.ts      # 预设运动模板
│   ├── db/
│   │   └── prisma.ts
│   ├── logger.ts             # 日志工具
│   ├── storage/              # 文件存储
│   └── utils.ts
│
├── prisma/
│   ├── schema.prisma         # 数据库模型（大幅扩展）
│   ├── seed-ai-models.ts     # AI 模型种子数据
│   └── seed-alibaba-qwen.ts  # 阿里通义千问种子数据
│
├── tests/                    # 测试文件
│   ├── components/
│   │   ├── exercise-plans/   # 运动方案组件测试
│   │   └── ...
│   ├── api/
│   └── e2e/
│
└── types/                    # TypeScript 类型定义
    ├── ai-config.ts          # AI 配置类型
    ├── health-analysis.ts    # 健康分析类型
    └── next-auth.d.ts        # NextAuth 类型
```

---

## 数据库模型

### 核心模型

```prisma
// User - 用户模型
model User {
  id               String    @id @default(cuid())
  name             String?
  email            String    @unique
  emailVerified    DateTime?
  image            String?
  password         String?
  role             Role      @default(NUTRITIONIST)
  clients          Client[]

  // AI Configuration
  aiConfigs        AIModelConfig[]
  aiKeys           UserAIKey[]
  defaultProvider  String?
  useEnvFallback   Boolean   @default(true)

  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
}

// Client - 客户模型
model Client {
  id               String   @id @default(cuid())
  userId           String
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name             String
  gender           Gender
  birthDate        DateTime
  height           Float    // cm
  weight           Float    // kg
  activityLevel    ActivityLevel
  allergies        String   @default("[]") // JSON array
  medicalHistory   String   @default("[]") // JSON array
  healthConcerns   String   @default("[]") // JSON array
  preferences      String?
  userRequirements String?  // 用户需求（减重、增肌等）
  exerciseDetails  String?  // 运动详情（器材、环境、经验）
  phone            String?
  email            String?

  // 饮食分析相关
  dietAnalysis     String?  // JSON格式汇总
  dietPreferences  String?  // JSON格式
  eatingHabits     String?  // JSON格式

  reports          Report[]
  recommendations  Recommendation[]
  dietPhotos       DietPhoto[]
  mealGroups       DietPhotoMealGroup[]
  consultations    Consultation[]
  planEvaluations  PlanEvaluation[]
  weeklySummaries  WeeklyDietSummary[]
  taskProgress     TaskProgress[]
  exerciseRecords  ExerciseRecord[]
  exercisePlans    ExercisePlan[]

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

// Report - 体检报告模型
model Report {
  id               String   @id @default(cuid())
  clientId         String
  client           Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  fileUrl          String
  fileName         String
  fileType         String
  extractedData    Json
  analysis         Json?
  uploadedAt       DateTime @default(now())
  recommendations  Recommendation[]
}

// Recommendation - 营养建议模型
model Recommendation {
  id          String   @id @default(cuid())
  clientId    String
  client      Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  reportId    String?
  report      Report?  @relation(fields: [reportId], references: [id], onDelete: SetNull)
  type        RecType
  content     Json
  generatedAt DateTime @default(now())
}
```

### 饮食相关模型

```prisma
// DietPhoto - 饮食照片模型
model DietPhoto {
  id               String   @id @default(cuid())
  clientId         String
  client           Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  mealGroupId      String?
  mealGroup        DietPhotoMealGroup? @relation(fields: [mealGroupId], references: [id], onDelete: Cascade)

  imageUrl         String   // Base64编码图片
  uploadedAt       DateTime @default(now())
  mealType         String?
  notes            String?

  analysis         String?  // JSON格式AI分析
  analyzedAt       DateTime?

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

// DietPhotoMealGroup - 饮食照片组
model DietPhotoMealGroup {
  id                String   @id @default(cuid())
  clientId          String
  client            Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  photos            DietPhoto[]

  name              String
  date              String   // YYYY-MM-DD
  mealType          String?

  combinedAnalysis  String?  // JSON格式综合分析
  totalScore        Int?
  overallRating     String?

  notes             String?
  textDescription   String?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

// Consultation - 咨询记录模型
model Consultation {
  id               String   @id @default(cuid())
  clientId         String
  client           Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)

  consultationDate DateTime @default(now())
  consultationType String
  sessionNotes     String?

  images           String?  // JSON格式图片数组
  textFiles        String?  // JSON格式文本文件信息

  analysis         String?  // ConsultationAnalysis JSON
  analyzedAt       DateTime?

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

// WeeklyDietSummary - 周饮食汇总
model WeeklyDietSummary {
  id               String   @id @default(cuid())
  clientId         String
  client           Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)

  weekStartDate    String?
  weekEndDate      String?
  weekNumber       Int?
  year             Int?

  startDate        String   @default("")
  endDate          String   @default("")

  summaryName      String?
  summaryType      String   @default("week")

  mealGroupIds     String
  summary          String

  recommendationId String?
  generatedAt      DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

### 运动相关模型

```prisma
// ExerciseRecord - 运动记录模型
model ExerciseRecord {
  id               String   @id @default(cuid())
  clientId         String
  client           Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)

  date             DateTime
  isRestDay        Boolean  @default(false)
  type             String?
  duration         Float?
  intensity        String?
  notes            String?

  exercisePlanId   String?
  exercisePlan     ExercisePlan? @relation("PlanRecords", fields: [exercisePlanId], references: [id], onDelete: SetNull)

  imageUrl         String?
  analysis         String?
  analyzedAt       DateTime?

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

// ExercisePlan - 运动方案模型（版本化）
model ExercisePlan {
  id                String   @id @default(cuid())
  clientId          String
  client            Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)

  version           Int      @default(1)
  parentPlanId      String?
  parentPlan        ExercisePlan? @relation("PlanVersions", fields: [parentPlanId], references: [id])

  planType          PlanType @default(INITIAL)

  triggerReason     String?
  triggerReportId   String?

  evaluationData    String?

  prescription      String

  targetStartDate   DateTime
  targetEndDate     DateTime
  actualStartDate   DateTime?

  totalPlannedDays  Int?
  totalCompletedDays Int?
  adherenceRate     Float?

  status            PlanStatus @default(ACTIVE)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  childPlans        ExercisePlan[] @relation("PlanVersions")
  records           ExerciseRecord[] @relation("PlanRecords")
}

enum PlanType {
  INITIAL      // 初始方案
  REVISION     // 调整方案
}

enum PlanStatus {
  ACTIVE       // 执行中
  COMPLETED    // 已完成
  PAUSED       // 暂停
  CANCELLED    // 取消
}
```

### AI 配置模型

```prisma
// AIProvider - AI 提供商
model AIProvider {
  id          String   @id @default(cuid())
  name        String   @unique // "google", "openai"
  displayName String
  enabled     Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  models      AIModel[]
  userKeys    UserAIKey[]
}

// AIModel - AI 模型
model AIModel {
  id              String      @id @default(cuid())
  providerId      String
  provider        AIProvider  @relation(fields: [providerId], references: [id], onDelete: Cascade)

  modelId         String      // "gemini-2.5-pro"
  displayName     String
  description     String?

  capabilities    String      // JSON: ["text", "vision"]
  maxTokens       Int?

  enabled         Boolean     @default(true)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  userConfigs     AIModelConfig[]
}

// UserAIKey - 用户 API Key
model UserAIKey {
  id           String     @id @default(cuid())
  userId       String
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  providerId   String
  provider     AIProvider @relation(fields: [providerId], references: [id], onDelete: Cascade)

  apiKey       String
  keyLast4     String
  isValid      Boolean    @default(true)
  lastValidated DateTime?

  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}

// AIModelConfig - 模型配置
model AIModelConfig {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  modelId     String
  model       AIModel  @relation(fields: [modelId], references: [id], onDelete: Cascade)

  taskType    String   // "health-analysis", "diet-photo"
  enabled     Boolean  @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 任务进度模型

```prisma
// TaskStatus - 任务状态
enum TaskStatus {
  PENDING       // 待执行
  RUNNING       // 执行中
  PAUSED        // 已暂停
  COMPLETED     // 已完成
  FAILED        // 失败
  CANCELLED     // 已取消
}

// TaskProgress - 任务进度
model TaskProgress {
  id               String   @id @default(cuid())

  taskType         String
  clientId         String
  client           Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)

  status           TaskStatus @default(PENDING)
  currentStep      String?
  progress         Int      @default(0)

  parameters       Json
  completedSteps   String   @default("[]")
  intermediateData String?
  resultData       String?
  error            String?

  startedAt        DateTime?
  completedAt      DateTime?
  pausedAt         DateTime?
  cancelledAt      DateTime?
  lastHeartbeatAt  DateTime?

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

---

## AI 提示词模板（注册营养师 RD 专业标准）

### 核心原则 (Core Principles)

**遵循以下标准：**
1. **循证医学 (Evidence-Based Medicine)**: 所有建议必须基于临床研究证据，拒绝模糊表述
2. **医学营养治疗 (MNT)**: 提供可量化、可执行的干预方案
3. **数据完整性**: 严禁幻觉生成，缺失数据必须标记为 `[Missing Data]`
4. **计算透明化**: 所有数值计算必须展示公式和中间步骤

---

### 1. 体检报告分析提示词

```typescript
const HEALTH_ANALYSIS_PROMPT = `
你是一位资深注册营养师 (Registered Dietitian, RD)，拥有 15 年以上专业营养治疗经验。
你必须严格遵循循证医学原则，基于医学营养治疗 (MNT) 标准进行分析。

## 【第一步：输入数据校验与清洗】

在开始分析前，必须对用户画像进行逻辑校验：

**客户信息：**
- 姓名：{name}
- 性别：{gender}
- 出生日期：{birthDate}
- 推断年龄：{age}岁
- 身高：{height}cm
- 体重：{weight}kg
- 活动水平：{activityLevel}
- 过敏史：{allergies || "无"}
- 疾病史：{medicalHistory || "无"}

**数据完整性检查：**
1. 如果年龄为 0 或负数，必须基于身高体重和血液指标推断成年人范围（18-65岁），或标记为 [Missing Data]
2. 绝对禁止输出 "Age: 0" 或不合理的年龄数值
3. 如果缺少关键数据，在响应中明确标注缺失字段

**体检报告原始数据：**
{reportData}

## 【第二步：核心计算逻辑】

请在思维链中完成以下定量计算，并在最终报告中呈现结果：

### 2.1 人体成分评估
- **BMI 计算**: BMI = 体重(kg) / 身高²(m)
- **BMI 分类**: 根据 WHO 亚洲标准（正常: 18.5-23.9）
- **理想体重**: = 身高²(m) × 22 (中位数)
- **体重调整**: 如果当前体重 > 理想体重，计算需要减少的重量

### 2.2 能量代谢计算 (Mifflin-St Jeor 公式)
**基础代谢率 (BMR):**
- 男性: BMR = 10 × 体重(kg) + 6.25 × 身高(cm) - 5 × 年龄 + 5
- 女性: BMR = 10 × 体重(kg) + 6.25 × 身高(cm) - 5 × 年龄 - 161

**总能量消耗 (TDEE):**
- 久坐 (SEDENTARY): TDEE = BMR × 1.2
- 轻度活动 (LIGHT): TDEE = BMR × 1.375
- 中度活动 (MODERATE): TDEE = BMR × 1.55
- 活跃 (ACTIVE): TDEE = BMR × 1.725
- 非常活跃 (VERY_ACTIVE): TDEE = BMR × 1.9

**热量缺口/盈余目标:**
- 如果超重: 目标摄入量 = TDEE - 500 kcal (制造热量缺口)
- 如果体重不足: 目标摄入量 = TDEE + 300 kcal (制造热量盈余)
- 如果体重正常: 目标摄入量 = TDEE (维持体重)

### 2.3 宏量营养素分配

根据体检异常指标调整供能比：

**标准分配（健康人群）：**
- 碳水化合物: 50-60% (优先选择低GI食物)
- 蛋白质: 15-20% (1.0-1.2g/kg体重)
- 脂肪: 25-30% (限制饱和脂肪 <10%)

**异常指标调整：**
- **高血脂 (TG > 1.7mmol/L 或 LDL-C > 3.4mmol/L)**:
  - 脂肪供能比降至 <25%
  - 饱和脂肪 <7%，反式脂肪 <1%
  - 增加Omega-3脂肪酸
- **高血糖 (FPG > 6.1mmol/L)**:
  - 碳水供能比降至 45-50%
  - 优先选择低GI食物 (GI <55)
  - 增加膳食纤维至 25-35g/天
- **高尿酸 (UA > 420μmol/L)**:
  - 限制嘌呤摄入 <150mg/天
  - 避免高嘌呤食物（动物内脏、浓肉汤、啤酒）
- **肝功能异常 (ALT/AST > 40U/L)**:
  - 蛋白质增至 1.2-1.5g/kg体重（优质蛋白为主）
  - 限制脂肪摄入，尤其是动物脂肪
  - 增加抗氧化维生素 (维生素C、E)

### 2.4 运动心率区间 (Karvonen 储备心率法)

**目标心率 = [(最大心率 - 静息心率) × 运动强度%] + 静息心率**
- 最大心率 = 220 - 年龄
- 静息心率（如未知，默认为 70 bpm）

**运动强度分级：**
- 低强度 (热身/恢复): 50-60% 储备心率
- 中等强度 (燃脂): 60-70% 储备心率
- 高强度 (心肺训练): 70-80% 储备心率
- 极限强度（避免）: >80% 储备心率

## 【第三步：输出结构化分析】

请以 JSON 格式返回以下内容：

{
  "summary": "整体健康状况总结（2-3句话，基于证据的结论）",
  "healthScore": 0-100,
  "calculations": {
    "bmi": { "value": 数值, "category": "偏瘦/正常/超重/肥胖" },
    "bmr": 数值,
    "tdee": 数值,
    "targetCalories": 数值,
    "weightGoal": "减重/增重/维持",
    "recommendedCalories": "每日建议XX kcal，制造XX kcal热量缺口/盈余"
  },
  "macroTargets": {
    "carbs": { "grams": 数值, "percentage": "55%", "rationale": "基于XX指标调整" },
    "protein": { "grams": 数值, "percentage": "20%", "rationale": "基于XX指标调整" },
    "fat": { "grams": 数值, "percentage": "25%", "rationale": "基于XX指标调整" }
  },
  "indicators": [
    {
      "name": "指标名称",
      "value": "检测值",
      "unit": "单位",
      "normalRange": "正常范围",
      "status": "正常/偏高/偏低",
      "clinicalSignificance": "临床意义解释",
      "risk": "相关健康风险（如有）",
      "priority": "高/中/低",
      "intervention": "针对性干预建议"
    }
  ],
  "nutrientDeficiencies": [
    { "nutrient": "营养素名称", "severity": "轻度/中度/重度", "evidence": "判断依据" }
  ],
  "riskFactors": [
    { "factor": "风险因素", "level": "高/中/低", "mitigation": "缓解策略" }
  ]
}

**输出要求：**
1. 所有数值必须保留1位小数
2. 临床意义解释必须引用循证医学依据
3. 如果缺少数据，在相应字段标注 "[Missing Data]"
`;
```

---

### 2. 专业营养干预建议生成提示词

```typescript
const NUTRITION_INTERVENTION_PROMPT = `
你是一位资深注册营养师 (Registered Dietitian, RD)，必须基于医学营养治疗 (MNT) 标准生成干预方案。
所有建议必须可量化、可执行、基于循证医学证据。

## 输入数据

**客户信息：**
- 姓名：{name}
- 性别：{gender}
- 年龄：{age}岁
- 身高：{height}cm
- 体重：{weight}kg
- 活动水平：{activityLevel}
- 过敏史：{allergies || "无"}
- 疾病史：{medicalHistory || "无"}
- 饮食偏好：{preferences || "无"}

**体检分析结果：**
{analysisResults}

**能量与营养素目标：**
- 每日热量目标：{targetCalories} kcal
- 宏量营养素目标：{macroTargets}

**异常指标：**
{abnormalIndicators}

---

## 输出要求（JSON 格式）

{
  "dailyTargets": {
    "calories": 数值,
    "macros": {
      "carbs": { "grams": 数值, "kcal": 数值, "percentage": "XX%" },
      "protein": { "grams": 数值, "kcal": 数值, "percentage": "XX%" },
      "fat": { "grams": 数值, "kcal": 数值, "percentage": "XX%" }
    },
    "fiber": "25-35g",
    "water": "2000-2500ml"
  },

  "trafficLightFoods": {
    "green": [
      {
        "food": "具体食材名称",
        "reason": "推荐理由（如：富含XX营养素，有助于XX指标改善）",
        "nutrients": ["关键营养素"],
        "serving": "建议分量",
        "frequency": "建议频率（如：每日2-3次）"
      }
    ],
    "yellow": [
      {
        "food": "具体食材名称",
        "reason": "需控制原因",
        "limit": "每日限额（如：坚果不超过15g，全脂乳制品不超过200ml）",
        "timing": "建议食用时间（如：运动后、早餐时）"
      }
    ],
    "red": [
      {
        "food": "具体食材名称",
        "reason": "避免原因（如：高嘌呤、高饱和脂肪、高钠）",
        "alternatives": ["替代食材1", "替代食材2"]
      }
    ]
  },

  "oneDayMealPlan": {
    "breakfast": {
      "time": "07:00-08:00",
      "meals": [
        {
          "food": "食物名称",
          "amount": "具体克数或估量单位（如：燕麦片50g/约3汤匙）",
          "preparation": "简单制作方法",
          "nutrition": "热量XXkcal，蛋白质XXg"
        }
      ],
      "totalCalories": "总计XX kcal",
      "macroDistribution": "碳水XXg / 蛋白质XXg / 脂肪XXg"
    },
    "lunch": {
      "time": "12:00-13:00",
      "meals": [/* 同上 */],
      "totalCalories": "总计XX kcal",
      "macroDistribution": "碳水XXg / 蛋白质XXg / 脂肪XXg"
    },
    "dinner": {
      "time": "18:00-19:00",
      "meals": [/* 同上 */],
      "totalCalories": "总计XX kcal",
      "macroDistribution": "碳水XXg / 蛋白质XXg / 脂肪XXg"
    },
    "snacks": [
      {
        "time": "10:00 / 15:00",
        "food": "加餐食物",
        "amount": "具体分量",
        "purpose": "加餐目的（如：补充蛋白质、稳定血糖）"
      }
    ],
    "dailyTotal": {
      "calories": "总计XX kcal",
      "macros": {
        "carbs": "XXg (XX%)",
        "protein": "XXg (XX%)",
        "fat": "XXg (XX%)"
      }
    }
  },

  "biomarkerInterventionMapping": [
    {
      "biomarker": "异常指标名称（如：同型半胱氨酸 18μmol/L）",
      "status": "偏高/偏低",
      "mechanism": "病理生理机制解释（如：同型半胱氨酸升高增加血栓风险，损伤血管内皮）",
      "nutritionalIntervention": "营养干预方案",
      "foodSources": [
        { "food": "食物1", "nutrient": "富含XX营养素", "amount": "建议每日XXg" },
        { "food": "食物2", "nutrient": "富含XX营养素", "amount": "建议每日XXg" },
        { "food": "食物3", "nutrient": "富含XX营养素", "amount": "建议每日XXg" }
      ],
      "supplement": {
        "name": "补充剂名称（如：叶酸、维生素B12）",
        "dosage": "建议剂量（如：叶酸 400μg/天）",
        "duration": "建议服用周期",
        "evidence": "循证依据（如：RCT研究显示叶酸补充可降低HCY水平25%）"
      },
      "monitoring": "监测指标（如：建议3个月后复查同型半胱氨酸水平）"
    }
  ],

  "exercisePrescription": {
    "cardio": {
      "type": "有氧运动类型（如：快走、慢跑、游泳）",
      "frequency": "每周X次",
      "duration": "每次X分钟",
      "intensity": {
        "method": "Karvonen储备心率法",
        "targetZone": "目标心率区间：XXX-XXX bpm",
        "calculation": "计算公式：(220-{age}-70) × 0.6-0.7 + 70",
        "rpe": "主观疲劳度：12-13级（有点累）"
      },
      "timing": "建议运动时间（如：餐后1小时，避免空腹运动）",
      "precautions": ["注意事项1", "注意事项2"]
    },
    "resistance": {
      "type": "力量训练类型（如：弹力带、自重训练、轻器械）",
      "frequency": "每周X次",
      "exercises": [
        { "name": "深蹲", "sets": "X组", "reps": "X次", "rest": "休息X秒" },
        { "name": "俯卧撑", "sets": "X组", "reps": "X次", "rest": "休息X秒" }
      ],
      "intensity": "强度递增原则（每周增加5-10%负荷）"
    },
    "flexibility": {
      "type": "柔韧性训练（如：静态拉伸、瑜伽）",
      "frequency": "每周X次",
      "duration": "每次X分钟",
      "focus": "重点拉伸部位（如：胸肌、背阔肌、腘绳肌）"
    }
  },

  "lifestyleModifications": [
    {
      "area": "生活领域（如：睡眠、压力管理、戒烟限酒）",
      "currentStatus": "现状评估",
      "recommendation": "具体干预措施",
      "priority": "高/中/低",
      "expectedOutcome": "预期效果",
      "actionSteps": ["可执行步骤1", "可执行步骤2", "可执行步骤3"]
    }
  ],

  "supplements": [
    {
      "name": "补充剂名称",
      "indication": "适应症（基于XX指标异常）",
      "dosage": "建议剂量（如：Omega-3鱼油 1000mg，含EPA+DHA 600mg，每日2次）",
      "timing": "服用时间（如：随餐服用）",
      "duration": "建议服用周期",
      "contraindications": ["禁忌症1", "禁忌症2"],
      "interactions": ["药物相互作用（如有）"],
      "evidence": "循证依据（如：Cochrane综述显示Omega-3可降低TG 20-30%）"
    }
  ],

  "followUpPlan": {
    "needed": true,
    "timeline": "建议随访时间（如：4周后首次随访，然后每8周一次）",
    "monitoringIndicators": ["需监测的指标1", "需监测的指标2"],
    "assessments": ["评估项目1", "评估项目2"],
    "adjustments": "根据监测结果调整方案的预案"
  },

  "summary": "整体干预方案总结（3-4句话，强调核心干预策略和预期效果）"
}

---

## 输出标准

1. **量化精度**: 所有食物分量必须精确到"克"或使用"拳头/手掌"等直观单位
2. **循证依据**: 每个干预措施必须说明循证依据（如：ADA指南、ESPEN共识、RCT研究）
3. **个体化**: 根据客户的过敏史、疾病史、饮食偏好调整方案
4. **可执行性**: 方案必须现实可行，考虑客户的烹饪条件、时间限制、经济能力
5. **安全性**: 明确标注禁忌症和注意事项，特别是与药物的相互作用
6. **监测计划**: 必须包含效果监测指标和随访时间表

---

## 特殊情况处理

**数据缺失时：**
- 如果缺少静息心率，使用默认值 70 bpm
- 如果缺少年龄，基于身高体重推断为成年人（25-45岁），并标注 [Estimated]
- 如果缺少疾病史，在建议中说明"建议咨询医生确认"

**矛盾数据时：**
- 如果客户自述与体检结果矛盾，以体检结果为准
- 如果不同指标给出冲突的饮食建议，优先考虑风险最高的指标

**多指标异常时：**
- 按优先级排序干预策略
- 寻找协同干预方案（如：DASH饮食同时改善高血压和高血脂）
`;
```

---

### 3. 运动方案生成提示词

```typescript
const EXERCISE_PLAN_GENERATION_PROMPT = `
你是一位资深注册营养师和运动处方专家，需要为客户生成个性化的运动方案。

## 【客户基本信息】

**个人信息：**
- 姓名：{name}
- 性别：{gender}
- 年龄：{age}岁
- 身高：{height}cm
- 体重：{weight}kg
- 活动水平：{activityLevel}

**运动相关：**
- 用户需求：{userRequirements || '减重、改善整体健康'}
- 运动详情：{exerciseDetails || '无特殊器材/环境要求'}
- 健康问题：{healthConcerns.join('、') || '无'}
- 疾病史：{medicalHistory.join('、') || '无'}

## 【健康分析结果】

{healthAnalysis JSON}

## 【方案要求】

请生成一个**为期3个月**的渐进式运动方案，包含：
- 每周目标
- 训练计划（按月/周分解）
- 运动处方（有氧、力量、柔韧性）
- 注意事项
- 成功标准

## 【输出格式】

{
  "overview": "整体运动策略说明（2-3句话）",
  "weeklyGoal": "每周运动目标",
  "trainingPlan": [
    {
      "week": "第1-2周",
      "focus": "本周训练重点",
      "schedule": [
        {
          "day": "周一",
          "type": "有氧训练",
          "duration": "30分钟",
          "warmup": "5分钟快走",
          "exercises": [
            {
              "name": "快走/慢跑",
              "sets": "1",
              "reps": "30分钟",
              "rest": "-",
              "intensity": "低-中",
              "notes": "心率控制在最大心率的60-70%"
            }
          ],
          "cooldown": "5分钟拉伸"
        }
      ]
    }
  ],
  "monthlyProgression": ["第1月重点", "第2月重点", "第3月重点"],
  "precautions": ["注意事项1", "注意事项2"],
  "successCriteria": ["成功标准1", "成功标准2"]
}
`;
```

---

### 4. 运动方案评估提示词

```typescript
const EXERCISE_PLAN_EVALUATION_PROMPT = (
  clientInfo,
  currentPlan,
  exerciseRecords,
  analysisPeriod
) => `
你是一位资深运动处方专家，需要评估客户的运动方案执行情况。

## 【客户信息】

- 姓名：{name}
- 性别：{gender}
- 年龄：{age}岁
- 用户需求：{userRequirements}

## 【当前运动方案】

{currentPlan.prescription JSON}

## 【运动记录数据】

{exerciseRecords JSON}

## 【评估周期】

{startDate} 至 {endDate}（共{days}天）

## 【评估任务】

请评估运动方案的执行情况，包括：
1. 执行统计（达成率、运动天数、总时长等）
2. 类型完成情况
3. 关键发现
4. 优势与问题
5. 调整建议

## 【输出格式】

{
  "executionStats": {
    "totalDays": 总天数,
    "recordedDays": 已记录天数,
    "exerciseDays": 运动天数,
    "restDays": 休息日天数,
    "totalDuration": 总运动时长（分钟）,
    "avgDuration": 平均每次运动时长（分钟）,
    "adherenceRate": 达成率（0-1）
  },
  "keyFindings": ["关键发现1", "关键发现2"],
  "strengths": ["执行良好的方面1", "执行良好的方面2"],
  "issues": [
    {
      "issue": "问题描述",
      "severity": "高/中/低",
      "impact": "影响说明"
    }
  ],
  "recommendations": [
    {
      "area": "调整领域",
      "suggestion": "具体建议",
      "reason": "建议原因"
    }
  ],
  "overallAssessment": "优秀/良好/一般/需改善",
  "shouldRevise": true/false,
  "reviseReason": "如需调整，说明原因"
}
`;
```

---

### 5. 饮食照片合规性评估提示词

```typescript
const DIET_PHOTO_COMPLIANCE_EVALUATION_PROMPT = (
  clientInfo,
  recommendation,
  notes?
) => `
你是一位资深注册营养师 (RD)，需要评估客户的饮食照片是否符合其专业营养干预方案。

## 【客户信息】

- 姓名：{name}
- 性别：{gender}
- 年龄：{age}岁
- 健康问题：{healthConcerns.join('、') || '无'}

## 【照片备注】（最高优先级）

{notes ? notes : '无备注'}

⚠️ **备注是用户的明确说明，具有最高优先级！当备注与视觉识别冲突时，必须以备注为准。**

## 【客户营养干预方案】

### 每日目标
- 总热量：{calories} kcal
- 碳水化合物：{carbs}g ({percentage})
- 蛋白质：{protein}g ({percentage})
- 脂肪：{fat}g ({percentage})

### 红绿灯食物指南
- 绿灯食物（随意吃）：{greenFoods}
- 黄灯食物（控制量）：{yellowFoods}
- 红灯食物（避免）：{redFoods}

## 【评估任务】

1. 食物识别与分类
2. 热量与营养素估算
3. 红绿灯合规性评估
4. 改进建议

## 【输出格式】

{
  "foods": [
    {
      "name": "食物名称",
      "category": "绿灯/黄灯/红灯",
      "portion": "大/中/小",
      "cookingMethod": "烹饪方式",
      "estimatedCalories": 数值
    }
  ],
  "complianceEvaluation": {
    "overallScore": 85,
    "overallRating": "良好",
    "calorieMatch": {
      "estimatedCalories": 650,
      "targetCalories": {targetCalories},
      "status": "within"
    },
    "foodTrafficLightCompliance": {
      "greenFoods": ["绿灯食物"],
      "yellowFoods": ["黄灯食物"],
      "redFoods": ["红灯食物"]
    }
  },
  "improvementSuggestions": {
    "removals": [
      {
        "food": "炸鸡翅",
        "reason": "红灯食物 - 高油脂",
        "alternatives": ["蒸鸡翅"]
      }
    ],
    "additions": [
      {
        "food": "深色蔬菜",
        "reason": "增加膳食纤维",
        "amount": "1-2份"
      }
    ]
  }
}
`;
```

---

### 6. 咨询记录分析提示词

```typescript
const CONSULTATION_ANALYSIS_PROMPT = (
  clientInfo,
  consultationData
) => `
你是一位资深注册营养师 (RD)，正在分析一次营养咨询记录。

## 【客户背景信息】

- 姓名：{name}
- 性别：{gender}
- 年龄：{age}岁
- 当前健康问题：{healthConcerns}

## 【当前营养干预方案】

- 每日热量目标：{calories} kcal
- 核心建议：{recommendations}
- 绿灯食物：{greenFoods}
- 红灯食物：{redFoods}

## 【本次咨询内容】

{sessionNotes}
{textFiles content}
{imageDescriptions}

## 【核心分析任务】

1. 识别具体进展（体重、症状、饮食、生活方式）
2. 识别具体问题（困难、疑问、新症状）
3. 评估执行程度
4. 识别情绪状态
5. 提出行动建议

## 【输出格式】

{
  "summary": "2-3句话总结本次咨询",
  "dietChanges": {
    "reportedChanges": ["客户报告的饮食变化"],
    "compliantBehaviors": ["符合建议的行为"],
    "nonCompliantBehaviors": ["不符合建议的行为"]
  },
  "symptomChanges": {
    "improved": ["改善的症状"],
    "worsened": ["加重的症状"],
    "unchanged": ["未变化的症状"]
  },
  "challenges": ["遇到的具体困难"],
  "emotionalState": "积极/焦虑/沮丧/动力不足",
  "actionRecommendations": [
    {
      "priority": "高/中/低",
      "action": "具体行动建议",
      "reason": "建议原因"
    }
  ],
  "nextConsultationFocus": "下次咨询重点"
}
`;
```

---

## 核心流程

### 1. 体检报告上传与分析流程

```
用户上传报告
    ↓
文件存储（Vercel Blob）
    ↓
OCR 识别（Tesseract / Gemini 2.5 Flash Vision）
    ↓
提取结构化数据
    ↓
存储到数据库
    ↓
AI 分析（Gemini 2.5 Pro）
    ↓
生成建议 → 展示给用户
```

### 2. 运动方案管理流程

```
创建初始方案
    ↓
选择模板或 AI 生成
    ↓
关联运动记录
    ↓
执行数据收集
    ↓
AI 评估执行情况
    ↓
生成调整方案（如需要）
    ↓
版本对比与切换
```

### 3. 饮食照片合规性评估流程

```
上传饮食照片
    ↓
AI 识别食物
    ↓
计算热量与营养素
    ↓
对比红绿灯指南
    ↓
生成合规性评分
    ↓
提供改进建议
```

### 4. 咨询记录管理流程

```
创建咨询记录
    ↓
上传图片/文本文件
    ↓
AI 分析内容
    ↓
提取关键信息
    ↓
生成结构化报告
    ↓
更新营养干预方案
```

### 5. AI 调用策略

1. **简单报告**：直接使用 Gemini 2.5 Flash Vision API 分析图片
2. **复杂表格**：Tesseract 预处理 + Gemini 2.5 Pro 结构化
3. **结果验证**：JSON Schema 验证，失败则重试

---

## 开发计划

### Phase 1: 基础框架 ✅
- [x] Next.js 项目初始化
- [x] 数据库设计与 Prisma 配置
- [x] 用户认证（NextAuth.js）
- [x] 基础 UI 组件（shadcn/ui）

### Phase 2: 客户管理 ✅
- [x] 客户 CRUD 接口
- [x] 客户表单与验证
- [x] 客户列表与搜索

### Phase 3: 报告上传与分析 ✅
- [x] 文件上传功能
- [x] OCR 集成
- [x] Gemini AI 分析
- [x] 分析结果展示

### Phase 4: 建议生成 ✅
- [x] 饮食建议生成
- [x] 运动建议生成
- [x] 报告导出（PDF）

### Phase 5: 运动方案管理 ✅（新功能）
- [x] 运动方案模板库
- [x] 运动方案创建（AI 生成/模板选择）
- [x] 运动方案版本管理
- [x] 运动记录与时间线
- [x] 运动方案 AI 评估
- [x] 运动方案调整
- [x] 方案对比功能

### Phase 6: 饮食照片与咨询 ✅（新功能）
- [x] 饮食照片上传与分析
- [x] 红绿灯合规性评估
- [x] 咨询记录管理
- [x] 咨询内容 AI 分析
- [x] 周饮食汇总

### Phase 7: AI 配置与优化 ✅（新功能）
- [x] 多 AI 模型支持
- [x] 用户 API Key 管理
- [x] 任务断点续传
- [x] 待办事项 Dashboard

### Phase 8: 优化与部署
- [ ] 性能优化
- [ ] 错误处理
- [ ] 生产部署

---

## API 文档

### 运动方案管理 API

#### GET `/api/clients/[id]/exercise-plans`
获取客户的所有运动方案

**响应示例：**
```json
{
  "exercisePlans": [
    {
      "id": "plan_123",
      "version": 1,
      "planType": "INITIAL",
      "status": "ACTIVE",
      "triggerReason": "基于「减重基础方案」模板生成运动方案",
      "prescription": { /* 运动处方 JSON */ },
      "targetStartDate": "2026-03-01T00:00:00Z",
      "targetEndDate": "2026-05-26T00:00:00Z",
      "totalPlannedDays": 84,
      "totalCompletedDays": 14,
      "adherenceRate": 0.85
    }
  ]
}
```

#### POST `/api/clients/[id]/exercise-plans`
创建新的运动方案

**请求体：**
```json
{
  "useHealthData": true,
  "templateId": "weight_loss_basic"
}
```

**响应示例：**
```json
{
  "success": true,
  "plan": { /* 运动方案对象 */ }
}
```

#### POST `/api/clients/[id]/exercise-plans/[planId]/evaluate`
评估运动方案执行情况

**请求体：**
```json
{
  "analysisDays": 7
}
```

**响应示例：**
```json
{
  "success": true,
  "evaluation": {
    "overallAssessment": "良好",
    "shouldRevise": false,
    "executionStats": {
      "adherenceRate": 0.85,
      "totalDays": 7,
      "exerciseDays": 5
    }
  }
}
```

#### POST `/api/clients/[id]/exercise-plans/[planId]/revise`
生成调整版运动方案

**响应示例：**
```json
{
  "success": true,
  "newPlan": { /* 新方案对象 */ }
}
```

#### GET `/api/clients/[id]/exercise-plans/compare?from={planId1}&to={planId2}`
对比两个版本的方案

**响应示例：**
```json
{
  "comparison": {
    "summary": "主要变更说明",
    "keyChanges": ["变更1", "变更2"]
  }
}
```

### 运动记录 API

#### GET `/api/clients/[id]/exercise-records`
获取运动记录列表

**查询参数：**
- `startDate`: 开始日期（YYYY-MM-DD）
- `endDate`: 结束日期（YYYY-MM-DD）

#### POST `/api/clients/[id]/exercise-records`
创建运动记录

**请求体：**
```json
{
  "date": "2026-03-01",
  "type": "跑步",
  "duration": 30,
  "intensity": "中等",
  "notes": "配速 6:30/km",
  "imageUrl": "data:image/jpeg;base64,..."
}
```

### 饮食照片 API

#### GET `/api/clients/[id]/diet-photos`
获取饮食照片列表

#### POST `/api/clients/[id]/diet-photos`
上传饮食照片

**请求体：**
```json
{
  "imageUrl": "data:image/jpeg;base64,...",
  "mealType": "早餐",
  "notes": "备注信息"
}
```

### 咨询记录 API

#### GET `/api/clients/[id]/consultations`
获取咨询记录列表

#### POST `/api/clients/[id]/consultations`
创建咨询记录

**请求体：**
```json
{
  "consultationDate": "2026-03-01T10:00:00Z",
  "consultationType": "面对面",
  "sessionNotes": "咨询笔记",
  "images": ["base64_image1", "base64_image2"],
  "textFiles": [
    {
      "fileName": "报告.pdf",
      "content": "base64_content"
    }
  ]
}
```

### 待办事项 API

#### GET `/api/dashboard/todos`
获取待办事项列表

**响应示例：**
```json
{
  "pendingPhotos": [ /* 待分析的饮食照片 */ ],
  "pendingRecommendations": [ /* 待生成建议的客户 */ ],
  "pendingMealGroups": [ /* 待分析的食谱组 */ ],
  "pendingEvaluations": [ /* 待评估的运动方案 */ ]
}
```

---

## 环境变量

```env
# .env.local
DATABASE_URL="file:./dev.db"  # SQLite (开发环境)
# DATABASE_URL="postgresql://..."  # PostgreSQL (生产环境)

NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# AI 模型配置（可选，用户可在设置中配置）
GOOGLE_GENERATIVE_AI_API_KEY="..."  # Google Gemini
OPENAI_API_KEY="..."                 # OpenAI GPT
ANTHROPIC_API_KEY="..."              # Anthropic Claude

# 文件存储（可选）
UPLOADTHING_SECRET="..."
UPLOADTHING_APP_ID="..."
```

### AI 模型配置说明

系统支持以下 AI 提供商：

| 提供商 | 模型 ID | 用途 | 支持的功能 |
|--------|---------|------|-----------|
| Google | `gemini-2.5-flash` | 默认模型 | 文本、视觉 |
| Google | `gemini-2.5-pro` | 高级分析 | 文本、视觉、JSON 模式 |
| OpenAI | `gpt-4o` | 复杂分析 | 文本、视觉 |
| OpenAI | `gpt-4o-mini` | 快速响应 | 文本、视觉 |
| Anthropic | `claude-3-5-sonnet` | 高级分析 | 文本、视觉 |
| Alibaba | `qwen-vl-max` | 中文优化 | 文本、视觉 |

用户可以在设置中为每个功能模块选择不同的 AI 模型：
- 健康分析
- 饮食照片分析
- 运动方案生成
- 咨询记录分析

---

## 快速开始

```bash
# 1. 创建项目
npx create-next-app@latest nutricoach-pro --typescript --tailwind --app

# 2. 安装依赖
cd nutricoach-pro
npm install @prisma/client next-auth @ai-sdk/google zod react-hook-form
npm install -D prisma

# 3. 初始化数据库
npx prisma init
npx prisma db push

# 4. 运行开发服务器
npm run dev
```

---

## 运动方案模板库

系统预置了 4 种常见目标的运动方案模板：

### 1. 减重基础方案 (`weight_loss_basic`)
- **目标人群**: 减重 5-10kg、BMI 25-30、运动新手
- **训练重点**: 脂肪燃烧、心肺功能提升、基础力量建立
- **每周目标**: 5天，包含 3次有氧 + 2次力量
- **时长**: 8周

### 2. 增肌基础方案 (`muscle_gain_basic`)
- **目标人群**: 增肌、改善体型、力量提升
- **训练重点**: 肌肉量增长、基础力量、体态改善
- **每周目标**: 4天力量训练（分化训练）
- **时长**: 8周

### 3. 低冲击康复方案 (`rehabilitation_low_impact`)
- **目标人群**: 关节不适、恢复期、中老年
- **训练重点**: 关节保护、心肺功能维持、柔韧性改善
- **每周目标**: 4-5天低冲击有氧
- **时长**: 8周

### 4. 健康改善方案 (`health_improvement_basic`)
- **目标人群**: 健康维护、久坐改善、体能提升
- **训练重点**: 心肺健康、基础力量、身体柔韧性
- **每周目标**: 5天综合训练
- **时长**: 8周

---

## 功能特性

### AI 模型选择
- 支持多个 AI 提供商（Google、OpenAI、Anthropic、阿里）
- 用户可配置自己的 API Key
- 每个功能模块可选择不同的 AI 模型
- 环境变量 Key 作为备用方案

### 任务断点续传
- 长时间 AI 任务（如周饮食汇总）支持进度追踪
- 任务失败后可从断点继续
- 实时显示任务进度和当前步骤

### 运动方案版本管理
- 所有方案保留历史版本
- 支持版本对比
- 可随时切换到历史版本

---

## 参考资料

- [Next.js 文档](https://nextjs.org/docs)
- [Prisma 文档](https://www.prisma.io/docs)
- [Gemini API](https://ai.google.dev/gemini-api/docs)
- [shadcn/ui](https://ui.shadcn.com)

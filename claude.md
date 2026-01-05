# 营养师智能分析平台 (NutriCoach Pro)

## 项目概述

为专业营养师打造的智能分析平台，通过上传客户体检报告和资料，利用 AI 自动生成全面的饮食和运动建议。

---

## 核心功能

### 1. 客户管理
- 添加/编辑客户档案（年龄、性别、身高、体重、活动水平、过敏史、疾病史）
- 客户列表与搜索
- 历史记录追踪

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

### 4. 报告导出
- 生成专业 PDF 报告
- 支持自定义模板
- 一键分享给客户

---

## 推荐技术栈

### 前端

| 技术 | 用途 | 理由 |
|------|------|------|
| **Next.js 14** | 全栈框架 | SSR/SSG、SEO 友好、API Routes |
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
| **Google Gemini 3.0 Pro** | 主 AI 模型 | 最新的多模态理解能力、结构化输出 |
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
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 认证相关页面
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/       # 主应用页面
│   │   │   ├── clients/       # 客户管理
│   │   │   ├── analysis/      # 体检报告分析
│   │   │   ├── recommendations/ # 建议生成
│   │   │   └── settings/      # 设置
│   │   └── api/               # API Routes
│   │       ├── clients/
│   │       ├── reports/
│   │       ├── upload/
│   │       └── ai/
│   ├── components/
│   │   ├── ui/                # shadcn/ui 组件
│   │   ├── forms/             # 表单组件
│   │   ├── charts/            # 图表组件
│   │   ├── upload/            # 文件上传
│   │   └── layout/            # 布局组件
│   ├── lib/
│   │   ├── ai/                # AI 服务集成
│   │   │   ├── gemini.ts
│   │   │   └── prompts.ts     # 提示词模板
│   │   ├── db/                # 数据库
│   │   │   └── prisma.ts
│   │   ├── ocr/               # OCR 处理
│   │   │   └── tesseract.ts
│   │   └── utils.ts           # 工具函数
│   ├── types/                 # TypeScript 类型
│   └── styles/
├── prisma/
│   └── schema.prisma          # 数据库模型
├── public/
│   └── uploads/               # 上传文件（本地开发）
└── package.json
```

---

## 数据库模型

```prisma
// prisma/schema.prisma

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  role          Role      @default(NUTRITIONIST)
  clients       Client[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Client {
  id               String   @id @default(cuid())
  userId           String
  user             User     @relation(fields: [userId], references: [id])
  name             String
  gender           Gender
  birthDate        DateTime
  height           Float    // cm
  weight           Float    // kg
  activityLevel    ActivityLevel
  allergies        String[] // 过敏原
  medicalHistory   String[] // 疾病史
  preferences      String?  // 饮食偏好（素食、清真等）
  phone            String?
  email            String?
  reports          Report[]
  recommendations  Recommendation[]
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

model Report {
  id              String   @id @default(cuid())
  clientId        String
  client          Client   @relation(fields: [clientId], references: [id])
  fileUrl         String
  fileName        String
  fileType        String
  extractedData   Json     // OCR 提取的原始数据
  analysis        Json?    // AI 分析结果
  uploadedAt      DateTime @default(now())
}

model Recommendation {
  id              String   @id @default(cuid())
  clientId        String
  client          Client   @relation(fields: [clientId], references: [id])
  reportId        String?
  type            RecType
  content         Json     // 结构化建议内容
  generatedAt     DateTime @default(now())
}

enum Role {
  ADMIN
  NUTRITIONIST
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum ActivityLevel {
  SEDENTARY    // 久坐
  LIGHT        // 轻度活动
  MODERATE     // 中度活动
  ACTIVE       // 活跃
  VERY_ACTIVE  // 非常活跃
}

enum RecType {
  DIET
  EXERCISE
  LIFESTYLE
  COMPREHENSIVE
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

## 核心流程

### 1. 体检报告上传与分析流程

```
用户上传报告
    ↓
文件存储（Vercel Blob）
    ↓
OCR 识别（Tesseract / Gemini 3.0 Pro Vision）
    ↓
提取结构化数据
    ↓
存储到数据库
    ↓
AI 分析（Gemini 3.0 Pro）
    ↓
生成建议 → 展示给用户
```

### 2. AI 调用策略

1. **简单报告**：直接使用 Gemini 3.0 Pro Vision API 分析图片
2. **复杂表格**：Tesseract 预处理 + Gemini 3.0 Pro 结构化
3. **结果验证**：JSON Schema 验证，失败则重试

---

## 开发计划

### Phase 1: 基础框架（Week 1-2）
- [ ] Next.js 项目初始化
- [ ] 数据库设计与 Prisma 配置
- [ ] 用户认证（NextAuth.js）
- [ ] 基础 UI 组件（shadcn/ui）

### Phase 2: 客户管理（Week 3）
- [ ] 客户 CRUD 接口
- [ ] 客户表单与验证
- [ ] 客户列表与搜索

### Phase 3: 报告上传与分析（Week 4-5）
- [ ] 文件上传功能
- [ ] OCR 集成
- [ ] Gemini AI 分析
- [ ] 分析结果展示

### Phase 4: 建议生成（Week 6）
- [ ] 饮食建议生成
- [ ] 运动建议生成
- [ ] 报告导出（PDF）

### Phase 5: 优化与部署（Week 7）
- [ ] 性能优化
- [ ] 错误处理
- [ ] 生产部署

---

## 环境变量

```env
# .env.local
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# Gemini AI
GEMINI_API_KEY="..."

# 文件存储
UPLOADTHING_SECRET="..."
UPLOADTHING_APP_ID="..."

# OAuth（可选）
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

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

## 参考资料

- [Next.js 文档](https://nextjs.org/docs)
- [Prisma 文档](https://www.prisma.io/docs)
- [Gemini API](https://ai.google.dev/gemini-api/docs)
- [shadcn/ui](https://ui.shadcn.com)

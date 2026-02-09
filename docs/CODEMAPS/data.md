# NutriCoach Pro - Data Codemap

**Generated:** 2026-02-01
**Version:** 0.1.0
**Scope:** Database Schema, TypeScript Types, Data Models

---

## Overview

NutriCoach Pro uses Prisma ORM with SQLite for development (PostgreSQL recommended for production). All data models are type-safe and generated from the Prisma schema.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA ARCHITECTURE                                 │
│                      (Prisma ORM + TypeScript Types)                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│  Prisma ORM   │           │   Database    │           │  TypeScript   │
│               │           │               │           │    Types      │
│ - Schema      │◄──────────►│ - SQLite      │◄──────────►│ - interfaces/ │
│ - Client      │   Migrate  │ - Tables      │  Generate  │ - enums/     │
│ - Models      │           │ - Relations   │           │ - types/      │
└───────────────┘           └───────────────┘           └───────────────┘
```

---

## Database Schema

### Technology
- **ORM:** Prisma 6.19.1
- **Database:** SQLite (development), PostgreSQL (production recommended)
- **Schema File:** `prisma/schema.prisma`

### Connection
```typescript
// lib/db/prisma.ts
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
});
```

---

## Data Models

```
Prisma Schema
│
├── User                          # Nutritionists using the platform
│
├── Client                        # Client profiles
│   ├── Report[]                  # Health reports
│   ├── Recommendation[]          # AI recommendations
│   ├── DietPhoto[]               # Individual meal photos
│   ├── DietPhotoMealGroup[]      # Grouped meals
│   ├── Consultation[]            # Consultation records
│   ├── PlanEvaluation[]          # Plan safety checks
│   └── WeeklyDietSummary[]       # Weekly summaries
│
├── Report                        # Uploaded health reports
│   └── Recommendation[]          # Generated recommendations
│
├── Recommendation                # AI-generated plans
│   └── Report                    # Source report (optional)
│
├── DietPhoto                     # Individual meal photos
│   └── DietPhotoMealGroup        # Parent group
│
├── DietPhotoMealGroup            # Meal groups
│   └── DietPhoto[]               # Child photos
│
├── Consultation                  # Consultation records
│
├── PlanEvaluation                # Nutritionist plan evaluations
│
└── WeeklyDietSummary             # Weekly diet summaries
    └── Recommendation            # Source recommendation
```

---

## Model Details

### User

**Purpose:** Nutritionists using the platform

**Fields:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, @default(cuid()) | Primary key |
| name | String? | Optional | Display name |
| email | String | @unique | Login email |
| emailVerified | DateTime? | Optional | Email verification |
| image | String? | Optional | Profile image URL |
| password | String? | Optional | Hashed password (bcrypt) |
| role | Role | @default(NUTRITIONIST) | User role |
| createdAt | DateTime | @default(now()) | Creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update |

**Relations:**
- `clients Client[]` - Clients belonging to this user

**Enum: Role**
```prisma
enum Role {
  ADMIN
  NUTRITIONIST
}
```

**Indexes:**
- `email` (unique)

---

### Client

**Purpose:** Client profiles with health data

**Fields:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, @default(cuid()) | Primary key |
| userId | String | Foreign key | Owner user |
| name | String | Required | Client name |
| gender | Gender | Required | Gender |
| birthDate | DateTime | Required | Birth date |
| height | Float | Required | Height (cm) |
| weight | Float | Required | Weight (kg) |
| activityLevel | ActivityLevel | Required | Activity level |
| allergies | String | @default("[]") | JSON array |
| medicalHistory | String | @default("[]") | JSON array |
| healthConcerns | String | @default("[]") | JSON array |
| preferences | String? | Optional | Dietary preferences |
| userRequirements | String? | Optional | User goals |
| exerciseDetails | String? | Optional | Exercise info |
| phone | String? | Optional | Phone number |
| email | String? | Optional | Email address |
| dietAnalysis | String? | Optional | JSON analysis |
| dietPreferences | String? | Optional | JSON preferences |
| eatingHabits | String? | Optional | JSON habits |
| createdAt | DateTime | @default(now()) | Creation |
| updatedAt | DateTime | @updatedAt | Last update |

**Relations:**
- `user User @relation(fields: [userId], references: [id], onDelete: Cascade)`
- `reports Report[]`
- `recommendations Recommendation[]`
- `dietPhotos DietPhoto[]`
- `mealGroups DietPhotoMealGroup[]`
- `consultations Consultation[]`
- `planEvaluations PlanEvaluation[]`
- `weeklySummaries WeeklyDietSummary[]`

**Enums:**
```prisma
enum Gender {
  MALE
  FEMALE
  OTHER
}

enum ActivityLevel {
  SEDENTARY    # 久坐
  LIGHT        # 轻度活动
  MODERATE     # 中度活动
  ACTIVE       # 活跃
  VERY_ACTIVE  # 非常活跃
}
```

**JSON Field Structure:**
- `allergies`: `["花生", "海鲜"]`
- `medicalHistory`: `["高血压", "糖尿病"]`
- `healthConcerns`: `["减重", "改善睡眠"]`

**Indexes:**
- None (queries by userId via relation)

---

### Report

**Purpose:** Uploaded health reports (PDF/images)

**Fields:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, @default(cuid()) | Primary key |
| clientId | String | Foreign key | Owner client |
| fileUrl | String | Required | File URL (Base64 or path) |
| fileName | String | Required | Original filename |
| fileType | String | Required | MIME type |
| extractedData | Json | Required | OCR/extracted data |
| analysis | Json? | Optional | AI analysis result |
| uploadedAt | DateTime | @default(now()) | Upload timestamp |

**Relations:**
- `client Client @relation(fields: [clientId], references: [id], onDelete: Cascade)`
- `recommendations Recommendation[]`

**JSON Field Structure:**
```json
{
  "extractedData": {
    "indicators": [
      {
        "name": "总胆固醇",
        "value": "5.2",
        "unit": "mmol/L",
        "normalRange": "<5.2"
      }
    ]
  },
  "analysis": {
    "summary": "整体健康状况...",
    "bmi": 22.9,
    "bmiCategory": "正常",
    "abnormalIndicators": [],
    "nutrientDeficiencies": [],
    "riskFactors": [],
    "overallHealthScore": 85
  }
}
```

**Indexes:**
- None (queries by clientId via relation)

---

### Recommendation

**Purpose:** AI-generated diet/exercise plans

**Fields:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, @default(cuid()) | Primary key |
| clientId | String | Foreign key | Target client |
| reportId | String? | Optional Foreign key | Source report |
| type | RecType | Required | Recommendation type |
| content | Json | Required | Recommendation content |
| generatedAt | DateTime | @default(now()) | Generation time |

**Relations:**
- `client Client @relation(fields: [clientId], references: [id], onDelete: Cascade)`
- `report Report? @relation(fields: [reportId], references: [id], onDelete: SetNull)`

**Enum:**
```prisma
enum RecType {
  DIET           # 饮食建议
  EXERCISE       # 运动建议
  LIFESTYLE      # 生活方式
  COMPREHENSIVE  # 综合建议
}
```

**JSON Field Structure (content):**
```json
{
  "dailyTargets": {
    "calories": 1800,
    "macros": {
      "carbs": { "grams": 250, "kcal": 1000, "percentage": "55%" },
      "protein": { "grams": 90, "kcal": 360, "percentage": "20%" },
      "fat": { "grams": 60, "kcal": 540, "percentage": "25%" }
    },
    "fiber": "25-35g",
    "water": "2000-2500ml"
  },
  "trafficLightFoods": {
    "green": [...],
    "yellow": [...],
    "red": [...]
  },
  "oneDayMealPlan": {
    "breakfast": {...},
    "lunch": {...},
    "dinner": {...},
    "snacks": [...]
  },
  "biomarkerInterventionMapping": [...],
  "exercisePrescription": {
    "overview": "...",
    "goals": [...],
    "equipment": {...},
    "weeklySchedule": [...]
  },
  "lifestyleModifications": [...],
  "supplements": [...]
}
```

**Indexes:**
- None (queries by clientId via relation)

---

### DietPhoto

**Purpose:** Individual meal photos with AI analysis

**Fields:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, @default(cuid()) | Primary key |
| clientId | String | Foreign key | Owner client |
| mealGroupId | String? | Optional Foreign key | Parent group |
| imageUrl | String | Required | Base64 image data |
| uploadedAt | DateTime | @default(now()) | Upload time |
| mealType | String? | Optional | 早餐/午餐/晚餐/加餐 |
| notes | String? | Optional | User notes |
| analysis | String? | Optional | JSON analysis |
| analyzedAt | DateTime? | Optional | Analysis time |
| createdAt | DateTime | @default(now()) | Creation |
| updatedAt | DateTime | @updatedAt | Last update |

**Relations:**
- `client Client @relation(fields: [clientId], references: [id], onDelete: Cascade)`
- `mealGroup DietPhotoMealGroup? @relation(fields: [mealGroupId], references: [id], onDelete: Cascade)`

**JSON Field Structure (analysis):**
```json
{
  "foods": [...],
  "mealType": "午餐",
  "description": "照片描述",
  "complianceEvaluation": {
    "overallScore": 85,
    "overallRating": "良好",
    "calorieMatch": {...},
    "macroMatch": {...},
    "nutritionBalance": {...},
    "foodTrafficLightCompliance": {...},
    "biomarkerCompliance": {...}
  },
  "improvementSuggestions": {...},
  "mealPlanAlignment": {...},
  "healthConcernsAlignment": {...}
}
```

**Indexes:**
- `clientId`
- `mealGroupId`

---

### DietPhotoMealGroup

**Purpose:** Grouped meals for comprehensive analysis

**Fields:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, @default(cuid()) | Primary key |
| clientId | String | Foreign key | Owner client |
| name | String | Required | Group name |
| date | String | Required | YYYY-MM-DD |
| mealType | String? | Optional | 早餐/午餐/晚餐/加餐/全天 |
| combinedAnalysis | String? | Optional | JSON aggregated analysis |
| totalScore | Int? | Optional | Average score (0-100) |
| overallRating | String? | Optional | 优秀/良好/一般/需改善 |
| notes | String? | Optional | User notes |
| textDescription | String? | Optional | Food description (no photos) |
| createdAt | DateTime | @default(now()) | Creation |
| updatedAt | DateTime | @updatedAt | Last update |

**Relations:**
- `client Client @relation(fields: [clientId], references: [id], onDelete: Cascade)`
- `photos DietPhoto[]`

**JSON Field Structure (combinedAnalysis):**
```json
{
  "totalPhotos": 3,
  "analyzedPhotos": 3,
  "avgScore": 82,
  "overallRating": "良好",
  "summary": {
    "greenFoods": ["西兰花", "鸡胸肉"],
    "yellowFoods": ["米饭"],
    "redFoods": ["炸鸡翅"],
    "totalCount": 4
  },
  "nutritionSummary": {
    "protein": "充足",
    "vegetables": "充足",
    "carbs": "充足",
    "fat": "不足",
    "fiber": "充足"
  },
  "recommendations": {
    "removals": [...],
    "additions": [...],
    "modifications": [...]
  }
}
```

**Indexes:**
- `clientId`
- `date`

---

### Consultation

**Purpose:** Consultation records with multimedia

**Fields:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, @default(cuid()) | Primary key |
| clientId | String | Foreign key | Owner client |
| consultationDate | DateTime | @default(now()) | Consultation date |
| consultationType | String | Required | Type label |
| sessionNotes | String? | Optional | Text notes |
| images | String? | Optional | JSON image array |
| textFiles | String? | Optional | JSON text file array |
| analysis | String? | Optional | JSON AI analysis |
| analyzedAt | DateTime? | Optional | Analysis time |
| createdAt | DateTime | @default(now()) | Creation |
| updatedAt | DateTime | @updatedAt | Last update |

**Relations:**
- `client Client @relation(fields: [clientId], references: [id], onDelete: Cascade)`

**JSON Field Structure:**
```json
{
  "images": [
    {
      "id": "cuid",
      "imageUrl": "data:image/jpeg;base64,...",
      "uploadedAt": "2026-01-15T10:00:00Z",
      "description": "Client progress photo"
    }
  ],
  "textFiles": [
    {
      "id": "cuid",
      "fileName": "consultation_notes.docx",
      "fileType": "docx",
      "content": "Extracted text content..."
    }
  ],
  "analysis": {
    "summary": "咨询总结...",
    "dietChanges": {...},
    "physicalConditionFeedback": {...},
    "implementationProgress": {...},
    "newProblemsAndRequirements": {...},
    "nutritionistActionItems": {...},
    "contextForRecommendations": {...}
  }
}
```

**Indexes:**
- `clientId`
- `consultationDate`

---

### PlanEvaluation

**Purpose:** Nutritionist plan safety evaluation

**Fields:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, @default(cuid()) | Primary key |
| clientId | String | Foreign key | Target client |
| planType | String | @default("diet") | diet/exercise |
| fileName | String | Required | Original filename |
| fileType | String | Required | txt/md/docx |
| originalContent | String | Required | Original text |
| extractedData | Json? | Optional | Parsed data |
| evaluation | Json | Required | Safety evaluation |
| concerns | Json | Required | Issues found |
| suggestions | Json | Required | Adjustment suggestions |
| optimizedPlan | Json? | Optional | AI-optimized plan |
| createdAt | DateTime | @default(now()) | Creation |

**Relations:**
- `client Client @relation(fields: [clientId], references: [id], onDelete: Cascade)`

**JSON Field Structure:**
```json
{
  "extractedData": {
    "diet": {
      "recommendations": [...],
      "foods": { "recommend": [...], "avoid": [...] },
      "supplements": [...],
      "meals": [...]
    },
    "exercise": {
      "recommendations": [...],
      "activities": [...],
      "precautions": [...]
    }
  },
  "evaluation": {
    "overallStatus": "safe|needs_adjustment|unsafe",
    "safetyScore": 85,
    "summary": "评估摘要",
    "keyFindings": [...]
  },
  "concerns": [
    {
      "category": "diet|exercise|supplement|lifestyle",
      "severity": "high|medium|low",
      "issue": "问题描述",
      "reason": "原因",
      "relatedIndicators": [...],
      "originalText": "原文引用"
    }
  ],
  "suggestions": [
    {
      "concernId": 0,
      "action": "replace|modify|remove|add",
      "description": "调整说明",
      "recommendation": "具体建议",
      "alternatives": [...],
      "rationale": "理由依据"
    }
  ],
  "optimizedPlan": {
    "diet": {...},
    "exercise": {...},
    "followUp": {...}
  }
}
```

**Indexes:**
- `clientId`
- `[clientId, planType]`

---

### WeeklyDietSummary

**Purpose:** Aggregated weekly meal analysis

**Fields:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, @default(cuid()) | Primary key |
| clientId | String | Foreign key | Owner client |
| weekStartDate | String | Required | YYYY-MM-DD (Monday) |
| weekEndDate | String | Required | YYYY-MM-DD (Sunday) |
| weekNumber | Int | Required | 1-52 |
| year | Int | Required | Year |
| mealGroupIds | String | Required | JSON array of IDs |
| summary | String | Required | JSON summary content |
| recommendationId | String? | Optional Foreign key | Source plan |
| generatedAt | DateTime | @default(now()) | Generation |
| updatedAt | DateTime | @updatedAt | Last update |

**Relations:**
- `client Client @relation(fields: [clientId], references: [id], onDelete: Cascade)`

**JSON Field Structure (summary):**
```json
{
  "weekRange": "2026-01-26 至 2026-02-02",
  "isPartialWeek": false,
  "recordedDays": 7,
  "totalDaysExpected": 7,
  "statistics": {
    "totalDays": 7,
    "totalMeals": 21,
    "totalPhotos": 35,
    "avgScore": 76.5
  },
  "complianceEvaluation": {
    "overallRating": "良好",
    "scoreDistribution": {
      "excellent": { "count": 2, "meals": [...] },
      "good": { "count": 4, "meals": [...] },
      "fair": { "count": 1, "meals": [...] },
      "poor": { "count": 0, "meals": [] }
    }
  },
  "mealTypeAnalysis": {
    "breakfast": {...},
    "lunch": {...},
    "dinner": {...},
    "snack": {...}
  },
  "nutritionAnalysis": {
    "proteinStatus": "充足",
    "proteinDetails": "...",
    "vegetableStatus": "不足",
    "vegetableDetails": "...",
    "fiberStatus": "充足",
    "carbQuality": "优质",
    "fatQuality": "一般"
  },
  "foodIntakeAnalysis": {
    "greenFoodCount": 25,
    "yellowFoodCount": 12,
    "redFoodCount": 3,
    "allGreenFoods": [...],
    "allYellowFoods": [...],
    "allRedFoods": [...]
  },
  "problematicMeals": [...],
  "targetedEvaluation": {
    "healthIndicatorAlignment": [...],
    "goalProgress": [...]
  },
  "improvementRecommendations": [
    {
      "category": "keepDoing|improve|tryNew",
      "priority": "high|medium|low",
      "behavior": "...",
      "reason": "...",
      "evidence": "..."
    }
  ],
  "nextWeekGoals": {
    "primaryGoals": [...],
    "smartGoals": [...]
  },
  "nutritionistActions": {
    "followUpNeeded": true,
    "suggestedTopics": [...],
    "adjustmentsNeeded": true
  },
  "summary": {
    "overall": "本周饮食整体良好...",
    "highlights": [...],
    "concerns": [...],
    "encouragement": "继续努力..."
  }
}
```

**Indexes:**
- `clientId`
- `[clientId, weekStartDate]`
- **Unique Constraint:** `[clientId, weekStartDate]` (one summary per week per client)

---

## TypeScript Types

### Location
`types/index.ts` - Central type definitions

### Core User Types
```typescript
export type UserRole = 'ADMIN' | 'NUTRITIONIST';

export interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
```

### Client Types
```typescript
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type ActivityLevel = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';

export interface Client {
  id: string;
  userId: string;
  name: string;
  gender: Gender;
  birthDate: Date;
  height: number; // cm
  weight: number; // kg
  activityLevel: ActivityLevel;
  allergies: string[];
  medicalHistory: string[];
  preferences: string | null;
  exerciseDetails?: string | null;
  phone: string | null;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### Health Analysis Types
```typescript
export interface HealthAnalysis {
  summary: string;
  bmi: number;
  bmiCategory: '正常' | '偏瘦' | '超重' | '肥胖';
  abnormalIndicators: AbnormalIndicator[];
  nutrientDeficiencies: string[];
  riskFactors: string[];
  overallHealthScore: number; // 0-100
}

export interface AbnormalIndicator {
  indicator: string;
  value: string;
  normalRange: string;
  status: '偏高' | '偏低' | '正常';
  risk: string;
  priority: '高' | '中' | '低';
}
```

### Recommendation Types
```typescript
export type RecType = 'DIET' | 'EXERCISE' | 'LIFESTYLE' | 'COMPREHENSIVE';

export interface Recommendation {
  id: string;
  clientId: string;
  reportId: string | null;
  type: RecType;
  content: DietRecommendation | ExerciseRecommendation | LifestyleRecommendation | ComprehensiveRecommendation;
  generatedAt: Date;
}

export interface DietRecommendation {
  dailyCalorieTarget: number;
  macroTargets: {
    protein: number;
    carbs: number;
    fat: number;
  };
  foodsToEat: FoodItem[];
  foodsToAvoid: FoodItem[];
  supplements: Supplement[];
  mealPlan: MealPlan;
}

export interface FoodItem {
  food: string;
  reason: string;
  nutrients?: string[];
}

export interface Supplement {
  name: string;
  dosage: string;
  reason: string;
}

export interface MealPlan {
  breakfast: string[];
  lunch: string[];
  dinner: string[];
  snacks: string[];
}
```

### Diet Analysis Types
```typescript
export interface DietComplianceEvaluation {
  foods: FoodItemInPhoto[];
  mealType: string;
  description: string;
  complianceEvaluation: ComplianceEvaluation;
  improvementSuggestions: ImprovementSuggestions;
  mealPlanAlignment: MealPlanAlignment;
  healthConcernsAlignment: HealthConcernsAlignment;
  personalizedRecommendations?: PersonalizedRecommendation[];
}

export interface ComplianceEvaluation {
  overallScore: number; // 0-100
  overallRating: '优秀' | '良好' | '一般' | '需改善';
  calorieMatch: CalorieMatch;
  macroMatch: MacroMatch;
  nutritionBalance?: NutritionBalance;
  foodTrafficLightCompliance: FoodTrafficLightCompliance;
  biomarkerCompliance: BiomarkerCompliance;
}
```

### Consultation Types
```typescript
export interface Consultation {
  id: string;
  clientId: string;
  consultationDate: Date;
  consultationType: string;
  sessionNotes: string | null;
  images: ConsultationImage[] | null;
  textFiles: TextFile[] | null;
  analysis: ConsultationAnalysis | null;
  analyzedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsultationAnalysis {
  summary: string;
  dietChanges: {
    reportedChanges: string[];
    newPreferences: string[];
    complianceLevel: 'high' | 'medium' | 'low';
    complianceReason?: string;
  };
  physicalConditionFeedback: {
    symptoms: Array<{
      symptom: string;
      status: '改善' | '无变化' | '恶化';
      details: string;
    }>;
    energyLevel: string;
    digestiveHealth: string;
    sleepQuality: string;
    otherFeedback: string[];
  };
  implementationProgress: {...};
  newProblemsAndRequirements: {...};
  nutritionistActionItems: {...};
  contextForRecommendations: {...};
}
```

### Weekly Summary Types
```typescript
export interface WeeklyDietSummary {
  id: string;
  clientId: string;
  weekStartDate: string;
  weekEndDate: string;
  weekNumber: number;
  year: number;
  mealGroupIds: string[];
  summary: WeeklyDietSummaryContent;
  recommendationId: string | null;
  generatedAt: Date;
  updatedAt: Date;
}

export interface WeeklyDietSummaryContent {
  weekRange: string;
  isPartialWeek?: boolean;
  recordedDays?: number;
  totalDaysExpected?: number;
  statistics: {
    totalDays: number;
    totalMeals: number;
    totalPhotos: number;
    avgScore: number;
  };
  complianceEvaluation: {
    overallRating: '优秀' | '良好' | '一般' | '需改善';
    scoreDistribution: {
      excellent: {...};
      good: {...};
      fair: {...};
      poor: {...};
    };
  };
  mealTypeAnalysis?: {...};
  nutritionAnalysis: {...};
  foodIntakeAnalysis: {...};
  problematicMeals?: [...];
  targetedEvaluation: {...};
  improvementRecommendations?: [...];
  nextWeekGoals: {...};
  nutritionistActions: {...};
  summary: {
    overall: string;
    highlights: string[];
    concerns: string[];
    encouragement: string;
  };
}
```

---

## Data Relationships

### Entity Relationship Diagram
```
User (1) ──┬── (N) Client
            │
            ├── (1) Client ──┬── (N) Report ──┬─ (N) Recommendation
            │                 │                 │
            │                 ├── (N) Recommendation (direct)
            │                 │
            │                 ├── (N) DietPhoto ──┬─ (1) DietPhotoMealGroup
            │                 │                   │
            │                 ├── (N) Consultation
            │                 │
            │                 ├── (N) PlanEvaluation
            │                 │
            │                 └── (N) WeeklyDietSummary ──┬─ (1) Recommendation
            │                                             │
            └── (1) Recommendation ───────────────────────┘
```

### Cascade Rules
- **User deleted →** Clients deleted (CASCADE)
- **Client deleted →** All related data deleted (CASCADE)
- **Report deleted →** Recommendations orphaned (SET NULL)
- **DietPhotoMealGroup deleted →** DietPhotos deleted (CASCADE)
- **Recommendation deleted →** WeeklySummaries orphaned (no cascade)

---

## Data Validation

### Database Level (Prisma)
- **Required fields:** Non-nullable columns
- **Unique constraints:** email
- **Foreign keys:** Referential integrity
- **Enums:** Restricted values

### Application Level (Zod)
```typescript
const createClientSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  birthDate: z.string().min(1, '出生日期不能为空'),
  height: z.string().min(1, '身高不能为空'),
  weight: z.string().min(1, '体重不能为空'),
  activityLevel: z.enum(['SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE']),
  allergies: z.string().default('[]'),
  medicalHistory: z.string().default('[]'),
  healthConcerns: z.string().default('[]'),
  preferences: z.string().optional(),
  userRequirements: z.string().optional(),
  exerciseDetails: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
});
```

---

## Data Migration Strategy

### Development
```bash
npx prisma db push      # Apply schema changes
npx prisma studio       # Visual database browser
```

### Production
```bash
npx prisma migrate deploy  # Apply migrations
npx prisma migrate reset    # Reset database (dev only)
```

### Schema Changes
1. Update `prisma/schema.prisma`
2. Run `npx prisma db push` (dev) or `npx prisma migrate dev` (prod)
3. Regenerate types: `npx prisma generate`

---

## Data Access Patterns

### Prisma Client Usage
```typescript
// Single record
const client = await prisma.client.findUnique({
  where: { id: clientId },
});

// Related records
const clientWithReports = await prisma.client.findUnique({
  where: { id: clientId },
  include: {
    reports: true,
    recommendations: true,
  },
});

// Filtering
const userClients = await prisma.client.findMany({
  where: { userId: userId },
  orderBy: { createdAt: 'desc' },
});

// Aggregation
const stats = await prisma.dietPhoto.groupBy({
  by: ['clientId'],
  _count: true,
});
```

---

## Performance Considerations

### Indexes
- Added on: `DietPhoto.clientId`, `DietPhoto.mealGroupId`
- Added on: `DietPhotoMealGroup.clientId`, `DietPhotoMealGroup.date`
- Added on: `Consultation.clientId`, `Consultation.consultationDate`
- Added on: `PlanEvaluation.clientId`, `[PlanEvaluation.clientId, planType]`
- Added on: `WeeklyDietSummary.clientId`, `[WeeklyDietSummary.clientId, weekStartDate]`

### Query Optimization
- Use `select` to limit returned fields
- Use `include` vs `select` based on needs
- Batch queries with `findMany` where possible
- Consider connection pooling for production

### JSON Field Storage
- Pros: Flexible schema, easy to update
- Cons: No queryable indexes, larger storage
- Recommendation: Use for AI-generated content, query in application layer

---

## Backup & Recovery

### Development (SQLite)
```bash
# Backup
cp prisma/dev.db prisma/dev.db.backup

# Restore
cp prisma/dev.db.backup prisma/dev.db
```

### Production (PostgreSQL)
- Use database provider's backup tools
- Regular automated backups
- Point-in-time recovery capability

---

## Security Considerations

### Data Protection
- Passwords: Hashed with bcrypt
- Images: Base64 encoded (consider object storage)
- Sensitive health data: JSON in database (encrypt at rest for production)

### Access Control
- User isolation via `userId` foreign key
- Client ownership verification in API routes
- No cross-user data access

---

## Data Statistics

### Estimated Storage Per Client
| Entity | Records | Size (avg) | Total |
|--------|---------|------------|-------|
| Client | 1 | 2 KB | 2 KB |
| Reports | 5 | 500 KB | 2.5 MB |
| Recommendations | 3 | 100 KB | 300 KB |
| Diet Photos | 50 | 1 MB | 50 MB |
| Meal Groups | 20 | 50 KB | 1 MB |
| Consultations | 12 | 200 KB | 2.4 MB |
| Weekly Summaries | 12 | 50 KB | 600 KB |
| **Total** | **103** | - | **~57 MB** |

### Scaling Estimates
- 100 clients: ~5.7 GB
- 1,000 clients: ~57 GB
- 10,000 clients: ~570 GB

**Note:** Actual usage varies based on image sizes and retention policy.

---

## Future Data Enhancements

1. **Time-Series Data:** Health metrics tracking over time
2. **Document Storage:** Migrate Base64 to object storage (S3)
3. **Data Retention:** Automated archival of old records
4. **Audit Trail:** Track all data changes
5. **Export/Import:** Client data portability
6. **Analytics:** Aggregated insights dashboard
7. **Data Encryption:** At-rest encryption for sensitive fields
8. **Full-Text Search:** PostgreSQL full-text search for notes

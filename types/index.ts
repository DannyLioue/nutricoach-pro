// 用户相关类型
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

// 客户相关类型
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
  exerciseDetails?: string | null; // 运动详情（器材、环境、经验等）
  phone: string | null;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// 报告相关类型
export interface Report {
  id: string;
  clientId: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  extractedData: Record<string, any>;
  analysis: HealthAnalysis | null;
  uploadedAt: Date;
}

// 健康分析类型
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

// 建议相关类型
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

export interface ExerciseRecommendation {
  weeklyGoal: string;
  workouts: Workout[];
  precautions: string[];
}

export interface Workout {
  type: string;
  duration: string;
  intensity: '低' | '中' | '高';
  frequency: string;
  description: string;
}

export interface LifestyleRecommendation {
  sleep: string;
  hydration: string;
  stressManagement: string[];
}

export interface ComprehensiveRecommendation {
  diet: DietRecommendation;
  exercise: ExerciseRecommendation;
  lifestyle: LifestyleRecommendation;
}

// 饮食照片分析类型
export interface DietAnalysis {
  mealType: string;
  description: string;
  foods: FoodItemInPhoto[];
  nutritionBalance: NutritionBalance;
  issues: DietIssue[];
  suggestions: DietSuggestion[];
  overallScore: number;
  overallRating: '优秀' | '良好' | '一般' | '需改善';
}

export interface FoodItemInPhoto {
  name: string;
  category: string;
  portion: string;
  cookingMethod: string;
}

export interface NutritionBalance {
  protein: string;
  vegetables: string;
  carbs: string;
  fat: string;
  fiber: string;
}

export interface DietIssue {
  type: string;
  severity: '高' | '中' | '低';
  description: string;
}

export interface DietSuggestion {
  category: string;
  content: string;
}

// ==================== 饮食合规评估类型 ====================
// 用于基于营养干预方案的饮食照片合规性评估

export interface PersonalizedRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: 'health-concern' | 'user-requirement' | 'nutrition-balance';
  recommendation: string;
  reason: string;
}

export interface DietComplianceEvaluation {
  // 食物识别
  foods: FoodItemInPhoto[];
  mealType: string;
  description: string;

  // 合规性评估
  complianceEvaluation: ComplianceEvaluation;

  // 改善建议
  improvementSuggestions: ImprovementSuggestions;

  // 膳食计划对齐度
  mealPlanAlignment: MealPlanAlignment;

  // 健康问题对齐度
  healthConcernsAlignment: HealthConcernsAlignment;

  // 个性化建议（基于客户健康问题和需求）
  personalizedRecommendations?: PersonalizedRecommendation[];
}

export interface ComplianceEvaluation {
  overallScore: number; // 0-100
  overallRating: '优秀' | '良好' | '一般' | '需改善';

  // 热量匹配
  calorieMatch: CalorieMatch;

  // 营养素匹配
  macroMatch: MacroMatch;

  // 营养平衡评估
  nutritionBalance?: NutritionBalance;

  // 红绿灯食物合规性
  foodTrafficLightCompliance: FoodTrafficLightCompliance;

  // 生物标志物合规性
  biomarkerCompliance: BiomarkerCompliance;
}

export interface CalorieMatch {
  estimatedCalories: number;
  targetCalories: number;
  percentage: number;
  status: 'within' | 'under' | 'over';
}

export interface MacroMatch {
  protein: MacroStatus;
  carbs: MacroStatus;
  fat: MacroStatus;
}

export interface MacroStatus {
  actual: number;
  target: number;
  status: 'within' | 'under' | 'over';
}

export interface FoodTrafficLightCompliance {
  greenFoods: string[]; // 绿灯食物
  yellowFoods: string[]; // 黄灯食物
  redFoods: string[]; // 红灯食物（违规）
  unknownFoods: string[]; // 未分类食物
}

export interface BiomarkerCompliance {
  compliantIndicators: string[]; // 有利改善的异常指标
  violatingIndicators: string[]; // 不利改善的异常指标
  neutralIndicators: string[]; // 无影响的异常指标
}

export interface ImprovementSuggestions {
  priority: 'high' | 'medium' | 'low';

  // 需要移除的食物
  removals: RemovalSuggestion[];

  // 需要添加的食物
  additions: AdditionSuggestion[];

  // 需要修改的食物
  modifications: ModificationSuggestion[];

  // 份量调整
  portionAdjustments: PortionAdjustment[];
}

export interface RemovalSuggestion {
  food: string;
  reason: string;
  alternatives: string[];
}

export interface AdditionSuggestion {
  food: string;
  reason: string;
  targetMeal: string;
  amount: string;
}

export interface ModificationSuggestion {
  food: string;
  currentIssue: string;
  suggestedChange: string;
  reason: string;
}

export interface PortionAdjustment {
  food: string;
  currentPortion: string;
  suggestedPortion: string;
  reason: string;
}

export interface MealPlanAlignment {
  matchesTargetMeal: boolean;
  targetMealType: string; // breakfast/lunch/dinner/snack
  alignmentScore: number; // 0-100
  suggestions: string[];
}

export interface HealthConcernsAlignment {
  concernedHealthIssues: string[];
  supportiveFoods: string[]; // 有利食物
  harmfulFoods: string[]; // 不利食物
  overallImpact: 'positive' | 'neutral' | 'negative';
}

// ==================== 表单类型 ====================
export interface ClientFormData {
  name: string;
  gender: Gender;
  birthDate: string;
  height: number;
  weight: number;
  activityLevel: ActivityLevel;
  allergies: string[];
  medicalHistory: string[];
  preferences: string;
  phone: string;
  email: string;
}

// ==================== 食谱组类型 ====================
export interface DietPhotoMealGroup {
  id: string;
  clientId: string;
  name: string;
  date: string; // YYYY-MM-DD
  mealType: '早餐' | '午餐' | '晚餐' | '加餐' | '全天' | null;
  totalScore: number | null;
  overallRating: '优秀' | '良好' | '一般' | '需改善' | null;
  combinedAnalysis: CombinedMealAnalysis | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  photos: DietPhotoInGroup[];
}

export interface DietPhotoInGroup {
  id: string;
  clientId: string;
  mealGroupId: string;
  imageUrl: string;
  uploadedAt: Date;
  mealType: string | null;
  notes: string | null;
  analysis: DietComplianceEvaluation | null;
  analyzedAt: Date | null;
}

export interface CombinedMealAnalysis {
  totalPhotos: number;
  analyzedPhotos: number;
  avgScore: number;
  overallRating: '优秀' | '良好' | '一般' | '需改善';
  summary: {
    greenFoods: string[];
    yellowFoods: string[];
    redFoods: string[];
    totalCount: number;
  };
  nutritionSummary?: NutritionBalance & {
    details?: {
      protein: { 充足: number; 不足: number; 缺乏: number };
      vegetables: { 充足: number; 不足: number; 缺乏: number };
      carbs: { 充足: number; 不足: number; 缺乏: number };
      fat: { 充足: number; 不足: number; 缺乏: number };
      fiber: { 充足: number; 不足: number; 缺乏: number };
    };
  };
  recommendations: {
    personalized?: PersonalizedRecommendation[];
    general?: {
      removals: Array<RemovalSuggestion & { photoId: string }>;
      additions: Array<AdditionSuggestion & { photoId: string }>;
      modifications: Array<ModificationSuggestion & { photoId: string }>;
    };
    removals?: Array<RemovalSuggestion & { photoId: string }>;
    additions?: Array<AdditionSuggestion & { photoId: string }>;
    modifications?: Array<ModificationSuggestion & { photoId: string }>;
  };
  photoAnalysis: Array<{
    photoId: string;
    evaluation?: DietComplianceEvaluation;
    error?: string;
  }>;
}

export interface CreateMealGroupFormData {
  name: string;
  date: string;
  mealType: '早餐' | '午餐' | '晚餐' | '加餐' | '全天';
  notes: string;
  textDescription?: string; // 文字描述（用于没有照片的情况）
  photos?: Array<{
    data: string;
    mealType: string;
    notes: string;
  }>;
}

// ==================== 详细运动处方类型 ====================
// 用于两周的详细运动计划

export interface ExerciseEquipment {
  owned: string[];
  recommended: Array<{
    item: string;
    reason: string;
    priority?: 'essential' | 'helpful' | 'optional';
    alternatives?: string[];
  }>;
}

export interface ExerciseSet {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  intensity: string;
  notes?: string;
  targetMuscle?: string;
}

export interface TrainingDay {
  day: string;
  type: string;
  duration: string;
  focus?: string;
  exercises: ExerciseSet[];
  totalVolume?: string;
}

export interface WeeklySchedule {
  week: number;
  focus: string;
  notes?: string;
  days: TrainingDay[];
}

export interface DetailedExercisePrescription {
  overview: string;
  goals: string[];
  equipment: ExerciseEquipment;
  weeklySchedule: WeeklySchedule[];
  progression: string;
  precautions: string[];
  successCriteria: string[];
}

// ==================== 咨询记录类型 ====================

// 文本文件（上传的文本文件，支持.txt, .md, .doc, .docx格式）
export interface TextFile {
  id: string;
  fileName: string;              // 原始文件名
  fileType: 'txt' | 'md' | 'doc' | 'docx';
  content: string;               // 提取的文本内容
  uploadedAt: Date;
}

export interface Consultation {
  id: string;
  clientId: string;
  consultationDate: Date;
  consultationType: string;
  sessionNotes: string | null;
  images: ConsultationImage[] | null;
  textFiles: TextFile[] | null;   // 替代audioFiles
  analysis: ConsultationAnalysis | null;
  analyzedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsultationImage {
  id: string;
  imageUrl: string; // Base64
  uploadedAt: Date;
  description?: string;
}

export interface ConsultationAnalysis {
  // 咨询总结
  summary: string;

  // 饮食变化识别
  dietChanges: {
    reportedChanges: string[];
    newPreferences: string[];
    complianceLevel: 'high' | 'medium' | 'low';
    complianceReason?: string;
  };

  // 身体状况反馈
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

  // 实施进展
  implementationProgress: {
    followedRecommendations: Array<{
      recommendation: string;
      effect: string;
    }>;
    challenges: Array<{
      challenge: string;
      impact: string;
    }>;
    missedRecommendations: Array<{
      recommendation: string;
      reason: string;
    }>;
    lifestyleAdjustments: string[];
  };

  // 新问题/需求
  newProblemsAndRequirements: {
    newHealthConcerns: string[];
    newGoals: string[];
    newConstraints: string[];
    questions: string[];
  };

  // 营养师行动建议
  nutritionistActionItems: {
    priority: 'high' | 'medium' | 'low';
    followUpActions: string[];
    recommendationsToAdjust: string[];
    additionalAssessments: string[];
  };

  // 上下文信息（用于生成建议）
  contextForRecommendations: {
    updatedPreferences: string[];
    updatedAllergies: string[];
    updatedConstraints: string[];
    moodAndMotivation: string;
  };
}

export interface CreateConsultationFormData {
  consultationType: string;
  sessionNotes?: string;
  images?: Array<{
    data: string; // Base64
    description?: string;
  }>;
  textFiles?: Array<{
    data: string; // Base64
    fileName: string;
    fileSize: number;
    content?: string;
    fileType?: 'txt' | 'md' | 'doc' | 'docx';
  }>;
}

// ==================== 营养师计划评估类型 ====================

// 营养师计划评估
export interface PlanEvaluation {
  id: string;
  clientId: string;
  fileName: string;
  fileType: string;
  originalContent: string;
  extractedData?: ExtractedPlanData;
  evaluation: PlanEvaluationResult;
  concerns: Concern[];
  suggestions: Suggestion[];
  createdAt: Date;
}

// AI 提取的计划数据
export interface ExtractedPlanData {
  diet?: {
    recommendations: string[];      // 饮食建议文本
    foods: {
      recommend: string[];          // 推荐食物
      avoid: string[];              // 避免食物
    };
    supplements: Array<{           // 补充剂
      name: string;
      dosage: string;
      frequency: string;
    }>;
    meals: Array<{                 // 餐食建议
      type: string;                // 早餐/午餐/晚餐/加餐
      foods: string[];
    }>;
  };
  exercise?: {
    recommendations: string[];      // 运动建议文本
    activities: Array<{            // 运动项目
      type: string;                // 运动类型
      duration: string;            // 时长
      frequency: string;           // 频率
      intensity: string;           // 强度
    }>;
    precautions: string[];         // 注意事项
  };
}

// 评估结果
export interface PlanEvaluationResult {
  overallStatus: 'safe' | 'needs_adjustment' | 'unsafe';
  safetyScore: number;             // 0-100
  summary: string;                 // 总体评估摘要
  keyFindings: string[];           // 关键发现
}

// 具体问题
export interface Concern {
  category: 'diet' | 'exercise' | 'supplement' | 'lifestyle';
  severity: 'high' | 'medium' | 'low';
  issue: string;                   // 问题描述
  reason: string;                  // 为什么是问题
  relatedIndicators: string[];     // 相关的健康指标
  originalText?: string;           // 原文引用
}

// 调整建议
export interface Suggestion {
  concernId: number;               // 对应的 concern
  action: 'replace' | 'modify' | 'remove' | 'add';
  description: string;             // 调整说明
  recommendation: string;          // 具体建议
  alternatives?: string[];         // 替代方案
  rationale: string;               // 理由依据
}

// ==================== 周饮食汇总类型 ====================
// 用于本周饮食记录的汇总分析和建议

export interface WeeklyDietSummary {
  id: string;
  clientId: string;
  weekStartDate: string;           // 周一日期 YYYY-MM-DD
  weekEndDate: string;             // 周日日期 YYYY-MM-DD
  weekNumber: number;              // 年内周序号 (1-52)
  year: number;                    // 年份
  mealGroupIds: string[];          // 本周包含的食谱组ID列表
  summary: WeeklyDietSummaryContent;
  recommendationId: string | null; // 依据的推荐方案ID
  generatedAt: Date;
  updatedAt: Date;
}

export interface WeeklyDietSummaryContent {
  // 基本信息
  weekRange: string;               // "2026-01-27 至 2026-02-02"
  isPartialWeek?: boolean;         // 是否为部分周数据（本周未过完）
  recordedDays?: number;           // 实际记录天数
  totalDaysExpected?: number;      // 本周应记录天数（完整周为7，部分周为已过天数）

  // 数据统计
  statistics: {
    totalDays: number;             // 本周记录天数
    totalMeals: number;            // 总餐次
    totalPhotos: number;           // 总照片数
    avgScore: number;              // 平均合规分
    recordedDays?: number;         // 实际记录天数
    totalDaysInWeek?: number;      // 本周应记录天数
  };

  // 合规性评估
  complianceEvaluation: {
    overallRating: '优秀' | '良好' | '一般' | '需改善';
    scoreDistribution: {
      excellent: {
        count: number;
        meals: Array<{
          date: string;
          mealType: string;
          score: number;
          reason?: string;  // 评分理由：为什么这餐得这个分数
          highlights?: string[];  // 亮点：做得好的地方
          issues?: string[];  // 问题：需要改善的地方
        }>;
      };
      good: {
        count: number;
        meals: Array<{
          date: string;
          mealType: string;
          score: number;
          reason?: string;
          highlights?: string[];
          issues?: string[];
        }>;
      };
      fair: {
        count: number;
        meals: Array<{
          date: string;
          mealType: string;
          score: number;
          reason?: string;
          highlights?: string[];
          issues?: string[];
        }>;
      };
      poor: {
        count: number;
        meals: Array<{
          date: string;
          mealType: string;
          score: number;
          reason?: string;
          highlights?: string[];
          issues?: string[];
        }>;
      };
    };
  };

  // 按餐次分析
  mealTypeAnalysis?: {
    breakfast: {
      count: number;
      avgScore: number;
      allMeals?: Array<{ date: string; score: number; protein?: string; vegetable?: string }>;
      bestMeal: { date: string; score: number };
      worstMeal: { date: string; score: number; issues: string[] };
      proteinDeficientCount: number;
      vegetableDeficientCount: number;
      redFoodOccurrences: Array<{
        food: string;
        date: string;
        reason: string;
      }>;
    };
    lunch: {
      count: number;
      avgScore: number;
      allMeals?: Array<{ date: string; score: number; protein?: string; vegetable?: string }>;
      bestMeal: { date: string; score: number };
      worstMeal: { date: string; score: number; issues: string[] };
      proteinDeficientCount: number;
      vegetableDeficientCount: number;
      redFoodOccurrences: Array<{
        food: string;
        date: string;
        reason: string;
      }>;
    };
    dinner: {
      count: number;
      avgScore: number;
      allMeals?: Array<{ date: string; score: number; protein?: string; vegetable?: string }>;
      bestMeal: { date: string; score: number };
      worstMeal: { date: string; score: number; issues: string[] };
      proteinDeficientCount: number;
      vegetableDeficientCount: number;
      redFoodOccurrences: Array<{
        food: string;
        date: string;
        reason: string;
      }>;
    };
    snack: {
      count: number;
      avgScore: number;
      allMeals?: Array<{ date: string; score: number; protein?: string; vegetable?: string }>;
      bestMeal: { date: string; score: number };
      worstMeal: { date: string; score: number; issues: string[] };
      proteinDeficientCount: number;
      vegetableDeficientCount: number;
      redFoodOccurrences: Array<{
        food: string;
        date: string;
        reason: string;
      }>;
    };
  };

  // 营养素分析
  nutritionAnalysis: {
    proteinStatus: '充足' | '不足' | '缺乏';
    proteinDetails?: string;       // 详细说明哪几餐不足
    proteinBreakdown?: {
      sufficientCount: number;
      insufficientCount: number;
      lackingCount: number;
      mealsByStatus: {
        sufficient: Array<{ date: string; mealType: string; source?: string }>;
        insufficient: Array<{ date: string; mealType: string; issue: string }>;
        lacking: Array<{ date: string; mealType: string; issue: string }>;
      };
    };
    vegetableStatus: '充足' | '不足' | '缺乏';
    vegetableDetails?: string;     // 详细说明哪几餐不足
    vegetableBreakdown?: {
      sufficientCount: number;
      insufficientCount: number;
      lackingCount: number;
      mealsByStatus: {
        sufficient: Array<{ date: string; mealType: string; types?: string[] }>;
        insufficient: Array<{ date: string; mealType: string; amount: string }>;
        lacking: Array<{ date: string; mealType: string; issue: string }>;
      };
    };
    fiberStatus: '充足' | '不足' | '缺乏';
    fiberDetails?: string;         // 详细说明
    fiberBreakdown?: {
      sources: string[];
      avgDailyGrams: number;
      targetGrams: number;
    };
    carbQuality: '优质' | '一般' | '较差';
    carbDetails?: string;
    fatQuality: '优质' | '一般' | '较差';
    fatDetails?: string;
    avgDailyCalories?: number;
    calorieMatchRate?: number;     // 与目标热量匹配率
  };

  // 食物摄入分析
  foodIntakeAnalysis: {
    greenFoodCount: number;
    yellowFoodCount: number;
    redFoodCount: number;
    allGreenFoods?: Array<{
      food: string;
      count: number;
      meals: string[];
      benefits?: string;
    }>;
    allYellowFoods?: Array<{
      food: string;
      count: number;
      meals: string[];
      note?: string;
    }>;
    allRedFoods?: Array<{
      food: string;
      count: number;
      meals: string[];
      healthImpact?: string;
      reason?: string;
    }>;
    mostFrequentGreenFoods: Array<{
      food: string;
      count: number;
      meals: string[];             // 如 ["1/15午餐", "1/17晚餐"]
    }>;
    mostFrequentRedFoods: Array<{
      food: string;
      count: number;
      meals: string[];             // 如 ["1/14午餐", "1/16晚餐", "1/18午餐"]
      healthImpact?: string;       // 如 "高脂肪高热量"
    }>;
    redFoodTrends: Array<{
      food: string;
      occurrences: number;
      trend: 'increasing' | 'stable' | 'decreasing';
      suggestion?: string;         // 替代建议
    }>;
  };

  // 问题餐次列表
  problematicMeals?: Array<{
    date: string;
    mealType: string;
    score: number;
    issues: Array<{
      type: string;                // "nutrition" | "food"
      description: string;
    }>;
    suggestion: string;
  }>;

  // 针对性评价（结合体检指标和方案）
  targetedEvaluation: {
    healthIndicatorAlignment: Array<{
      indicator: string;           // 如"血脂偏高"
      impact: 'positive' | 'neutral' | 'negative';
      evidence: string;            // 判断依据，包含具体日期
    }>;
    goalProgress: Array<{
      goal: string;                 // 如"减重"
      progress: 'on_track' | 'needs_improvement' | 'off_track';
      assessment: string;
      specificIssues?: string[];   // 具体问题列表
    }>;
  };

  // 改进建议 - 统一数组格式
  improvementRecommendations?: Array<{
    category: 'keepDoing' | 'improve' | 'tryNew';
    priority?: 'high' | 'medium' | 'low';
    // keepDoing 字段
    behavior?: string;
    reason?: string;
    evidence?: string;             // 数据支持
    // improve 字段
    issue?: string;
    quantification?: string;       // 量化指标
    healthImpact?: string;         // 健康影响
    suggestion?: string;
    actionSteps?: string[];
    expectedOutcome?: string;
    alternatives?: string[];       // 替代方案
    // tryNew 字段
    howTo?: string;
  }> | {
    // 旧格式兼容
    priority: 'high' | 'medium' | 'low';
    keepDoing: Array<{
      behavior: string;
      reason: string;
      evidence?: string;
    }>;
    improve: Array<{
      issue: string;
      evidence?: string;
      quantification?: string;
      healthImpact?: string;
      suggestion: string;
      actionSteps: string[];
      expectedOutcome: string;
      alternatives?: string[];
    }>;
    tryNew: Array<{
      suggestion: string;
      reason: string;
      howTo: string;
    }>;
  };

  // 下周目标
  nextWeekGoals: {
    primaryGoals: string[];        // 包含基线和目标，如"每日晚餐蔬菜≥200g（本周仅43%达标）"
    smartGoals: Array<{
      goal: string;
      measurable: string;
      achievable: string;
      relevant: string;
      timeBound: string;
      baseline?: string;           // 基线数据
      target?: string;             // 目标数据
    }>;
  };

  // 营养师行动项
  nutritionistActions: {
    followUpNeeded: boolean;
    suggestedTopics: string[];     // 下次咨询的话题
    adjustmentsNeeded: boolean;
    recommendationAdjustments?: string[];
  };

  // AI总结
  summary: {
    overall: string;               // 2-3句话总体评价
    highlights: string[];          // 本周亮点
    concerns: string[];            // 需要关注的问题
    encouragement: string;         // 鼓励性话语
  };
}

// ==================== 任务进度跟踪类型 ====================
// 用于断点续传功能

export type {
  TaskType,
  TASK_STEPS,
  WeeklySummaryTaskParameters,
  WeeklySummaryIntermediateData,
  WeeklySummaryResultData,
  TaskParameters,
  TaskIntermediateData,
  TaskResultData,
  TaskProgressResponse,
  TaskSSEEventType,
  TaskSSEEvent,
  StepProgress,
  TaskCreateResponse,
  TaskStatusResponse,
  TaskOperationResponse,
  TaskOptions,
} from './task-progress';

export { TaskStatus } from './task-progress';

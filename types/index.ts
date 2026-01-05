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

// 表单类型
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

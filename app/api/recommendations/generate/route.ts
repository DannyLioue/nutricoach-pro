import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { DETAILED_EXERCISE_PRESCRIPTION_PROMPT } from '@/lib/ai/prompts';

// 设置 @ai-sdk/google 需要的环境变量
process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { reportId } = await request.json();

    if (!reportId) {
      return NextResponse.json({ error: '未选择报告' }, { status: 400 });
    }

    // 获取报告和分析结果
    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        client: {
          userId: session.user.id,
        },
      },
      include: {
        client: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: '报告不存在' }, { status: 404 });
    }

    if (!report.analysis || (typeof report.analysis === 'object' && 'error' in report.analysis)) {
      return NextResponse.json({ error: '该报告尚未完成 AI 分析，请先完成分析' }, { status: 400 });
    }

    // 使用 Gemini AI 生成注册营养师 (RD) 专业建议
    let recommendation;
    try {
      // 使用 @ai-sdk/google 的 gemini-2.5-flash 模型（快速且支持长文本）
      const model = google('gemini-2.5-flash');

      // 计算年龄（带校验）
      const birthDate = new Date(report.client.birthDate);
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthDate.getFullYear();

      // 年龄校验：如果年龄不合理，标记为缺失数据
      const validatedAge = age <= 0 || age > 120 ? '[Missing Data]' : `${age}岁`;

      // 解析 JSON 字符串字段
      const parseJsonArray = (jsonString: string | null): string[] => {
        if (!jsonString) return [];
        try {
          const parsed = JSON.parse(jsonString);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      };

      const allergiesList = parseJsonArray(report.client.allergies as any);
      const medicalHistoryList = parseJsonArray(report.client.medicalHistory as any);
      const healthConcernsList = parseJsonArray((report.client as any).healthConcerns);

      // 类型守卫：确保 analysis 是对象且包含 indicators
      const analysis = report.analysis as any;
      const indicators = analysis?.indicators || [];

      // 构建异常指标详情（用于生物标志物干预映射）
      const abnormalIndicators = indicators.filter((i: any) => i.status !== '正常');
      const indicatorsList = abnormalIndicators.map((i: any) =>
        `${i.name}：${i.value} ${i.unit || ''}（正常范围：${i.normalRange || '未知'}）- ${i.status}${i.risk ? ` - 风险：${i.risk}` : ''}${i.clinicalSignificance ? ` - 临床意义：${i.clinicalSignificance}` : ''}`
      ).join('\n');

      // 计算基础代谢率 (BMR) - Mifflin-St Jeor 公式
      const isMale = report.client.gender === 'MALE';
      const weight = report.client.weight;
      const height = report.client.height;
      const validAge = typeof age === 'number' && age > 0 ? age : 35; // 默认成年人
      const bmr = isMale
        ? 10 * weight + 6.25 * height - 5 * validAge + 5
        : 10 * weight + 6.25 * height - 5 * validAge - 161;

      // 计算总能量消耗 (TDEE) - 根据活动水平
      const activityMultipliers: Record<string, number> = {
        SEDENTARY: 1.2,
        LIGHT: 1.375,
        MODERATE: 1.55,
        ACTIVE: 1.725,
        VERY_ACTIVE: 1.9,
      };
      const activityLevel = report.client.activityLevel || 'MODERATE';
      const tdee = bmr * (activityMultipliers[activityLevel] || 1.55);

      // 计算BMI
      const bmi = weight / ((height / 100) ** 2);

      // 根据BMI调整热量目标
      let targetCalories = tdee;
      let weightGoal = '维持';
      if (bmi >= 24) {
        targetCalories = tdee - 500; // 制造热量缺口
        weightGoal = '减重';
      } else if (bmi < 18.5) {
        targetCalories = tdee + 300; // 制造热量盈余
        weightGoal = '增重';
      }

      // 构建专业营养干预提示词
      const prompt = `你是一位资深注册营养师 (Registered Dietitian, RD)，拥有 15 年以上专业营养治疗经验。
你必须严格遵循循证医学原则，基于医学营养治疗 (MNT) 标准生成干预方案。

## 【第一步：输入数据校验与清洗】

**客户信息：**
- 姓名：${report.client.name}
- 性别：${report.client.gender === 'MALE' ? '男' : report.client.gender === 'FEMALE' ? '女' : '其他'}
- 出生日期：${birthDate.toLocaleDateString('zh-CN')}
- 推断年龄：${validatedAge}
- 身高：${height}cm
- 体重：${weight}kg
- 活动水平：${activityLevel}
- 过敏史：${allergiesList.join('、') || '无'}
- 疾病史：${medicalHistoryList.join('、') || '无'}
- 其他健康问题：${healthConcernsList.join('、') || '无'}
- 饮食偏好：${report.client.preferences || '无'}
- **用户需求**：${(report.client as any).userRequirements || '无特殊需求'}

**数据完整性检查：**
${age <= 0 || age > 120 ? '- ⚠️ 年龄数据异常，基于身高体重推断为成年人（18-65岁）范围' : '- ✓ 数据完整'}

**体检分析结果：**
- 健康评分：${analysis.healthScore || '未评估'}分
- 分析摘要：${analysis.summary || '无'}
- 异常指标数量：${abnormalIndicators.length}项

### 异常指标详情
${indicatorsList || '无异常指标'}

## 【第二步：核心计算逻辑（思维链）**

请在思维链中完成以下定量计算：

### 2.1 人体成分评估
- **BMI 计算**: ${bmi.toFixed(1)} (体重${weight}kg / 身高${height/100}²m)
- **BMI 分类**: ${bmi < 18.5 ? '偏瘦' : bmi < 24 ? '正常' : bmi < 28 ? '超重' : '肥胖'}
- **理想体重**: ${((height / 100) ** 2 * 22).toFixed(1)}kg
- **体重目标**: ${weightGoal}

### 2.2 能量代谢计算 (Mifflin-St Jeor)
- **基础代谢率 (BMR)**: ${bmr.toFixed(0)} kcal/天
- **总能量消耗 (TDEE)**: ${tdee.toFixed(0)} kcal/天 (活动系数 ${activityMultipliers[activityLevel] || 1.55})
- **目标热量摄入**: ${targetCalories.toFixed(0)} kcal/天 (${weightGoal === '减重' ? `制造${(tdee - targetCalories).toFixed(0)}kcal热量缺口` : weightGoal === '增重' ? `制造${(targetCalories - tdee).toFixed(0)}kcal热量盈余` : '维持体重'})

### 2.3 宏量营养素分配
根据体检异常指标调整供能比：
- **标准分配**: 碳水50-60%, 蛋白质15-20%, 脂肪25-30%
${abnormalIndicators.some((i: any) => i.name?.includes('血脂') || i.name?.includes('胆固醇') || i.name?.includes('甘油三酯')) ? '- **高血脂调整**: 脂肪供能比<25%, 饱和脂肪<7%, 增加Omega-3' : ''}
${abnormalIndicators.some((i: any) => i.name?.includes('血糖') || i.name?.includes('糖化血红蛋白')) ? '- **高血糖调整**: 碳水供能比45-50%, 优先低GI食物(GI<55)' : ''}
${abnormalIndicators.some((i: any) => i.name?.includes('尿酸')) ? '- **高尿酸调整**: 限制嘌呤<150mg/天, 避免高嘌呤食物' : ''}

### 2.4 运动心率区间 (Karvonen 储备心率法)
- **最大心率**: ${220 - validAge} bpm (220 - ${validAge}岁)
- **目标心率区间** (中等强度60-70%): ${(Math.round((220 - validAge - 70) * 0.6 + 70))}-${(Math.round((220 - validAge - 70) * 0.7 + 70))} bpm

## 【第三步：输出结构化干预方案】

### 3.1 红绿灯食物指南要求（重要）

**数量要求**：
- **绿灯食物（推荐食用）**：至少 20 种，必须涵盖：
  - 蔬菜类至少 8 种（绿叶菜、十字花科、根茎类、菌菇类等）
  - 高蛋白食物至少 5 种（鱼类、禽肉、蛋类、豆制品、奶类等）
  - 主食类至少 4 种（全谷物、杂粮、薯类等）
  - 水果类至少 3 种（低GI水果优先）
  - 坚果种子类至少 2 种
  - 其他健康食物（如海藻类、发酵食品等）

- **黄灯食物（控制份量）**：至少 10 种，包括：
  - 主食类（精制谷物、高淀粉食物）
  - 高蛋白食物（红肉、全脂乳制品等）
  - 水果类（高糖水果）
  - 坚果种子类（高热量品种）
  - 调味品类（高钠、高糖调料）

- **红灯食物（严格避免）**：至少 10 种，针对异常指标：
  - 加工肉类（香肠、培根、火腿）
  - 高盐食品（腌制品、酱菜、方便面）
  - 高糖食品（含糖饮料、甜点、糖果）
  - 反式脂肪食品（油炸食品、植脂末、部分氢化植物油）
  - 针对性禁忌食物（如高尿酸患者的高嘌呤食物）

**质量要求**：
- 每种食物必须包含详细的 category 分类
- 绿灯食物必须标明关键营养素 (nutrients 数组至少 3 个)
- 理由 (reason) 必须具体到针对哪个健康指标
- 红灯食物必须提供至少 2 种替代选择 (alternatives)

请以 JSON 格式返回以下内容（必须严格遵守结构）：

{
  "dailyTargets": {
    "calories": ${Math.round(targetCalories)},
    "macros": {
      "carbs": { "grams": 数值, "kcal": 数值, "percentage": "55%" },
      "protein": { "grams": 数值, "kcal": 数值, "percentage": "20%" },
      "fat": { "grams": 数值, "kcal": 数值, "percentage": "25%" }
    },
    "fiber": "25-35g",
    "water": "2000-2500ml"
  },
  "trafficLightFoods": {
    "green": [
      {
        "food": "具体食材名称",
        "category": "食物类别（蔬菜类/高蛋白食物/主食类/水果类/坚果种子类/乳制品类）",
        "reason": "推荐理由（富含XX营养素，针对XX指标有改善作用）",
        "nutrients": ["关键营养素1", "关键营养素2", "关键营养素3"],
        "serving": "建议分量（如：每餐100-150g）",
        "frequency": "建议食用频率（如：每日2-3次 / 每餐必备 / 每周3-4次）"
      }
    ],
    "yellow": [
      {
        "food": "具体食材名称",
        "category": "食物类别",
        "reason": "需控制原因（如：热量较高、含XX成分需适量）",
        "limit": "每日限额（如：坚果类不超过15g / 全脂乳制品不超过200ml）",
        "timing": "建议食用时间（如：早餐时 / 运动后 / 作为加餐）"
      }
    ],
    "red": [
      {
        "food": "具体食材名称",
        "category": "食物类别",
        "reason": "避免原因（详细说明对健康指标的不利影响，如：高嘌呤会升高尿酸、高饱和脂肪会恶化血脂、高钠会升高血压）",
        "alternatives": ["替代食材1（如：用菠菜代替空心菜）", "替代食材2", "替代食材3"]
      }
    ]
  },
  "oneDayMealPlan": {
    "breakfast": {
      "time": "07:00-08:00",
      "meals": [
        { "food": "食物名称", "amount": "具体克数或估量单位（如：燕麦片50g/约3汤匙）", "preparation": "简单制作方法", "nutrition": "热量XXkcal，蛋白质XXg" }
      ],
      "totalCalories": "总计XX kcal",
      "macroDistribution": "碳水XXg / 蛋白质XXg / 脂肪XXg"
    },
    "lunch": { "time": "12:00-13:00", "meals": [...], "totalCalories": "总计XX kcal", "macroDistribution": "..." },
    "dinner": { "time": "18:00-19:00", "meals": [...], "totalCalories": "总计XX kcal", "macroDistribution": "..." },
    "snacks": [
      { "time": "10:00 / 15:00", "food": "加餐食物", "amount": "具体分量", "purpose": "加餐目的" }
    ],
    "dailyTotal": { "calories": "总计XX kcal", "macros": { "carbs": "XXg (XX%)", "protein": "XXg (XX%)", "fat": "XXg (XX%)" } }
  },
  "biomarkerInterventionMapping": [
    {
      "biomarker": "异常指标名称（如：同型半胱氨酸 18μmol/L）",
      "status": "偏高/偏低",
      "priority": "高/中/低（根据以下标准评估：超出正常范围50%以上或有严重健康风险=高；超出30-50%或有中等风险=中；超出30%以下或风险较小=低）",
      "mechanism": "病理生理机制解释",
      "nutritionalIntervention": "营养干预方案",
      "currentValue": 指标当前数值,
      "targetValue": 目标数值,
      "unit": "单位",
      "foodSources": [
        { "food": "食物1", "nutrient": "富含XX营养素", "amount": "建议每日XXg" },
        { "food": "食物2", "nutrient": "富含XX营养素", "amount": "建议每日XXg" },
        { "food": "食物3", "nutrient": "富含XX营养素", "amount": "建议每日XXg" }
      ],
      "supplement": {
        "name": "补充剂名称",
        "dosage": "建议剂量（如：叶酸 400μg/天）",
        "duration": "建议服用周期",
        "evidence": "循证依据（如：RCT研究显示XX）"
      },
      "monitoring": "监测指标（如：建议3个月后复查）"
    }
  ],
  "exercisePrescription": {
    "cardio": {
      "type": "有氧运动类型（如：快走、慢跑、游泳）",
      "frequency": "每周X次",
      "duration": "每次X分钟",
      "intensity": {
        "method": "Karvonen储备心率法",
        "targetZone": "目标心率区间：${(Math.round((220 - validAge - 70) * 0.6 + 70))}-${(Math.round((220 - validAge - 70) * 0.7 + 70))} bpm",
        "calculation": "(220-${validAge}-70) × 0.6-0.7 + 70",
        "rpe": "主观疲劳度：12-13级（有点累）"
      },
      "timing": "建议运动时间（如：餐后1小时）",
      "precautions": ["注意事项1", "注意事项2"]
    },
    "resistance": {
      "type": "力量训练类型",
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
      "focus": "重点拉伸部位"
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
  "healthConcernsInterventions": {
    "title": "其他健康问题专项干预",
    "description": "针对客户报告的具体健康问题提供的营养和生活方式干预方案",
    "concerns": [
      {
        "concern": "健康问题名称（如：失眠、便秘、关节疼痛、消化不良、疲劳乏力、皮肤问题、记忆力下降等）",
        "severity": "轻度/中度/重度（根据客户描述评估）",
        "nutritionalStrategy": {
          "title": "营养干预策略",
          "keyFoods": [
            { "food": "推荐食物1", "reason": "推荐理由（含XX营养素，具有XX功效）", "amount": "建议每日分量", "timing": "最佳食用时间" },
            { "food": "推荐食物2", "reason": "推荐理由", "amount": "建议每日分量", "timing": "最佳食用时间" },
            { "food": "推荐食物3", "reason": "推荐理由", "amount": "建议每日分量", "timing": "最佳食用时间" }
          ],
          "avoidFoods": [
            { "food": "避免/限制食物1", "reason": "可能加重症状的原因" },
            { "food": "避免/限制食物2", "reason": "可能加重症状的原因" }
          ],
          "supplements": [
            { "name": "补充剂名称", "dosage": "剂量", "duration": "服用周期", "evidence": "循证依据" }
          ],
          "mealTiming": "进餐时间建议（如：失眠者晚餐时间、消化不良者少食多餐等）"
        },
        "lifestyleModifications": {
          "title": "生活方式调整",
          "morningRoutine": ["早晨建议1", "早晨建议2"],
          "dailyHabits": ["日间习惯1", "日间习惯2"],
          "eveningRoutine": ["晚间建议1", "晚间建议2"],
          "weeklyActivities": ["每周活动建议1", "每周活动建议2"]
        },
        "targetedNutrients": [
          { "nutrient": "营养素名称", "dailyAmount": "建议每日摄入量", "foodSources": ["食物来源1", "食物来源2"], "function": "该营养素对健康问题的作用机制" }
        ],
        "sampleMeals": {
          "title": "针对性食谱示例",
          "breakfast": "针对该健康问题的早餐建议",
          "lunch": "针对该健康问题的午餐建议",
          "dinner": "针对该健康问题的晚餐建议",
          "snacks": "针对该健康问题的加餐建议"
        },
        "progressTracking": {
          "title": "效果追踪",
          "symptoms": ["需要改善的症状1", "症状2", "症状3"],
          "metrics": ["可量化的指标1", "指标2"],
          "timeline": "预期改善时间（如：2周后初步见效，4-6周明显改善）"
        }
      }
    ],
    "commonConcerns": {
      "title": "常见健康问题干预模板（参考格式，生成时使用实际内容）",
      "insomnia": { "concern": "失眠", "keyFoods": [], "avoidFoods": [], "supplements": [], "lifestyleTips": {} },
      "constipation": { "concern": "便秘", "keyFoods": [], "avoidFoods": [], "supplements": [], "lifestyleTips": {} },
      "jointPain": { "concern": "关节疼痛", "keyFoods": [], "avoidFoods": [], "supplements": [], "lifestyleTips": {} },
      "digestiveIssues": { "concern": "消化不良", "keyFoods": [], "avoidFoods": [], "supplements": [], "lifestyleTips": {} },
      "fatigue": { "concern": "疲劳", "keyFoods": [], "avoidFoods": [], "supplements": [], "lifestyleTips": {} }
    }
  },
  "twoWeekPlan": {
    "title": "两周211饮食法改善计划",
    "description": "211饮食法：2份蔬菜+1份高蛋白食物+1份碳水/餐",
    "week1": {
      "title": "第一周：适应期",
      "focus": "建立211饮食习惯",
      "goals": ["掌握211餐盘比例", "增加蔬菜摄入"],
      "dailyPlan": [
        {
          "day": "第1-3天",
          "breakfast": "2份蔬菜+1份高蛋白食物+1份碳水",
          "lunch": "2份蔬菜+1份高蛋白食物+1份碳水",
          "dinner": "2份蔬菜+1份高蛋白食物+1份碳水",
          "snack": "蔬菜或水果",
          "tips": "使用9寸餐盘"
        },
        {
          "day": "第4-7天",
          "breakfast": "2份蔬菜+1份高蛋白食物+1份碳水",
          "lunch": "2份蔬菜+1份高蛋白食物+1份碳水",
          "dinner": "2份蔬菜+1份高蛋白食物+1份碳水",
          "snack": "坚果或酸奶",
          "tips": "注意饱腹感"
        }
      ],
      "weekendAdjustment": { "title": "周末调整", "content": "可适当放松，但保持211比例" }
    },
    "week2": {
      "title": "第二周：优化期",
      "focus": "精细化营养搭配",
      "goals": ["优化食物选择", "建立长期习惯"],
      "dailyPlan": [
        {
          "day": "第8-10天",
          "breakfast": "2份蔬菜+1份高蛋白食物+1份碳水",
          "lunch": "2份蔬菜+1份高蛋白食物+1份碳水",
          "dinner": "2份蔬菜+1份高蛋白食物+1份碳水",
          "snack": "健康零食",
          "tips": "尝试新蔬菜"
        },
        {
          "day": "第11-14天",
          "breakfast": "2份蔬菜+1份高蛋白食物+1份碳水",
          "lunch": "2份蔬菜+1份高蛋白食物+1份碳水",
          "dinner": "2份蔬菜+1份高蛋白食物+1份碳水",
          "snack": "高蛋白食物零食",
          "tips": "准备进入长期维持"
        }
      ],
      "weekendAdjustment": { "title": "周末调整", "content": "可适当放松，但保持211比例" }
    },
    "shoppingList": {
      "title": "购物清单",
      "vegetables": ["菠菜", "西兰花", "胡萝卜", "番茄", "黄瓜"],
      "proteins": ["鸡蛋", "鸡胸肉", "鱼类", "豆腐"],
      "carbs": ["燕麦", "糙米", "红薯", "全麦面包"],
      "healthyFats": ["坚果", "橄榄油", "牛油果"]
    },
    "trackingTools": {
      "title": "追踪工具",
      "plateVisual": "9寸餐盘：1/2蔬菜，1/4蛋白，1/4碳水",
      "dailyChecklist": ["每餐遵循211比例", "蔬菜500g+", "饮水2000ml+"],
      "weeklyMetrics": ["体重", "腰围", "精力水平"]
    },
    "expectedOutcomes": {
      "title": "预期效果",
      "physical": ["体重稳定", "精力提升"],
      "habitual": ["建立211饮食习惯", "学会餐盘搭配"],
      "biomarkers": ["血脂改善", "血糖稳定"]
    }
  }
}

## 【重要：根据用户需求定制方案】

**优先级原则**：
1. **用户需求是最高优先级** - 所有方案必须围绕用户需求展开
2. **体检指标作为参考和安全性约束** - 确保方案不会导致健康问题
3. **其他健康问题作为重要考虑因素** - 与用户需求协同处理

**根据用户需求调整方案**：
- **减重需求**：
  * 调整热量目标为减重模式（TDEE-500kcal）
  * 每日目标增加蛋白质供能比至25-30%
  * 红灯食物严格限制高热量、高脂食物
  * 运动处方强调有氧运动（每周5次，每次45-60分钟）
  * 生活方式调整包含饮食日记、定期称重

- **增肌需求**：
  * 调整热量目标为增肌模式（TDEE+300kcal）
  * 每日目标蛋白质提高至2.0-2.2g/kg体重
  * 绿灯食物增加优质蛋白来源
  * 运动处方强调力量训练（每周3-4次）
  * 一日示范食谱增加训练前后加餐

- **改善睡眠需求**：
  * 晚餐避免大量摄入，建议睡前3小时完成
  * 增加富含镁、色氨酸的食物（香蕉、杏仁、牛奶、火鸡）
  * 红灯食物严格限制咖啡因（下午2点后）、酒精
  * 生活方式调整包含睡眠卫生教育

- **提升精力需求**：
  * 强调稳定血糖，选择低GI食物
  * 增加复合碳水、B族维生素、铁的食物
  * 避免高糖食物导致的血糖波动
  * 生活方式调整包含规律进餐、充足水分

- **改善便秘需求**：
  * 大幅增加膳食纤维摄入（每日30-40g）
  * 绿灯食物强调高纤维食物（西梅、燕麦、奇亚籽、梨）
  * 饮水目标提高至2500-3000ml/天
  * 生活方式调整包含建立固定如厕时间

- **降低血压需求**：
  * DASH饮食原则，增加钾、镁、钙的食物
  * 严格限制钠摄入（每日<2000mg）
  * 红灯食物严格限制腌制食品、加工肉类
  * 生活方式调整包含减重、限酒、减压

**用户需求与体检指标冲突处理**：
- 如用户需求（如增肌）与某项异常指标（如尿酸偏高）冲突，优先找到营养等效的替代方案
- 在reason字段中明确说明调整原因
- 确保方案既满足用户需求，又不影响健康安全

严格按照以上JSON结构返回结果，不要添加任何额外的解释文字。

**输出格式要求**：
1. priority 字段必须使用中文："高"、"中"、"低"
2. 不要使用英文（High/Medium/Low）或其他格式
3. 根据指标的严重程度和健康风险评估优先级
`;

      const { text } = await generateText({
        model,
        prompt,
      });

      // 尝试解析 JSON
      try {
        // 清理 markdown 代码块标记
        const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        recommendation = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('JSON 解析失败，使用原始文本:', parseError);
        // 如果 JSON 解析失败，创建基础建议
        recommendation = {
          summary: text.substring(0, 500),
          dailyTargets: {
            calories: Math.round(targetCalories),
            macros: {
              carbs: { grams: Math.round(targetCalories * 0.55 / 4), kcal: Math.round(targetCalories * 0.55), percentage: '55%' },
              protein: { grams: Math.round(targetCalories * 0.20 / 4), kcal: Math.round(targetCalories * 0.20), percentage: '20%' },
              fat: { grams: Math.round(targetCalories * 0.25 / 9), kcal: Math.round(targetCalories * 0.25), percentage: '25%' }
            }
          },
          trafficLightFoods: { green: [], yellow: [], red: [] },
          oneDayMealPlan: { breakfast: {}, lunch: {}, dinner: {}, snacks: [] },
          biomarkerInterventionMapping: [],
          exercisePrescription: {},
          lifestyleModifications: [],
          healthConcernsInterventions: {
            title: '其他健康问题专项干预',
            description: '针对客户报告的具体健康问题提供的营养和生活方式干预方案',
            concerns: [],
            commonConcerns: {
              title: '常见健康问题干预模板（当客户有相关问题时参考）',
              insomnia: { concern: '失眠/睡眠质量差', keyFoods: [], avoidFoods: [], supplements: [], lifestyleTips: {} },
              constipation: { concern: '便秘/排便困难', keyFoods: [], avoidFoods: [], supplements: [], lifestyleTips: {} },
              jointPain: { concern: '关节疼痛/关节炎', keyFoods: [], avoidFoods: [], supplements: [], lifestyleTips: {} },
              digestiveIssues: { concern: '消化不良/胃胀气/胃反流', keyFoods: [], avoidFoods: [], supplements: [], lifestyleTips: {} },
              fatigue: { concern: '疲劳乏力/精力不足', keyFoods: [], avoidFoods: [], supplements: [], lifestyleTips: {} }
            }
          },
          supplements: [],
          followUpPlan: {},
          error: 'JSON 解析部分失败，仅使用基础数据'
        };
      }

      // 生成详细运动处方
      try {
        const proteinTarget = Math.round(targetCalories * 0.20 / 4);
        const exercisePrompt = DETAILED_EXERCISE_PRESCRIPTION_PROMPT(
          {
            name: report.client.name,
            gender: report.client.gender === 'MALE' ? '男' : report.client.gender === 'FEMALE' ? '女' : '其他',
            age: validAge,
            height: report.client.height,
            weight: report.client.weight,
            activityLevel: activityLevel,
            allergies: allergiesList,
            medicalHistory: medicalHistoryList,
            exerciseDetails: (report.client as any).exerciseDetails || null,
            userRequirements: (report.client as any).userRequirements || null,
            healthConcerns: healthConcernsList,
          },
          Math.round(targetCalories),
          proteinTarget,
          abnormalIndicators.length > 0 ? '中等风险' : '低风险'
        );

        const { text: exerciseText } = await generateText({
          model,
          prompt: exercisePrompt,
        });

        // 解析详细运动处方
        const cleanedExerciseText = exerciseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const detailedExercisePrescription = JSON.parse(cleanedExerciseText);

        if (Array.isArray(detailedExercisePrescription?.weeklySchedule)) {
          detailedExercisePrescription.weeklySchedule = detailedExercisePrescription.weeklySchedule.slice(0, 2);
        }

        // 合并到 recommendation
        recommendation.detailedExercisePrescription = detailedExercisePrescription;
      } catch (exerciseError) {
        console.error('详细运动处方生成失败:', exerciseError);
        // 失败时不影响主流程，留空或使用默认值
        recommendation.detailedExercisePrescription = null;
      }

      // 添加生成时间戳和计算元数据
      recommendation.generatedAt = new Date().toISOString();
      recommendation.metadata = {
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        bmi: parseFloat(bmi.toFixed(1)),
        weightGoal,
        age: validatedAge
      };
    } catch (aiError) {
      console.error('AI 生成建议错误:', aiError);
      // AI 生成失败时返回基础信息
      recommendation = {
        summary: '建议生成暂时不可用，请稍后重试',
        dailyTargets: {},
        trafficLightFoods: { green: [], yellow: [], red: [] },
        oneDayMealPlan: {},
        biomarkerInterventionMapping: [],
        exercisePrescription: {},
        lifestyleModifications: [],
        healthConcernsInterventions: {
          title: '其他健康问题专项干预',
          description: '针对客户报告的具体健康问题提供的营养和生活方式干预方案',
          concerns: [],
          commonConcerns: {
            title: '常见健康问题干预模板（当客户有相关问题时参考）',
            insomnia: { concern: '失眠/睡眠质量差', keyFoods: [], avoidFoods: [], supplements: [], lifestyleTips: {} },
            constipation: { concern: '便秘/排便困难', keyFoods: [], avoidFoods: [], supplements: [], lifestyleTips: {} },
            jointPain: { concern: '关节疼痛/关节炎', keyFoods: [], avoidFoods: [], supplements: [], lifestyleTips: {} },
            digestiveIssues: { concern: '消化不良/胃胀气/胃反流', keyFoods: [], avoidFoods: [], supplements: [], lifestyleTips: {} },
            fatigue: { concern: '疲劳乏力/精力不足', keyFoods: [], avoidFoods: [], supplements: [], lifestyleTips: {} }
          }
        },
        supplements: [],
        followUpPlan: {},
        error: 'AI 生成失败',
      };
    }

    // 创建建议记录
    const newRecommendation = await prisma.recommendation.create({
      data: {
        clientId: report.clientId,
        reportId: report.id,
        type: 'COMPREHENSIVE',
        content: recommendation as any,
      },
    });

    return NextResponse.json({
      message: '建议生成成功',
      recommendation: newRecommendation,
    });
  } catch (error) {
    console.error('生成建议错误:', error);
    return NextResponse.json({ error: '生成建议失败' }, { status: 500 });
  }
}

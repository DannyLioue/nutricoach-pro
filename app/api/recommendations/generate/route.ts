import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

    if (!report.analysis || report.analysis.error) {
      return NextResponse.json({ error: '该报告尚未完成 AI 分析，请先完成分析' }, { status: 400 });
    }

    // 使用 Gemini AI 生成注册营养师 (RD) 专业建议
    let recommendation;
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

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

      // 构建异常指标详情（用于生物标志物干预映射）
      const abnormalIndicators = report.analysis.indicators?.filter((i: any) => i.status !== '正常') || [];
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
- 饮食偏好：${report.client.preferences || '无'}

**数据完整性检查：**
${age <= 0 || age > 120 ? '- ⚠️ 年龄数据异常，基于身高体重推断为成年人（18-65岁）范围' : '- ✓ 数据完整'}

**体检分析结果：**
- 健康评分：${report.analysis.healthScore || '未评估'}分
- 分析摘要：${report.analysis.summary || '无'}
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
      { "food": "具体食材名称", "reason": "推荐理由（富含XX营养素）", "nutrients": ["营养素"], "serving": "建议分量", "frequency": "每日X次" }
    ],
    "yellow": [
      { "food": "具体食材名称", "reason": "需控制原因", "limit": "每日限额（如：坚果不超过15g）", "timing": "建议食用时间" }
    ],
    "red": [
      { "food": "具体食材名称", "reason": "避免原因（如：高嘌呤、高饱和脂肪）", "alternatives": ["替代食材"] }
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
      "mechanism": "病理生理机制解释",
      "nutritionalIntervention": "营养干预方案",
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
  "supplements": [
    {
      "name": "补充剂名称",
      "indication": "适应症（基于XX指标异常）",
      "dosage": "建议剂量（如：Omega-3鱼油 1000mg，含EPA+DHA 600mg，每日2次）",
      "timing": "服用时间（如：随餐服用）",
      "duration": "建议服用周期",
      "contraindications": ["禁忌症"],
      "interactions": ["药物相互作用（如有）"],
      "evidence": "循证依据（如：Cochrane综述显示XX）"
    }
  ],
  "followUpPlan": {
    "needed": true,
    "timeline": "建议随访时间（如：4周后首次随访，然后每8周一次）",
    "monitoringIndicators": ["需监测的指标"],
    "assessments": ["评估项目"],
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

请生成专业、可量化、可执行的营养干预方案。`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

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
          supplements: [],
          followUpPlan: {},
          error: 'JSON 解析部分失败，仅使用基础数据'
        };
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

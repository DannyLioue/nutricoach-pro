// AI 提示词模板

export const HEALTH_ANALYSIS_PROMPT = (
  clientInfo: {
    name: string;
    gender: string;
    age: number;
    height: number;
    weight: number;
    activityLevel: string;
    allergies: string[];
    medicalHistory: string[];
  },
  reportData: any
) => `
你是一位专业营养师和健康分析师。请根据以下体检报告和客户信息，提供全面分析。

**客户信息：**
- 姓名：${clientInfo.name}
- 性别：${clientInfo.gender}
- 年龄：${clientInfo.age}岁
- 身高：${clientInfo.height}cm
- 体重：${clientInfo.weight}kg
- 活动水平：${clientInfo.activityLevel}
- 过敏史：${clientInfo.allergies.join('、') || '无'}
- 疾病史：${clientInfo.medicalHistory.join('、') || '无'}

**体检报告数据：**
${JSON.stringify(reportData, null, 2)}

请以 JSON 格式返回以下内容（不要有 markdown 格式）：

{
  "summary": "整体健康状况总结（3-5句话）",
  "bmi": ${Math.round((clientInfo.weight / Math.pow(clientInfo.height / 100, 2)) * 10) / 10},
  "bmiCategory": "正常/偏瘦/超重/肥胖",
  "abnormalIndicators": [
    {
      "indicator": "指标名称",
      "value": "检测值",
      "normalRange": "正常范围",
      "status": "偏高/偏低/正常",
      "risk": "相关健康风险",
      "priority": "高/中/低"
    }
  ],
  "nutrientDeficiencies": ["可能缺乏的营养素"],
  "riskFactors": ["健康风险因素"],
  "overallHealthScore": 0-100
}
`;

export const DIET_RECOMMENDATION_PROMPT = (
  healthAnalysis: any,
  preferences: string,
  allergies: string[]
) => `
基于以下健康分析结果，请生成个性化饮食建议。

**健康分析：**
${JSON.stringify(healthAnalysis, null, 2)}

**客户饮食偏好：**${preferences || '无特别偏好'}
**客户过敏原：**${allergies.join('、') || '无'}

请以 JSON 格式返回（不要有 markdown 格式）：

{
  "dailyCalorieTarget": 数值（根据BMI、活动水平计算）,
  "macroTargets": {
    "protein": "克数",
    "carbs": "克数",
    "fat": "克数"
  },
  "foodsToEat": [
    {"food": "食物名", "reason": "推荐理由（针对健康问题）", "nutrients": ["富含的营养素"]}
  ],
  "foodsToAvoid": [
    {"food": "食物名", "reason": "避免理由"}
  ],
  "supplements": [
    {"name": "补充剂", "dosage": "建议剂量", "reason": "补充原因"}
  ],
  "mealPlan": {
    "breakfast": ["早餐选项1", "早餐选项2"],
    "lunch": ["午餐选项1", "午餐选项2"],
    "dinner": ["晚餐选项1", "晚餐选项2"],
    "snacks": ["健康零食建议"]
  }
}
`;

export const EXERCISE_RECOMMENDATION_PROMPT = (healthAnalysis: any, activityLevel: string) => `
基于以下健康分析结果，请生成个性化运动建议。

**健康分析：**
${JSON.stringify(healthAnalysis, null, 2)}

**当前活动水平：**${activityLevel}

请以 JSON 格式返回（不要有 markdown 格式）：

{
  "weeklyGoal": "每周运动目标（如：每周150分钟中等强度有氧运动）",
  "workouts": [
    {
      "type": "运动类型（如：快走、游泳、力量训练）",
      "duration": "每次时长",
      "intensity": "低/中/高",
      "frequency": "频率",
      "description": "具体说明"
    }
  ],
  "precautions": ["注意事项1", "注意事项2"]
}
`;

export const LIFESTYLE_RECOMMENDATION_PROMPT = (healthAnalysis: any) => `
基于以下健康分析结果，请提供生活方式建议。

**健康分析：**
${JSON.stringify(healthAnalysis, null, 2)}

请以 JSON 格式返回（不要有 markdown 格式）：

{
  "sleep": "睡眠建议",
  "hydration": "饮水建议",
  "stressManagement": ["减压建议1", "减压建议2"]
}
`;

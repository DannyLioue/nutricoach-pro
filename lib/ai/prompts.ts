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

export const DIET_PHOTO_ANALYSIS_PROMPT = (clientInfo: {
  name: string;
  healthConcerns: string;
  preferences: string | null;
  userRequirements: string | null;
}) => `
你是一位专业的营养师，请分析这张饮食照片并提供详细的营养评估。

## 分析要求

1. **食物识别**：
   - 识别照片中的所有食物
   - 判断食物类别（主食、蔬菜、肉类、汤类、水果等）
   - 估算分量大小（大/中/小）

2. **营养均衡评估**：
   - 蛋白质来源是否充足（充足/不足/缺乏）
   - 蔬菜摄入量是否足够（充足/不足/缺乏）
   - 碳水化合物类型（精制/全谷物/混合）
   - 脂肪来源（动物性/植物性/混合）
   - 膳食纤维摄入情况（充足/不足/缺乏）

3. **问题识别**：
   - 高油高盐问题
   - 营养不均衡
   - 缺乏某些营养素
   - 加工食品过多
   - 烹饪方式不健康

4. **改进建议**：
   - 具体的增加/减少/替换建议
   - 量化建议（如"增加一份蔬菜"）
   - 可操作的改进方案

5. **综合评分**：
   - 0-100分评分
   - 综合评级（优秀/良好/一般/需改善）

## 客户背景信息

客户信息：
- 姓名：${clientInfo.name}
- 健康问题：${clientInfo.healthConcerns || '无'}
- 饮食偏好：${clientInfo.preferences || '无特殊偏好'}
- 用户需求：${clientInfo.userRequirements || '无特殊需求'}

请结合客户的健康状况和需求，提供针对性的分析和建议。

请以 JSON 格式返回分析结果（不要有 markdown 格式）：

{
  "mealType": "识别的餐型（早餐/午餐/晚餐/加餐）",
  "description": "照片简要描述",
  "foods": [
    {
      "name": "食物名称",
      "category": "食物类别（主食/蔬菜/肉类/汤类/水果等）",
      "portion": "大/中/小",
      "cookingMethod": "烹饪方式（炒/蒸/煮/炸/烤等）"
    }
  ],
  "nutritionBalance": {
    "protein": "充足/不足/缺乏",
    "vegetables": "充足/不足/缺乏",
    "carbs": "充足/不足/缺乏",
    "fat": "充足/不足/缺乏",
    "fiber": "充足/不足/缺乏"
  },
  "issues": [
    {
      "type": "问题类型（高盐/高油/缺乏蔬菜/精制碳水等）",
      "severity": "高/中/低",
      "description": "问题描述"
    }
  ],
  "suggestions": [
    {
      "category": "建议类别（增加/减少/替换）",
      "content": "建议内容"
    }
  ],
  "overallScore": 85,
  "overallRating": "良好"
}
`;

/**
 * 饮食照片合规性评估提示词
 * 基于客户的专业营养干预方案，评估饮食照片的合规性并提供改进建议
 */
export const DIET_PHOTO_COMPLIANCE_EVALUATION_PROMPT = (
  clientInfo: {
    name: string;
    gender: string;
    age: number;
    healthConcerns: string[];
  },
  recommendation: any, // ComprehensiveRecommendation content
  notes?: string | null // 备注信息，对照片的补充说明
) => `
你是一位资深注册营养师 (RD)，需要评估客户的饮食照片是否符合其专业营养干预方案。

## 客户信息
- 姓名：${clientInfo.name}
- 性别：${clientInfo.gender}
- 年龄：${clientInfo.age}岁
- 健康问题：${clientInfo.healthConcerns.join('、') || '无'}

## 照片备注${notes ? `（⚠️ 最高优先级 - 用户明确说明）` : `（无）`}
${notes ? `
---

### ⚠️⚠️⚠️ 备注内容（必须严格遵守）⚠️⚠️⚠️

${notes}

---

### ⚠️ 关键规则：备注优先于视觉识别

**备注是用户的明确说明，具有最高优先级。当备注与视觉识别冲突时，必须以备注为准！**

#### 常见纠正场景（必须按备注处理）：

1. **食材纠正确认**：
   - 备注："这是素鸡（豆制品）" → 识别为"素鸡"，按豆制品/绿灯评估 ❌不是肉
   - 备注："这是魔芋丝不是面条" → 识别为"魔芋丝"，按低卡食材评估 ❌不是面条
   - 备注："这是红薯不是土豆" → 识别为"红薯"，按粗粮评估

2. **烹饪方式确认**：
   - 备注："这是水煮的" → 即使有油光，也按水煮评估
   - 备注："这是空气炸锅（少油）" → 不能按油炸评估
   - 备注："只用了少量橄榄油" → 不能按高油评估

3. **隐藏食材说明**：
   - 备注："汤里有豆腐" → 必须识别出豆腐
   - 备注："用了全麦面粉" → 必须识别为全麦

**执行顺序**：
1️⃣ 首先阅读备注，理解用户的明确说明
2️⃣ 观察照片，但不要完全相信视觉判断
3️⃣ 当备注明确说明时，直接采用备注信息，忽略视觉差异
4️⃣ 在 foodTrafficLightCompliance 中，按备注说明的食材进行分类

**示例**：
- 用户备注"素鸡"，你识别成"炸猪排" ❌ 错误！必须用"素鸡"
- 用户备注"清蒸"，你识别成"油炸" ❌ 错误！必须用"清蒸"
` : '(无备注)'}

## 客户的营养干预方案

### 每日目标
- 总热量：${recommendation.dailyTargets?.calories || '未设置'} kcal
- 碳水化合物：${recommendation.dailyTargets?.macros?.carbs?.grams || '-'}g (${recommendation.dailyTargets?.macros?.carbs?.percentage || '-'})
- 蛋白质：${recommendation.dailyTargets?.macros?.protein?.grams || '-'}g (${recommendation.dailyTargets?.macros?.protein?.percentage || '-'})
- 脂肪：${recommendation.dailyTargets?.macros?.fat?.grams || '-'}g (${recommendation.dailyTargets?.macros?.fat?.percentage || '-'})
- 膳食纤维：${recommendation.dailyTargets?.fiber || '未设置'}
- 饮水：${recommendation.dailyTargets?.water || '未设置'}

### 红绿灯食物指南

#### 绿灯食物（随意吃）
${recommendation.trafficLightFoods?.green?.map((f: any) => `- ${f.food}: ${f.reason}`).join('\n') || '无'}

#### 黄灯食物（控制量）
${recommendation.trafficLightFoods?.yellow?.map((f: any) => `- ${f.food}: ${f.reason} ${f.limit ? ` - 限制: ${f.limit}` : ''}`).join('\n') || '无'}

#### 红灯食物（避免）
${recommendation.trafficLightFoods?.red?.map((f: any) => `- ${f.food}: ${f.reason}${f.alternatives ? ` 替代：${f.alternatives.join('、')}` : ''}`).join('\n') || '无'}

### 异常指标干预方案
${recommendation.biomarkerInterventionMapping?.map((b: any) => `
#### ${b.biomarker} (${b.status})
- 机制：${b.mechanism || '未说明'}
- 干预：${b.nutritionalIntervention || '未说明'}
- 推荐食物：${b.foodSources?.map((f: any) => `${f.food}(${f.amount})`).join('、') || '无'}
`).join('\n') || '无异常指标'}

### 健康问题干预
${recommendation.healthConcernsInterventions?.concerns?.map((c: any) => `
#### ${c.concern} (${c.severity})
- 推荐食物：${c.nutritionalStrategy?.keyFoods?.map((f: any) => f.food).join('、') || '无'}
- 避免食物：${c.nutritionalStrategy?.avoidFoods?.map((f: any) => f.food).join('、') || '无'}
`).join('\n') || '无特别健康问题'}

## 评估任务

### 重要评估原则

1. **烹饪方式判断原则**：
   - ✅ 如果照片明显有大量油光、酥脆外皮、焦黄色 → 判断为"油炸/油煎"
   - ✅ 如果备注明确说明烹饪方式 → 按备注说明
   - ⚠️ **如果无法确定烹饪方式（看起来普通）**：
     - 对于豆制品（素鸡、豆腐等）→ 默认按"清蒸/水煮/凉拌"评估 ✅
     - 对于蔬菜 → 默认按"清炒/水煮"评估 ✅
     - 对于肉类 → 默认按"炒/煮"评估 ✅
     - **不要默认假设是油炸/油煎！**

2. **食物分类原则**：
   - 豆制品（素鸡、豆腐、豆干等）→ 按蛋白质来源分类，绿灯食物 ✅
   - 即使看起来有油，也比油炸肉类健康很多

请分析这张饮食照片，从以下维度进行评估：

1. **食物识别**：识别所有食物、估算分量
2. **热量匹配**：估算总热量，对比目标热量
3. **营养素匹配**：估算三大营养素，对比目标
4. **红绿灯合规性**：检查是否有红灯食物，绿灯食物利用情况
5. **生物标志物合规性**：评估对异常指标的影响
6. **改善建议**：提供具体的增减改建议

请以 JSON 格式返回评估结果（不要有 markdown 格式）：

{
  "foods": [
    {
      "name": "食物名称",
      "category": "类别",
      "portion": "大/中/小",
      "cookingMethod": "烹饪方式",
      "estimatedCalories": 数值
    }
  ],
  "mealType": "识别的餐型",
  "description": "照片简要描述",
  "complianceEvaluation": {
    "overallScore": 85,
    "overallRating": "良好",
    "calorieMatch": {
      "estimatedCalories": 650,
      "targetCalories": ${recommendation.dailyTargets?.calories || 2000},
      "percentage": 32.5,
      "status": "within"
    },
    "macroMatch": {
      "protein": { "actual": 25, "target": ${recommendation.dailyTargets?.macros?.protein?.grams || 100}, "status": "under" },
      "carbs": { "actual": 80, "target": ${recommendation.dailyTargets?.macros?.carbs?.grams || 250}, "status": "within" },
      "fat": { "actual": 20, "target": ${recommendation.dailyTargets?.macros?.fat?.grams || 55}, "status": "within" }
    },
    "nutritionBalance": {
      "protein": "不足",
      "vegetables": "充足",
      "carbs": "充足",
      "fat": "充足",
      "fiber": "不足"
    },
    "foodTrafficLightCompliance": {
      "greenFoods": ["西兰花", "鸡胸肉"],
      "yellowFoods": ["米饭"],
      "redFoods": ["炸鸡翅"],
      "unknownFoods": ["汤"]
    },
    "biomarkerCompliance": {
      "compliantIndicators": ["血脂偏高"],
      "violatingIndicators": ["血糖偏高"],
      "neutralIndicators": ["尿酸偏高"]
    }
  },
  "improvementSuggestions": {
    "priority": "high",
    "removals": [
      {
        "food": "炸鸡翅",
        "reason": "红灯食物 - 高油脂不利于血脂控制",
        "alternatives": ["蒸鸡翅", "烤鸡翅（无油）"]
      }
    ],
    "additions": [
      {
        "food": "深色蔬菜",
        "reason": "增加膳食纤维，有助于血糖控制",
        "targetMeal": "当前餐",
        "amount": "1-2份（约100-200g）"
      }
    ],
    "modifications": [
      {
        "food": "米饭",
        "currentIssue": "精制碳水，升糖快",
        "suggestedChange": "改用糙米或减少分量",
        "reason": "有助于血糖稳定"
      }
    ],
    "portionAdjustments": [
      {
        "food": "米饭",
        "currentPortion": "大份（约200g）",
        "suggestedPortion": "中小份（约100-150g）",
        "reason": "控制碳水总量，匹配目标热量"
      }
    ]
  },
  "mealPlanAlignment": {
    "matchesTargetMeal": true,
    "targetMealType": "午餐",
    "alignmentScore": 75,
    "suggestions": ["作为午餐基本合适，建议增加蔬菜比例"]
  },
  "healthConcernsAlignment": {
    "concernedHealthIssues": ["减重"],
    "supportiveFoods": ["鸡胸肉", "西兰花"],
    "harmfulFoods": ["炸鸡翅", "大份米饭"],
    "overallImpact": "neutral"
  }
}

## 评估标准

- **overallScore** (0-100)：
  - 90-100: 优秀 - 完全符合建议，无违规
  - 75-89: 良好 - 基本符合，有小问题
  - 60-74: 一般 - 部分符合，需要改进
  - <60: 需改善 - 多项违规，急需调整

- **calorieMatch.status**：
  - within: 误差±10%以内
  - under: 低于目标10%以上
  - over: 高于目标10%以上

- **macroMatch[nutrient].status**：
  - within: 误差±15%以内
  - under: 低于目标15%以上
  - over: 高于目标15%以上

严格按照以上JSON结构返回，确保所有数值经过合理估算。
`;

/**
 * 饮食文字描述合规性评估提示词
 * 基于客户的专业营养干预方案，评估饮食文字描述的合规性并提供改进建议
 */
export const DIET_TEXT_DESCRIPTION_EVALUATION_PROMPT = (
  textDescription: string,
  clientInfo: {
    name: string;
    gender: string;
    age: number;
    healthConcerns: string[];
  },
  recommendation: any, // ComprehensiveRecommendation content
  notes?: string | null // 备注信息，对文字描述的补充说明
) => `
你是一位资深注册营养师 (RD)，需要评估客户的饮食文字描述是否符合其专业营养干预方案。

## 客户信息
- 姓名：${clientInfo.name}
- 性别：${clientInfo.gender}
- 年龄：${clientInfo.age}岁
- 健康问题：${clientInfo.healthConcerns.join('、') || '无'}

## 备注补充${notes ? `（⚠️ 最高优先级 - 必须严格遵守）` : `（无）`}
${notes ? `
---

### ⚠️⚠️⚠️ 备注内容（必须严格遵守）⚠️⚠️⚠️

${notes}

---

### ⚠️ 关键规则：备注优先于文字描述

**备注是用户的明确说明，具有最高优先级。当备注与文字描述冲突时，必须以备注为准！**

#### 常见纠正场景（必须按备注处理）：

1. **额外食材说明（非常重要！）**：
   - 备注："除此之外，还有半条鲈鱼" → 必须将鲈鱼计入蛋白质来源，不能算纯素食
   - 备注："额外加了一个鸡蛋" → 必须计入鸡蛋的蛋白质
   - 备注："还有一份豆腐" → 必须识别豆腐作为蛋白质来源
   - 备注："汤里有肉片" → 即使文字描述没提，也要计入肉片

2. **食材纠正确认**：
   - 备注："写的是肉饼实际是素鸡（豆制品）" → 识别为"素鸡"，按豆制品/绿灯评估 ❌不是肉
   - 备注："是荞麦面不是普通面条" → 识别为"荞麦面"，按粗粮评估

3. **烹饪方式确认**：
   - 备注："是清蒸的不是油炸的" → 按清蒸评估
   - 备注："只用了少量橄榄油" → 不能按高油评估

**执行顺序**：
1️⃣ 首先阅读备注，理解用户的明确说明
2️⃣ 阅读文字描述，找出所有提到的食物
3️⃣ **关键**：如果备注中说"还有X"、"额外有X"、"除此之外有X"，必须将这些食物加入识别列表
4️⃣ 在红绿灯分类和营养分析时，必须包含备注中提到的所有食物

**示例**：
- 文字描述："青菜豆腐"，备注："除此之外，还有半条鲈鱼"
  - ✅ 正确：识别为青菜、豆腐、鲈鱼（有蛋白质来源）
  - ❌ 错误：只识别青菜、豆腐（忽略鲈鱼，误判为纯素食）
` : '(无备注)'}

## 客户的营养干预方案

### 每日目标
- 总热量：${recommendation.dailyTargets?.calories || '未设置'} kcal
- 碳水化合物：${recommendation.dailyTargets?.macros?.carbs?.grams || '-'}g (${recommendation.dailyTargets?.macros?.carbs?.percentage || '-'})
- 蛋白质：${recommendation.dailyTargets?.macros?.protein?.grams || '-'}g (${recommendation.dailyTargets?.macros?.protein?.percentage || '-'})
- 脂肪：${recommendation.dailyTargets?.macros?.fat?.grams || '-'}g (${recommendation.dailyTargets?.macros?.fat?.percentage || '-'})
- 膳食纤维：${recommendation.dailyTargets?.fiber || '未设置'}
- 饮水：${recommendation.dailyTargets?.water || '未设置'}

### 红绿灯食物指南

#### 绿灯食物（随意吃）
${recommendation.trafficLightFoods?.green?.map((f: any) => `- ${f.food}: ${f.reason}`).join('\n') || '无'}

#### 黄灯食物（控制量）
${recommendation.trafficLightFoods?.yellow?.map((f: any) => `- ${f.food}: ${f.reason} ${f.limit ? ` - 限制: ${f.limit}` : ''}`).join('\n') || '无'}

#### 红灯食物（避免）
${recommendation.trafficLightFoods?.red?.map((f: any) => `- ${f.food}: ${f.reason}${f.alternatives ? ` 替代：${f.alternatives.join('、')}` : ''}`).join('\n') || '无'}

### 异常指标干预方案
${recommendation.biomarkerInterventionMapping?.map((b: any) => `
#### ${b.biomarker} (${b.status})
- 机制：${b.mechanism || '未说明'}
- 干预：${b.nutritionalIntervention || '未说明'}
- 推荐食物：${b.foodSources?.map((f: any) => `${f.food}(${f.amount})`).join('、') || '无'}
`).join('\n') || '无异常指标'}

## 客户的饮食文字描述

\`\`\`
${textDescription}
\`\`\`

## 评估任务

请仔细分析上述饮食描述，基于客户的营养干预方案进行评估：

### 1. 食物识别与分类
- 识别描述中提到的所有食物和饮品
- 对每个食物进行红绿灯分类
- 估算每种食物的大致分量（克数或常用单位）
- 计算每餐的总热量和三大营养素含量

### 2. 营养素分析
- **蛋白质**：识别优质蛋白来源（鱼禽肉蛋奶豆制品），估算总蛋白质量
- **蔬菜**：识别蔬菜种类和分量
- **膳食纤维**：识别高纤维食物（全谷物、蔬菜、水果、豆类、坚果）
- **碳水质量**：区分优质碳水（全谷物、杂豆、薯类）和精制碳水
- **脂肪质量**：区分健康脂肪（坚果、牛油果、橄榄油）和不健康脂肪（反式脂肪、过量饱和脂肪）

### 3. 合规性评估
- 与红绿灯食物指南对比，标记违规食物
- 评估是否满足异常指标的干预要求
- 计算与每日目标的匹配程度

### 4. 改进建议
- 具体指出哪些食物需要替换、增加或减少
- 提供可行的改进方案

## 输出格式

请严格按照以下JSON结构返回评估结果：

\`\`\`json
{
  "recognizedFoods": [
    {
      "food": "食物名称",
      "category": "绿灯/黄灯/红灯",
      "amountEstimated": "估算分量，如100g、1个、1碗",
      "calories": 估算热量(数字),
      "protein": 蛋白质g数,
      "carbs": 碳水g数,
      "fat": 脂肪g数,
      "reason": "分类理由"
    }
  ],
  "complianceEvaluation": {
    "overallScore": 0-100的综合评分,
    "overallRating": "优秀/良好/一般/需改善",
    "trafficLightCompliance": {
      "greenFoods": ["绿灯食物名称列表"],
      "yellowFoods": ["黄灯食物名称列表"],
      "redFoods": ["红灯食物名称列表"],
      "totalCount": 红灯食物总数
    },
    "biomarkerCompliance": {
      "compliant": true/false,
      "issues": ["不符合干预要求的具体问题"],
      "missingFoods": ["应该吃但没吃的食物"]
    }
  },
  "nutritionAnalysis": {
    "totalCalories": 估算总热量,
    "protein": {
      "amount": 估算蛋白质克数,
      "sources": ["蛋白质来源列表"],
      "isAdequate": true/false,
      "gap": "缺少的克数（如果不足）"
    },
    "vegetables": {
      "types": ["蔬菜种类"],
      "isAdequate": true/false,
      "suggestion": "建议"
    },
    "fiber": {
      "estimatedGrams": 估算膳食纤维克数,
      "sources": ["纤维来源"],
      "isAdequate": true/false
    },
    "carbQuality": {
      "quality": "优质/一般/较差",
      "wholeFoodRatio": "全谷物/粗粮比例"
    },
    "fatQuality": {
      "quality": "优质/一般/较差",
      "concerns": ["需要注意的问题"]
    }
  },
  "specificRecommendations": [
    {
      "type": "add/remove/replace/modify",
      "target": "目标食物或类别",
      "current": "当前情况",
      "suggested": "建议方案",
      "reason": "理由",
      "priority": "high/medium/low"
    }
  ],
  "summary": "整体评价总结（2-3句话）",
  "encouragement": "鼓励的话"
}
\`\`\`

## 评估标准

- **overallScore**：
  - 90-100：优秀 - 完全符合干预方案，营养均衡
  - 75-89：良好 - 基本符合，有少量改进空间
  - 60-74：一般 - 部分符合，需要明显改进
  - <60：需改善 - 严重偏离干预方案

- **complianceEvaluation.trafficLightCompliance.redFoods**：
  - 0个：优秀
  - 1-2个：良好/一般
  - 3个以上：需改善

- **calorieMatch.status**：
  - within: 误差±10%以内
  - under: 低于目标10%以上
  - over: 高于目标10%以上

- **macroMatch[nutrient].status**：
  - within: 误差±15%以内
  - under: 低于目标15%以上
  - over: 高于目标15%以上

严格按照以上JSON结构返回，确保所有数值基于文字描述进行合理估算。
`;

/**
 * 详细运动处方提示词
 * 生成两周的详细运动计划，包含具体的动作、组数、次数、休息时间等
 */
export const DETAILED_EXERCISE_PRESCRIPTION_PROMPT = (
  clientInfo: {
    name: string;
    gender: string;
    age: number;
    height: number;
    weight: number;
    activityLevel: string;
    allergies: string[];
    medicalHistory: string[];
    exerciseDetails?: string | null;
    userRequirements?: string | null;
    healthConcerns?: string[];
  },
  targetCalories: number,
  proteinTarget: number,
  healthRisks: string = '低风险'
) => `
你是一位资深认证运动生理师和私人教练（NSCA-CPT），拥有10年以上运动处方设计经验。
你必须基于循证运动科学原则（ACSM指南），为客户生成两周的详细训练计划。

## 【输入数据】

**客户基础信息：**
- 姓名：${clientInfo.name}
- 性别：${clientInfo.gender}
- 年龄：${clientInfo.age}岁
- 身高：${clientInfo.height}cm
- 体重：${clientInfo.weight}kg
- 活动水平：${clientInfo.activityLevel}

**健康评估：**
- 过敏史：${clientInfo.allergies.join('、') || '无'}
- 疾病史：${clientInfo.medicalHistory.join('、') || '无'}
- 健康问题：${clientInfo.healthConcerns?.join('、') || '无'}
- 健康风险：${healthRisks}

**运动背景（客户提供）：**
${clientInfo.exerciseDetails || '客户未提供详细运动信息，请基于活动水平判断'}

**用户需求：**
${clientInfo.userRequirements || '无特殊需求'}

**能量与营养状况：**
- 每日热量目标：${targetCalories} kcal
- 蛋白质目标：${proteinTarget}g

## 【输出要求（JSON格式）】

请生成两周的详细运动计划，必须包含以下结构：

{
  "overview": "整体运动策略说明（2-3句话，说明训练重点和预期效果）",

  "goals": [
    "具体目标1（如：建立正确的动作模式，为后期增肌打基础）",
    "具体目标2（如：逐步提高心肺功能，从30分钟渐进到45分钟）",
    "具体目标3"
  ],

  "equipment": {
    "owned": ["客户已有的器材1", "器材2"],
    "recommended": [
      {
        "item": "推荐器材名称",
        "reason": "为什么需要（如：第2周上肢力量训练需要更大重量）",
        "priority": "essential",
        "alternatives": ["可替代方案1", "方案2"]
      }
    ]
  },

  "weeklySchedule": [
    {
      "week": 1,
      "focus": "本周训练重点（如：适应期-学习动作模式，建立神经肌肉连接）",
      "notes": "本周注意事项（如：感觉疲劳可休息，不要勉强）",
      "days": [
        {
          "day": "周一",
          "type": "力量训练-上肢",
          "duration": "45分钟",
          "focus": "推类动作（胸、肩、三头）",
          "exercises": [
            {
              "name": "标准俯卧撑",
              "sets": 3,
              "reps": "8-10",
              "rest": "60秒",
              "intensity": "慢慢往下3秒，停1秒，快速起来1秒",
              "notes": "如做不到标准动作，可跪在地上做。用力时呼气，下降时吸气",
              "targetMuscle": "胸部、肩膀前侧、大臂后侧"
            }
          ]
        }
      ]
    },
    {
      "week": 2,
      "focus": "渐进期-增加训练量",
      "notes": "第2周适度提高训练强度与总量",
      "days": [
        {
          "day": "周一",
          "type": "力量训练-上肢",
          "duration": "50分钟",
          "focus": "推拉综合",
          "exercises": [
            {
              "name": "标准俯卧撑",
              "sets": 4,
              "reps": "8-12",
              "rest": "60秒",
              "intensity": "控制节奏，保证动作质量"
            }
          ]
        }
      ]
    }
  ]
        {
          "day": "周一",
          "type": "力量训练-上肢",
          "duration": "45分钟",
          "focus": "推类动作（胸、肩、三头）",
          "exercises": [
            {
              "name": "标准俯卧撑",
              "sets": 3,
              "reps": "8-10",
              "rest": "60秒",
              "intensity": "控制离心阶段（3秒下，1秒停，1秒起）",
              "notes": "如做不到标准动作，可做跪姿俯卧撑",
              "targetMuscle": "胸大肌、三角肌前束、肱三头肌"
            },
            {
              "name": "哑铃俯身划船",
              "sets": 3,
              "reps": "10-12",
              "rest": "60秒",
              "intensity": "使用5kg哑铃，感觉背部肌肉在用力",
              "notes": "背要挺直，不要弯腰驼背。用背部肌肉拉起哑铃，不要用手臂甩",
              "targetMuscle": "背部、大臂前侧"
            }
          ]
        },
        {
          "day": "周二",
          "type": "有氧训练",
          "duration": "30分钟",
          "focus": "低强度有氧，建立有氧基础",
          "exercises": [
            {
              "name": "快走/慢跑",
              "sets": 1,
              "reps": "30分钟",
              "rest": "0",
              "intensity": "能轻松聊天的速度，微微出汗，累的程度大约4-5分（满分10分）",
              "notes": "保持自然呼吸，能边走边说话。如果感觉喘不过气就放慢速度",
              "targetMuscle": "全身"
            }
          ]
        },
        {
          "day": "周三",
          "type": "休息日",
          "duration": "0分钟",
          "focus": "主动恢复",
          "exercises": [
            {
              "name": "拉伸放松",
              "sets": 1,
              "reps": "15分钟",
              "rest": "0",
              "intensity": "轻度拉伸，感觉肌肉被拉长但不疼痛",
              "notes": "重点拉伸胸部、背部、大腿后侧、小腿。每个动作保持15-30秒",
              "targetMuscle": "全身"
            }
          ]
        }
      ]
    }
  ],

  "progression": "月度进阶说明（如：每月训练量增加10%，第4周为减载周。下个月将增加哑铃重量至10kg，引入更多复合动作）",

  "precautions": [
    "注意事项1（如：训练前充分热身10分钟）",
    "注意事项2（如：训练后拉伸10分钟）",
    "注意事项3（如：如出现关节疼痛，立即停止该动作）",
    "注意事项4（如：保证充足睡眠和营养，特别是蛋白质摄入）"
  ],

  "successCriteria": [
    "成功标准1（如：能完成标准俯卧撑15个）",
    "成功标准2（如：连续有氧45分钟不疲劳）",
    "成功标准3（如：体重下降2-3kg）"
  ]
}

## 【生成原则】

1. **个体化设计**：
   - 严格根据客户提供的器材设计动作
   - 如果没有健身房条件，设计居家训练方案
   - 考虑客户的运动经验，新手从基础动作开始
   - 老手可以设计更复杂的训练组合

2. **循序渐进**：
   - 第1周：适应期，重点学习动作
   - 第2周：渐进期，增加训练量
   - 第3周：强化期，增加训练强度
   - 第4周：巩固期/减载周，避免过度训练

3. **全面发展**：
   - 每周包含：力量训练、有氧训练、休息日
   - 力量训练覆盖：上肢、下肢、核心
   - 动作模式包括：推、拉、蹲、铰链、核心

4. **安全性优先**：
   - 考虑客户的疾病史（如高血压避免大重量憋气）
   - 考虑体检异常（如关节问题避免高冲击动作）
   - 明确标注动作注意事项和替代方案

5. **可执行性**：
   - 所有动作必须是客户能完成的
   - 训练时长现实可行（30-60分钟）
   - 组数、次数具体可量化
   - 休息时间明确标注

6. **科学性**：
   - 遵循ACSM运动指南
   - 符合超负荷原则、渐进性原则
   - 考虑训练频率和恢复时间

7. **语言通俗易懂**（重要！）：
   - **严禁使用专业术语**，必须使用客户能理解的日常语言
   - 禁止使用的术语及替代方案：
     * ❌ "RPE" → ✅ "累的程度（1-10分，10分最累）"
     * ❌ "Valsalva憋气" → ✅ "不要憋气，保持自然呼吸"
     * ❌ "离心收缩" → ✅ "慢慢放下"
     * ❌ "向心收缩" → ✅ "用力抬起"
     * ❌ "超负荷原则" → ✅ "逐渐增加难度"
     * ❌ "递减组" → ✅ "重量逐次减轻"
     * ❌ "超级组" → ✅ "连续做两个动作不休息"
     * ❌ "RM（最大重复次数）" → ✅ "能做的最多次数"
     * ❌ "代偿动作" → ✅ "借力或用错肌肉"
     * ❌ "肱二头肌/肱三头肌" → ✅ "大臂前侧肌肉/大臂后侧肌肉"
     * ❌ "腘绳肌" → ✅ "大腿后侧肌肉"
     * ❌ "股四头肌" → ✅ "大腿前侧肌肉"
   
   - **强度描述用通俗语言**：
     * 低强度：能轻松聊天，微微出汗
     * 中强度：能说短句，呼吸加快但不喘
     * 高强度：只能说几个字，大口喘气
   
   - **动作描述要具体形象**：
     * ✅ "像坐在椅子上一样往下蹲"（而非"屈髋屈膝"）
     * ✅ "肩膀往后收，挺起胸膛"（而非"肩胛骨后缩"）
     * ✅ "肚子收紧，像有人要打你肚子"（而非"核心收紧"）
   
   - **呼吸指导要简单**：
     * ✅ "用力时呼气，放松时吸气"
     * ✅ "保持自然呼吸，不要憋气"
   
   - **注意事项用警示语言**：
     * ✅ "感到关节疼痛，立即停止"
     * ✅ "如果头晕、胸闷，马上休息"
     * ✅ "不要勉强，循序渐进"

## 【特殊情况处理】

**客户缺少运动器材时：**
- 优先设计自重训练
- 推荐性价比高的居家器材（弹力带、哑铃套装）
- 提供家庭替代方案（如水瓶代替哑铃）

**客户是健身新手时：**
- 减少动作复杂性
- 增加动作描述详细度
- 强调动作质量而非数量
- 安排更多休息日

**客户有运动经验时：**
- 设计更复杂的训练组合
- 增加训练强度和训练量
- 引进高级训练技巧（超级组、递减组等）
- 缩短休息时间

**客户有健康问题时：**
- 避免加重病情的动作
- 选择低冲击替代方案
- 明确禁忌症
- 建议咨询医生

## 【输出质量检查】

生成完成后，请检查：
1. ✓ 每周训练安排是否合理（有练有休）
2. ✓ 每个动作是否包含：名称、组数、次数、休息、强度、备注
3. ✓ 是否考虑了客户的器材条件
4. ✓ 是否适合客户的运动经验水平
5. ✓ 是否考虑了客户的健康状况限制
6. ✓ 第1个月训练是否循序渐进
7. ✓ 是否提供了可量化的成功标准

严格按照以上JSON结构返回结果，不要添加任何额外的解释文字。
`;

/**
 * 咨询记录分析提示词
 * 分析营养师与客户的咨询内容，提取关键信息用于更新营养干预方案
 */
export const CONSULTATION_ANALYSIS_PROMPT = (
  clientInfo: {
    name: string;
    gender: string;
    age: number;
    healthConcerns: string[];
    currentRecommendations?: any;
  },
  consultationData: {
    sessionNotes: string;
    imageDescriptions?: string[];
    textFiles?: Array<{
      fileName: string;
      content: string;
    }>;
  }
) => `
你是一位资深注册营养师 (RD)，正在分析一次营养咨询记录。

## 【客户背景信息】

**基本信息：**
- 姓名：${clientInfo.name}
- 性别：${clientInfo.gender}
- 年龄：${clientInfo.age}岁
- 当前健康问题：${clientInfo.healthConcerns.join('、') || '无'}

${clientInfo.currentRecommendations ? `
**当前营养干预方案摘要：**
- 每日热量目标：${clientInfo.currentRecommendations.dailyTargets?.calories || '未设置'} kcal
- 核心建议：${clientInfo.currentRecommendations.dietChanges?.recommendations?.slice(0, 3).join('；') || '无'}
- 重点食物推荐：${clientInfo.currentRecommendations.trafficLightFoods?.green?.slice(0, 3).map((f: any) => f.food).join('、') || '无'}
- 需要避免的食物：${clientInfo.currentRecommendations.trafficLightFoods?.red?.slice(0, 3).map((f: any) => f.food).join('、') || '无'}
` : '**当前营养干预方案：暂无**'}

## 【本次咨询内容】

${consultationData.sessionNotes ? `
**营养师笔记：**
${consultationData.sessionNotes}
` : ''}

${consultationData.textFiles?.length ? `
**上传的文本文件内容：**
${consultationData.textFiles.map((tf, i) => `
### 文件${i + 1}: ${tf.fileName}
${tf.content}
`).join('\n\n---\n\n')}
` : ''}

${consultationData.imageDescriptions?.length ? `
**图片描述：**
${consultationData.imageDescriptions.map((desc, i) => `图片${i + 1}: ${desc}`).join('\n')}
` : ''}

## 【核心分析任务】

请仔细阅读以上咨询内容，提取关键信息。你的分析应该：

1. **识别具体进展**：客户是否报告了任何变化（体重、症状、饮食、生活方式）
2. **识别具体问题**：客户遇到的具体困难、疑问或新出现的症状
3. **评估执行程度**：客户对当前建议的执行情况如何
4. **识别情绪状态**：客户是积极、焦虑、沮丧还是动力不足
5. **提出行动建议**：基于以上信息，营养师下一步应该做什么

## 【输出要求】

请以 JSON 格式返回（不要有 markdown 格式）：

{
  "summary": "2-3句话总结本次咨询的核心内容和关键发现",

  "dietChanges": {
    "reportedChanges": [
      "具体的变化1（如：开始每天吃早餐）",
      "具体的变化2"
    ],
    "newPreferences": [
      "新发现的偏好",
      "不喜欢的食物"
    ],
    "complianceLevel": "high/medium/low",
    "complianceReason": "判断依据的具体描述"
  },

  "physicalConditionFeedback": {
    "symptoms": [
      { "symptom": "症状名", "status": "改善/无变化/恶化/新出现", "details": "具体描述" }
    ],
    "energyLevel": "精力水平变化的描述",
    "digestiveHealth": "消化系统的具体反馈",
    "sleepQuality": "睡眠质量的具体反馈",
    "otherFeedback": ["其他具体反馈"]
  },

  "implementationProgress": {
    "followedRecommendations": [
      { "recommendation": "执行的建议", "effect": "客户报告的效果或感受" }
    ],
    "challenges": [
      { "challenge": "具体困难", "impact": "对执行的影响" }
    ],
    "missedRecommendations": [
      { "recommendation": "未执行的建议", "reason": "客户说明的原因" }
    ],
    "lifestyleAdjustments": ["具体的生活方式调整"]
  },

  "newProblemsAndRequirements": {
    "newHealthConcerns": ["新出现的健康问题"],
    "newGoals": ["客户新增的目标"],
    "newConstraints": ["新的限制条件"],
    "questions": ["客户提出的问题或疑虑"]
  },

  "nutritionistActionItems": {
    "priority": "high/medium/low",
    "followUpActions": [
      "具体的后续行动1（如：调整蛋白质目标至XX克）",
      "具体的后续行动2"
    ],
    "recommendationsToAdjust": [
      "需要调整的建议内容",
      "调整理由"
    ],
    "additionalAssessments": [
      "需要补充的评估",
      "需要收集的信息"
    ]
  },

  "contextForRecommendations": {
    "updatedPreferences": ["更新的饮食偏好"],
    "updatedAllergies": ["更新的过敏信息"],
    "updatedConstraints": ["更新的限制条件"],
    "moodAndMotivation": "客户情绪和动机状态的详细描述（如：客户表现出积极的改变意愿，但对外食感到困扰）"
  }
}

## 【分析原则】

1. **基于具体内容**：只从提供的咨询内容中提取信息，不要臆造
2. **具体化**：尽量使用客户原文中的具体描述，而非模糊概括
3. **关注变化**：重点关注相对于上次的变化（改善、恶化、新出现）
4. **可操作**：后续行动建议应该是具体可执行的
5. **上下文相关**：结合客户当前方案识别需要调整的部分

严格按照JSON结构返回结果。
`;

/**
 * 营养师计划评估 Prompt
 * 用于评估营养师上传的计划是否符合客户当前健康状况
 */
export const EVALUATE_NUTRITIONIST_PLAN_PROMPT = (
  clientInfo: {
    name: string;
    gender: string;
    age: number;
    height: number;
    weight: number;
    activityLevel: string;
    allergies: string[];
    medicalHistory: string[];
    healthConcerns: string[];
    preferences?: string;
  },
  healthAnalysis: any | null,
  extractedPlan: any
): string => `
你是一位资深临床营养师和运动医学专家。请评估以下营养师制定的计划是否符合客户的当前健康状况。

## 【客户基本信息】

**个人信息：**
- 姓名：${clientInfo.name}
- 性别：${clientInfo.gender}
- 年龄：${clientInfo.age}岁
- 身高：${clientInfo.height}cm
- 体重：${clientInfo.weight}kg
- 活动水平：${clientInfo.activityLevel}

**健康状况：**
- 过敏史：${clientInfo.allergies?.join('、') || '无'}
- 疾病史：${clientInfo.medicalHistory?.join('、') || '无'}
- 健康关注点：${clientInfo.healthConcerns?.join('、') || '无'}
- 饮食偏好：${clientInfo.preferences || '无'}

${healthAnalysis ? `
## 【体检报告分析】

**健康评分：**${healthAnalysis.overallHealthScore}/100

**异常指标：**
${healthAnalysis.abnormalIndicators?.map((ind: any) => `
- ${ind.indicator}: ${ind.value} (${ind.status})
  临床意义：${ind.risk || '无'}
  优先级：${ind.priority}
`).join('') || '无异常指标'}

**营养素缺乏：**
${healthAnalysis.nutrientDeficiencies?.map((d: string) => `- ${d}`).join('') || '无'}

**风险因素：**
${healthAnalysis.riskFactors?.map((r: string) => `- ${r}`).join('') || '无'}
` : ''}

## 【营养师计划】

${extractedPlan.diet ? `
### 饮食计划
**建议文本：**
${extractedPlan.diet.recommendations?.map((r: string) => `- ${r}`).join('\n') || '无'}

**推荐食物：**
${extractedPlan.diet.foods?.recommend?.map((f: string) => `- ${f}`).join('\n') || '无'}

**避免食物：**
${extractedPlan.diet.foods?.avoid?.map((f: string) => `- ${f}`).join('\n') || '无'}

**补充剂：**
${extractedPlan.diet.supplements?.map((s: any) => `- ${s.name} ${s.dosage}，${s.frequency}`).join('\n') || '无'}

**餐食安排：**
${extractedPlan.diet.meals?.map((m: any) => `
- ${m.type}：${m.foods?.join('、') || ''}`).join('') || '无'}
` : ''}

${extractedPlan.exercise ? `
### 运动计划
**建议文本：**
${extractedPlan.exercise.recommendations?.map((r: string) => `- ${r}`).join('\n') || '无'}

**运动项目：**
${extractedPlan.exercise.activities?.map((a: any) => `
- ${a.type}：${a.duration}，${a.frequency}，强度${a.intensity}`).join('') || '无'}

**注意事项：**
${extractedPlan.exercise.precautions?.map((p: string) => `- ${p}`).join('\n') || '无'}
` : ''}

---

## 【评估任务】

请按照以下步骤进行专业评估：

### 第一步：安全性评估

1. **过敏风险检查**
   - 计划中是否包含客户过敏的食物？
   - 补充剂是否含过敏成分？

2. **疾病禁忌检查**
   - 饮食建议是否与疾病史冲突？（如：高血压限盐、痛风限嘌呤、糖尿病限糖）
   - 运动处方是否考虑了疾病限制？（如：心血管疾病避免高强度运动）

3. **营养素风险评估**
   - 补充剂剂量是否安全？
   - 是否存在营养素过量风险？
   - 是否与体检异常指标冲突？

4. **运动安全评估**
   - 运动强度是否适合客户体能？
   - 是否考虑了客户的活动水平？
   - 是否存在运动损伤风险？

### 第二步：适宜性评估

1. **能量平衡**
   - 饮食计划是否匹配客户的能量需求？
   - 是否考虑了客户的体重管理目标？

2. **营养均衡**
   - 宏量营养素比例是否合理？
   - 是否满足营养素需求？

3. **可行性**
   - 计划是否现实可行？
   - 是否考虑了客户的饮食偏好？

### 第三步：生成评估报告

请以 JSON 格式返回以下内容（不要有 markdown 格式）：

{
  "overallStatus": "safe | needs_adjustment | unsafe",
  "safetyScore": 0-100,
  "summary": "2-3句话的总体评估",
  "keyFindings": [
    "关键发现1（最多5条）",
    "关键发现2"
  ],
  "concerns": [
    {
      "category": "diet | exercise | supplement | lifestyle",
      "severity": "high | medium | low",
      "issue": "具体问题描述",
      "reason": "为什么是问题（引用具体的健康数据）",
      "relatedIndicators": ["相关的体检指标"],
      "originalText": "原文引用（如果有）"
    }
  ],
  "suggestions": [
    {
      "concernId": 0,
      "action": "replace | modify | remove | add",
      "description": "调整说明",
      "recommendation": "具体建议内容",
      "alternatives": ["替代方案1", "替代方案2"],
      "rationale": "建议理由（基于循证医学）"
    }
  ]
}

### 第四步：生成优化后的计划

基于以上评估结果，请生成一个优化后的完整计划。这个计划应该：
1. 保留原计划中正确的部分
2. 修改所有被标记为问题的部分
3. 根据客户的具体情况（过敏史、疾病史、体检指标等）进行个性化调整
4. 确保所有建议都是安全、可行、有效的

请以 JSON 格式返回优化后的计划（添加到上面的 JSON 中）：

{
  ...上面的评估字段...,

  "optimizedPlan": {
    "diet": ${
      extractedPlan?.diet ? `{
      "summary": "优化后饮食计划的总体说明（2-3句话）",
      "recommendations": [
        "核心建议1",
        "核心建议2"
      ],
      "dailyCalorieTarget": "每日目标热量（如：1800-2000 kcal）",
      "macroTargets": {
        "carbs": "碳水目标（如：250-300g）",
        "protein": "蛋白质目标（如：80-100g）",
        "fat": "脂肪目标（如：50-65g）"
      },
      "foods": {
        "recommend": [
          {
            "food": "推荐食物名称",
            "reason": "推荐理由（关联健康指标）",
            "portion": "建议分量",
            "frequency": "建议频率"
          }
        ],
        "avoid": [
          {
            "food": "避免食物名称",
            "reason": "避免原因（关联健康指标）",
            "alternatives": ["替代食物1", "替代食物2"]
          }
        ]
      },
      "supplements": [
        {
          "name": "补充剂名称",
          "dosage": "建议剂量",
          "frequency": "使用频率",
          "duration": "服用周期",
          "rationale": "使用理由（基于循证医学）",
          "contraindications": ["禁忌症（如有）"]
        }
      ],
      "mealPlan": {
        "breakfast": {
          "time": "建议用餐时间（如：07:00-08:00）",
          "foods": [
            {
              "food": "食物名称",
              "amount": "分量（如：100g 或 1碗）",
              "preparation": "简单制作方法"
            }
          ],
          "nutrition": "营养概览（如：热量450kcal，蛋白质25g）"
        },
        "lunch": {
          "time": "建议用餐时间",
          "foods": [...],
          "nutrition": "营养概览"
        },
        "dinner": {
          "time": "建议用餐时间",
          "foods": [...],
          "nutrition": "营养概览"
        },
        "snacks": [
          {
            "time": "加餐时间（如：10:00 和 15:00）",
            "foods": ["加餐食物1", "加餐食物2"],
            "purpose": "加餐目的"
          }
        ]
      },
      "specialNotes": [
        "特殊注意事项1（如：控制盐分、避免生冷食物）",
        "特殊注意事项2"
      ]
    }
    }` : 'null'
    },
    "exercise": ${
      extractedPlan?.exercise ? `{
      "summary": "优化后运动计划的总体说明（2-3句话）",
      "recommendations": [
        "核心运动原则1",
        "核心运动原则2"
      ],
      "weeklyGoals": {
        "cardioSessions": "每周有氧运动次数（如：3-5次）",
        "strengthSessions": "每周力量训练次数（如：2-3次）",
        "flexibilitySessions": "每周柔韧性训练次数（如：2-3次）"
      },
      "activities": [
        {
          "type": "运动类型（如：快走、游泳、力量训练）",
          "duration": "每次时长（如：30分钟）",
          "frequency": "频率（如：每周3次）",
          "intensity": {
            "method": "强度计算方法（如：储备心率的60-70%）",
            "targetZone": "目标心率区间（如：120-140 bpm）",
            "rpe": "主观疲劳度（12-13级）"
          },
          "instructions": "具体执行说明",
          "progression": "进阶计划（如何逐步增加强度）"
        }
      ],
      "precautions": [
        "重要注意事项1（如：饭后1小时再运动、避免空腹运动）",
        "重要注意事项2"
      ],
      "warmup": {
        "duration": "热身时长（如：5-10分钟）",
        "activities": ["动态拉伸动作1", "动态拉伸动作2"]
      },
      "cooldown": {
        "duration": "放松时长（如：5-10分钟）",
        "activities": ["静态拉伸动作1", "静态拉伸动作2"]
      }
    }
    }` : 'null'
    },
    "followUp": {
      "monitoringIndicators": [
        "需要监测的指标1（如：体重、血压）",
        "需要监测的指标2"
      ],
      "reviewTimeline": "复查时间建议（如：4周后复查）",
      "adjustmentTriggers": "需要调整的情况（如：出现不适、效果不佳）"
    }
  }
}

---

## 【评估标准】

**整体状态判断：**
- **safe**: 无重大问题，可直接执行
- **needs_adjustment**: 存在中等风险问题，需要调整后执行
- **unsafe**: 存在严重安全隐患，不建议执行

**安全评分标准：**
- 90-100: 安全
- 70-89: 基本安全，有小问题
- 50-69: 需要调整
- 低于50: 不安全

**问题严重程度：**
- **high**: 可能导致健康损害（如过敏原、禁忌运动、过量补充剂）
- **medium**: 可能影响效果或带来轻微风险
- **low**: 优化建议，不影响安全

## 【输出要求】

1. **所有判断必须基于循证医学证据**
2. **引用具体的客户健康数据**作为判断依据
3. **提供可操作的调整建议**
4. **使用专业但易懂的语言**
5. **如果缺少健康数据，请在 summary 中标注**

现在请开始评估，并以 JSON 格式返回结果。
`;

/**
 * 周饮食汇总提示词
 * 根据客户本周的饮食照片记录，针对营养干预方案和体检指标，给出评价和指导意见
 */
export const WEEKLY_DIET_SUMMARY_PROMPT = (
  clientInfo: {
    name: string;
    gender: string;
    age: number;
    healthConcerns: string[];
    userRequirements?: string | null;
    preferences?: string | null;
  },
  weekData: {
    weekRange: string;
    mealGroups: Array<{
      date: string;
      mealType: string;
      totalScore: number;
      redFoods?: string[];
      yellowFoods?: string[];
      greenFoods?: string[];
      totalCount?: number;
      protein?: string;
      vegetables?: string;
      fiber?: string;
      carbs?: string;
      fat?: string;
      recognizedFoods?: Array<{
        food: string;
        category: string;
        healthImpact: string;
      }>;
    }>;
  },
  recommendation: any, // Compressed recommendation content
  healthAnalysis: any // HealthAnalysis
) => `
你是一位资深注册营养师 (RD)，正在为客户生成本周饮食汇总报告。

## 【客户信息】

**基本信息:**
- 姓名: ${clientInfo.name}
- 性别: ${clientInfo.gender}
- 年龄: ${clientInfo.age}岁
- 健康问题: ${clientInfo.healthConcerns.join('、') || '无'}
- 个人需求: ${clientInfo.userRequirements || '无'}
- 饮食偏好: ${clientInfo.preferences || '无'}

## 【本周饮食数据 - 详细记录】

**时间范围:** ${weekData.weekRange}
**记录餐数:** ${weekData.mealGroups.length}餐

**逐餐详细数据:**
${weekData.mealGroups.map((g, idx) => {
  const redFoods = g.redFoods || [];
  const yellowFoods = g.yellowFoods || [];
  const greenFoods = g.greenFoods || [];
  return `
【第${idx + 1}餐】${g.date} - ${g.mealType}
├ 评分: ${g.totalScore}分 (${g.totalScore >= 90 ? '优秀' : g.totalScore >= 75 ? '良好' : g.totalScore >= 60 ? '一般' : '需改善'})
├ 红灯食物(${redFoods.length}个): ${redFoods.length > 0 ? redFoods.join('、') : '无'}
├ 黄灯食物(${yellowFoods.length}个): ${yellowFoods.length > 0 ? yellowFoods.join('、') : '无'}
├ 绿灯食物(${greenFoods.length}个): ${greenFoods.length > 0 ? greenFoods.join('、') : '无'}
└ 营养素: 蛋白质${g.protein || '-'}、蔬菜${g.vegetables || '-'}、纤维${g.fiber || '-'}、碳水${g.carbs || '-'}、脂肪${g.fat || '-'}`;
}).join('\n')}

## 【客户的营养干预方案】

**每日目标:**
- 热量: ${recommendation.dailyTargets?.calories || '-'} kcal
- 蛋白质: ${recommendation.dailyTargets?.macros?.protein?.grams || '-'}g
- 膳食纤维: ${recommendation.dailyTargets?.fiber || '-'}

**红绿灯食物:**
- 绿灯食物: ${recommendation.trafficLightFoods?.green?.map((f: any) => f.food).join('、') || '无'}
- 黄灯食物: ${recommendation.trafficLightFoods?.yellow?.map((f: any) => f.food).join('、') || '无'}
- 红灯食物: ${recommendation.trafficLightFoods?.red?.map((f: any) => f.food).join('、') || '无'}

## 【体检指标参考】

${healthAnalysis ? `
**异常指标:**
${healthAnalysis.abnormalIndicators?.map((ind: any) => `- ${ind.indicator}: ${ind.value} (${ind.status})`).join('\n') || '无'}
` : '无体检数据'}

## 【分析要求】

**你必须生成按餐次分解的详细分析，包括:**

1. **按餐次统计**: 早餐、午餐、晚餐、加餐分别统计
2. **具体案例**: 列出每餐出现的红灯食物具体名称和日期
3. **量化指标**: 如"晚餐蛋白质不足3次，发生在1/15、1/17、1/19"
4. **有理有据**: 每条结论都要引用具体的数据支持

**【重要】每餐必须包含评分理由:**
- 对于每餐，必须说明为什么得这个分数
- 包括：蛋白质评估、蔬菜评估、红灯食物情况
- 亮点：做得好的地方（如"优质蛋白来源"、"蔬菜种类丰富"）
- 问题：需要改善的地方（如"蛋白质不足"、"红灯食物过多"）

## 【返回格式】

请以 JSON 格式返回（不要有 markdown 格式）:

{
  "statistics": {
    "totalDays": 数字,
    "totalMeals": 数字,
    "totalPhotos": 数字,
    "avgScore": 数字
  },

  "complianceEvaluation": {
    "overallRating": "优秀/良好/一般/需改善",
    "scoreDistribution": {
      "excellent": {
        "count": 数字,
        "meals": [
          {
            "date": "1/15",
            "mealType": "午餐",
            "score": 92,
            "reason": "蛋白质充足(鸡胸肉30g)、蔬菜丰富(西兰花200g+胡萝卜100g)、无红灯食物",
            "highlights": ["优质蛋白来源", "蔬菜种类丰富", "营养均衡"],
            "issues": []
          }
        ]
      },
      "good": {
        "count": 数字,
        "meals": [
          {
            "date": "1/16",
            "mealType": "晚餐",
            "score": 78,
            "reason": "蛋白质充足(鱼肉25g)、蔬菜适量(青菜150g)、有1个黄灯食物(米饭略多)",
            "highlights": ["蛋白质来源优质", "蔬菜摄入达标"],
            "issues": ["主食量略多"]
          }
        ]
      },
      "fair": {
        "count": 数字,
        "meals": [
          {
            "date": "1/14",
            "mealType": "午餐",
            "score": 65,
            "reason": "蛋白质不足(豆腐仅50g)、蔬菜偏少(生菜100g)、有1个红灯食物(油炸花生)",
            "highlights": ["有植物蛋白"],
            "issues": ["蛋白质量不足", "蔬菜摄入偏少", "含油炸食物"]
          }
        ]
      },
      "poor": {
        "count": 数字,
        "meals": [
          {
            "date": "1/17",
            "mealType": "晚餐",
            "score": 45,
            "reason": "缺乏蛋白质(纯素食晚餐)、蔬菜不足、红灯食物过多(油条+糖醋排骨)",
            "highlights": [],
            "issues": ["无蛋白质来源", "蔬菜量严重不足", "多个红灯食物", "高油脂"]
          }
        ]
      }
    }
  },

  "mealTypeAnalysis": {
    "breakfast": {
      "count": 数字,
      "avgScore": 数字,
      "allMeals": [{"date": "1/15", "score": 85, "protein": "充足", "vegetable": "不足"}],
      "bestMeal": { "date": "日期", "score": 分数 },
      "worstMeal": { "date": "日期", "score": 分数, "issues": ["问题1", "问题2"] },
      "proteinDeficientCount": 数字,
      "vegetableDeficientCount": 数字,
      "redFoodOccurrences": [
        { "food": "油条", "date": "1/15早餐", "reason": "高油炸" }
      ]
    },
    "lunch": {
      "count": 数字,
      "avgScore": 数字,
      "allMeals": [{"date": "1/15", "score": 85, "protein": "充足", "vegetable": "不足"}],
      "bestMeal": { "date": "日期", "score": 分数 },
      "worstMeal": { "date": "日期", "score": 分数, "issues": ["问题1", "问题2"] },
      "proteinDeficientCount": 数字,
      "vegetableDeficientCount": 数字,
      "redFoodOccurrences": [
        { "food": "油条", "date": "1/15早餐", "reason": "高油炸" }
      ]
    },
    "dinner": {
      "count": 数字,
      "avgScore": 数字,
      "allMeals": [{"date": "1/15", "score": 85, "protein": "充足", "vegetable": "不足"}],
      "bestMeal": { "date": "日期", "score": 分数 },
      "worstMeal": { "date": "日期", "score": 分数, "issues": ["问题1", "问题2"] },
      "proteinDeficientCount": 数字,
      "vegetableDeficientCount": 数字,
      "redFoodOccurrences": [
        { "food": "油条", "date": "1/15早餐", "reason": "高油炸" }
      ]
    },
    "snack": {
      "count": 数字,
      "avgScore": 数字,
      "allMeals": [{"date": "1/15", "score": 85, "protein": "充足", "vegetable": "不足"}],
      "bestMeal": { "date": "日期", "score": 分数 },
      "worstMeal": { "date": "日期", "score": 分数, "issues": ["问题1", "问题2"] },
      "proteinDeficientCount": 数字,
      "vegetableDeficientCount": 数字,
      "redFoodOccurrences": [
        { "food": "油条", "date": "1/15早餐", "reason": "高油炸" }
      ]
    }
  },

  "nutritionAnalysis": {
    "proteinStatus": "充足/不足/缺乏",
    "proteinDetails": "本周蛋白质摄入评估，具体说明哪几餐不足",
    "proteinBreakdown": {
      "sufficientCount": 数字,
      "insufficientCount": 数字,
      "lackingCount": 数字,
      "mealsByStatus": {
        "sufficient": [{"date": "1/15", "mealType": "午餐", "source": "鸡胸肉"}],
        "insufficient": [{"date": "1/16", "mealType": "晚餐", "issue": "只有蔬菜，无蛋白质来源"}],
        "lacking": [{"date": "1/17", "mealType": "晚餐", "issue": "纯素食，蛋白质不足"}]
      }
    },
    "vegetableStatus": "充足/不足/缺乏",
    "vegetableDetails": "本周蔬菜摄入评估，具体说明哪几餐不足",
    "vegetableBreakdown": {
      "sufficientCount": 数字,
      "insufficientCount": 数字,
      "lackingCount": 数字,
      "mealsByStatus": {
        "sufficient": [{"date": "1/15", "mealType": "午餐", "types": ["西兰花", "胡萝卜"]}],
        "insufficient": [{"date": "1/16", "mealType": "晚餐", "amount": "约50g，目标100g+"}],
        "lacking": [{"date": "1/17", "mealType": "晚餐", "issue": "几乎无蔬菜"}]
      }
    },
    "fiberStatus": "充足/不足/缺乏",
    "fiberDetails": "本周膳食纤维摄入评估",
    "fiberBreakdown": {
      "sources": ["燕麦", "全麦面包", "西兰花"],
      "avgDailyGrams": 数字,
      "targetGrams": 数字
    },
    "carbQuality": "优质/一般/较差",
    "carbDetails": "本周碳水化合物质量评估，包括精制碳水 vs 全谷物比例",
    "fatQuality": "优质/一般/较差",
    "fatDetails": "本周脂肪质量评估，包括饱和脂肪 vs 不饱和脂肪比例"
  },

  "foodIntakeAnalysis": {
    "greenFoodCount": 数字,
    "yellowFoodCount": 数字,
    "redFoodCount": 数字,
    "allGreenFoods": [
      { "food": "西兰花", "count": 5, "meals": ["1/15午餐", "1/17晚餐"], "benefits": "富含维生素C和纤维" }
    ],
    "allYellowFoods": [
      { "food": "米饭", "count": 7, "meals": ["每日三餐"], "note": "控制分量" }
    ],
    "allRedFoods": [
      { "food": "炸鸡翅", "count": 3, "meals": ["1/14午餐", "1/16晚餐", "1/18午餐"], "healthImpact": "高脂肪高热量", "reason": "高温油炸产生反式脂肪酸" }
    ],
    "mostFrequentGreenFoods": [
      { "food": "西兰花", "count": 5, "meals": ["1/15午餐", "1/17晚餐"] }
    ],
    "mostFrequentRedFoods": [
      { "food": "炸鸡翅", "count": 3, "meals": ["1/14午餐", "1/16晚餐", "1/18午餐"], "healthImpact": "高脂肪高热量" }
    ],
    "redFoodTrends": [
      {
        "food": "炸鸡翅",
        "occurrences": 3,
        "trend": "increasing",
        "suggestion": "建议用烤鸡翅或水煮鸡胸肉替代"
      }
    ]
  },

  "problematicMeals": [
    {
      "date": "1/15",
      "mealType": "晚餐",
      "score": 45,
      "issues": [
        { "type": "nutrition", "description": "蛋白质不足，只有蔬菜和米饭" },
        { "type": "food", "description": "出现红灯食物：红烧肉（高脂）" }
      ],
      "suggestion": "建议增加一份豆制品或瘦肉，减少红烧肉分量"
    }
  ],

  "targetedEvaluation": {
    "healthIndicatorAlignment": [
      {
        "indicator": "血脂偏高",
        "impact": "positive",
        "evidence": "本周5餐低脂高纤维，有利于血脂控制；但2餐出现油炸食品（1/14午餐炸鸡翅、1/18午餐炸鱼）"
      }
    ],
    "goalProgress": [
      {
        "goal": "减重",
        "progress": "needs_improvement",
        "assessment": "本周7餐中有3餐热量超标（1/14午餐、1/16晚餐、1/18午餐），主要原因是外食和高油烹饪",
        "specificIssues": [
          "1/14午餐：炸鸡翅+大份米饭，估计热量800kcal",
          "1/16晚餐：红烧肉分量偏大"
        ]
      }
    ]
  },

  "improvementRecommendations": [
    {
      "category": "keepDoing",
      "priority": "high",
      "behavior": "早餐规律且营养均衡",
      "evidence": "本周7天早餐全部记录，平均分85分",
      "reason": "有助于稳定血糖，提供充足能量"
    },
    {
      "category": "improve",
      "priority": "high",
      "issue": "晚餐蔬菜摄入不足",
      "evidence": "7天晚餐中有4天蔬菜不足（1/14、1/16、1/17、1/19）",
      "quantification": "本周晚餐平均蔬菜约100g，目标200g/餐",
      "suggestion": "增加晚餐蔬菜至2份（约200g）",
      "actionSteps": [
        "周末预切蔬菜，方便烹饪",
        "晚餐蔬菜占餐盘1/2",
        "尝试绿叶菜+十字花科蔬菜搭配"
      ],
      "expectedOutcome": "膳食纤维达标，增加饱腹感，减少晚间饥饿"
    },
    {
      "category": "improve",
      "priority": "high",
      "issue": "油炸食品出现频率过高",
      "evidence": "本周出现3次油炸食品（炸鸡翅2次、炸鱼1次）",
      "quantification": "油炸食品占21%的餐次（3/14）",
      "healthImpact": "增加反式脂肪酸摄入，不利于心血管健康",
      "suggestion": "油炸食品每周不超过1次",
      "alternatives": [
        "炸鸡翅 → 烤鸡翅或水煮鸡胸肉",
        "炸鱼 → 清蒸鱼或煎鱼（少油）"
      ]
    },
    {
      "category": "tryNew",
      "priority": "medium",
      "suggestion": "尝试藜麦代替米饭",
      "reason": "藜麦富含蛋白质和纤维，GI值低，有助于控制血糖",
      "howTo": "周末批量煮好，冷藏保存，食用时微波加热"
    }
  ],

  "nextWeekGoals": {
    "primaryGoals": [
      "每日晚餐蔬菜≥200g（本周仅43%达标）",
      "油炸食品≤1次（本周3次）",
      "晚餐蛋白质充足率≥85%（本周仅57%）"
    ],
    "smartGoals": [
      {
        "goal": "晚餐蔬菜达标率100%",
        "measurable": "每日晚餐至少2份蔬菜（约200g），7天全达标",
        "achievable": "通过周末备餐实现",
        "relevant": "改善膳食纤维不足，增加饱腹感，辅助减重",
        "timeBound": "下周7天每天执行",
        "baseline": "本周7晚餐中只有3餐蔬菜达标（43%）",
        "target": "下周7晚餐全部达标（100%）"
      }
    ]
  },

  "nutritionistActions": {
    "followUpNeeded": true,
    "suggestedTopics": [
      "讨论如何减少外食频率（本周外食4次）",
      "教授低油烹饪技巧",
      "制定晚餐蔬菜搭配方案"
    ],
    "adjustmentsNeeded": true,
    "recommendationAdjustments": [
      "建议增加适合晚餐的快手蔬菜菜谱",
      "提供外食选择指南"
    ]
  },

  "summary": {
    "overall": "本周饮食整体良好，平均分76分（良好）。早餐表现最优（85分），晚餐需要加强（68分）。主要问题：晚餐蔬菜不足（4/7天）、油炸食品偏多（3次）。",
    "highlights": [
      "早餐坚持规律且营养均衡，7天全部记录，平均85分",
      "绿灯食物种类丰富，本周共35种，包括西兰花、鸡胸肉、燕麦等",
      "蛋白质摄入基本达标，午餐和加餐表现良好"
    ],
    "concerns": [
      "晚餐蔬菜不足：7天中有4天蔬菜摄入量不足100g（1/14、1/16、1/17、1/19）",
      "油炸食品频繁：本周出现3次（1/14午餐炸鸡翅、1/18午餐炸鱼、1/19晚餐炸薯条），占21%的餐次",
      "外食次数较多：本周外食4次，其中3次出现红灯食物"
    ],
    "encouragement": "你已经养成了记录饮食的好习惯，早餐和午餐表现很棒！下周重点优化晚餐的蔬菜摄入，让我们一起把晚餐的分数从68分提升到80分！"
  }
}

## 【重要提示 - 必须严格遵守】

**评分理由要求（complianceEvaluation.scoreDistribution.meals）:**
- 每一餐必须包含 reason 字段：简要说明为什么得这个分数
- 格式："{蛋白质评估}、{蔬菜评估}、{红灯食物情况}"
- 示例："蛋白质充足(鸡胸肉30g)、蔬菜丰富(西兰花200g+胡萝卜100g)、无红灯食物"
- 每一餐必须包含 highlights 数组：列出2-3个做得好的地方
- 每一餐必须包含 issues 数组：列出需要改善的问题

**营养分析要求（nutritionAnalysis）:**
- proteinBreakdown.mealsByStatus 必须列出**每一餐**的蛋白质评估
- vegetableBreakdown.mealsByStatus 必须列出**每一餐**的蔬菜评估
- fiberBreakdown 必须提供具体的纤维来源和每日摄入量
- 不得使用"缺乏"等简单结论，必须说明"哪几餐缺乏、具体缺什么"

**食物分析要求（foodIntakeAnalysis）:**
- allGreenFoods 必须列出**所有**绿灯食物（不仅是最频繁的）
- allYellowFoods 必须列出**所有**黄灯食物
- allRedFoods 必须列出**所有**红灯食物
- 每个食物必须包含 count（出现次数）和 meals（具体餐次数组）

**通用要求:**
1. **数据驱动**: 每条结论必须引用具体数据，如"7天晚餐中有4天蔬菜不足"
2. **具体案例**: 必须列出具体日期和餐次，如"1/14午餐炸鸡翅"
3. **量化指标**: 使用具体数字，避免"经常"、"有时"等模糊词
4. **有理有据**: 每条建议都要说明为什么（基于什么数据）

**【重要】JSON格式要求:**
- **所有数字字段必须是完整的数字**，不要输出如 "count": - 或 "score": 这样的不完整格式
- **计算必须提前完成**：如果需要计算差值，请先计算好再输出，不要在JSON中写表达式
- **空值处理**：如果某项数据为0或空，必须输出完整的数字0，不要只输出减号
- **示例**：
  - ✅ 正确: "count": 3, "score": 85, "deficientCount": 0
  - ❌ 错误: "count": -, "score": , "deficientCount": -

严格按照JSON结构返回结果，不要省略任何字段。
`;

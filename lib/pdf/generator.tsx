import { renderToBuffer } from '@react-pdf/renderer';
import { PDFTemplate } from '@/components/pdf/PDFDocument';
import { PDFFoodGuide } from '@/components/pdf/PDFFoodGuide';
import { PDFFoodGuideMobile } from '@/components/pdf/PDFFoodGuideMobile';
import { PDFExercisePlan } from '@/components/pdf/PDFExercisePlan';
import { PDFRecommendationSummary } from '@/components/pdf/PDFRecommendationSummary';
import { TrafficLightData } from '@/components/TrafficLightGuide';
import { registerPDFFonts } from './fonts';

function convertTrafficLightData(data: any): TrafficLightData | null {
  if (!data?.trafficLightFoods) return null;

  const convertFoodItem = (item: any, variant: 'green' | 'yellow' | 'red'): any => {
    if (item.name && (item.detail || item.reason || item.category || item.nutrients)) {
      return item;
    }

    const baseItem = {
      name: item.food || item.name || '',
      category: item.category || undefined,
      nutrients: item.nutrients || item.keyNutrients || undefined,
      frequency: item.frequency || item.servingFrequency || undefined,
    };

    if (variant === 'red') {
      return {
        ...baseItem,
        reason: item.reason || item.whyAvoid || '',
        alternatives: item.alternatives || item.substitutes || undefined,
      };
    }

    if (variant === 'yellow') {
      return {
        ...baseItem,
        detail: item.reason || item.detail || item.whyLimit || '',
        limit: item.limit || item.serving || item.dailyLimit || '',
      };
    }

    return {
      ...baseItem,
      detail: item.reason || item.detail || item.whyRecommended || '',
    };
  };

  const getRationale = (variant: 'green' | 'yellow' | 'red'): string => {
    const rationales = {
      green: '这些食物富含改善您当前异常指标所需的关键营养素，是211饮食法的核心组成部分。建议每餐保证50%蔬菜，25%高蛋白食物，25%全谷物。',
      yellow: '这些食物营养价值适中，但热量较高或含有可能影响您指标的成分。建议控制份量和食用频率，可作为偶尔调剂。',
      red: '这些食物会恶化您当前的异常指标，应严格避免。它们通常高盐、高糖、高饱和脂肪或含有对您当前健康状况不利的成分。',
    };
    return rationales[variant];
  };

  return {
    green: {
      title: '🟢 绿灯食物 (推荐食用)',
      description: '富含改善指标的关键营养素，建议作为每餐主要选择',
      rationale: getRationale('green'),
      items: (data.trafficLightFoods.green || []).map((item: any) => convertFoodItem(item, 'green')),
    },
    yellow: {
      title: '🟡 黄灯食物 (控制份量)',
      description: '可适量食用，需注意控制频率和份量',
      rationale: getRationale('yellow'),
      items: (data.trafficLightFoods.yellow || []).map((item: any) => convertFoodItem(item, 'yellow')),
    },
    red: {
      title: '🔴 红灯食物 (严格避免)',
      description: '会恶化当前指标，应从饮食中完全排除',
      rationale: getRationale('red'),
      items: (data.trafficLightFoods.red || []).map((item: any) => convertFoodItem(item, 'red')),
    },
  };
}

export async function generateFoodGuidePDF(content: any, clientName: string, generatedDate: string) {
  // 注册字体（仅注册一次）
  registerPDFFonts();

  const trafficLightData = convertTrafficLightData(content);

  if (!trafficLightData) {
    throw new Error('暂无食物指南数据');
  }

  const pdfComponent = (
    <PDFTemplate title="红绿灯食物指南" clientName={clientName} date={generatedDate}>
      <PDFFoodGuide data={trafficLightData} />
    </PDFTemplate>
  );

  return await renderToBuffer(pdfComponent);
}

export async function generateExercisePlanPDF(content: any, clientName: string, generatedDate: string) {
  // 注册字体（仅注册一次）
  registerPDFFonts();

  const exerciseData = content.detailedExercisePrescription;

  if (!exerciseData) {
    throw new Error('暂无运动处方数据');
  }

  const pdfComponent = (
    <PDFTemplate title="两周运动训练计划" clientName={clientName} date={generatedDate}>
      <PDFExercisePlan data={exerciseData} />
    </PDFTemplate>
  );

  return await renderToBuffer(pdfComponent);
}

export async function generateRecommendationSummaryPDF(content: any, clientName: string, generatedDate: string) {
  // 注册字体（仅注册一次）
  registerPDFFonts();

  if (!content.biomarkerInterventionMapping && !content.twoWeekPlan) {
    throw new Error('暂无干预方案数据');
  }

  const pdfComponent = (
    <PDFTemplate title="营养干预方案" clientName={clientName} date={generatedDate}>
      <PDFRecommendationSummary 
        content={content}
        clientName={clientName}
        generatedDate={generatedDate}
      />
    </PDFTemplate>
  );

  return await renderToBuffer(pdfComponent);
}

// 健康分析 PDF
export async function generateHealthAnalysisPDF(content: any, clientName: string, generatedDate: string) {
  registerPDFFonts();

  if (!content.biomarkerInterventionMapping && !content.healthConcernsInterventions) {
    throw new Error('暂无健康分析数据');
  }

  // 使用 PDFRecommendationSummary 但只包含健康相关部分
  const healthContent = {
    biomarkerInterventionMapping: content.biomarkerInterventionMapping,
    healthConcernsInterventions: content.healthConcernsInterventions,
  };

  const pdfComponent = (
    <PDFTemplate title="健康分析报告" clientName={clientName} date={generatedDate}>
      <PDFRecommendationSummary 
        content={healthContent}
        clientName={clientName}
        generatedDate={generatedDate}
      />
    </PDFTemplate>
  );

  return await renderToBuffer(pdfComponent);
}

// 两周执行计划 PDF
export async function generateActionPlanPDF(content: any, clientName: string, generatedDate: string) {
  registerPDFFonts();

  if (!content.twoWeekPlan) {
    throw new Error('暂无执行计划数据');
  }

  const planContent = {
    twoWeekPlan: content.twoWeekPlan,
    followUpPlan: content.followUpPlan,
  };

  const pdfComponent = (
    <PDFTemplate title="两周执行计划" clientName={clientName} date={generatedDate}>
      <PDFRecommendationSummary 
        content={planContent}
        clientName={clientName}
        generatedDate={generatedDate}
      />
    </PDFTemplate>
  );

  return await renderToBuffer(pdfComponent);
}

// 补充剂清单 PDF
export async function generateSupplementsPDF(content: any, clientName: string, generatedDate: string) {
  registerPDFFonts();

  if (!content.supplements || content.supplements.length === 0) {
    throw new Error('暂无补充剂数据');
  }

  const supplementsContent = {
    supplements: content.supplements,
  };

  const pdfComponent = (
    <PDFTemplate title="补充剂清单" clientName={clientName} date={generatedDate}>
      <PDFRecommendationSummary
        content={supplementsContent}
        clientName={clientName}
        generatedDate={generatedDate}
      />
    </PDFTemplate>
  );

  return await renderToBuffer(pdfComponent);
}

// 移动端红绿灯食物指南 PDF - 优化手机阅读
export async function generateFoodGuidePDFMobile(content: any, clientName: string, generatedDate: string) {
  registerPDFFonts();

  const trafficLightData = convertTrafficLightData(content);

  if (!trafficLightData) {
    throw new Error('暂无食物指南数据');
  }

  // 直接使用移动端组件，不需要 PDFTemplate 包装
  const pdfComponent = (
    <PDFFoodGuideMobile
      data={trafficLightData}
      clientName={clientName}
      generatedDate={generatedDate}
    />
  );

  return await renderToBuffer(pdfComponent);
}

// 评估结果 PDF - 导出营养师计划评估报告
export async function generatePlanEvaluationPDF(
  evaluationData: {
    planType: 'diet' | 'exercise';
    evaluation: {
      overallStatus: 'safe' | 'needs_adjustment' | 'unsafe';
      safetyScore: number;
      summary: string;
      keyFindings: string[];
    };
    concerns: any[];
    suggestions: any[];
  },
  clientName: string,
  generatedDate: string
) {
  registerPDFFonts();

  const { PDFPlanEvaluation } = await import('@/components/pdf/PDFPlanEvaluation');

  const pdfComponent = (
    <PDFPlanEvaluation
      clientName={clientName}
      generatedDate={generatedDate}
      planType={evaluationData.planType}
      evaluation={evaluationData.evaluation}
      concerns={evaluationData.concerns}
      suggestions={evaluationData.suggestions}
    />
  );

  return await renderToBuffer(pdfComponent);
}

// 优化计划 PDF - 导出 AI 优化后的营养方案
export async function generateOptimizedPlanPDF(
  optimizedPlanData: {
    planType: 'diet' | 'exercise';
    optimizedPlan: any;
  },
  clientName: string,
  generatedDate: string
) {
  registerPDFFonts();

  const { PDFOptimizedPlan } = await import('@/components/pdf/PDFOptimizedPlan');

  if (!optimizedPlanData.optimizedPlan) {
    throw new Error('暂无优化方案数据');
  }

  const pdfComponent = (
    <PDFOptimizedPlan
      clientName={clientName}
      generatedDate={generatedDate}
      planType={optimizedPlanData.planType}
      optimizedPlan={optimizedPlanData.optimizedPlan}
    />
  );

  return await renderToBuffer(pdfComponent);
}

// 周饮食汇总 PDF
export async function generateWeeklyDietSummaryPDF(
  summaryContent: any,
  clientName: string,
  generatedDate: string,
  weekRange: string
) {
  registerPDFFonts();

  const { PDFWeeklyDietSummary } = await import('@/lib/pdf/weekly-diet-summary');

  if (!summaryContent) {
    throw new Error('暂无周饮食汇总数据');
  }

  const pdfComponent = (
    <PDFWeeklyDietSummary
      content={summaryContent}
      clientName={clientName}
      generatedDate={generatedDate}
      weekRange={weekRange}
    />
  );

  return await renderToBuffer(pdfComponent);
}

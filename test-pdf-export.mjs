import { renderToBuffer } from '@react-pdf/renderer';
import { PDFTemplate } from './components/pdf/PDFDocument.js';
import { PDFExercisePlan } from './components/pdf/PDFExercisePlan.js';
import { readFileSync } from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 注册中文字体
const fontRegularPath = path.join(process.cwd(), 'node_modules/@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-400-normal.woff2');
const fontBoldPath = path.join(process.cwd(), 'node_modules/@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-700-normal.woff2');

// 动态导入 Font
async function testPDFExport() {
  try {
    // 获取推荐数据
    const recommendation = await prisma.recommendation.findFirst({
      where: {
        id: 'cmkvxhxxp0007bslwa71q7hbv',
        client: {
          userId: 'user_123' // 临时使用，实际会从session获取
        }
      },
      include: {
        client: true,
      },
    });

    if (!recommendation) {
      console.log('❌ 推荐不存在');
      return;
    }

    const exerciseData = recommendation.content?.detailedExercisePrescription;
    if (!exerciseData) {
      console.log('❌ 无运动处方数据');
      console.log('Content keys:', Object.keys(recommendation.content || {}));
      return;
    }

    console.log('✅ 找到运动处方数据');
    console.log('- 运动类型:', exerciseData.type);
    console.log('- 每周计划周数:', exerciseData.weeklySchedule?.length);

    // 生成PDF
    const pdfComponent = (
      <PDFTemplate
        title="第一个月运动训练计划"
        clientName={recommendation.client?.name || '测试客户'}
        date={new Date(recommendation.generatedAt || new Date()).toLocaleDateString('zh-CN')}
      >
        <PDFExercisePlan data={exerciseData} />
      </PDFTemplate>
    );

    console.log('开始生成PDF...');
    const buffer = await renderToBuffer(pdfComponent);

    // 保存PDF
    const outputPath = path.join(process.cwd(), 'test-exercise-plan.pdf');
    require('fs').writeFileSync(outputPath, buffer);

    console.log('✅ PDF导出成功！');
    console.log('- 文件大小:', (buffer.length / 1024).toFixed(2), 'KB');
    console.log('- 保存路径:', outputPath);
    console.log('');
    console.log('正在打开PDF...');

    // 在macOS上打开
    const { exec } = require('child_process');
    exec(`open "${outputPath}"`);

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testPDFExport();

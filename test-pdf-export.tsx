import { renderToBuffer } from '@react-pdf/renderer';
import { PDFTemplate } from './components/pdf/PDFDocument';
import { PDFExercisePlan } from './components/pdf/PDFExercisePlan';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { registerPDFFonts } from './lib/pdf/fonts';

const prisma = new PrismaClient();

// 注册中文字体（使用统一的字体管理）
registerPDFFonts();

async function testPDFExport() {
  try {
    // 获取推荐数据
    const recommendation = await prisma.recommendation.findFirst({
      where: {
        id: 'cmkvxhxxp0007bslwa71q7hbv',
      },
      include: {
        client: true,
      },
    });

    if (!recommendation) {
      console.log('❌ 推荐不存在，使用模拟数据测试');

      // 使用模拟数据
      const mockExerciseData = {
        overview: '第一个月训练计划：建立基础运动习惯，逐步提升体能。',
        goals: [
          '每周进行3-4次运动训练',
          '逐步提高运动强度和时间',
          '培养良好的运动习惯'
        ],
        equipment: {
          owned: ['瑜伽垫', '弹力带'],
          recommended: []
        },
        weeklySchedule: [
          {
            week: 1,
            focus: '适应期',
            days: [
              {
                day: '周一',
                type: '力量训练',
                duration: '30分钟',
                exercises: [
                  {
                    name: '深蹲',
                    sets: 3,
                    reps: '12次',
                    rest: '60秒',
                    intensity: '自身体重，控制速度'
                  }
                ]
              }
            ]
          }
        ],
        progression: '每周增加5-10%的运动量，根据身体适应情况调整',
        precautions: ['运动前充分热身', '保持正确姿势', '量力而行'],
        successCriteria: ['能完成基础动作', '心率恢复正常', '无运动疼痛']
      };

      const pdfComponent = (
        <PDFTemplate
          title="第一个月运动训练计划"
          clientName="测试客户"
          date={new Date().toLocaleDateString('zh-CN')}
        >
          <PDFExercisePlan data={mockExerciseData} />
        </PDFTemplate>
      );

      console.log('开始生成PDF...');
      const buffer = await renderToBuffer(pdfComponent);

      const outputPath = path.join(process.cwd(), 'test-exercise-plan.pdf');
      fs.writeFileSync(outputPath, buffer);

      console.log('✅ PDF导出成功！');
      console.log('- 文件大小:', (buffer.length / 1024).toFixed(2), 'KB');
      console.log('- 保存路径:', outputPath);

      // 打开PDF
      const { exec } = require('child_process');
      exec(`open "${outputPath}"`);

      return;
    }

    const exerciseData = (recommendation.content as any)?.detailedExercisePrescription;
    if (!exerciseData) {
      console.log('❌ 无运动处方数据');
      return;
    }

    console.log('✅ 找到运动处方数据');

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

    const outputPath = path.join(process.cwd(), 'test-exercise-plan.pdf');
    fs.writeFileSync(outputPath, buffer);

    console.log('✅ PDF导出成功！');
    console.log('- 文件大小:', (buffer.length / 1024).toFixed(2), 'KB');

    const { exec } = require('child_process');
    exec(`open "${outputPath}"`);

  } catch (error) {
    console.error('❌ 测试失败:', (error as Error).message);
    console.error((error as Error).stack);
  } finally {
    await prisma.$disconnect();
  }
}

testPDFExport();

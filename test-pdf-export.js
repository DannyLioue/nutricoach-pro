// 测试PDF生成功能
const { renderToBuffer } = require('@react-pdf/renderer');
const fs = require('fs');

// 模拟数据
const mockData = {
  green: {
    title: '🟢 绿灯食物 (推荐食用)',
    description: '富含改善指标的关键营养素，建议作为每餐主要选择',
    rationale: '这些食物富含改善您当前异常指标所需的关键营养素，是211饮食法的核心组成部分。建议每餐保证50%蔬菜，25%高蛋白食物，25%全谷物。',
    items: [
      {
        name: '冬瓜',
        category: '蔬菜类',
        detail: '低热量高水分，有利尿消肿作用',
        nutrients: ['膳食纤维', '维生素C', '钾'],
      },
      {
        name: '含糖饮料',
        category: '高糖饮品',
        detail: '应避免饮用，选择白开水或茶',
        nutrients: ['无'],
      },
      {
        name: '鸡胸肉',
        category: '高蛋白',
        detail: '优质蛋白质来源，低脂肪',
        nutrients: ['蛋白质', '维生素B6', ' niacin'],
      },
    ],
  },
  yellow: {
    title: '🟡 黄灯食物 (控制份量)',
    description: '可适量食用，需注意控制频率和份量',
    rationale: '这些食物营养价值适中，但热量较高或含有可能影响您指标的成分。建议控制份量和食用频率，可作为偶尔调剂。',
    items: [
      {
        name: '白米饭',
        category: '主食类',
        detail: '精制碳水，适量食用',
        limit: '每餐1小碗',
      },
    ],
  },
  red: {
    title: '🔴 红灯食物 (严格避免)',
    description: '会恶化当前指标，应从饮食中完全排除',
    rationale: '这些食物会恶化您当前的异常指标，应严格避免。它们通常高盐、高糖、高饱和脂肪或含有对您当前健康状况不利的成分。',
    items: [
      {
        name: '油炸食品',
        category: '加工食品',
        reason: '高脂肪高热量',
        alternatives: ['清蒸', '水煮'],
      },
    ],
  },
};

async function testPDF() {
  try {
    // 注册字体
    const { registerPDFFonts } = require('./lib/pdf/fonts.ts');
    registerPDFFonts(true);

    // 导入组件
    const { PDFFoodGuideMobile } = require('./components/pdf/PDFFoodGuideMobile.tsx');

    // 创建PDF
    const pdfComponent = (
      PDFFoodGuideMobile({
        data: mockData,
        clientName: '测试客户',
        generatedDate: '2026-01-28',
      })
    );

    // 渲染PDF
    const buffer = await renderToBuffer(pdfComponent);

    // 保存PDF
    fs.writeFileSync('/tmp/test-mobile-food-guide.pdf', buffer);
    console.log('✅ PDF生成成功！已保存到 /tmp/test-mobile-food-guide.pdf');
    console.log(`文件大小: ${(buffer.length / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error('❌ PDF生成失败:', error.message);
    console.error(error.stack);
  }
}

testPDF();

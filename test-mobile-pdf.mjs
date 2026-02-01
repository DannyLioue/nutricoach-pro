import { renderToBuffer } from '@react-pdf/renderer';
import { registerPDFFonts } from './lib/pdf/fonts.ts';
import { PDFFoodGuideMobile } from './components/pdf/PDFFoodGuideMobile.tsx';

const mockData = {
  green: {
    title: '🟢 绿灯食物 (推荐食用)',
    description: '富含改善指标的关键营养素，建议作为每餐主要选择',
    rationale: '这些食物富含改善您当前异常指标所需的关键营养素',
    items: [
      { name: '西兰花', category: '蔬菜类', detail: '富含维生素C和纤维，这是为了测试长文本是否会正确换行显示', nutrients: ['维生素C', '膳食纤维', '钾元素'] },
      { name: '胡萝卜', category: '蔬菜类', detail: '富含胡萝卜素对眼睛很好', nutrients: ['维生素A', '膳食纤维'] }
    ]
  },
  yellow: {
    title: '🟡 黄灯食物 (控制份量)',
    description: '可适量食用，需注意控制频率和份量',
    rationale: '这些食物营养价值适中，但热量较高或含有可能影响您指标的成分',
    items: [
      { name: '白米饭', category: '主食类', detail: '精制碳水，适量食用', limit: '每餐不超过1小碗约100克' }
    ]
  },
  red: {
    title: '🔴 红灯食物 (严格避免)',
    description: '会恶化当前指标，应从饮食中完全排除',
    rationale: '这些食物会恶化您当前的异常指标，应严格避免',
    items: [
      { name: '油炸食品', category: '其他', reason: '高脂肪高热量，不利于健康', alternatives: ['清蒸', '水煮', '烤'] }
    ]
  }
};

async function test() {
  try {
    await registerPDFFonts();
    const pdf = PDFFoodGuideMobile({
      data: mockData,
      clientName: '测试客户张三李四王五赵六',
      generatedDate: '2024年3月1日'
    });
    
    const buffer = await renderToBuffer(pdf);
    console.log('✓ PDF generated successfully, size:', buffer.length, 'bytes');
    Bun.write('/tmp/test-mobile.pdf', buffer);
    console.log('✓ PDF saved to /tmp/test-mobile.pdf');
    console.log('Please open the file to check for garbled text and line wrapping');
  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error(error.stack);
  }
}

test();

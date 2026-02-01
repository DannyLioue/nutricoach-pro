import { renderToBuffer } from '@react-pdf/renderer';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import path from 'path';
import fs from 'fs';
import { registerPDFFonts } from './lib/pdf/fonts';

// 注册中文字体（使用统一的字体管理）
registerPDFFonts();

const styles = {
  page: {
    padding: 30,
    fontFamily: 'Noto Sans SC',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 20,
    fontFamily: 'Noto Sans SC',
  },
  text: {
    fontSize: 14,
    marginBottom: 10,
    fontFamily: 'Noto Sans SC',
  },
};

const TestPDF = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>中文字体测试</Text>
      <Text style={styles.text}>这是一个测试PDF文档，用于验证中文字体是否正常显示。</Text>
      <Text style={styles.text}>营养师智能分析平台 - NutriCoach Pro</Text>
      <Text style={styles.text}>红绿灯食物指南</Text>
      <Text style={styles.text}>运动处方：第一个月训练计划</Text>
      <Text style={styles.text}>字符测试：中文文字、数字123、English ABC</Text>
    </Page>
  </Document>
);

async function test() {
  try {
    console.log('开始生成PDF...');
    const buffer = await renderToBuffer(<TestPDF />);

    // 保存到文件
    const outputPath = path.join(process.cwd(), 'test-chinese-font.pdf');
    fs.writeFileSync(outputPath, buffer);

    console.log('✅ PDF生成成功！');
    console.log('文件大小:', (buffer.length / 1024).toFixed(2), 'KB');
    console.log('保存路径:', outputPath);
    console.log('');
    console.log('请在预览应用中打开PDF文件，检查中文字符是否正常显示。');
  } catch (error) {
    console.error('❌ PDF生成失败:', (error as Error).message);
    console.error((error as Error).stack);
    process.exit(1);
  }
}

test();

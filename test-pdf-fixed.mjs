import { renderToBuffer } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import fs from 'fs';
import { registerPDFFonts } from './lib/pdf/fonts.ts';

// 注册字体
registerPDFFonts();

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Noto Sans SC',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 20,
    color: '#111827',
    fontFamily: 'Noto Sans SC',
  },
  text: {
    fontSize: 14,
    marginBottom: 10,
    color: '#374151',
    lineHeight: 1.6,
    fontFamily: 'Noto Sans SC',
  },
  section: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 8,
    color: '#065F46',
    fontFamily: 'Noto Sans SC',
  },
});

const TestPDF = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>NutriCoach Pro - 中文字体测试</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>系统信息</Text>
        <Text style={styles.text}>营养师智能分析平台</Text>
        <Text style={styles.text}>版本: 0.1.0</Text>
        <Text style={styles.text}>测试日期: 2026-01-27</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>功能测试</Text>
        <Text style={styles.text}>1. 红绿灯食物指南 - 个性化饮食建议</Text>
        <Text style={styles.text}>2. 运动处方 - 第一个月训练计划</Text>
        <Text style={styles.text}>3. 健康指标分析 - AI智能解读</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>字符测试</Text>
        <Text style={styles.text}>中文: 营养健康管理系统</Text>
        <Text style={styles.text}>数字: 1234567890</Text>
        <Text style={styles.text}>English: NutriCoach Professional Edition</Text>
        <Text style={styles.text}>混合: 211饮食法、BMI指数、AI分析</Text>
      </View>

      <Text style={[styles.text, { marginTop: 20, fontSize: 12, color: '#6B7280' }]}>
        如果您能清晰看到以上所有中文文字，说明PDF导出功能已修复成功！
      </Text>
    </Page>
  </Document>
);

async function test() {
  try {
    console.log('开始生成测试PDF...');
    console.log('使用新的字体管理系统（OTF格式）\n');

    const startTime = Date.now();
    const buffer = await renderToBuffer(<TestPDF />);
    const endTime = Date.now();

    const outputPath = './test-fixed.pdf';
    fs.writeFileSync(outputPath, buffer);

    const fileSizeKB = (buffer.length / 1024).toFixed(2);
    const generationTime = endTime - startTime;

    console.log('✅ PDF生成成功！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📦 文件大小: ${fileSizeKB} KB`);
    console.log(`⏱️  生成时间: ${generationTime} ms`);
    console.log(`📄 保存路径: ${outputPath}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 验证文件大小
    if (buffer.length < 500 * 1024) {
      console.log('✅ 文件大小正常（< 500 KB）');
    } else {
      console.log('⚠️  警告：文件大小仍然偏大');
    }

    console.log('\n请用PDF阅读器打开文件，检查中文是否正常显示。');
    
  } catch (error) {
    console.error('❌ PDF生成失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

test();

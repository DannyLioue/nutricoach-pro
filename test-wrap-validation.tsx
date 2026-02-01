import { renderToBuffer, Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import fs from 'fs';
import { registerPDFFonts } from './lib/pdf/fonts';
import { wrapChineseText } from './lib/pdf/text-wrapper';

registerPDFFonts();

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Noto Sans SC',
    backgroundColor: '#FFFFFF',
  },
  box: {
    backgroundColor: '#F0FDF4',
    padding: 15,
    borderWidth: 1,
    borderColor: '#86EFAC',
    marginBottom: 15,
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 8,
    fontFamily: 'Noto Sans SC',
  },
  text: {
    fontSize: 11,
    fontFamily: 'Noto Sans SC',
    lineHeight: 1.5,
  },
});

// 测试用的超长文本
const veryLongText = '本训练计划旨在逐渐增强您的力量和耐力结合您当前的健康状况帮助您实现体能提升和整体健康本训练计划旨在逐渐增强您的力量和耐力结合您当前的健康状况帮助您实现体能提升和整体健康本训练计划旨在逐渐增强您的力量和耐力结合您当前的健康状况帮助您实现体能提升和整体健康';

const normalText = '为了实现上肢、背部和核心的力量训练目标，需要哑铃提供渐进的阻力刺激。可调节哑铃能够根据训练强度逐步增加重量，满足不同阶段的训练需求。';

const TestPDF = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.box}>
        <Text style={styles.title}>测试1：不使用wrapChineseText（应该超框）</Text>
        <Text style={styles.text}>{veryLongText}</Text>
      </View>

      <View style={styles.box}>
        <Text style={styles.title}>测试2：使用wrapChineseText（不应超框）</Text>
        <Text style={styles.text}>{wrapChineseText(veryLongText)}</Text>
      </View>

      <View style={styles.box}>
        <Text style={styles.title}>测试3：正常长度不使用wrap</Text>
        <Text style={styles.text}>{normalText}</Text>
      </View>

      <View style={styles.box}>
        <Text style={styles.title}>测试4：正常长度使用wrap</Text>
        <Text style={styles.text}>{wrapChineseText(normalText)}</Text>
      </View>

      <View style={styles.box}>
        <Text style={styles.title}>测试5：页面宽度边界测试</Text>
        <Text style={styles.text}>
          {wrapChineseText('一二三四五六七八九十一二三四五六七八九十一二三四五六七八九十一二三四五六七八九十一二三四五六七八九十一二三四五六七八九十')}
        </Text>
      </View>
    </Page>
  </Document>
);

async function test() {
  try {
    console.log('开始生成验证PDF...');
    const buffer = await renderToBuffer(<TestPDF />);
    const outputPath = './test-wrap-validation.pdf';
    fs.writeFileSync(outputPath, buffer);
    
    console.log('✅ PDF生成成功！');
    console.log('文件大小:', (buffer.length / 1024).toFixed(2), 'KB');
    console.log('保存路径:', outputPath);
    
    const { exec } = require('child_process');
    exec(`open "${outputPath}"`);
  } catch (error) {
    console.error('❌ 失败:', error);
  }
}

test();

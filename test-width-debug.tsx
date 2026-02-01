import { renderToBuffer, Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import fs from 'fs';
import { registerPDFFonts } from './lib/pdf/fonts';

registerPDFFonts();

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Noto Sans SC',
  },
  box: {
    backgroundColor: '#F0FDF4',
    padding: 15,
    borderWidth: 1,
    borderColor: '#86EFAC',
    marginBottom: 15,
  },
  text: {
    fontSize: 11,
    fontFamily: 'Noto Sans SC',
    lineHeight: 1.5,
  },
});

const TestPDF = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* 测试不同的maxWidth值 */}
      <View style={styles.box}>
        <Text style={styles.text}>无宽度限制：本训练计划旨在逐渐增强您的力量和耐力，结合您当前的健康状况，帮助您实现体能提升和整体健康。</Text>
      </View>

      <View style={styles.box}>
        <Text style={[styles.text, { maxWidth: 500 }]}>maxWidth 500：本训练计划旨在逐渐增强您的力量和耐力，结合您当前的健康状况，帮助您实现体能提升和整体健康。</Text>
      </View>

      <View style={styles.box}>
        <Text style={[styles.text, { maxWidth: 480 }]}>maxWidth 480：本训练计划旨在逐渐增强您的力量和耐力，结合您当前的健康状况，帮助您实现体能提升和整体健康。</Text>
      </View>

      <View style={styles.box}>
        <Text style={[styles.text, { maxWidth: 460 }]}>maxWidth 460：本训练计划旨在逐渐增强您的力量和耐力，结合您当前的健康状况，帮助您实现体能提升和整体健康。</Text>
      </View>

      <View style={styles.box}>
        <Text style={[styles.text, { maxWidth: 440 }]}>maxWidth 440：本训练计划旨在逐渐增强您的力量和耐力，结合您当前的健康状况，帮助您实现体能提升和整体健康。</Text>
      </View>

      <View style={styles.box}>
        <Text style={[styles.text, { width: 480 }]}>width 480（固定）：本训练计划旨在逐渐增强您的力量和耐力，结合您当前的健康状况，帮助您实现体能提升和整体健康。</Text>
      </View>
    </Page>
  </Document>
);

async function test() {
  try {
    const buffer = await renderToBuffer(<TestPDF />);
    const outputPath = './test-width-debug.pdf';
    fs.writeFileSync(outputPath, buffer);
    console.log('✅ 测试PDF生成成功！');
    console.log('文件路径:', outputPath);
    
    const { exec } = require('child_process');
    exec(`open "${outputPath}"`);
  } catch (error) {
    console.error('❌ 失败:', error);
  }
}

test();

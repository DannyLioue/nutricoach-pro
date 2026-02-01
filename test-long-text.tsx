import { renderToBuffer, Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import fs from 'fs';
import path from 'path';
import { registerPDFFonts } from './lib/pdf/fonts';

// 注册字体
registerPDFFonts();

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Noto Sans SC',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    maxWidth: '100%',
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 10,
    fontFamily: 'Noto Sans SC',
  },
  text: {
    fontSize: 11,
    fontFamily: 'Noto Sans SC',
    lineHeight: 1.5,
    maxWidth: '100%',
  },
  flexRow: {
    flexDirection: 'row',
    marginBottom: 8,
    maxWidth: '100%',
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#10B981',
    marginTop: 6,
    marginRight: 8,
    flexShrink: 0,
  },
  flexText: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Noto Sans SC',
    lineHeight: 1.5,
    maxWidth: '100%',
  },
});

const TestPDF = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>长文本换行测试</Text>
        
        {/* 测试1: 普通长文本 */}
        <Text style={styles.text}>
          这是一段很长的文字用来测试PDF中的自动换行功能是否正常工作。本训练计划旨在逐渐增强您的力量和耐力，结合您当前的健康状况，帮助您实现体能提升和整体健康。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>列表项长文本测试</Text>
        
        {/* 测试2: flex布局中的长文本 */}
        <View style={styles.flexRow}>
          <View style={styles.bullet} />
          <Text style={styles.flexText}>
            将体脂率逐步降低至27%（通过运动和调整的综合）。这需要结合有氧运动、力量训练和正确的饮食计划来实现。
          </Text>
        </View>

        <View style={styles.flexRow}>
          <View style={styles.bullet} />
          <Text style={styles.flexText}>
            提高上肢、背部和核心肌群的力量和耐力，通过5个阶段的抗阻训练方案。每个阶段将逐步增加训练强度和复杂度。
          </Text>
        </View>

        <View style={styles.flexRow}>
          <View style={styles.bullet} />
          <Text style={styles.flexText}>
            优化六种基础的功能性动作，确保姿态正确，并提升整体功能力和运动表现。包括深蹲、硬拉、推举、划船、引体向上和核心稳定性训练。
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>设备说明长文本测试</Text>
        <Text style={styles.text}>
          可调节哑铃（例如，2-10kg一对）（必需）
        </Text>
        <Text style={[styles.text, { marginTop: 5, fontSize: 10, color: '#6B7280' }]}>
          为了实现上肢、背部和核心的力量训练目标，需要哑铃提供渐进的阻力刺激。可调节哑铃能够根据训练强度逐步增加重量，满足不同阶段的训练需求。建议选择质量好、调节方便的产品，确保训练过程中的安全性和舒适度。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>极限长度测试</Text>
        <Text style={styles.text}>
          这是一段超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级长的文字用来测试边界情况下PDF的文字换行是否正常工作。
        </Text>
      </View>
    </Page>
  </Document>
);

async function test() {
  try {
    console.log('开始生成长文本测试PDF...');
    const buffer = await renderToBuffer(<TestPDF />);
    
    const outputPath = path.join(process.cwd(), 'test-long-text.pdf');
    fs.writeFileSync(outputPath, buffer);
    
    console.log('✅ PDF生成成功！');
    console.log('文件大小:', (buffer.length / 1024).toFixed(2), 'KB');
    console.log('保存路径:', outputPath);
    
    // 打开PDF
    const { exec } = require('child_process');
    exec(`open "${outputPath}"`);
  } catch (error) {
    console.error('❌ PDF生成失败:', error);
    process.exit(1);
  }
}

test();

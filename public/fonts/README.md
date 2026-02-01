# PDF 中文字体配置指南

## 当前状态
PDF 导出功能已正常工作，但中文会显示为方框或乱码，因为尚未配置中文字体。

## 添加中文字体的方法

### 方法 1：使用本地字体文件（推荐）

1. **下载中文字体文件**
   - 访问 [Google Fonts Noto Sans SC](https://fonts.google.com/noto/specimen/Noto+Sans+SC)
   - 点击 "Download family" 下载字体包
   - 或者直接下载：
     - Regular: https://github.com/notofonts/noto-cjk/releases/download/Sans2.004/03_NotoSansCJK-OTC.zip
   - 解压后找到 `NotoSansSC-Regular.otf` 和 `NotoSansSC-Bold.otf`

2. **放置字体文件**
   ```bash
   # 将字体文件复制到 public/fonts 目录
   cp NotoSansSC-Regular.otf public/fonts/
   cp NotoSansSC-Bold.otf public/fonts/
   ```

3. **更新字体配置**

   编辑 `components/pdf/PDFDocument.tsx`，取消注释并更新：
   ```typescript
   import path from 'path';

   Font.register({
     family: 'Noto Sans SC',
     src: path.resolve(process.cwd(), 'public/fonts/NotoSansSC-Regular.otf'),
   });

   Font.register({
     family: 'Noto Sans SC',
     fontWeight: 700,
     src: path.resolve(process.cwd(), 'public/fonts/NotoSansSC-Bold.otf'),
   });
   ```

4. **取消注释 fontFamily**
   ```bash
   # 在 PDF 组件中取消注释 fontFamily
   sed -i '' "s/\/\/ fontFamily: 'Noto Sans SC'/fontFamily: 'Noto Sans SC'/g" components/pdf/*.tsx
   ```

### 方法 2：使用 npm 包（替代方案）

```bash
npm install @fontsource/noto-sans-sc
```

然后在 `components/pdf/PDFDocument.tsx` 中：

```typescript
import FontSource from '@fontsource/noto-sans-sc/files/noto-sans-sc-sc-400.woff2';
import FontSourceBold from '@fontsource/noto-sans-sc/files/noto-sans-sc-sc-700.woff2';

Font.register({
  family: 'Noto Sans SC',
  src: FontSource,
});

Font.register({
  family: 'Noto Sans SC',
  fontWeight: 700,
  src: FontSourceBold,
});
```

### 方法 3：直接使用图片导出（临时方案）

如果 PDF 字体配置太复杂，可以考虑：
- 使用 html2canvas 或 dom-to-image 导出为图片
- 客户可以在浏览器中打印网页为 PDF

## 字体格式支持

@react-pdf/renderer 支持以下格式：
- `.otf` (OpenType) - 推荐
- `.ttf` (TrueType)
- `.woff2` (Web Open Font Format 2.0)
- `.woff` (Web Open Font Format)

## 测试字体配置

配置完成后，尝试导出 PDF：
```bash
# 查看服务器日志
npm run dev
```

如果看到 "Unknown font format" 错误，说明：
- 字体文件路径不正确
- 字体文件损坏
- 字体格式不支持

使用以下命令检查字体文件：
```bash
file public/fonts/*.otf
# 应该显示: "OpenType font data" 而不是 "HTML document"
```

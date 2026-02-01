import { Text } from '@react-pdf/renderer';
import React from 'react';

/**
 * 自动换行的文本组件
 * 通过在中文字符之间插入零宽空格，强制浏览器在任意位置换行
 */
interface WrappedTextProps {
  style?: any;
  children: string;
}

export function WrappedText({ style, children }: WrappedTextProps) {
  if (!children || typeof children !== 'string') {
    return <Text style={style}>{children}</Text>;
  }

  // 在每个中文字符后插入零宽空格（U+200B）
  // 这样 PDF 渲染器就知道可以在这些位置换行
  const processedText = children.split('').map((char, index) => {
    // 检查是否是中文字符
    const isChinese = /[\u4e00-\u9fa5]/.test(char);
    const nextChar = children[index + 1];
    const nextIsChinese = nextChar && /[\u4e00-\u9fa5]/.test(nextChar);
    
    // 在中文字符之间插入零宽空格
    if (isChinese && nextIsChinese) {
      return char + '\u200B';
    }
    
    return char;
  }).join('');

  return <Text style={style}>{processedText}</Text>;
}

/**
 * 处理文本字符串，插入零宽空格以支持换行
 */
export function wrapChineseText(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  return text.split('').map((char, index) => {
    const isChinese = /[\u4e00-\u9fa5]/.test(char);
    const nextChar = text[index + 1];
    const nextIsChinese = nextChar && /[\u4e00-\u9fa5]/.test(nextChar);
    
    if (isChinese && nextIsChinese) {
      return char + '\u200B';
    }
    
    return char;
  }).join('');
}

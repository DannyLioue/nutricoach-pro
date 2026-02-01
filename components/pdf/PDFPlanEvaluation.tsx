import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Concern, Suggestion } from '@/types';
import { wrapChineseText } from '@/lib/pdf/text-wrapper';

interface PDFPlanEvaluationProps {
  clientName: string;
  generatedDate: string;
  planType: 'diet' | 'exercise';
  evaluation: {
    overallStatus: 'safe' | 'needs_adjustment' | 'unsafe';
    safetyScore: number;
    summary: string;
    keyFindings: string[];
  };
  concerns: Concern[];
  suggestions: Suggestion[];
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Noto Sans SC',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottom: '2pt solid #2563eb',
    fontFamily: 'Noto Sans SC',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 5,
    fontFamily: 'Noto Sans SC',
  },
  subtitle: {
    fontSize: 18,
    color: '#64748b',
    fontFamily: 'Noto Sans SC',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottom: '1pt solid #e2e8f0',
    fontFamily: 'Noto Sans SC',
  },
  statusCard: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  statusSafe: {
    backgroundColor: '#f0fdf4',
    border: '1pt solid #86efac',
  },
  statusWarning: {
    backgroundColor: '#fefce8',
    border: '1pt solid #fde047',
  },
  statusUnsafe: {
    backgroundColor: '#fef2f2',
    border: '1pt solid #fca5a5',
  },
  statusLabel: {
    fontSize: 21,
    fontWeight: 'bold',
    marginBottom: 5,
    fontFamily: 'Noto Sans SC',
  },
  scoreText: {
    fontSize: 18,
    marginBottom: 8,
    fontFamily: 'Noto Sans SC',
  },
  summaryText: {
    fontSize: 17,
    lineHeight: 1.6,
    fontFamily: 'Noto Sans SC',
  },
  concernCard: {
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    marginBottom: 10,
    borderLeft: '3pt solid #f59e0b',
  },
  concernHeader: {
    flexDirection: 'row',
    marginBottom: 5,
    flexWrap: 'wrap',
  },
  concernBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 6,
    alignSelf: 'flex-start',
  },
  concernBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Noto Sans SC',
  },
  concernTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    flex: 1,
    fontFamily: 'Noto Sans SC',
    minWidth: 0,
  },
  concernReason: {
    fontSize: 14,
    lineHeight: 1.5,
    marginTop: 5,
    fontFamily: 'Noto Sans SC',
  },
  suggestionCard: {
    padding: 12,
    backgroundColor: '#dbeafe',
    borderRadius: 6,
    marginBottom: 10,
    borderLeft: '3pt solid #3b82f6',
  },
  suggestionHeader: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 5,
    fontFamily: 'Noto Sans SC',
  },
  suggestionText: {
    fontSize: 14,
    lineHeight: 1.5,
    fontFamily: 'Noto Sans SC',
  },
  suggestionRationale: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 5,
    fontFamily: 'Noto Sans SC',
  },
  keyFinding: {
    fontSize: 14,
    lineHeight: 1.6,
    marginBottom: 4,
    paddingLeft: 12,
    fontFamily: 'Noto Sans SC',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    borderTop: '1pt solid #e2e8f0',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 14,
    color: '#94a3b8',
    fontFamily: 'Noto Sans SC',
  },
});

function getStatusConfig(status: 'safe' | 'needs_adjustment' | 'unsafe') {
  if (status === 'safe') {
    return {
      label: '✓ 安全',
      color: '#166534',
      style: styles.statusSafe,
    };
  }
  if (status === 'needs_adjustment') {
    return {
      label: '⚠ 需要调整',
      color: '#b45309',
      style: styles.statusWarning,
    };
  }
  return {
    label: '✗ 不安全',
    color: '#991b1b',
    style: styles.statusUnsafe,
  };
}

function getSeverityColor(severity: 'high' | 'medium' | 'low') {
  if (severity === 'high') return { bg: '#fecaca', text: '#991b1b', label: '高风险' };
  if (severity === 'medium') return { bg: '#fef08a', text: '#b45309', label: '中风险' };
  return { bg: '#dbeafe', text: '#1e40af', label: '低风险' };
}

function getActionColor(action: 'replace' | 'modify' | 'remove' | 'add') {
  const colors = {
    replace: { bg: '#f3e8ff', text: '#7c3aed', label: '替换' },
    modify: { bg: '#dbeafe', text: '#1d4ed8', label: '修改' },
    remove: { bg: '#fecaca', text: '#dc2626', label: '移除' },
    add: { bg: '#dcfce7', text: '#16a34a', label: '添加' },
  };
  return colors[action];
}

export function PDFPlanEvaluation({
  clientName,
  generatedDate,
  planType,
  evaluation,
  concerns,
  suggestions,
}: PDFPlanEvaluationProps) {
  const statusConfig = getStatusConfig(evaluation.overallStatus);
  const planTypeLabel = planType === 'diet' ? '饮食计划' : '运动计划';

  // 过滤出对应类型的 concerns 和 suggestions
  const relevantConcerns = concerns.filter(c => {
    if (planType === 'diet') {
      return c.category === 'diet' || c.category === 'supplement';
    }
    return c.category === 'exercise';
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 页眉 */}
        <View style={styles.header}>
          <Text style={styles.title}>{wrapChineseText('营养师计划评估报告')}</Text>
          <Text style={styles.subtitle}>
            {wrapChineseText(planTypeLabel + '评估 · ' + clientName + ' · ' + generatedDate)}
          </Text>
        </View>

        {/* 评估状态 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{wrapChineseText('评估结果')}</Text>
          <View style={[styles.statusCard, statusConfig.style]}>
            <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
              {wrapChineseText(statusConfig.label)}
            </Text>
            <Text style={styles.scoreText}>
              {wrapChineseText('安全评分：' + evaluation.safetyScore + '/100')}
            </Text>
            <Text style={styles.summaryText}>
              {wrapChineseText(evaluation.summary)}
            </Text>
          </View>
        </View>

        {/* 关键发现 */}
        {evaluation.keyFindings && evaluation.keyFindings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{wrapChineseText('关键发现')}</Text>
            {evaluation.keyFindings.map((finding, index) => (
              <Text key={index} style={styles.keyFinding}>
                {wrapChineseText('• ' + finding)}
              </Text>
            ))}
          </View>
        )}

        {/* 发现的问题 */}
        {relevantConcerns.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {wrapChineseText('发现的问题 (' + relevantConcerns.length + ')')}
            </Text>
            {relevantConcerns.map((concern, index) => {
              const severity = getSeverityColor(concern.severity);
              return (
                <View key={index} style={styles.concernCard}>
                  <View style={styles.concernHeader}>
                    <View style={[styles.concernBadge, { backgroundColor: severity.bg }]}>
                      <Text style={[styles.concernBadgeText, { color: severity.text }]}>
                        {wrapChineseText(severity.label)}
                      </Text>
                    </View>
                    <Text style={styles.concernTitle}>{wrapChineseText(concern.issue)}</Text>
                  </View>
                  <Text style={styles.concernReason}>
                    <Text style={{ fontWeight: 'bold' }}>{wrapChineseText('原因：')}</Text>
                    {wrapChineseText(concern.reason)}
                  </Text>
                  {concern.originalText && (
                    <Text style={[styles.concernReason, { fontSize: 14, color: '#64748b' }]}>
                      {wrapChineseText('原文："' + concern.originalText + '"')}
                    </Text>
                  )}
                  {concern.relatedIndicators && concern.relatedIndicators.length > 0 && (
                    <Text style={[styles.concernReason, { fontSize: 14 }]}>
                      {wrapChineseText('相关指标：' + concern.relatedIndicators.join('、'))}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* 调整建议 */}
        {suggestions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {wrapChineseText('调整建议 (' + suggestions.length + ')')}
            </Text>
            {suggestions.map((suggestion, index) => {
              const action = getActionColor(suggestion.action);
              return (
                <View key={index} style={styles.suggestionCard}>
                  <View style={styles.concernHeader}>
                    <View style={[styles.concernBadge, { backgroundColor: action.bg }]}>
                      <Text style={[styles.concernBadgeText, { color: action.text }]}>
                        {wrapChineseText(action.label)}
                      </Text>
                    </View>
                    <Text style={styles.suggestionHeader}>{wrapChineseText(suggestion.description)}</Text>
                  </View>
                  <Text style={styles.suggestionText}>
                    <Text style={{ fontWeight: 'bold' }}>{wrapChineseText('建议：')}</Text>
                    {wrapChineseText(suggestion.recommendation)}
                  </Text>
                  {suggestion.alternatives && suggestion.alternatives.length > 0 && (
                    <Text style={[styles.suggestionText, { fontSize: 14 }]}>
                      <Text style={{ fontWeight: 'bold' }}>{wrapChineseText('替代方案：')}</Text>
                      {wrapChineseText(suggestion.alternatives.join('、'))}
                    </Text>
                  )}
                  <Text style={styles.suggestionRationale}>
                    {wrapChineseText('理由：' + suggestion.rationale)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* 页脚 */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {wrapChineseText('本报告由 AI 辅助生成，仅供营养师参考')}
          </Text>
          <Text style={styles.footerText}>
            {wrapChineseText('NutriCoach Pro · 智能营养分析平台')}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

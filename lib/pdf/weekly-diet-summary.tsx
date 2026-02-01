import {
  Document,
  View,
  Text,
  StyleSheet,
  Page,
  Link,
} from '@react-pdf/renderer';
import type { WeeklyDietSummaryContent } from '@/types';
import { wrapChineseText } from './text-wrapper';

interface PDFWeeklyDietSummaryProps {
  content: WeeklyDietSummaryContent;
  clientName: string;
  generatedDate: string;
  weekRange: string;
}

// 字号扩大1.5倍后的样式
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Noto Sans SC',
    backgroundColor: '#FFFFFF',
    fontSize: 17, // 11 * 1.5
    flexDirection: 'column',
  },
  header: {
    marginBottom: 23, // 15 * 1.5
    paddingBottom: 15, // 10 * 1.5
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    borderBottomStyle: 'solid',
  },
  title: {
    fontSize: 33, // 22 * 1.5
    fontWeight: 700,
    color: '#111827',
    marginBottom: 8, // 5 * 1.5
  },
  subtitle: {
    fontSize: 17, // 11 * 1.5
    color: '#6B7280',
    marginBottom: 3, // 2 * 1.5
  },
  section: {
    marginBottom: 30, // 20 * 1.5
  },
  sectionTitle: {
    fontSize: 21, // 14 * 1.5
    fontWeight: 700,
    color: '#1F2937',
    marginBottom: 15, // 10 * 1.5
    paddingBottom: 8, // 5 * 1.5
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    borderBottomStyle: 'solid',
  },
  subsectionTitle: {
    fontSize: 18, // 12 * 1.5
    fontWeight: 600,
    color: '#374151',
    marginBottom: 12, // 8 * 1.5
    marginTop: 15, // 10 * 1.5
  },
  statsGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15, // 10 * 1.5
    marginBottom: 15, // 10 * 1.5
  },
  statCard: {
    flex: 1,
    minWidth: 150, // 100 * 1.5
    padding: 15, // 10 * 1.5
    backgroundColor: '#F9FAFB',
    borderRadius: 9, // 6 * 1.5
    border: '1 solid #E5E7EB',
  },
  statLabel: {
    fontSize: 15, // 10 * 1.5
    color: '#6B7280',
    marginBottom: 5, // 3 * 1.5
  },
  statValue: {
    fontSize: 27, // 18 * 1.5
    fontWeight: 700,
    color: '#111827',
  },
  ratingBadge: {
    paddingHorizontal: 15, // 10 * 1.5
    paddingVertical: 6, // 4 * 1.5
    borderRadius: 6, // 4 * 1.5
    alignSelf: 'flex-start',
    marginBottom: 15, // 10 * 1.5
  },
  ratingText: {
    fontSize: 21, // 14 * 1.5
    fontWeight: 600,
    color: '#FFFFFF',
  },
  mealCard: {
    padding: 12, // 8 * 1.5
    marginBottom: 9, // 6 * 1.5
    borderRadius: 6, // 4 * 1.5
    border: '1 solid #E5E7EB',
    flexDirection: 'column',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6, // 4 * 1.5
    flexWrap: 'wrap',
  },
  mealDate: {
    fontSize: 17, // 11 * 1.5
    fontWeight: 600,
    color: '#1F2937',
  },
  mealScore: {
    fontSize: 18, // 12 * 1.5
    fontWeight: 700,
  },
  mealReason: {
    fontSize: 15, // 10 * 1.5
    color: '#4B5563',
    marginBottom: 5, // 3 * 1.5
  },
  mealHighlight: {
    fontSize: 14, // 9 * 1.5
    color: '#059669',
  },
  mealIssue: {
    fontSize: 14, // 9 * 1.5
    color: '#DC2626',
  },
  foodCard: {
    padding: 9, // 6 * 1.5
    marginBottom: 6, // 4 * 1.5
    borderRadius: 6, // 4 * 1.5
    border: '1 solid #E5E7EB',
    flexDirection: 'column',
  },
  foodName: {
    fontSize: 17, // 11 * 1.5
    fontWeight: 500,
    color: '#1F2937',
  },
  foodMeta: {
    fontSize: 14, // 9 * 1.5
    color: '#6B7280',
  },
  recommendationCard: {
    padding: 15, // 10 * 1.5
    marginBottom: 15, // 10 * 1.5
    borderRadius: 9, // 6 * 1.5
    borderLeft: 6, // 4 * 1.5
    flexDirection: 'column',
  },
  recommendationTitle: {
    fontSize: 18, // 12 * 1.5
    fontWeight: 600,
    marginBottom: 9, // 6 * 1.5
  },
  recommendationText: {
    fontSize: 15, // 10 * 1.5
    lineHeight: 1.5,
    color: '#374151',
  },
  footer: {
    marginTop: 30, // 20 * 1.5
    paddingTop: 15, // 10 * 1.5
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderTopStyle: 'solid',
    fontSize: 14, // 9 * 1.5
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

function getRatingColor(rating: string) {
  switch (rating) {
    case '优秀': return '#10B981';
    case '良好': return '#3B82F6';
    case '一般': return '#F59E0B';
    case '需改善': return '#EF4444';
    default: return '#6B7280';
  }
}

export function PDFWeeklyDietSummary({
  content,
  clientName,
  generatedDate,
  weekRange,
}: PDFWeeklyDietSummaryProps) {
  return (
    <Document>
      {/* 第一页：概览和合规性评价 */}
      <Page size="A4" style={styles.page}>
        {/* 页眉 */}
        <View style={styles.header}>
          <Text style={styles.title}>{wrapChineseText('周饮食汇总报告')}</Text>
          <Text style={styles.subtitle}>{wrapChineseText('客户: ' + clientName)}</Text>
          <Text style={styles.subtitle}>{wrapChineseText('汇总周期: ' + weekRange)}</Text>
          <Text style={styles.subtitle}>{wrapChineseText('生成日期: ' + generatedDate)}</Text>
        </View>

        {/* 核心统计 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{wrapChineseText('核心数据概览')}</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{wrapChineseText('平均得分')}</Text>
              <Text style={styles.statValue}>{content.statistics.avgScore.toFixed(0)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{wrapChineseText('记录天数')}</Text>
              <Text style={styles.statValue}>{content.statistics.totalDays}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{wrapChineseText('用餐次数')}</Text>
              <Text style={styles.statValue}>{content.statistics.totalMeals}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{wrapChineseText('照片数量')}</Text>
              <Text style={styles.statValue}>{content.statistics.totalPhotos}</Text>
            </View>
          </View>
          <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(content.complianceEvaluation.overallRating) }]}>
            <Text style={styles.ratingText}>{wrapChineseText('综合评级: ' + content.complianceEvaluation.overallRating)}</Text>
          </View>
        </View>

        {/* 合规性评价 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{wrapChineseText('合规性评价')}</Text>

          {/* 评分分布 */}
          <Text style={styles.subsectionTitle}>{wrapChineseText('评分分布')}</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{wrapChineseText('优秀 (≥90分)')}</Text>
              <Text style={[styles.statValue, { color: '#10B981' }]}>
                {typeof content.complianceEvaluation.scoreDistribution.excellent === 'number'
                  ? content.complianceEvaluation.scoreDistribution.excellent
                  : content.complianceEvaluation.scoreDistribution.excellent?.count || 0}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{wrapChineseText('良好 (75-89分)')}</Text>
              <Text style={[styles.statValue, { color: '#3B82F6' }]}>
                {typeof content.complianceEvaluation.scoreDistribution.good === 'number'
                  ? content.complianceEvaluation.scoreDistribution.good
                  : content.complianceEvaluation.scoreDistribution.good?.count || 0}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{wrapChineseText('一般 (60-74分)')}</Text>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                {typeof content.complianceEvaluation.scoreDistribution.fair === 'number'
                  ? content.complianceEvaluation.scoreDistribution.fair
                  : content.complianceEvaluation.scoreDistribution.fair?.count || 0}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{wrapChineseText('需改善 (&lt;60分)')}</Text>
              <Text style={[styles.statValue, { color: '#EF4444' }]}>
                {typeof content.complianceEvaluation.scoreDistribution.poor === 'number'
                  ? content.complianceEvaluation.scoreDistribution.poor
                  : content.complianceEvaluation.scoreDistribution.poor?.count || 0}
              </Text>
            </View>
          </View>

          {/* 各档位餐次详情 */}
          {(() => {
            const dist = content.complianceEvaluation.scoreDistribution;
            const hasMeals = dist.excellent?.meals || dist.good?.meals || dist.fair?.meals || dist.poor?.meals;
            if (!hasMeals) return null;

            const renderMealCard = (meal: any, bgColor: string, borderColor: string, scoreColor: string) => (
              <View key={meal.date + '-' + meal.mealType} style={[styles.mealCard, { backgroundColor: bgColor, borderColor: borderColor }]}>
                <View style={styles.mealHeader}>
                  <Text style={styles.mealDate}>{wrapChineseText(meal.date + ' ' + meal.mealType)}</Text>
                  <Text style={[styles.mealScore, { color: scoreColor }]}>{wrapChineseText(meal.score + '分')}</Text>
                </View>
                {meal.reason && <Text style={styles.mealReason}>{wrapChineseText(meal.reason)}</Text>}
                {meal.highlights && meal.highlights.length > 0 && (
                  <Text style={[styles.mealHighlight, { color: scoreColor === '#10B981' ? '#059669' : '#059669' }]}>
                    {wrapChineseText('亮点: ' + meal.highlights.join('、'))}
                  </Text>
                )}
                {meal.issues && meal.issues.length > 0 && (
                  <Text style={styles.mealIssue}>{wrapChineseText('问题: ' + meal.issues.join('、'))}</Text>
                )}
              </View>
            );

            return (
              <View style={{ marginTop: 15 }}>
                <Text style={styles.subsectionTitle}>{wrapChineseText('各档位具体餐次详情')}</Text>

                {/* 优秀 */}
                {dist.excellent?.meals && dist.excellent.meals.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={[styles.subsectionTitle, { color: '#10B981', marginTop: 0, fontSize: 15 }]}>
                      {wrapChineseText('优秀 (' + dist.excellent.meals.length + '餐)')}
                    </Text>
                    {dist.excellent.meals.map((meal: any) => renderMealCard(meal, '#ECFDF5', '#10B981', '#10B981'))}
                  </View>
                )}

                {/* 良好 */}
                {dist.good?.meals && dist.good.meals.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={[styles.subsectionTitle, { color: '#3B82F6', marginTop: 0, fontSize: 15 }]}>
                      {wrapChineseText('良好 (' + dist.good.meals.length + '餐)')}
                    </Text>
                    {dist.good.meals.map((meal: any) => renderMealCard(meal, '#EFF6FF', '#3B82F6', '#3B82F6'))}
                  </View>
                )}

                {/* 一般 */}
                {dist.fair?.meals && dist.fair.meals.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={[styles.subsectionTitle, { color: '#F59E0B', marginTop: 0, fontSize: 15 }]}>
                      {wrapChineseText('一般 (' + dist.fair.meals.length + '餐)')}
                    </Text>
                    {dist.fair.meals.map((meal: any) => renderMealCard(meal, '#FEF3C7', '#F59E0B', '#F59E0B'))}
                  </View>
                )}

                {/* 需改善 */}
                {dist.poor?.meals && dist.poor.meals.length > 0 && (
                  <View>
                    <Text style={[styles.subsectionTitle, { color: '#EF4444', marginTop: 0, fontSize: 15 }]}>
                      {wrapChineseText('需改善 (' + dist.poor.meals.length + '餐)')}
                    </Text>
                    {dist.poor.meals.map((meal: any) => renderMealCard(meal, '#FEF2F2', '#FCA5A5', '#DC2626'))}
                  </View>
                )}
              </View>
            );
          })()}
        </View>

        {/* 页脚 */}
        <View style={styles.footer}>
          <Text>{wrapChineseText('本报告由 NutriCoach Pro 智能分析系统生成')}</Text>
          <Text>{wrapChineseText('基于营养学原理和循证医学证据，仅供参考')}</Text>
        </View>
      </Page>

      {/* 第二页：营养分析 */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{wrapChineseText('营养摄入分析')}</Text>
          <Text style={styles.subtitle}>{wrapChineseText(clientName + ' - ' + weekRange)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{wrapChineseText('营养状态概览')}</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{wrapChineseText('蛋白质')}</Text>
              <Text style={styles.statValue}>{wrapChineseText(content.nutritionAnalysis.proteinStatus)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{wrapChineseText('蔬菜摄入')}</Text>
              <Text style={styles.statValue}>{wrapChineseText(content.nutritionAnalysis.vegetableStatus)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{wrapChineseText('膳食纤维')}</Text>
              <Text style={styles.statValue}>{wrapChineseText(content.nutritionAnalysis.fiberStatus)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{wrapChineseText('碳水质量')}</Text>
              <Text style={styles.statValue}>{wrapChineseText(content.nutritionAnalysis.carbQuality)}</Text>
            </View>
          </View>
        </View>

        {/* 蛋白质明细 */}
        {content.nutritionAnalysis.proteinBreakdown && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{wrapChineseText('蛋白质摄入明细')}</Text>
            <Text style={styles.subsectionTitle}>
              {wrapChineseText('充足: ' + content.nutritionAnalysis.proteinBreakdown.sufficientCount + ' | ' +
              '不足: ' + content.nutritionAnalysis.proteinBreakdown.insufficientCount + ' | ' +
              '缺乏: ' + content.nutritionAnalysis.proteinBreakdown.lackingCount)}
            </Text>

            {/* 充足的餐次 */}
            {content.nutritionAnalysis.proteinBreakdown.mealsByStatus?.sufficient?.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={[styles.subsectionTitle, { color: '#059669' }]}>{wrapChineseText('蛋白质充足的餐次')}</Text>
                {content.nutritionAnalysis.proteinBreakdown.mealsByStatus.sufficient.map((meal: any, idx: number) => (
                  <View key={idx} style={[styles.mealCard, { backgroundColor: '#ECFDF5', borderColor: '#10B981' }]}>
                    <Text style={styles.mealDate}>{wrapChineseText(meal.date + ' ' + meal.mealType)}</Text>
                    {meal.source && <Text style={[styles.mealReason, { color: '#059669' }]}>{wrapChineseText('来源: ' + meal.source)}</Text>}
                  </View>
                ))}
              </View>
            )}

            {/* 不足的餐次 */}
            {content.nutritionAnalysis.proteinBreakdown.mealsByStatus?.insufficient?.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={[styles.subsectionTitle, { color: '#D97706' }]}>{wrapChineseText('蛋白质不足的餐次')}</Text>
                {content.nutritionAnalysis.proteinBreakdown.mealsByStatus.insufficient.map((meal: any, idx: number) => (
                  <View key={idx} style={[styles.mealCard, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
                    <Text style={styles.mealDate}>{wrapChineseText(meal.date + ' ' + meal.mealType)}</Text>
                    <Text style={[styles.mealIssue, { color: '#92400E' }]}>{wrapChineseText(meal.issue)}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* 缺乏的餐次 */}
            {content.nutritionAnalysis.proteinBreakdown.mealsByStatus?.lacking?.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={[styles.subsectionTitle, { color: '#DC2626' }]}>{wrapChineseText('缺乏蛋白质的餐次')}</Text>
                {content.nutritionAnalysis.proteinBreakdown.mealsByStatus.lacking.map((meal: any, idx: number) => (
                  <View key={idx} style={[styles.mealCard, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
                    <Text style={styles.mealDate}>{wrapChineseText(meal.date + ' ' + meal.mealType)}</Text>
                    <Text style={styles.mealIssue}>{wrapChineseText(meal.issue)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* 蔬菜明细 */}
        {content.nutritionAnalysis.vegetableBreakdown && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{wrapChineseText('蔬菜摄入明细')}</Text>
            <Text style={styles.subsectionTitle}>
              {wrapChineseText('充足: ' + content.nutritionAnalysis.vegetableBreakdown.sufficientCount + ' | ' +
              '不足: ' + content.nutritionAnalysis.vegetableBreakdown.insufficientCount + ' | ' +
              '缺乏: ' + content.nutritionAnalysis.vegetableBreakdown.lackingCount)}
            </Text>

            {/* 充足的餐次 */}
            {content.nutritionAnalysis.vegetableBreakdown.mealsByStatus?.sufficient?.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={[styles.subsectionTitle, { color: '#059669' }]}>{wrapChineseText('蔬菜充足的餐次')}</Text>
                {content.nutritionAnalysis.vegetableBreakdown.mealsByStatus.sufficient.map((meal: any, idx: number) => (
                  <View key={idx} style={[styles.mealCard, { backgroundColor: '#ECFDF5', borderColor: '#10B981' }]}>
                    <Text style={styles.mealDate}>{wrapChineseText(meal.date + ' ' + meal.mealType)}</Text>
                    {meal.types && <Text style={[styles.mealReason, { color: '#059669' }]}>{wrapChineseText('蔬菜: ' + meal.types)}</Text>}
                  </View>
                ))}
              </View>
            )}

            {/* 不足的餐次 */}
            {content.nutritionAnalysis.vegetableBreakdown.mealsByStatus?.insufficient?.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={[styles.subsectionTitle, { color: '#D97706' }]}>{wrapChineseText('蔬菜不足的餐次')}</Text>
                {content.nutritionAnalysis.vegetableBreakdown.mealsByStatus.insufficient.map((meal: any, idx: number) => (
                  <View key={idx} style={[styles.mealCard, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
                    <Text style={styles.mealDate}>{wrapChineseText(meal.date + ' ' + meal.mealType)}</Text>
                    <Text style={[styles.mealIssue, { color: '#92400E' }]}>{wrapChineseText(meal.issue)}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* 缺乏的餐次 */}
            {content.nutritionAnalysis.vegetableBreakdown.mealsByStatus?.lacking?.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={[styles.subsectionTitle, { color: '#DC2626' }]}>{wrapChineseText('蔬菜缺乏的餐次')}</Text>
                {content.nutritionAnalysis.vegetableBreakdown.mealsByStatus.lacking.map((meal: any, idx: number) => (
                  <View key={idx} style={[styles.mealCard, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
                    <Text style={styles.mealDate}>{wrapChineseText(meal.date + ' ' + meal.mealType)}</Text>
                    <Text style={styles.mealIssue}>{wrapChineseText(meal.issue)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* 膳食纤维明细 */}
        {content.nutritionAnalysis.fiberBreakdown && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{wrapChineseText('膳食纤维摄入分析')}</Text>
            {content.nutritionAnalysis.fiberBreakdown.sources && (
              <View>
                <Text style={styles.subsectionTitle}>{wrapChineseText('膳食纤维来源')}</Text>
                <View style={styles.statsGrid}>
                  {content.nutritionAnalysis.fiberBreakdown.sources.map((source: string, idx: number) => (
                    <View key={idx} style={[styles.statCard, { backgroundColor: '#F3E8FF', borderColor: '#8B5CF6' }]}>
                      <Text style={[styles.statValue, { fontSize: 15, color: '#6D28D9' }]}>{wrapChineseText(source)}</Text>
                    </View>
                  ))}
                </View>
                {content.nutritionAnalysis.fiberBreakdown.avgDailyGrams && (
                  <Text style={[styles.subsectionTitle, { marginTop: 12 }]}>
                    {wrapChineseText('平均每日: ' + content.nutritionAnalysis.fiberBreakdown.avgDailyGrams + 'g | 目标: ' + content.nutritionAnalysis.fiberBreakdown.targetGrams + 'g')}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        <View style={styles.footer}>
          <Text>{wrapChineseText('本报告由 NutriCoach Pro 智能分析系统生成')}</Text>
        </View>
      </Page>

      {/* 第三页：食物摄入分析 */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{wrapChineseText('食物摄入分析')}</Text>
          <Text style={styles.subtitle}>{wrapChineseText(clientName + ' - ' + weekRange)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{wrapChineseText('红绿灯食物统计')}</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#ECFDF5', borderColor: '#10B981' }]}>
              <Text style={styles.statLabel}>{wrapChineseText('绿灯食物')}</Text>
              <Text style={[styles.statValue, { color: '#10B981' }]}>{content.foodIntakeAnalysis.greenFoodCount}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
              <Text style={styles.statLabel}>{wrapChineseText('黄灯食物')}</Text>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>{content.foodIntakeAnalysis.yellowFoodCount}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }]}>
              <Text style={styles.statLabel}>{wrapChineseText('红灯食物')}</Text>
              <Text style={[styles.statValue, { color: '#EF4444' }]}>{content.foodIntakeAnalysis.redFoodCount}</Text>
            </View>
          </View>
        </View>

        {/* 红灯食物列表 */}
        {content.foodIntakeAnalysis.allRedFoods && content.foodIntakeAnalysis.allRedFoods.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{wrapChineseText('红灯食物列表 (需避免)')}</Text>
            {content.foodIntakeAnalysis.allRedFoods.map((food: any, idx: number) => (
              <View key={idx} style={[styles.foodCard, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, flexWrap: 'wrap' }}>
                  <Text style={styles.foodName}>{wrapChineseText('[红灯] ' + food.food)}</Text>
                  <Text style={[styles.foodMeta, { color: '#DC2626' }]}>{wrapChineseText(food.count + '次')}</Text>
                </View>
                {food.meals && <Text style={styles.foodMeta}>{wrapChineseText('出现: ' + food.meals.join(', '))}</Text>}
                {food.healthImpact && <Text style={[styles.foodMeta, { color: '#991B1B' }]}>{wrapChineseText('影响: ' + food.healthImpact)}</Text>}
                {food.reason && <Text style={styles.foodMeta}>{wrapChineseText(food.reason)}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* 绿灯食物列表 */}
        {content.foodIntakeAnalysis.allGreenFoods && content.foodIntakeAnalysis.allGreenFoods.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{wrapChineseText('绿灯食物列表 (推荐)')}</Text>
            {content.foodIntakeAnalysis.allGreenFoods.slice(0, 15).map((food: any, idx: number) => (
              <View key={idx} style={[styles.foodCard, { backgroundColor: '#ECFDF5', borderColor: '#10B981' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, flexWrap: 'wrap' }}>
                  <Text style={styles.foodName}>{wrapChineseText('[绿灯] ' + food.food)}</Text>
                  <Text style={[styles.foodMeta, { color: '#059669' }]}>{wrapChineseText(food.count + '次')}</Text>
                </View>
                {food.meals && <Text style={styles.foodMeta}>{wrapChineseText('出现: ' + food.meals.join(', '))}</Text>}
                {food.benefits && <Text style={[styles.foodMeta, { color: '#065F46' }]}>{wrapChineseText('优点: ' + food.benefits)}</Text>}
              </View>
            ))}
            {content.foodIntakeAnalysis.allGreenFoods.length > 15 && (
              <Text style={styles.foodMeta}>{wrapChineseText('...还有 ' + (content.foodIntakeAnalysis.allGreenFoods.length - 15) + ' 种绿灯食物')}</Text>
            )}
          </View>
        )}

        <View style={styles.footer}>
          <Text>{wrapChineseText('本报告由 NutriCoach Pro 智能分析系统生成')}</Text>
        </View>
      </Page>

      {/* 第四页：改进建议 */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{wrapChineseText('改进建议')}</Text>
          <Text style={styles.subtitle}>{wrapChineseText(clientName + ' - ' + weekRange)}</Text>
        </View>

        <View style={styles.section}>
          {/* 继续保持 */}
          {(() => {
            const recs = content.improvementRecommendations;
            let keepDoing: any[] = [];
            if (Array.isArray(recs)) {
              keepDoing = recs.filter(r => r.category === 'keepDoing');
            } else if (recs && typeof recs === 'object') {
              keepDoing = recs.keepDoing || [];
            }
            if (keepDoing.length === 0) return null;
            return (
              <View style={styles.section}>
                {keepDoing.map((item: any, idx: number) => (
                  <View key={idx} style={[styles.recommendationCard, { borderLeftColor: '#10B981', backgroundColor: '#ECFDF5' }]}>
                    <Text style={[styles.recommendationTitle, { color: '#065F46' }]}>{wrapChineseText('[继续保持]')}</Text>
                    <Text style={styles.recommendationTitle}>{wrapChineseText(item.behavior || item.suggestion)}</Text>
                    <Text style={styles.recommendationText}>{wrapChineseText(item.reason || item.detail)}</Text>
                    {item.evidence && <Text style={[styles.recommendationText, { fontSize: 14, color: '#059669' }]}>{wrapChineseText('证据: ' + item.evidence)}</Text>}
                  </View>
                ))}
              </View>
            );
          })()}

          {/* 需要改进 */}
          {(() => {
            const recs = content.improvementRecommendations;
            let improve: any[] = [];
            if (Array.isArray(recs)) {
              improve = recs.filter(r => r.category === 'improve');
            } else if (recs && typeof recs === 'object') {
              improve = recs.improve || [];
            }
            if (improve.length === 0) return null;
            return (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{wrapChineseText('需要改进')}</Text>
                {improve.map((item: any, idx: number) => (
                  <View key={idx} style={[styles.recommendationCard, { borderLeftColor: '#F59E0B', backgroundColor: '#FEF3C7' }]}>
                    <Text style={[styles.recommendationTitle, { color: '#92400E' }]}>{wrapChineseText('[问题] ' + (item.issue || '需要改善'))}</Text>
                    <Text style={styles.recommendationText}>{wrapChineseText(item.suggestion)}</Text>
                    {item.quantification && <Text style={styles.recommendationText}>{wrapChineseText('量化目标: ' + item.quantification)}</Text>}
                    {item.actionSteps && item.actionSteps.length > 0 && (
                      <View>
                        <Text style={[styles.recommendationTitle, { fontSize: 15, marginTop: 12 }]}>{wrapChineseText('行动步骤:')}</Text>
                        {item.actionSteps.map((step: string, stepIdx: number) => (
                          <Text key={stepIdx} style={styles.recommendationText}>{wrapChineseText('  ' + (stepIdx + 1) + '. ' + step)}</Text>
                        ))}
                      </View>
                    )}
                    {item.expectedOutcome && (
                      <Text style={[styles.recommendationText, { fontSize: 14, marginTop: 8, color: '#78350F' }]}>
                        {wrapChineseText('预期效果: ' + item.expectedOutcome)}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            );
          })()}

          {/* 尝试新事物 */}
          {(() => {
            const recs = content.improvementRecommendations;
            let tryNew: any[] = [];
            if (Array.isArray(recs)) {
              tryNew = recs.filter(r => r.category === 'tryNew');
            } else if (recs && typeof recs === 'object') {
              tryNew = recs.tryNew || [];
            }
            if (tryNew.length === 0) return null;
            return (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{wrapChineseText('尝试新事物')}</Text>
                {tryNew.map((item: any, idx: number) => (
                  <View key={idx} style={[styles.recommendationCard, { borderLeftColor: '#3B82F6', backgroundColor: '#DBEAFE' }]}>
                    <Text style={[styles.recommendationTitle, { color: '#1E40AF' }]}>{wrapChineseText('[建议] ' + item.suggestion)}</Text>
                    <Text style={styles.recommendationText}>{wrapChineseText(item.reason)}</Text>
                    {item.howTo && <Text style={[styles.recommendationText, { fontSize: 14, color: '#1E3A8A' }]}>{wrapChineseText('如何做: ' + item.howTo)}</Text>}
                  </View>
                ))}
              </View>
            );
          })()}
        </View>

        {/* 下周目标 */}
        {content.nextWeekGoals && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{wrapChineseText('下周目标')}</Text>
            {content.nextWeekGoals.primaryGoals?.map((goal: string, idx: number) => (
              <View key={idx} style={styles.mealCard}>
                <Text style={styles.recommendationText}>{wrapChineseText((idx + 1) + '. ' + goal)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 总结 */}
        {content.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{wrapChineseText('本周总结')}</Text>
            {content.summary.overall && (
              <Text style={styles.recommendationText}>{wrapChineseText(content.summary.overall)}</Text>
            )}
            {content.summary.highlights?.length > 0 && (
              <View style={{ marginTop: 15 }}>
                <Text style={[styles.subsectionTitle, { color: '#059669' }]}>{wrapChineseText('本周亮点')}</Text>
                {content.summary.highlights.map((h: string, idx: number) => (
                  <Text key={idx} style={styles.recommendationText}>{wrapChineseText('[OK] ' + h)}</Text>
                ))}
              </View>
            )}
            {content.summary.encouragement && (
              <View style={[styles.recommendationCard, { borderLeftColor: '#8B5CF6', backgroundColor: '#EDE9FE', marginTop: 15 }]}>
                <Text style={[styles.recommendationTitle, { color: '#6D28D9' }]}>{wrapChineseText('[鼓励] ' + content.summary.encouragement)}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.footer}>
          <Text>{wrapChineseText('本报告由 NutriCoach Pro 智能分析系统生成')}</Text>
          <Text>{wrapChineseText('基于营养学原理和循证医学证据，仅供参考')}</Text>
        </View>
      </Page>
    </Document>
  );
}

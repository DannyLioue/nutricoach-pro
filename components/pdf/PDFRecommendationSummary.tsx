import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { wrapChineseText } from '@/lib/pdf/text-wrapper';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 535,
  },
  // 标题卡片
  titleCard: {
    backgroundColor: '#10B981',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: 'Noto Sans SC',
  },
  subtitle: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.9,
    fontFamily: 'Noto Sans SC',
  },
  // 区块样式
  section: {
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 10,
    fontFamily: 'Noto Sans SC',
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  // 生物标志物卡片
  biomarkerCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  biomarkerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  biomarkerName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#991B1B',
    fontFamily: 'Noto Sans SC',
  },
  statusBadge: {
    fontSize: 8,
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontFamily: 'Noto Sans SC',
  },
  biomarkerText: {
    fontSize: 9,
    color: '#7F1D1D',
    marginBottom: 4,
    lineHeight: 1.4,
    fontFamily: 'Noto Sans SC',
  },
  foodSourcesBox: {
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 4,
    marginTop: 6,
  },
  foodSourceItem: {
    fontSize: 8,
    color: '#4B5563',
    marginBottom: 2,
    fontFamily: 'Noto Sans SC',
  },
  // 健康关注点
  concernCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  concernName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 6,
    fontFamily: 'Noto Sans SC',
  },
  concernText: {
    fontSize: 9,
    color: '#78350F',
    marginBottom: 4,
    lineHeight: 1.4,
    fontFamily: 'Noto Sans SC',
  },
  // 两周计划
  weekCard: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  weekTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 4,
    fontFamily: 'Noto Sans SC',
  },
  weekFocus: {
    fontSize: 9,
    color: '#1E3A8A',
    marginBottom: 6,
    fontFamily: 'Noto Sans SC',
  },
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    padding: 8,
    marginBottom: 6,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 4,
    fontFamily: 'Noto Sans SC',
  },
  mealRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  mealLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#6B7280',
    width: 40,
    fontFamily: 'Noto Sans SC',
  },
  mealText: {
    fontSize: 8,
    color: '#374151',
    flex: 1,
    fontFamily: 'Noto Sans SC',
  },
  // 购物清单 - 网格布局
  shoppingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  shoppingCategory: {
    width: '48%',
    marginRight: '2%',
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 4,
    fontFamily: 'Noto Sans SC',
  },
  shoppingItem: {
    fontSize: 8,
    color: '#4B5563',
    marginBottom: 2,
    fontFamily: 'Noto Sans SC',
  },
  // 追踪工具
  trackingBox: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  trackingTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 6,
    fontFamily: 'Noto Sans SC',
  },
  trackingItem: {
    fontSize: 8,
    color: '#6B7280',
    marginBottom: 3,
    fontFamily: 'Noto Sans SC',
  },
  plateVisual: {
    fontSize: 9,
    color: '#4B5563',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
    fontFamily: 'Noto Sans SC',
    lineHeight: 1.4,
  },
  // 预期结果
  outcomeBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  outcomeTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#065F46',
    marginBottom: 6,
    fontFamily: 'Noto Sans SC',
  },
  outcomeItem: {
    fontSize: 8,
    color: '#047857',
    marginBottom: 3,
    fontFamily: 'Noto Sans SC',
  },
});

interface PDFRecommendationSummaryProps {
  content: any;
  clientName: string;
  generatedDate: string;
}

export function PDFRecommendationSummary({ content, clientName, generatedDate }: PDFRecommendationSummaryProps) {
  return (
    <View style={styles.container}>
      {/* 标题卡片 */}
      <View style={styles.titleCard}>
        <Text style={styles.title}>{clientName} 的营养干预方案</Text>
        <Text style={styles.subtitle}>生成日期: {generatedDate}</Text>
      </View>

      {/* 健康问题干预 - 异常生物标志物 */}
      {content.biomarkerInterventionMapping && content.biomarkerInterventionMapping.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>异常指标干预</Text>
          {content.biomarkerInterventionMapping.map((item: any, idx: number) => (
            <View key={idx} style={styles.biomarkerCard}>
              <View style={styles.biomarkerHeader}>
                <Text style={styles.biomarkerName}>{wrapChineseText(item.biomarker)}</Text>
                <Text style={styles.statusBadge}>{wrapChineseText(item.status)}</Text>
              </View>

              {item.nutritionalIntervention && (
                <Text style={styles.biomarkerText}>
                  {wrapChineseText(item.nutritionalIntervention)}
                </Text>
              )}

              {item.foodSources && item.foodSources.length > 0 && (
                <View style={styles.foodSourcesBox}>
                  <Text style={[styles.biomarkerText, { fontWeight: 'bold', marginBottom: 4 }]}>
                    食物来源:
                  </Text>
                  {item.foodSources.map((source: any, sIdx: number) => (
                    <Text key={sIdx} style={styles.foodSourceItem}>
                      • {wrapChineseText(source.food)} - {wrapChineseText(source.nutrient)} ({source.amount})
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* 其他健康关注点 */}
      {content.healthConcernsInterventions?.concerns && content.healthConcernsInterventions.concerns.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>其他健康关注</Text>
          {content.healthConcernsInterventions.concerns.map((concern: any, idx: number) => (
            <View key={idx} style={styles.concernCard}>
              <Text style={styles.concernName}>
                {wrapChineseText(concern.concern)} ({concern.severity})
              </Text>

              {concern.nutritionalStrategy?.keyFoods && concern.nutritionalStrategy.keyFoods.length > 0 && (
                <View style={{ marginBottom: 6 }}>
                  <Text style={[styles.concernText, { fontWeight: 'bold', marginBottom: 2 }]}>
                    推荐食物:
                  </Text>
                  {concern.nutritionalStrategy.keyFoods.map((food: any, fIdx: number) => (
                    <Text key={fIdx} style={styles.foodSourceItem}>
                      • {wrapChineseText(food.food)} {food.amount ? `(${food.amount})` : ''}
                    </Text>
                  ))}
                </View>
              )}

              {concern.nutritionalStrategy?.avoidFoods && concern.nutritionalStrategy.avoidFoods.length > 0 && (
                <View style={{ marginBottom: 6 }}>
                  <Text style={[styles.concernText, { fontWeight: 'bold', marginBottom: 2 }]}>
                    避免食物:
                  </Text>
                  {concern.nutritionalStrategy.avoidFoods.map((food: any, fIdx: number) => (
                    <Text key={fIdx} style={styles.foodSourceItem}>
                      • {wrapChineseText(food.food)}
                    </Text>
                  ))}
                </View>
              )}

              {concern.nutritionalStrategy?.supplements && concern.nutritionalStrategy.supplements.length > 0 && (
                <View style={{ marginBottom: 6 }}>
                  <Text style={[styles.concernText, { fontWeight: 'bold', marginBottom: 2 }]}>
                    建议补充剂:
                  </Text>
                  {concern.nutritionalStrategy.supplements.map((supp: any, sIdx: number) => (
                    <Text key={sIdx} style={styles.foodSourceItem}>
                      • {wrapChineseText(supp.name)} ({supp.dosage})
                    </Text>
                  ))}
                </View>
              )}

              {concern.lifestyleModifications && [
                    ...(concern.lifestyleModifications.morningRoutine || []),
                    ...(concern.lifestyleModifications.dailyHabits || []),
                    ...(concern.lifestyleModifications.eveningRoutine || []),
                    ...(concern.lifestyleModifications.weeklyActivities || []),
                  ].length > 0 && (
                <View>
                  <Text style={[styles.concernText, { fontWeight: 'bold', marginBottom: 2 }]}>
                    生活方式建议:
                  </Text>
                  {[
                    ...(concern.lifestyleModifications.morningRoutine || []),
                    ...(concern.lifestyleModifications.dailyHabits || []),
                    ...(concern.lifestyleModifications.eveningRoutine || []),
                    ...(concern.lifestyleModifications.weeklyActivities || []),
                  ].map((habit: string, hIdx: number) => (
                    <Text key={hIdx} style={styles.foodSourceItem}>
                      • {wrapChineseText(habit)}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* 两周改善计划 */}
      {content.twoWeekPlan && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {wrapChineseText(content.twoWeekPlan.title || '两周211饮食改善计划')}
          </Text>

          {/* 第一周 */}
          {content.twoWeekPlan.week1 && (
            <View style={styles.weekCard}>
              <Text style={styles.weekTitle}>{wrapChineseText(content.twoWeekPlan.week1.title)}</Text>
              <Text style={styles.weekFocus}>
                重点: {wrapChineseText(content.twoWeekPlan.week1.focus)}
              </Text>
              
              {content.twoWeekPlan.week1.dailyPlan && content.twoWeekPlan.week1.dailyPlan.map((day: any, dayIdx: number) => (
                <View key={dayIdx} style={styles.dayCard}>
                  <Text style={styles.dayLabel}>{day.day}</Text>
                  <View style={styles.mealRow}>
                    <Text style={styles.mealLabel}>早餐:</Text>
                    <Text style={styles.mealText}>{wrapChineseText(day.breakfast)}</Text>
                  </View>
                  <View style={styles.mealRow}>
                    <Text style={styles.mealLabel}>午餐:</Text>
                    <Text style={styles.mealText}>{wrapChineseText(day.lunch)}</Text>
                  </View>
                  <View style={styles.mealRow}>
                    <Text style={styles.mealLabel}>晚餐:</Text>
                    <Text style={styles.mealText}>{wrapChineseText(day.dinner)}</Text>
                  </View>
                  {day.snack && (
                    <View style={styles.mealRow}>
                      <Text style={styles.mealLabel}>加餐:</Text>
                      <Text style={styles.mealText}>{wrapChineseText(day.snack)}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* 第二周 */}
          {content.twoWeekPlan.week2 && (
            <View style={styles.weekCard}>
              <Text style={styles.weekTitle}>{wrapChineseText(content.twoWeekPlan.week2.title)}</Text>
              <Text style={styles.weekFocus}>
                重点: {wrapChineseText(content.twoWeekPlan.week2.focus)}
              </Text>
              
              {content.twoWeekPlan.week2.dailyPlan && content.twoWeekPlan.week2.dailyPlan.map((day: any, dayIdx: number) => (
                <View key={dayIdx} style={styles.dayCard}>
                  <Text style={styles.dayLabel}>{day.day}</Text>
                  <View style={styles.mealRow}>
                    <Text style={styles.mealLabel}>早餐:</Text>
                    <Text style={styles.mealText}>{wrapChineseText(day.breakfast)}</Text>
                  </View>
                  <View style={styles.mealRow}>
                    <Text style={styles.mealLabel}>午餐:</Text>
                    <Text style={styles.mealText}>{wrapChineseText(day.lunch)}</Text>
                  </View>
                  <View style={styles.mealRow}>
                    <Text style={styles.mealLabel}>晚餐:</Text>
                    <Text style={styles.mealText}>{wrapChineseText(day.dinner)}</Text>
                  </View>
                  {day.snack && (
                    <View style={styles.mealRow}>
                      <Text style={styles.mealLabel}>加餐:</Text>
                      <Text style={styles.mealText}>{wrapChineseText(day.snack)}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* 购物清单 - 网格布局 */}
          {content.twoWeekPlan.shoppingList && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>购物清单</Text>
              <View style={styles.shoppingGrid}>
                {content.twoWeekPlan.shoppingList.vegetables && content.twoWeekPlan.shoppingList.vegetables.length > 0 && (
                  <View style={styles.shoppingCategory}>
                    <Text style={styles.categoryLabel}>🥬 蔬菜类</Text>
                    {content.twoWeekPlan.shoppingList.vegetables.map((item: string, idx: number) => (
                      <Text key={idx} style={styles.shoppingItem}>• {wrapChineseText(item)}</Text>
                    ))}
                  </View>
                )}

                {content.twoWeekPlan.shoppingList.proteins && content.twoWeekPlan.shoppingList.proteins.length > 0 && (
                  <View style={styles.shoppingCategory}>
                    <Text style={styles.categoryLabel}>🥩 高蛋白食物</Text>
                    {content.twoWeekPlan.shoppingList.proteins.map((item: string, idx: number) => (
                      <Text key={idx} style={styles.shoppingItem}>• {wrapChineseText(item)}</Text>
                    ))}
                  </View>
                )}

                {content.twoWeekPlan.shoppingList.carbs && content.twoWeekPlan.shoppingList.carbs.length > 0 && (
                  <View style={styles.shoppingCategory}>
                    <Text style={styles.categoryLabel}>🍞 主食类</Text>
                    {content.twoWeekPlan.shoppingList.carbs.map((item: string, idx: number) => (
                      <Text key={idx} style={styles.shoppingItem}>• {wrapChineseText(item)}</Text>
                    ))}
                  </View>
                )}

                {content.twoWeekPlan.shoppingList.healthyFats && content.twoWeekPlan.shoppingList.healthyFats.length > 0 && (
                  <View style={styles.shoppingCategory}>
                    <Text style={styles.categoryLabel}>🥑 健康油脂</Text>
                    {content.twoWeekPlan.shoppingList.healthyFats.map((item: string, idx: number) => (
                      <Text key={idx} style={styles.shoppingItem}>• {wrapChineseText(item)}</Text>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* 追踪工具 */}
          {content.twoWeekPlan.trackingTools && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{wrapChineseText(content.twoWeekPlan.trackingTools.title || '追踪工具')}</Text>
              
              {content.twoWeekPlan.trackingTools.plateVisual && (
                <Text style={styles.plateVisual}>
                  {wrapChineseText(content.twoWeekPlan.trackingTools.plateVisual)}
                </Text>
              )}

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {content.twoWeekPlan.trackingTools.dailyChecklist && content.twoWeekPlan.trackingTools.dailyChecklist.length > 0 && (
                  <View style={[styles.trackingBox, { width: '48%' }]}>
                    <Text style={styles.trackingTitle}>每日检查清单</Text>
                    {content.twoWeekPlan.trackingTools.dailyChecklist.map((item: string, idx: number) => (
                      <Text key={idx} style={styles.trackingItem}>☐ {wrapChineseText(item)}</Text>
                    ))}
                  </View>
                )}

                {content.twoWeekPlan.trackingTools.weeklyMetrics && content.twoWeekPlan.trackingTools.weeklyMetrics.length > 0 && (
                  <View style={[styles.trackingBox, { width: '48%' }]}>
                    <Text style={styles.trackingTitle}>每周追踪指标</Text>
                    {content.twoWeekPlan.trackingTools.weeklyMetrics.map((item: string, idx: number) => (
                      <Text key={idx} style={styles.trackingItem}>• {wrapChineseText(item)}</Text>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* 预期结果 */}
          {content.twoWeekPlan.expectedOutcomes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>预期效果</Text>
              
              {content.twoWeekPlan.expectedOutcomes.physical && content.twoWeekPlan.expectedOutcomes.physical.length > 0 && (
                <View style={styles.outcomeBox}>
                  <Text style={styles.outcomeTitle}>身体变化:</Text>
                  {content.twoWeekPlan.expectedOutcomes.physical.map((item: string, idx: number) => (
                    <Text key={idx} style={styles.outcomeItem}>• {wrapChineseText(item)}</Text>
                  ))}
                </View>
              )}

              {content.twoWeekPlan.expectedOutcomes.habitual && content.twoWeekPlan.expectedOutcomes.habitual.length > 0 && (
                <View style={styles.outcomeBox}>
                  <Text style={styles.outcomeTitle}>习惯养成:</Text>
                  {content.twoWeekPlan.expectedOutcomes.habitual.map((item: string, idx: number) => (
                    <Text key={idx} style={styles.outcomeItem}>• {wrapChineseText(item)}</Text>
                  ))}
                </View>
              )}

              {content.twoWeekPlan.expectedOutcomes.biomarkers && content.twoWeekPlan.expectedOutcomes.biomarkers.length > 0 && (
                <View style={styles.outcomeBox}>
                  <Text style={styles.outcomeTitle}>指标改善:</Text>
                  {content.twoWeekPlan.expectedOutcomes.biomarkers.map((item: string, idx: number) => (
                    <Text key={idx} style={styles.outcomeItem}>• {wrapChineseText(item)}</Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

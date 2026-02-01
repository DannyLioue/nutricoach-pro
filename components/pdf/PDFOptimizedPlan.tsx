import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { wrapChineseText } from '@/lib/pdf/text-wrapper';

interface PDFOptimizedPlanProps {
  clientName: string;
  generatedDate: string;
  planType: 'diet' | 'exercise';
  optimizedPlan: {
    diet?: {
      summary: string;
      recommendations: string[];
      dailyCalorieTarget: string;
      macroTargets: {
        carbs: string;
        protein: string;
        fat: string;
      };
      foods: {
        recommend: Array<{
          food: string;
          reason: string;
          portion: string;
          frequency: string;
        }>;
        avoid: Array<{
          food: string;
          reason: string;
          alternatives: string[];
        }>;
      };
      supplements: Array<{
        name: string;
        dosage: string;
        frequency: string;
        duration: string;
        rationale: string;
        contraindications?: string[];
      }>;
      mealPlan: {
        breakfast: {
          time: string;
          foods: Array<{
            food: string;
            amount: string;
            preparation: string;
          }>;
          nutrition: string;
        };
        lunch: {
          time: string;
          foods: Array<{
            food: string;
            amount: string;
            preparation: string;
          }>;
          nutrition: string;
        };
        dinner: {
          time: string;
          foods: Array<{
            food: string;
            amount: string;
            preparation: string;
          }>;
          nutrition: string;
        };
        snacks: Array<{
          time: string;
          foods: string[];
          purpose: string;
        }>;
      };
      specialNotes: string[];
    };
    exercise?: {
      summary: string;
      recommendations: string[];
      weeklyGoals: {
        cardioSessions: string;
        strengthSessions: string;
        flexibilitySessions: string;
      };
      activities: Array<{
        type: string;
        duration: string;
        frequency: string;
        intensity: {
          method: string;
          targetZone: string;
          rpe: string;
        };
        instructions: string;
        progression: string;
      }>;
      precautions: string[];
      warmup: {
        duration: string;
        activities: string[];
      };
      cooldown: {
        duration: string;
        activities: string[];
      };
    };
    followUp: {
      monitoringIndicators: string[];
      reviewTimeline: string;
      adjustmentTriggers: string[];
    };
  };
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Noto Sans SC',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottom: '2pt solid #10b981',
    fontFamily: 'Noto Sans SC',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 5,
    fontFamily: 'Noto Sans SC',
  },
  subtitle: {
    fontSize: 18,
    color: '#64748b',
    fontFamily: 'Noto Sans SC',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottom: '1pt solid #d1fae5',
    fontFamily: 'Noto Sans SC',
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
    marginTop: 10,
    marginBottom: 6,
    fontFamily: 'Noto Sans SC',
  },
  summaryBox: {
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
    borderLeft: '3pt solid #10b981',
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 1.6,
    fontFamily: 'Noto Sans SC',
  },
  listItem: {
    fontSize: 15,
    lineHeight: 1.5,
    marginBottom: 4,
    paddingLeft: 12,
    fontFamily: 'Noto Sans SC',
  },
  macroBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  macroItem: {
    width: '31%',
    marginRight: '3%',
    marginBottom: 8,
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 6,
    border: '1pt solid #86efac',
  },
  macroLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 3,
    fontFamily: 'Noto Sans SC',
  },
  macroValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
    fontFamily: 'Noto Sans SC',
  },
  foodCard: {
    padding: 10,
    backgroundColor: '#fafafa',
    borderRadius: 6,
    marginBottom: 8,
    borderLeft: '3pt solid #10b981',
  },
  foodName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
    fontFamily: 'Noto Sans SC',
  },
  foodDetail: {
    fontSize: 14,
    lineHeight: 1.4,
    color: '#475569',
    fontFamily: 'Noto Sans SC',
  },
  avoidCard: {
    borderLeftColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  mealSection: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f0fdfa',
    borderRadius: 6,
  },
  mealTime: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 5,
    fontFamily: 'Noto Sans SC',
  },
  mealFood: {
    fontSize: 15,
    marginBottom: 2,
    fontFamily: 'Noto Sans SC',
  },
  mealNutrition: {
    fontSize: 13,
    color: '#059669',
    marginTop: 5,
    fontFamily: 'Noto Sans SC',
  },
  supplementBox: {
    padding: 10,
    backgroundColor: '#fffbeb',
    borderRadius: 6,
    marginBottom: 8,
    borderLeft: '3pt solid #f59e0b',
  },
  supplementName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
    fontFamily: 'Noto Sans SC',
  },
  supplementDetail: {
    fontSize: 14,
    lineHeight: 1.4,
    fontFamily: 'Noto Sans SC',
  },
  activityCard: {
    padding: 10,
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    marginBottom: 8,
    borderLeft: '3pt solid #3b82f6',
  },
  activityType: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 5,
    fontFamily: 'Noto Sans SC',
  },
  activityDetail: {
    fontSize: 14,
    lineHeight: 1.4,
    fontFamily: 'Noto Sans SC',
  },
  precautionsBox: {
    padding: 10,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    marginBottom: 8,
    borderLeft: '3pt solid #f59e0b',
  },
  followUpBox: {
    padding: 12,
    backgroundColor: '#e0f2fe',
    borderRadius: 6,
    border: '1pt solid #7dd3fc',
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

export function PDFOptimizedPlan({
  clientName,
  generatedDate,
  planType,
  optimizedPlan,
}: PDFOptimizedPlanProps) {
  const planTypeLabel = planType === 'diet' ? '饮食计划' : '运动计划';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 页眉 */}
        <View style={styles.header}>
          <Text style={styles.title}>{wrapChineseText('AI 优化营养方案')}</Text>
          <Text style={styles.subtitle}>
            {wrapChineseText(planTypeLabel + '优化 · ' + clientName + ' · ' + generatedDate)}
          </Text>
        </View>

        {/* 饮食计划 */}
        {optimizedPlan.diet && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{wrapChineseText('一、优化饮食方案')}</Text>

              {/* 总体说明 */}
              <View style={styles.summaryBox}>
                <Text style={styles.summaryText}>
                  {wrapChineseText(optimizedPlan.diet.summary)}
                </Text>
              </View>

              {/* 核心建议 */}
              {optimizedPlan.diet.recommendations && optimizedPlan.diet.recommendations.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.subsectionTitle}>{wrapChineseText('核心建议')}</Text>
                  {optimizedPlan.diet.recommendations.map((rec, index) => (
                    <Text key={index} style={styles.listItem}>
                      {wrapChineseText((index + 1) + '. ' + rec)}
                    </Text>
                  ))}
                </View>
              )}

              {/* 热量和宏量营养素目标 */}
              <View style={styles.section}>
                <Text style={styles.subsectionTitle}>{wrapChineseText('营养目标')}</Text>
                <View style={styles.summaryBox}>
                  <Text style={styles.listItem}>
                    {wrapChineseText('• 每日热量：' + optimizedPlan.diet.dailyCalorieTarget)}
                  </Text>
                </View>

                <View style={styles.macroBox}>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroLabel}>{wrapChineseText('碳水化合物')}</Text>
                    <Text style={styles.macroValue}>{wrapChineseText(optimizedPlan.diet.macroTargets.carbs)}</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroLabel}>{wrapChineseText('蛋白质')}</Text>
                    <Text style={styles.macroValue}>{wrapChineseText(optimizedPlan.diet.macroTargets.protein)}</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroLabel}>{wrapChineseText('脂肪')}</Text>
                    <Text style={styles.macroValue}>{wrapChineseText(optimizedPlan.diet.macroTargets.fat)}</Text>
                  </View>
                </View>
              </View>

              {/* 推荐食物 */}
              {optimizedPlan.diet.foods.recommend && optimizedPlan.diet.foods.recommend.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.subsectionTitle}>{wrapChineseText('推荐食物')}</Text>
                  {optimizedPlan.diet.foods.recommend.map((food, index) => (
                    <View key={index} style={styles.foodCard}>
                      <Text style={styles.foodName}>{wrapChineseText(food.food)}</Text>
                      <Text style={styles.foodDetail}>
                        {wrapChineseText('推荐理由：' + food.reason)}
                      </Text>
                      <Text style={styles.foodDetail}>
                        {wrapChineseText('建议分量：' + food.portion + ' | 频率：' + food.frequency)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* 避免食物 */}
              {optimizedPlan.diet.foods.avoid && optimizedPlan.diet.foods.avoid.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.subsectionTitle}>{wrapChineseText('避免食物')}</Text>
                  {optimizedPlan.diet.foods.avoid.map((food, index) => (
                    <View key={index} style={[styles.foodCard, styles.avoidCard]}>
                      <Text style={styles.foodName}>{wrapChineseText(food.food)}</Text>
                      <Text style={styles.foodDetail}>
                        {wrapChineseText('避免原因：' + food.reason)}
                      </Text>
                      {food.alternatives && food.alternatives.length > 0 && (
                        <Text style={styles.foodDetail}>
                          {wrapChineseText('替代方案：' + food.alternatives.join('、'))}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* 补充剂 */}
              {optimizedPlan.diet.supplements && optimizedPlan.diet.supplements.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.subsectionTitle}>{wrapChineseText('补充剂建议')}</Text>
                  {optimizedPlan.diet.supplements.map((supp, index) => (
                    <View key={index} style={styles.supplementBox}>
                      <Text style={styles.supplementName}>
                        {wrapChineseText(supp.name + ' - ' + supp.dosage)}
                      </Text>
                      <Text style={styles.supplementDetail}>
                        {wrapChineseText('频率：' + supp.frequency + ' | 周期：' + supp.duration)}
                      </Text>
                      <Text style={styles.supplementDetail}>
                        {wrapChineseText('理由：' + supp.rationale)}
                      </Text>
                      {supp.contraindications && supp.contraindications.length > 0 && (
                        <Text style={[styles.supplementDetail, { color: '#dc2626' }]}>
                          {wrapChineseText('禁忌症：' + supp.contraindications.join('、'))}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* 一日食谱 */}
              {optimizedPlan.diet.mealPlan && (
                <View style={styles.section}>
                  <Text style={styles.subsectionTitle}>{wrapChineseText('一日食谱参考')}</Text>

                  {/* 早餐 */}
                  <View style={styles.mealSection}>
                    <Text style={styles.mealTime}>
                      {wrapChineseText('早餐 · ' + optimizedPlan.diet.mealPlan.breakfast.time)}
                    </Text>
                    {optimizedPlan.diet.mealPlan.breakfast.foods.map((food, index) => (
                      <Text key={index} style={styles.mealFood}>
                        {wrapChineseText('• ' + food.food + ' - ' + food.amount)}
                        {food.preparation && (
                          <Text>{wrapChineseText(' (' + food.preparation + ')')}</Text>
                        )}
                      </Text>
                    ))}
                    <Text style={styles.mealNutrition}>
                      {wrapChineseText(optimizedPlan.diet.mealPlan.breakfast.nutrition)}
                    </Text>
                  </View>

                  {/* 午餐 */}
                  <View style={styles.mealSection}>
                    <Text style={styles.mealTime}>
                      {wrapChineseText('午餐 · ' + optimizedPlan.diet.mealPlan.lunch.time)}
                    </Text>
                    {optimizedPlan.diet.mealPlan.lunch.foods.map((food, index) => (
                      <Text key={index} style={styles.mealFood}>
                        {wrapChineseText('• ' + food.food + ' - ' + food.amount)}
                        {food.preparation && (
                          <Text>{wrapChineseText(' (' + food.preparation + ')')}</Text>
                        )}
                      </Text>
                    ))}
                    <Text style={styles.mealNutrition}>
                      {wrapChineseText(optimizedPlan.diet.mealPlan.lunch.nutrition)}
                    </Text>
                  </View>

                  {/* 晚餐 */}
                  <View style={styles.mealSection}>
                    <Text style={styles.mealTime}>
                      {wrapChineseText('晚餐 · ' + optimizedPlan.diet.mealPlan.dinner.time)}
                    </Text>
                    {optimizedPlan.diet.mealPlan.dinner.foods.map((food, index) => (
                      <Text key={index} style={styles.mealFood}>
                        {wrapChineseText('• ' + food.food + ' - ' + food.amount)}
                        {food.preparation && (
                          <Text>{wrapChineseText(' (' + food.preparation + ')')}</Text>
                        )}
                      </Text>
                    ))}
                    <Text style={styles.mealNutrition}>
                      {wrapChineseText(optimizedPlan.diet.mealPlan.dinner.nutrition)}
                    </Text>
                  </View>

                  {/* 加餐 */}
                  {optimizedPlan.diet.mealPlan.snacks && optimizedPlan.diet.mealPlan.snacks.length > 0 && (
                    <>
                      {optimizedPlan.diet.mealPlan.snacks.map((snack, index) => (
                        <View key={index} style={styles.mealSection}>
                          <Text style={styles.mealTime}>
                            {wrapChineseText('加餐 · ' + snack.time)}
                          </Text>
                          {snack.foods.map((food, foodIndex) => (
                            <Text key={foodIndex} style={styles.mealFood}>
                              {wrapChineseText('• ' + food)}
                            </Text>
                          ))}
                          <Text style={[styles.mealNutrition, { color: '#64748b' }]}>
                            {wrapChineseText('目的：' + snack.purpose)}
                          </Text>
                        </View>
                      ))}
                    </>
                  )}
                </View>
              )}

              {/* 特殊注意事项 */}
              {optimizedPlan.diet.specialNotes && optimizedPlan.diet.specialNotes.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.subsectionTitle}>{wrapChineseText('特殊注意事项')}</Text>
                  {optimizedPlan.diet.specialNotes.map((note, index) => (
                    <Text key={index} style={styles.listItem}>
                      {wrapChineseText('• ' + note)}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        {/* 运动计划 */}
        {optimizedPlan.exercise && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{wrapChineseText('二、优化运动方案')}</Text>

              {/* 总体说明 */}
              <View style={styles.summaryBox}>
                <Text style={styles.summaryText}>
                  {wrapChineseText(optimizedPlan.exercise.summary)}
                </Text>
              </View>

              {/* 核心原则 */}
              {optimizedPlan.exercise.recommendations && optimizedPlan.exercise.recommendations.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.subsectionTitle}>{wrapChineseText('核心运动原则')}</Text>
                  {optimizedPlan.exercise.recommendations.map((rec, index) => (
                    <Text key={index} style={styles.listItem}>
                      {wrapChineseText((index + 1) + '. ' + rec)}
                    </Text>
                  ))}
                </View>
              )}

              {/* 每周目标 */}
              <View style={styles.section}>
                <Text style={styles.subsectionTitle}>{wrapChineseText('每周训练目标')}</Text>
                <View style={styles.macroBox}>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroLabel}>{wrapChineseText('有氧运动')}</Text>
                    <Text style={styles.macroValue}>{wrapChineseText(optimizedPlan.exercise.weeklyGoals.cardioSessions)}</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroLabel}>{wrapChineseText('力量训练')}</Text>
                    <Text style={styles.macroValue}>{wrapChineseText(optimizedPlan.exercise.weeklyGoals.strengthSessions)}</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroLabel}>{wrapChineseText('柔韧性训练')}</Text>
                    <Text style={styles.macroValue}>{wrapChineseText(optimizedPlan.exercise.weeklyGoals.flexibilitySessions)}</Text>
                  </View>
                </View>
              </View>

              {/* 运动项目 */}
              {optimizedPlan.exercise.activities && optimizedPlan.exercise.activities.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.subsectionTitle}>{wrapChineseText('运动项目详情')}</Text>
                  {optimizedPlan.exercise.activities.map((activity, index) => (
                    <View key={index} style={styles.activityCard}>
                      <Text style={styles.activityType}>
                        {wrapChineseText((index + 1) + '. ' + activity.type)}
                      </Text>
                      <Text style={styles.activityDetail}>
                        {wrapChineseText('时长：' + activity.duration + ' | 频率：' + activity.frequency)}
                      </Text>
                      <Text style={styles.activityDetail}>
                        {wrapChineseText('强度计算：' + activity.intensity.method)}
                      </Text>
                      <Text style={styles.activityDetail}>
                        {wrapChineseText('目标心率区间：' + activity.intensity.targetZone)}
                      </Text>
                      <Text style={styles.activityDetail}>
                        {wrapChineseText('主观疲劳度：' + activity.intensity.rpe)}
                      </Text>
                      <Text style={styles.activityDetail}>
                        {wrapChineseText('执行说明：' + activity.instructions)}
                      </Text>
                      <Text style={styles.activityDetail}>
                        {wrapChineseText('进阶计划：' + activity.progression)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* 热身和放松 */}
              {(optimizedPlan.exercise.warmup || optimizedPlan.exercise.cooldown) && (
                <View style={styles.section}>
                  <Text style={styles.subsectionTitle}>{wrapChineseText('热身与放松')}</Text>

                  {optimizedPlan.exercise.warmup && (
                    <View style={styles.mealSection}>
                      <Text style={styles.mealTime}>
                        {wrapChineseText('热身运动 - ' + optimizedPlan.exercise.warmup.duration)}
                      </Text>
                      {optimizedPlan.exercise.warmup.activities.map((item, index) => (
                        <Text key={index} style={styles.mealFood}>
                          {wrapChineseText('• ' + item)}
                        </Text>
                      ))}
                    </View>
                  )}

                  {optimizedPlan.exercise.cooldown && (
                    <View style={styles.mealSection}>
                      <Text style={styles.mealTime}>
                        {wrapChineseText('放松运动 - ' + optimizedPlan.exercise.cooldown.duration)}
                      </Text>
                      {optimizedPlan.exercise.cooldown.activities.map((item, index) => (
                        <Text key={index} style={styles.mealFood}>
                          {wrapChineseText('• ' + item)}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* 注意事项 */}
              {optimizedPlan.exercise.precautions && optimizedPlan.exercise.precautions.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.subsectionTitle}>{wrapChineseText('重要注意事项')}</Text>
                  {optimizedPlan.exercise.precautions.map((prec, index) => (
                    <View key={index} style={styles.precautionsBox}>
                      <Text style={styles.listItem}>
                        {wrapChineseText('• ' + prec)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        {/* 随访计划 */}
        {optimizedPlan.followUp && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{wrapChineseText('三、随访与监测')}</Text>

            <View style={styles.followUpBox}>
              <Text style={styles.subsectionTitle}>{wrapChineseText('监测指标')}</Text>
              {optimizedPlan.followUp.monitoringIndicators.map((indicator, index) => (
                <Text key={index} style={styles.listItem}>
                  {wrapChineseText('• ' + indicator)}
                </Text>
              ))}
            </View>

            <View style={styles.summaryBox}>
              <Text style={styles.listItem}>
                {wrapChineseText('复查时间：' + optimizedPlan.followUp.reviewTimeline)}
              </Text>
            </View>

            <View style={styles.precautionsBox}>
              <Text style={styles.subsectionTitle}>{wrapChineseText('需要调整的情况')}</Text>
              {optimizedPlan.followUp.adjustmentTriggers.map((trigger, index) => (
                <Text key={index} style={styles.listItem}>
                  {wrapChineseText('• ' + trigger)}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* 页脚 */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {wrapChineseText('本方案由 AI 基于营养师计划优化生成，需结合专业判断使用')}
          </Text>
          <Text style={styles.footerText}>
            {wrapChineseText('NutriCoach Pro · 智能营养分析平台')}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

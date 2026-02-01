import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { DetailedExercisePrescription } from '@/types';
import { wrapChineseText } from '@/lib/pdf/text-wrapper';

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  overviewBox: {
    backgroundColor: '#F0FDF4',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
    marginBottom: 15,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 10,
    color: '#111827',
    fontFamily: 'Noto Sans SC',
  },
  overviewText: {
    fontSize: 11,
    color: '#065F46',
    lineHeight: 1.5,
    fontFamily: 'Noto Sans SC',
  },
  goalsBox: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 15,
    width: '100%',
  },
  goalItem: {
    fontSize: 11,
    color: '#374151',
    marginBottom: 5,
    flexDirection: 'row',
    alignItems: 'flex-start',
    fontFamily: 'Noto Sans SC',
    flexWrap: 'wrap',
  },
  goalBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#10B981',
    marginTop: 6,
    marginRight: 8,
  },
  equipmentSection: {
    marginBottom: 15,
  },
  equipmentBox: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: '100%',
  },
  equipmentTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#374151',
    fontFamily: 'Noto Sans SC',
  },
  equipmentItem: {
    fontSize: 11,
    color: '#4B5563',
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    fontFamily: 'Noto Sans SC',
    flexWrap: 'wrap',
  },
  equipmentCheck: {
    width: 12,
    height: 12,
    marginRight: 8,
    color: '#10B981',
  },
  weekSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 15,
    width: '100%',
  },
  weekHeader: {
    backgroundColor: '#10B981',
    padding: 10,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
  },
  weekTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Noto Sans SC',
  },
  weekContent: {
    padding: 12,
  },
  daySection: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dayName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Noto Sans SC',
  },
  dayMeta: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: 'Noto Sans SC',
  },
  exerciseBox: {
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 6,
    marginTop: 6,
  },
  exerciseName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Noto Sans SC',
  },
  exerciseMeta: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 4,
    fontFamily: 'Noto Sans SC',
  },
  exerciseDetail: {
    fontSize: 9,
    color: '#4B5563',
    lineHeight: 1.3,
    fontFamily: 'Noto Sans SC',
    textAlign: 'left',
    maxWidth: 495,
    flexWrap: 'wrap',
  },
  precautionsBox: {
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    width: '100%',
  },
  precautionsTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 8,
    fontFamily: 'Noto Sans SC',
  },
  precautionItem: {
    fontSize: 11,
    color: '#78350F',
    marginBottom: 4,
    lineHeight: 1.4,
    fontFamily: 'Noto Sans SC',
  },
});

interface PDFExercisePlanProps {
  data: DetailedExercisePrescription;
}

export function PDFExercisePlan({ data }: PDFExercisePlanProps) {
  const weeklySchedule = data.weeklySchedule.slice(0, 2);

  return (
    <View style={{ width: '100%', maxWidth: 535 }}>
      {/* 概览 */}
      <View style={styles.overviewBox}>
        <Text style={styles.sectionTitle}>整体运动策略</Text>
        <Text style={styles.overviewText}>{wrapChineseText(data.overview)}</Text>
      </View>

      {/* 目标 */}
      <View style={styles.goalsBox}>
        <Text style={styles.sectionTitle}>训练目标</Text>
        {data.goals.map((goal, idx) => (
          <View style={styles.goalItem} key={idx}>
            <View style={styles.goalBullet} />
            <Text style={{ flex: 1, fontFamily: 'Noto Sans SC', textAlign: 'left' }}>{wrapChineseText(goal)}</Text>
          </View>
        ))}
      </View>

      {/* 器材 */}
      <View style={styles.equipmentSection}>
        <Text style={styles.sectionTitle}>运动器材</Text>

        <View style={styles.equipmentBox}>
          <Text style={styles.equipmentTitle}>已有器材</Text>
          {data.equipment.owned.length > 0 ? (
            data.equipment.owned.map((item, idx) => (
              <View style={styles.equipmentItem} key={idx}>
                <Text style={{ marginRight: 4, fontFamily: 'Noto Sans SC' }}>✓</Text>
                <Text style={{ flex: 1, fontFamily: 'Noto Sans SC', textAlign: 'left' }}>{item}</Text>
              </View>
            ))
          ) : (
            <Text style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'Noto Sans SC' }}>暂无器材信息</Text>
          )}
        </View>

        {data.equipment.recommended.length > 0 && (
          <View style={[styles.equipmentBox, { marginTop: 8 }]}>
            <Text style={styles.equipmentTitle}>推荐器材</Text>
            {data.equipment.recommended.map((item, idx) => (
              <View key={idx} style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#111827', fontFamily: 'Noto Sans SC' }}>
                  {wrapChineseText(item.item)}
                  {item.priority && (
                    <Text style={{ fontSize: 9, color: '#6B7280', fontFamily: 'Noto Sans SC' }}>
                      {' '}({item.priority === 'essential' ? '必需' : item.priority === 'helpful' ? '推荐' : '可选'})
                    </Text>
                  )}
                </Text>
                <Text style={{ fontSize: 10, color: '#6B7280', marginTop: 2, fontFamily: 'Noto Sans SC', lineHeight: 1.4 }}>
                  {wrapChineseText(item.reason)}
                </Text>
                {item.alternatives && item.alternatives.length > 0 && (
                  <Text style={{ fontSize: 9, color: '#9CA3AF', marginTop: 2, fontFamily: 'Noto Sans SC', lineHeight: 1.3 }}>
                    替代: {wrapChineseText(item.alternatives.join('、'))}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 周计划 */}
      {weeklySchedule.map((week) => (
        <View style={styles.weekSection} key={week.week}>
          <View style={styles.weekHeader}>
            <Text style={styles.weekTitle}>第{week.week}周 - {week.focus}</Text>
          </View>
          <View style={styles.weekContent}>
            {week.notes && (
              <Text style={{ fontSize: 10, color: '#6B7280', marginBottom: 10, fontFamily: 'Noto Sans SC', lineHeight: 1.4 }}>
                备注: {wrapChineseText(week.notes)}
              </Text>
            )}

            {week.days.map((day, dayIdx) => {
              const isRestDay = day.type.includes('休息') || day.exercises.length === 0;

              return (
                <View
                  style={dayIdx < week.days.length - 1 ? styles.daySection : {}}
                  key={dayIdx}
                >
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayName}>{day.day}</Text>
                    <Text style={styles.dayMeta}>{day.type} · {day.duration}</Text>
                  </View>

                  {day.focus && (
                    <Text style={{ fontSize: 10, color: '#6B7280', marginBottom: 4, fontFamily: 'Noto Sans SC', lineHeight: 1.4 }}>
                      重点: {wrapChineseText(day.focus)}
                    </Text>
                  )}

                  {isRestDay ? (
                    <Text style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'Noto Sans SC' }}>
                      休息日 - 主动恢复
                    </Text>
                  ) : (
                    day.exercises.map((exercise, exIdx) => (
                      <View style={styles.exerciseBox} key={exIdx}>
                        <Text style={styles.exerciseName}>{wrapChineseText(exercise.name)}</Text>
                        <Text style={styles.exerciseMeta}>
                          {exercise.sets}组 × {exercise.reps}次 · 休息{exercise.rest}
                        </Text>
                        <Text style={styles.exerciseDetail}>
                          强度: {wrapChineseText(exercise.intensity)}
                        </Text>
                        {exercise.targetMuscle && (
                          <Text style={styles.exerciseDetail}>
                            目标肌群: {wrapChineseText(exercise.targetMuscle)}
                          </Text>
                        )}
                        {exercise.notes && (
                          <Text style={[styles.exerciseDetail, { marginTop: 4 }]}>
                            注意: {wrapChineseText(exercise.notes)}
                          </Text>
                        )}
                      </View>
                    ))
                  )}
                </View>
              );
            })}
          </View>
        </View>
      ))}

      {/* 注意事项 */}
      {data.precautions.length > 0 && (
        <View style={styles.precautionsBox}>
          <Text style={styles.precautionsTitle}>注意事项</Text>
          {data.precautions.map((item, idx) => (
            <Text style={styles.precautionItem} key={idx}>
              • {wrapChineseText(item)}
            </Text>
          ))}
        </View>
      )}

      {/* 成功标准 */}
      {data.successCriteria.length > 0 && (
        <View style={[styles.goalsBox, { marginTop: 15 }]}>
          <Text style={styles.sectionTitle}>成功标准</Text>
          {data.successCriteria.map((criteria, idx) => (
            <View style={styles.goalItem} key={idx}>
              <View style={[styles.goalBullet, { backgroundColor: '#10B981' }]} />
              <Text style={{ flex: 1, fontFamily: 'Noto Sans SC', textAlign: 'left' }}>{wrapChineseText(criteria)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

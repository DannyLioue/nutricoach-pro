import { View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { TrafficLightData } from '@/components/TrafficLightGuide';
import { wrapChineseText } from '@/lib/pdf/text-wrapper';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 535,
  },
  // 说明卡片
  introCard: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  introTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 6,
    fontFamily: 'Noto Sans SC',
  },
  introText: {
    fontSize: 10,
    color: '#1E3A8A',
    lineHeight: 1.5,
    fontFamily: 'Noto Sans SC',
  },
  // 区域样式
  section: {
    marginBottom: 20,
    width: '100%',
  },
  sectionHeader: {
    padding: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  greenHeader: {
    backgroundColor: '#10B981',
  },
  yellowHeader: {
    backgroundColor: '#F59E0B',
  },
  redHeader: {
    backgroundColor: '#EF4444',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#FFFFFF',
    fontFamily: 'Noto Sans SC',
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 10,
    color: '#FFFFFF',
    lineHeight: 1.5,
    fontFamily: 'Noto Sans SC',
    opacity: 0.95,
  },
  sectionBody: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  greenBorder: {
    borderColor: '#86EFAC',
  },
  yellowBorder: {
    borderColor: '#FCD34D',
  },
  redBorder: {
    borderColor: '#FCA5A5',
  },
  rationale: {
    fontSize: 10,
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    color: '#374151',
    fontFamily: 'Noto Sans SC',
    lineHeight: 1.5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  // 分类区块
  categorySection: {
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    paddingBottom: 4,
    color: '#111827',
    fontFamily: 'Noto Sans SC',
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  // 食物卡片
  foodItem: {
    backgroundColor: '#F9FAFB',
    padding: 10,
    marginBottom: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: '100%',
  },
  foodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  foodName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Noto Sans SC',
    marginRight: 6,
  },
  categoryBadge: {
    fontSize: 8,
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: 'Noto Sans SC',
  },
  foodDetail: {
    fontSize: 9,
    color: '#4B5563',
    marginBottom: 4,
    lineHeight: 1.4,
    fontFamily: 'Noto Sans SC',
  },
  // 标签行
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  nutrientTag: {
    fontSize: 8,
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontFamily: 'Noto Sans SC',
    marginRight: 4,
    marginBottom: 3,
  },
  limitTag: {
    fontSize: 8,
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontFamily: 'Noto Sans SC',
    marginBottom: 3,
  },
  // 原因说明
  reasonBox: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 4,
    marginTop: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#60A5FA',
  },
  reasonLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 3,
    fontFamily: 'Noto Sans SC',
  },
  reasonText: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.4,
    fontFamily: 'Noto Sans SC',
  },
  // 替代选项
  alternativesBox: {
    backgroundColor: '#F0F9FF',
    padding: 8,
    marginTop: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  alternativesTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0369A1',
    marginBottom: 3,
    fontFamily: 'Noto Sans SC',
  },
  alternativesList: {
    fontSize: 9,
    color: '#075985',
    fontFamily: 'Noto Sans SC',
    lineHeight: 1.3,
  },
});

interface PDFFoodGuideProps {
  data: TrafficLightData;
}

export function PDFFoodGuide({ data }: PDFFoodGuideProps) {
  const renderFoodItem = (item: any) => {
    return (
      <View style={styles.foodItem} key={item.name}>
        {/* 食物标题行 */}
        <View style={styles.foodHeader}>
          <Text style={styles.foodName}>{wrapChineseText(item.name)}</Text>
          {item.category && (
            <Text style={styles.categoryBadge}>{wrapChineseText(item.category)}</Text>
          )}
        </View>

        {/* 食物详情 */}
        {item.detail && (
          <Text style={styles.foodDetail}>{wrapChineseText(item.detail)}</Text>
        )}

        {/* 营养成分标签 */}
        {item.nutrients && item.nutrients.length > 0 && (
          <View style={styles.tagsRow}>
            {item.nutrients.map((nutrient: string, idx: number) => (
              <Text style={styles.nutrientTag} key={idx}>
                {wrapChineseText(nutrient)}
              </Text>
            ))}
          </View>
        )}

        {/* 限制说明 */}
        {item.limit && (
          <View style={styles.tagsRow}>
            <Text style={styles.limitTag}>
              限制: {wrapChineseText(item.limit)}
            </Text>
          </View>
        )}

        {/* 原因说明 */}
        {item.reason && (
          <View style={styles.reasonBox}>
            <Text style={styles.reasonLabel}>推荐原因</Text>
            <Text style={styles.reasonText}>{wrapChineseText(item.reason)}</Text>
          </View>
        )}

        {/* 替代选项 */}
        {item.alternatives && item.alternatives.length > 0 && (
          <View style={styles.alternativesBox}>
            <Text style={styles.alternativesTitle}>推荐替代</Text>
            <Text style={styles.alternativesList}>
              {wrapChineseText(item.alternatives.join(' · '))}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderZone = (
    title: string,
    description: string,
    rationale: string | undefined,
    items: any[],
    variant: 'green' | 'yellow' | 'red'
  ) => {
    const headerStyle =
      variant === 'green'
        ? styles.greenHeader
        : variant === 'yellow'
        ? styles.yellowHeader
        : styles.redHeader;

    const borderStyle =
      variant === 'green'
        ? styles.greenBorder
        : variant === 'yellow'
        ? styles.yellowBorder
        : styles.redBorder;

    // Group by category
    const grouped = items.reduce((acc, item) => {
      const cat = item.category || '其他';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    return (
      <View style={styles.section}>
        {/* 区域标题头部 */}
        <View style={[styles.sectionHeader, headerStyle]}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionDesc}>{wrapChineseText(description)}</Text>
        </View>

        {/* 区域内容 */}
        <View style={[styles.sectionBody, borderStyle]}>
          {/* 原理说明 */}
          {rationale && (
            <Text style={styles.rationale}>
              💡 {wrapChineseText(rationale)}
            </Text>
          )}

          {/* 分类食物列表 */}
          {Object.keys(grouped).map((category, catIdx) => (
            <View style={styles.categorySection} key={category}>
              {category !== '其他' && (
                <Text style={styles.categoryTitle}>
                  {wrapChineseText(category)}
                </Text>
              )}
              {grouped[category].map((item: any) => renderFoodItem(item))}
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 211原则说明卡片 */}
      <View style={styles.introCard}>
        <Text style={styles.introTitle}>基于211饮食原则的红绿灯食物指南</Text>
        <Text style={styles.introText}>
          {wrapChineseText(
            '红绿灯食物分类与您的健康指标直接相关。绿灯食物富含改善您当前异常指标的营养素，建议作为每餐的主要选择；黄灯食物可适量食用，需注意控制份量；红灯食物会恶化您的指标，应严格避免。'
          )}
        </Text>
      </View>

      {renderZone(
        data.green.title,
        data.green.description,
        data.green.rationale,
        data.green.items,
        'green'
      )}

      {renderZone(
        data.yellow.title,
        data.yellow.description,
        data.yellow.rationale,
        data.yellow.items,
        'yellow'
      )}

      {renderZone(
        data.red.title,
        data.red.description,
        data.red.rationale,
        data.red.items,
        'red'
      )}
    </View>
  );
}

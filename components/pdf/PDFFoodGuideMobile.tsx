import { View, Text, StyleSheet, Page, Document } from '@react-pdf/renderer';
import { TrafficLightData } from '@/components/TrafficLightGuide';
import { wrapChineseText } from '@/lib/pdf/text-wrapper';

// 移动端PDF样式 - 大字体、大间距、优化手机阅读
const styles = StyleSheet.create({
  page: {
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  // 大标题区域
  header: {
    marginBottom: 24,
    textAlign: 'center',
  },
  titleIcon: {
    fontSize: 48,
    marginBottom: 8,
    color: '#10B981',
    fontWeight: 'bold',
    fontFamily: 'Noto Sans SC',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Noto Sans SC',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    fontFamily: 'Noto Sans SC',
  },
  clientInfo: {
    fontSize: 18,
    color: '#9CA3AF',
    fontFamily: 'Noto Sans SC',
    marginTop: 8,
  },

  // 绿色区域样式
  greenPage: {
    backgroundColor: '#F0FDF4',
    padding: 24,
    borderRadius: 16,
  },
  greenHeaderBox: {
    backgroundColor: '#10B981',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  greenTitleIcon: {
    fontSize: 56,
    marginBottom: 8,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: 'Noto Sans SC',
  },
  greenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Noto Sans SC',
    marginBottom: 4,
  },
  greenDesc: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: 'Noto Sans SC',
    textAlign: 'center',
  },

  // 黄色区域样式
  yellowPage: {
    backgroundColor: '#FEFCE8',
    padding: 24,
    borderRadius: 16,
  },
  yellowHeaderBox: {
    backgroundColor: '#F59E0B',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  yellowTitleIcon: {
    fontSize: 56,
    marginBottom: 8,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: 'Noto Sans SC',
  },
  yellowTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Noto Sans SC',
    marginBottom: 4,
  },
  yellowDesc: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: 'Noto Sans SC',
    textAlign: 'center',
  },

  // 红色区域样式
  redPage: {
    backgroundColor: '#FEF2F2',
    padding: 24,
    borderRadius: 16,
  },
  redHeaderBox: {
    backgroundColor: '#EF4444',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  redTitleIcon: {
    fontSize: 56,
    marginBottom: 8,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: 'Noto Sans SC',
  },
  redTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Noto Sans SC',
    marginBottom: 4,
  },
  redDesc: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: 'Noto Sans SC',
    textAlign: 'center',
  },

  // 原理说明卡片
  rationaleCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 6,
    borderLeftColor: '#60A5FA',
  },
  rationaleIcon: {
    fontSize: 24,
    marginBottom: 8,
    color: '#60A5FA',
    fontWeight: 'bold',
    fontFamily: 'Noto Sans SC',
  },
  rationaleText: {
    fontSize: 20,
    color: '#374151',
    fontFamily: 'Noto Sans SC',
    lineHeight: 1.8,
  },

  // 分类标题
  categoryHeader: {
    backgroundColor: '#E5E7EB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Noto Sans SC',
  },

  // 食物卡片
  foodCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  foodName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Noto Sans SC',
    marginBottom: 10,
  },
  foodDetail: {
    fontSize: 22,
    color: '#4B5563',
    fontFamily: 'Noto Sans SC',
    marginBottom: 10,
    lineHeight: 1.6,
  },
  foodTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  nutrientTag: {
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  nutrientText: {
    fontSize: 20,
    fontFamily: 'Noto Sans SC',
  },
  limitTag: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  limitText: {
    fontSize: 20,
    fontFamily: 'Noto Sans SC',
  },

  // 原因说明
  reasonBox: {
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  reasonLabel: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E40AF',
    fontFamily: 'Noto Sans SC',
    marginBottom: 6,
  },
  reasonText: {
    fontSize: 21,
    color: '#374151',
    fontFamily: 'Noto Sans SC',
    lineHeight: 1.6,
  },

  // 替代食物
  alternativesBox: {
    backgroundColor: '#ECFDF5',
    padding: 14,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#6EE7B7',
  },
  alternativesLabel: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#047857',
    fontFamily: 'Noto Sans SC',
    marginBottom: 6,
  },
  alternativesText: {
    fontSize: 21,
    color: '#065F46',
    fontFamily: 'Noto Sans SC',
    lineHeight: 1.6,
  },

  // 页码
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    right: 24,
    fontSize: 16,
    color: '#9CA3AF',
    fontFamily: 'Noto Sans SC',
  },
});

interface PDFFoodGuideMobileProps {
  data: TrafficLightData;
  clientName?: string;
  generatedDate?: string;
}

// 渲染单个食物项
function renderFoodItem(item: any, variant: 'green' | 'yellow' | 'red') {
  // 根据类型确定标签文字
  const getReasonLabel = () => {
    switch (variant) {
      case 'green': return '推荐原因';
      case 'yellow': return '适量原因';
      case 'red': return '避免原因';
    }
  };

  const getAlternativesLabel = () => {
    switch (variant) {
      case 'green': return '推荐替代';
      case 'yellow': return '推荐替代';
      case 'red': return '推荐替代';
    }
  };

  return (
    <View style={styles.foodCard} key={item.name} wrap={false}>
      <Text style={styles.foodName}>{wrapChineseText(item.name)}</Text>

      {item.detail && (
        <Text style={styles.foodDetail}>{wrapChineseText(item.detail)}</Text>
      )}

      {item.nutrients && item.nutrients.length > 0 && (
        <View style={styles.foodTags}>
          {item.nutrients.map((nutrient: string, idx: number) => (
            <View style={styles.nutrientTag} key={idx}>
              <Text style={styles.nutrientText}>
                {wrapChineseText('营养素: ' + nutrient)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {item.limit && (
        <View style={styles.foodTags}>
          <View style={styles.limitTag}>
            <Text style={styles.limitText}>
              {wrapChineseText('限制: ' + item.limit)}
            </Text>
          </View>
        </View>
      )}

      {item.reason && (
        <View style={styles.reasonBox}>
          <Text style={styles.reasonLabel}>
            {wrapChineseText(getReasonLabel())}
          </Text>
          <Text style={styles.reasonText}>{wrapChineseText(item.reason)}</Text>
        </View>
      )}

      {item.alternatives && item.alternatives.length > 0 && (
        <View style={styles.alternativesBox}>
          <Text style={styles.alternativesLabel}>
            {wrapChineseText(getAlternativesLabel())}
          </Text>
          <Text style={styles.alternativesText}>
            {wrapChineseText(item.alternatives.join(' · '))}
          </Text>
        </View>
      )}
    </View>
  );
}

// 渲染完整区域（单独一页）
function renderZonePage(
  title: string,
  description: string,
  rationale: string | undefined,
  items: any[],
  variant: 'green' | 'yellow' | 'red',
  pageNum: string
) {
  // 按分类分组
  const grouped = items.reduce((acc, item) => {
    const cat = item.category || '其他';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const pageStyle = variant === 'green' ? styles.greenPage :
                    variant === 'yellow' ? styles.yellowPage : styles.redPage;

  const headerBox = variant === 'green' ? styles.greenHeaderBox :
                     variant === 'yellow' ? styles.yellowHeaderBox : styles.redHeaderBox;

  const titleIcon = variant === 'green' ? '推荐' : variant === 'yellow' ? '适量' : '避免';
  const titleIconStyle = variant === 'green' ? styles.greenTitleIcon :
                          variant === 'yellow' ? styles.yellowTitleIcon : styles.redTitleIcon;

  const titleStyle = variant === 'green' ? styles.greenTitle :
                      variant === 'yellow' ? styles.yellowTitle : styles.redTitle;

  const descStyle = variant === 'green' ? styles.greenDesc :
                     variant === 'yellow' ? styles.yellowDesc : styles.redDesc;

  return (
    <Page size="A4" style={[styles.page, pageStyle]}>
      {/* 区域头部 */}
      <View style={headerBox}>
        <Text style={titleIconStyle}>{titleIcon}</Text>
        <Text style={titleStyle}>{wrapChineseText(title.split(' ').slice(1).join(' '))}</Text>
        <Text style={descStyle}>{wrapChineseText(description)}</Text>
      </View>

      {/* 原理说明 */}
      {rationale && (
        <View style={styles.rationaleCard} wrap={false}>
          <Text style={styles.rationaleIcon}>说明</Text>
          <Text style={styles.rationaleText}>{wrapChineseText(rationale)}</Text>
        </View>
      )}

      {/* 分类食物列表 */}
      {Object.keys(grouped).map((category, catIdx) => {
        const categoryItems = grouped[category];
        const isNotFirstCategory = catIdx > 0;

        return (
          <View key={category}>
            {category !== '其他' && (
              <View
                style={styles.categoryHeader}
                minPresenceAhead={isNotFirstCategory ? 600 : 0}
              >
                <Text style={styles.categoryTitle}>
                  {wrapChineseText(category)}
                </Text>
              </View>
            )}
            {categoryItems.map((item: any) => renderFoodItem(item, variant))}
          </View>
        );
      })}

      {/* 页码 */}
      <Text style={styles.pageNumber} render={({ pageNumber }) => `${pageNum}-${pageNumber}`} fixed />
    </Page>
  );
}

export function PDFFoodGuideMobile({ data, clientName, generatedDate }: PDFFoodGuideMobileProps) {
  return (
    <Document>
      {/* 封面页 */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.titleIcon}>膳食指南</Text>
          <Text style={styles.title}>{wrapChineseText('红绿灯食物指南')}</Text>
          <Text style={styles.subtitle}>{wrapChineseText('基于211饮食原则的个性化营养方案')}</Text>
          {clientName && (
            <Text style={styles.clientInfo}>{wrapChineseText(`客户：${clientName} · 生成日期：${generatedDate}`)}</Text>
          )}
        </View>

        {/* 说明卡片 */}
        <View style={styles.rationaleCard} wrap={false}>
          <Text style={styles.rationaleIcon}>指南</Text>
          <Text style={styles.rationaleText}>
            {wrapChineseText('本指南根据您的健康指标定制，采用红绿灯分类帮助您快速选择食物：')}
            {'\n\n'}
            <Text style={{ fontWeight: 'bold', color: '#10B981' }}>{wrapChineseText('[绿灯] 推荐食用')}</Text>
            {': '}{wrapChineseText('富含改善您指标所需营养素，建议作为每餐主要选择')}
            {'\n\n'}
            <Text style={{ fontWeight: 'bold', color: '#F59E0B' }}>{wrapChineseText('[黄灯] 适量食用')}</Text>
            {': '}{wrapChineseText('可适量食用，需控制份量和频率')}
            {'\n\n'}
            <Text style={{ fontWeight: 'bold', color: '#EF4444' }}>{wrapChineseText('[红灯] 严格避免')}</Text>
            {': '}{wrapChineseText('会恶化您的指标，应严格避免')}
          </Text>
        </View>

        {/* 211原则 */}
        <View style={[styles.rationaleCard, { borderLeftColor: '#10B981' }]} wrap={false}>
          <Text style={styles.rationaleIcon}>原则</Text>
          <Text style={styles.rationaleText}>
            <Text style={{ fontWeight: 'bold' }}>{wrapChineseText('211 饮食原则')}</Text>
            {'\n'}{wrapChineseText('每餐按 2:1:1 比例分配：')}
            {'\n'}{wrapChineseText('• 2份蔬菜（50%）- 占据餐盘一半')}
            {'\n'}{wrapChineseText('• 1份优质蛋白质（25%）- 鱼肉蛋奶豆')}
            {'\n'}{wrapChineseText('• 1份全谷物主食（25%）- 糙米燕麦玉米')}
          </Text>
        </View>

        <Text style={styles.pageNumber} render={({ pageNumber }) => `封面-${pageNumber}`} fixed />
      </Page>

      {/* 绿灯食物页 */}
      {renderZonePage(
        data.green.title,
        data.green.description,
        data.green.rationale,
        data.green.items,
        'green',
        '绿灯'
      )}

      {/* 黄灯食物页 */}
      {renderZonePage(
        data.yellow.title,
        data.yellow.description,
        data.yellow.rationale,
        data.yellow.items,
        'yellow',
        '黄灯'
      )}

      {/* 红灯食物页 */}
      {renderZonePage(
        data.red.title,
        data.red.description,
        data.red.rationale,
        data.red.items,
        'red',
        '红灯'
      )}
    </Document>
  );
}

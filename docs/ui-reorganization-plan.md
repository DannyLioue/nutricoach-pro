# NutriCoach Pro UI/UX 重构实施计划

## 方案 A: 以客户为中心的整合方案

---

## 📋 需求重述

重新组织 NutriCoach Pro 应用的 UI/UX，使其对营养师更加直观：
- 减少入口混乱，统一客户相关功能
- 创建清晰的工作流：档案 → 上传 → 分析 → 干预
- 合并相关功能（饮食照片 + 食谱组）
- 简化导航，突出客户为中心的设计

---

## 🎯 实施阶段

### Phase 1: 简化顶部导航

**目标：** 删除重复的页面入口，将功能集中在客户详情页

#### 修改文件

1. **`components/layout/DashboardNav.tsx`**
   - 删除 `/analysis` 和 `/recommendations` 导航项
   - 保留：Dashboard, Clients, Settings

2. **`app/(dashboard)/analysis/page.tsx`**
   - 添加重定向到 `/clients`
   - 或显示"请从客户详情页访问体检报告"提示

3. **`app/(dashboard)/recommendations/page.tsx`**
   - 添加重定向到 `/clients`
   - 或显示"请从客户详情页访问营养建议"提示

#### 测试清单
- [ ] 导航只有 3 个项目
- [ ] 点击旧链接自动重定向
- [ ] 浏览器后退按钮正常工作

---

### Phase 2: 重构客户详情页标签结构

**目标：** 从 5 个标签重组为 4 个更清晰的标签

#### 标签变更

| 旧标签名 | 新标签名 | 说明 |
|---------|---------|------|
| 基本信息 | 档案 | 更简洁 |
| 饮食照片 | ❌ 删除 | 合并到饮食记录 |
| 食谱组 | ❌ 删除 | 合并到饮食记录 |
| 体检报告 | 体检报告 | 保持，增强功能 |
| 营养建议 | 干预方案 | 更专业的术语 |

新增：
- **饮食记录** - 包含单张照片和食谱组的子标签

#### 修改文件

1. **`app/(dashboard)/clients/[id]/page.tsx`**
   ```typescript
   // 更新 TabType
   type TabType = 'profile' | 'diet-records' | 'health-reports' | 'interventions';

   // 更新标签配置
   const tabs = [
     { id: 'profile' as TabType, label: '档案', icon: FileText },
     { id: 'diet-records' as TabType, label: '饮食记录', icon: Camera },
     { id: 'health-reports' as TabType, label: '体检报告', icon: Heart },
     { id: 'interventions' as TabType, label: '干预方案', icon: BookOpen },
   ];
   ```

2. **类型定义**
   - `types/index.ts` - 更新相关类型（如果有）

#### 测试清单
- [ ] 4 个标签正确显示
- [ ] 标签切换正常
- [ ] URL hash 更新（如果使用）
- [ ] 标签状态保持（刷新后记住当前标签）

---

### Phase 3: 创建统一的饮食记录标签页

**目标：** 合并饮食照片和食谱组为一个标签，带子标签切换

#### 创建新组件

**`components/DietRecordsTab.tsx`**

```typescript
interface DietRecordsTabProps {
  clientId: string;
  activeSubTab: 'photos' | 'meal-groups';
  onSubTabChange: (tab: 'photos' | 'meal-groups') => void;
}

功能：
1. 子标签切换器
   - 单张照片 | 食谱组
2. 统一的"上传"按钮
   - 点击后弹出模态框选择类型
3. 条件渲染当前子标签内容
```

#### 上传模态框

**`components/DietRecordUploadModal.tsx`**

```typescript
功能：
1. 选择上传类型
   - [ ] 单张照片（1-9张）
   - [ ] 食谱组（给这个组起个名字）
2. 根据选择显示对应的上传组件
3. 上传成功后刷新对应标签的数据
```

#### 修改文件

1. **`app/(dashboard)/clients/[id]/page.tsx`**
   - 添加 `dietRecordsSubTab` 状态
   - 条件渲染 DietRecordsTab 组件

2. **保留现有组件**
   - `DietPhotoCard.tsx` - 单张照片卡片
   - `DietPhotoUpload.tsx` - 单张上传
   - `MealGroupCard.tsx` - 食谱组卡片
   - `MealGroupUpload.tsx` - 食谱组上传

#### 测试清单
- [ ] 子标签切换正常
- [ ] 上传模态框正确显示
- [ ] 选择类型后显示正确的上传组件
- [ ] 上传成功后数据显示在正确位置
- [ ] 单张照片和食谱组数据正确过滤

---

### Phase 4: 重新设计工作台（Dashboard）

**目标：** 从快速操作页面改为工作概览 + 待办事项

#### 新增组件

**1. `components/TodoList.tsx`**

```typescript
功能：
1. 显示待办事项
   - 待分析的体检报告
   - 待生成干预方案的客户
   - 最近需要关注的饮食记录
2. 点击跳转到对应客户详情页
```

**2. `components/WeeklyStats.tsx`**

```typescript
功能：
1. 本周新增饮食记录数量
2. 本周完成分析数量
3. 简单的图表展示
```

#### 修改文件

**`app/(dashboard)/dashboard/page.tsx`**

```typescript
新布局：
1. 统计卡片（3个）- 保持不变
2. 待办事项组件 ← 新增
3. 数据概览组件 ← 新增
4. 快速操作 - 只保留"添加客户"
```

#### 测试清单
- [ ] 待办事项正确显示
- [ ] 点击待办跳转到正确客户
- [ ] 数据概览正确统计
- [ ] 快速操作只有一个"添加客户"

---

### Phase 5: 集成操作按钮到各标签页

**目标：** 在每个标签页直接提供主要操作，无需跳转

#### 5.1 体检报告标签

**修改：** `app/(dashboard)/clients/[id]/page.tsx` 的 health-reports 部分

```typescript
添加：
- [上传报告] 按钮
  - 点击打开模态框或跳转到 `/analysis/new?clientId={id}`
- 分析状态指示器
  - 已分析 / 待分析
- 最新健康指标摘要卡片
  - BMI、健康评分、主要异常指标
```

#### 5.2 干预方案标签

**修改：** `app/(dashboard)/clients/[id]/page.tsx` 的 interventions 部分

```typescript
添加：
- [生成方案] 按钮
  - 检查是否有体检报告
  - 如果没有，提示"请先上传体检报告"
  - 如果有，跳转到 `/recommendations/new?clientId={id}&reportId={latestReportId}`
- 方案状态卡片
  - 当前使用的方案版本
  - 最后更新时间
```

#### 测试清单
- [ ] 上传报告按钮工作正常
- [ ] 生成方案按钮有正确的条件检查
- [ ] 状态指示器准确反映数据状态

---

## 📁 文件修改清单

### 需要修改的文件

```
components/
├── layout/
│   └── DashboardNav.tsx                      ← Phase 1
├── DietRecordsTab.tsx                        ← Phase 3 (新建)
├── DietRecordUploadModal.tsx                  ← Phase 3 (新建)
├── TodoList.tsx                               ← Phase 4 (新建)
└── WeeklyStats.tsx                            ← Phase 4 (新建)

app/(dashboard)/
├── layout.tsx                                 ← 检查导航组件
├── dashboard/
│   └── page.tsx                               ← Phase 4
├── analysis/
│   └── page.tsx                               ← Phase 1 (重定向)
├── recommendations/
│   └── page.tsx                               ← Phase 1 (重定向)
└── clients/
    └── [id]/
        └── page.tsx                           ← Phase 2, 5.1, 5.2

types/
└── index.ts                                   ← 检查类型定义
```

---

## ⚠️ 风险评估

| 风险 | 级别 | 缓解措施 |
|------|------|----------|
| 用户习惯改变 | 中 | 清晰的 UI 标签，添加过渡提示 |
| 现有链接失效 | 低 | 添加 301 重定向 |
| 数据过滤逻辑错误 | 中 | TDD 测试覆盖 |
| 移动端布局 | 中 | Tailwind 响应式类 |
| 状态管理复杂化 | 低 | 使用 React 本地状态 |

---

## 🧪 TDD 测试策略

### Phase 1 测试
```typescript
// tests/components/DashboardNav.test.tsx
- 导航只有 3 个链接
- 点击 Analysis 链接触发重定向
- 点击 Recommendations 链接触发重定向
```

### Phase 2 测试
```typescript
// tests/components/ClientDetailTabs.test.tsx
- 标签数量为 4
- 标签名称正确
- 标签切换更新状态
```

### Phase 3 测试
```typescript
// tests/components/DietRecordsTab.test.tsx
- 默认显示第一个子标签
- 子标签切换更新视图
- 上传按钮打开模态框
- 模态框选择类型正确

// tests/unit/photo-filter.test.ts
- 已有 ✓ - 验证数据过滤逻辑
```

### Phase 4 测试
```typescript
// tests/components/TodoList.test.tsx
- 显示待办事项列表
- 点击跳转到正确客户页面
- 数据加载和错误处理
```

### Phase 5 测试
```typescript
// tests/integration/tab-actions.test.tsx
- 上传报告按钮存在且可点击
- 生成方案按钮有条件检查
- 状态指示器正确显示
```

---

## 📊 复杂度估算

| Phase | 描述 | 复杂度 | 时间 |
|-------|------|--------|------|
| 1 | 简化导航 | 低 | 1h |
| 2 | 重构标签 | 中 | 2-3h |
| 3 | 饮食记录标签 | 中-高 | 3-4h |
| 4 | 工作台重设计 | 中 | 2-3h |
| 5 | 集成操作按钮 | 低-中 | 1-2h |
| **总计** | | **中** | **9-13h** |

---

## 🚀 实施顺序

### 推荐顺序
1. **Phase 1** → 简化导航（独立，无依赖）
2. **Phase 2** → 重构标签（为后续做准备）
3. **Phase 3** → 饮食记录标签（核心功能）
4. **Phase 4** → 工作台重设计（独立）
5. **Phase 5** → 集成操作（锦上添花）

### 可并行
- Phase 1 和 4 可以并行（独立模块）
- Phase 5 可以在 Phase 2-4 的任何时候进行

---

## ✅ 完成标准

### 功能完整性
- [ ] 顶部导航只有 3 个项目
- [ ] 客户详情页有 4 个标签
- [ ] 饮食记录有子标签切换
- [ ] 工作台显示待办事项
- [ ] 各标签页有操作按钮

### 测试覆盖
- [ ] 所有新组件有单元测试
- [ ] 关键流程有集成测试
- [ ] 测试覆盖率达到 80%+

### 用户体验
- [ ] 导航直观清晰
- [ ] 工作流顺畅：档案 → 报告 → 饮食 → 干预
- [ ] 无死链接或重定向循环
- [ ] 移动端可正常使用

---

## 🎨 UI/UX 原则

### 清晰的信息层次
```
1. 客户名称（最突出）
2. 当前标签内容
3. 操作按钮（主要操作）
4. 历史记录（次要，可折叠）
```

### 一致性
- 相同功能使用相同的图标和颜色
- 操作按钮位置一致
- 标签顺序符合工作流

### 反馈及时
- 上传后立即显示进度
- 操作成功/失败有明确提示
- 加载状态有指示器

---

**等待确认：** 是否按此计划开始实施？
回答 "yes" 或 "proceed" 开始 TDD 开发。

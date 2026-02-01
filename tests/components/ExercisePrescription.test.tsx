/**
 * ExercisePrescription 组件测试
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExercisePrescription from '@/components/ExercisePrescription';
import type { DetailedExercisePrescription } from '@/types';

// Mock data
const mockPrescription: DetailedExercisePrescription = {
  overview: '两周训练计划重点建立正确的动作模式，为后续增肌打基础。通过循序渐进的训练，逐步提高心肺功能和肌肉力量。',
  goals: [
    '建立正确的动作模式，为后期增肌打基础',
    '逐步提高心肺功能，从30分钟渐进到45分钟',
    '掌握基础训练动作，养成运动习惯',
  ],
  equipment: {
    owned: ['哑铃5kgx2', '弹力带', '瑜伽垫'],
    recommended: [
      {
        item: '哑铃10kg',
        reason: '第2周上肢力量训练需要更大重量',
        priority: 'essential',
        alternatives: ['使用5kg哑铃增加次数', '使用弹力带提供阻力'],
      },
    ],
  },
  weeklySchedule: [
    {
      week: 1,
      focus: '适应期-学习动作模式，建立神经肌肉连接',
      notes: '感觉疲劳可休息，不要勉强',
      days: [
        {
          day: '周一',
          type: '力量训练-上肢',
          duration: '45分钟',
          focus: '推类动作（胸、肩、三头）',
          exercises: [
            {
              name: '标准俯卧撑',
              sets: 3,
              reps: '8-10',
              rest: '60秒',
              intensity: '控制离心阶段（3秒下，1秒停，1秒起）',
              notes: '如做不到标准动作，可做跪姿俯卧撑',
              targetMuscle: '胸大肌、三角肌前束、肱三头肌',
            },
            {
              name: '哑铃俯身划船',
              sets: 3,
              reps: '10-12',
              rest: '60秒',
              intensity: '使用5kg哑铃，感受背部肌肉收缩',
              notes: '保持背部挺直，不要借力',
              targetMuscle: '背阔肌、菱形肌、肱二头肌',
            },
          ],
        },
        {
          day: '周二',
          type: '有氧训练',
          duration: '30分钟',
          focus: '低强度有氧，建立有氧基础',
          exercises: [
            {
              name: '快走/慢跑',
              sets: 1,
              reps: '30分钟',
              rest: '0',
              intensity: '心率区间：110-130 bpm（RPE 11-12）',
              notes: '保持呼吸顺畅，可以交谈的强度',
              targetMuscle: '全身',
            },
          ],
        },
        {
          day: '周三',
          type: '休息日',
          duration: '0分钟',
          focus: '主动恢复',
          exercises: [],
        },
        {
          day: '周四',
          type: '力量训练-下肢',
          duration: '45分钟',
          focus: '下肢基础力量',
          exercises: [
            {
              name: '自重深蹲',
              sets: 3,
              reps: '12-15',
              rest: '60秒',
              intensity: '控制下蹲速度，感受臀部发力',
              notes: '膝盖不要内扣，重心在后脚跟',
              targetMuscle: '股四头肌、臀大肌',
            },
          ],
        },
        {
          day: '周五',
          type: '有氧训练',
          duration: '30分钟',
          focus: '低强度有氧',
          exercises: [
            {
              name: '快走/慢跑',
              sets: 1,
              reps: '30分钟',
              rest: '0',
              intensity: '心率区间：110-130 bpm',
              notes: '可更换为骑行、跳绳等其他有氧',
              targetMuscle: '全身',
            },
          ],
        },
        {
          day: '周六',
          type: '力量训练-全身',
          duration: '40分钟',
          focus: '综合训练，强化动作模式',
          exercises: [
            {
              name: '深蹲+推举组合',
              sets: 3,
              reps: '8-10',
              rest: '60秒',
              intensity: '使用5kg哑铃',
              notes: '深蹲站起时顺势推举',
              targetMuscle: '全身',
            },
          ],
        },
        {
          day: '周日',
          type: '休息日',
          duration: '0分钟',
          focus: '完全休息',
          exercises: [],
        },
      ],
    },
    // 第2周简化数据
    {
      week: 2,
      focus: '渐进期-增加训练量',
      days: [],
    },
  ],
  progression: '两周内训练量逐步增加，第2周适度提升强度。下一阶段将增加哑铃重量至10kg，引入更多复合动作。',
  precautions: [
    '训练前充分热身10分钟，包括关节活动和动态拉伸',
    '训练后拉伸10分钟，重点拉伸训练过的肌群',
    '如出现关节疼痛，立即停止该动作',
    '保证充足睡眠和营养，特别是蛋白质摄入',
  ],
  successCriteria: [
    '能完成标准俯卧撑15个',
    '连续有氧45分钟不疲劳',
    '体重下降2-3kg',
  ],
};

describe('ExercisePrescription Component', () => {
  it('should render overview and goals', () => {
    render(<ExercisePrescription data={mockPrescription} />);

    expect(screen.getByText('整体运动策略')).toBeInTheDocument();
    expect(screen.getByText(mockPrescription.overview)).toBeInTheDocument();

    // Goals
    mockPrescription.goals.forEach((goal) => {
      expect(screen.getByText(goal)).toBeInTheDocument();
    });
  });

  it('should render equipment section', () => {
    render(<ExercisePrescription data={mockPrescription} />);

    expect(screen.getByText('运动器材')).toBeInTheDocument();
    expect(screen.getByText('已有器材')).toBeInTheDocument();
    expect(screen.getByText('推荐器材')).toBeInTheDocument();

    // Owned equipment
    mockPrescription.equipment.owned.forEach((item) => {
      expect(screen.getByText(item)).toBeInTheDocument();
    });

    // Recommended equipment
    expect(screen.getByText('哑铃10kg')).toBeInTheDocument();
    expect(screen.getByText(/第3周上肢力量训练需要更大重量/)).toBeInTheDocument();
  });

  it('should render weekly schedule tabs', () => {
    render(<ExercisePrescription data={mockPrescription} />);

    expect(screen.getByText('第1周')).toBeInTheDocument();
    expect(screen.getByText('第2周')).toBeInTheDocument();
    expect(screen.queryByText('第3周')).not.toBeInTheDocument();
    expect(screen.queryByText('第4周')).not.toBeInTheDocument();
  });

  it('should switch between weeks', async () => {
    render(<ExercisePrescription data={mockPrescription} />);

    // Default: Week 1
    expect(screen.getByText('适应期-学习动作模式，建立神经肌肉连接')).toBeInTheDocument();

    // Click Week 2
    fireEvent.click(screen.getByText('第2周'));
    await waitFor(() => {
      expect(screen.getByText('渐进期-增加训练量')).toBeInTheDocument();
    });

  });

  it('should render training days for selected week', () => {
    render(<ExercisePrescription data={mockPrescription} />);

    // Week 1 should be selected by default
    expect(screen.getByText('周一')).toBeInTheDocument();
    expect(screen.getByText('周二')).toBeInTheDocument();
    expect(screen.getByText('周三')).toBeInTheDocument();
    expect(screen.getByText('周四')).toBeInTheDocument();
    expect(screen.getByText('周五')).toBeInTheDocument();
    expect(screen.getByText('周六')).toBeInTheDocument();
    expect(screen.getByText('周日')).toBeInTheDocument();
  });

  it('should expand training day to show exercises', async () => {
    render(<ExercisePrescription data={mockPrescription} />);

    // Click on Monday to expand
    const mondayButton = screen.getByText('周一');
    fireEvent.click(mondayButton);

    await waitFor(() => {
      expect(screen.getByText('标准俯卧撑')).toBeInTheDocument();
      expect(screen.getByText('哑铃俯身划船')).toBeInTheDocument();
    });

    // Check exercise details
    expect(screen.getByText(/3.*组/)).toBeInTheDocument();
    expect(screen.getByText(/8-10.*次/)).toBeInTheDocument();
    expect(screen.getByText(/60.*秒.*休息/)).toBeInTheDocument();
  });

  it('should render exercise details correctly', async () => {
    render(<ExercisePrescription data={mockPrescription} />);

    // Expand Monday
    fireEvent.click(screen.getByText('周一'));

    await waitFor(() => {
      // First exercise
      expect(screen.getByText('标准俯卧撑')).toBeInTheDocument();
      expect(screen.getByText('控制离心阶段（3秒下，1秒停，1秒起）')).toBeInTheDocument();
      expect(screen.getByText('胸大肌、三角肌前束、肱三头肌')).toBeInTheDocument();
      expect(screen.getByText(/如做不到标准动作，可做跪姿俯卧撑/)).toBeInTheDocument();
    });
  });

  it('should render rest day correctly', () => {
    render(<ExercisePrescription data={mockPrescription} />);

    // Wednesday is a rest day
    expect(screen.getByText('休息日')).toBeInTheDocument();
  });

  it('should render progression section', () => {
    render(<ExercisePrescription data={mockPrescription} />);

    expect(screen.getByText('两周进阶')).toBeInTheDocument();
    expect(screen.getByText(mockPrescription.progression)).toBeInTheDocument();
  });

  it('should render precautions section', () => {
    render(<ExercisePrescription data={mockPrescription} />);

    expect(screen.getByText('注意事项')).toBeInTheDocument();

    mockPrescription.precautions.forEach((precaution) => {
      expect(screen.getByText(precaution)).toBeInTheDocument();
    });
  });

  it('should render success criteria section', () => {
    render(<ExercisePrescription data={mockPrescription} />);

    expect(screen.getByText('成功标准')).toBeInTheDocument();

    mockPrescription.successCriteria.forEach((criteria) => {
      expect(screen.getByText(criteria)).toBeInTheDocument();
    });
  });

  it('should handle empty weekly schedule gracefully', () => {
    const emptyPrescription: DetailedExercisePrescription = {
      ...mockPrescription,
      weeklySchedule: [],
    };

    render(<ExercisePrescription data={emptyPrescription} />);

    expect(screen.getByText('暂无训练计划')).toBeInTheDocument();
  });

  it('should handle empty equipment lists gracefully', () => {
    const noEquipmentPrescription: DetailedExercisePrescription = {
      ...mockPrescription,
      equipment: {
        owned: [],
        recommended: [],
      },
    };

    render(<ExercisePrescription data={noEquipmentPrescription} />);

    expect(screen.getByText(/暂无器材信息/)).toBeInTheDocument();
  });

  it('should display equipment priority badges', () => {
    render(<ExercisePrescription data={mockPrescription} />);

    // Essential priority
    const essentialBadge = screen.getByText('必需');
    expect(essentialBadge).toBeInTheDocument();
  });

  it('should show exercise target muscle when available', async () => {
    render(<ExercisePrescription data={mockPrescription} />);

    fireEvent.click(screen.getByText('周一'));

    await waitFor(() => {
      expect(screen.getByText('目标肌群')).toBeInTheDocument();
      expect(screen.getByText('胸大肌、三角肌前束、肱三头肌')).toBeInTheDocument();
    });
  });

  it('should collapse day when clicked again', async () => {
    render(<ExercisePrescription data={mockPrescription} />);

    const mondayButton = screen.getByText('周一');

    // Expand
    fireEvent.click(mondayButton);
    await waitFor(() => {
      expect(screen.getByText('标准俯卧撑')).toBeInTheDocument();
    });

    // Collapse
    fireEvent.click(mondayButton);
    await waitFor(() => {
      expect(screen.queryByText('标准俯卧撑')).not.toBeInTheDocument();
    });
  });
});

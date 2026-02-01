/**
 * 详细运动处方类型验证测试
 * 测试 TypeScript 类型和运行时验证
 */

import { describe, it, expect } from 'vitest';
import type {
  ExerciseEquipment,
  ExerciseSet,
  TrainingDay,
  WeeklySchedule,
  DetailedExercisePrescription,
} from '@/types';

describe('ExercisePrescription Types', () => {
  describe('ExerciseEquipment', () => {
    it('should accept valid equipment structure', () => {
      const equipment: ExerciseEquipment = {
        owned: ['哑铃5kgx2', '弹力带', '瑜伽垫'],
        recommended: [
          {
            item: '哑铃10kg',
            reason: '第2周上肢力量训练需要更大重量',
            priority: 'essential',
            alternatives: ['使用5kg哑铃增加次数', '使用弹力带'],
          },
        ],
      };

      expect(equipment.owned).toHaveLength(3);
      expect(equipment.recommended).toHaveLength(1);
      expect(equipment.recommended[0].priority).toBe('essential');
    });

    it('should accept minimal equipment structure', () => {
      const equipment: ExerciseEquipment = {
        owned: [],
        recommended: [],
      };

      expect(equipment.owned).toEqual([]);
      expect(equipment.recommended).toEqual([]);
    });

    it('should allow optional priority and alternatives', () => {
      const equipment: ExerciseEquipment = {
        owned: ['瑜伽垫'],
        recommended: [
          {
            item: '哑铃套装',
            reason: '力量训练需要',
          },
        ],
      };

      expect(equipment.recommended[0].priority).toBeUndefined();
      expect(equipment.recommended[0].alternatives).toBeUndefined();
    });
  });

  describe('ExerciseSet', () => {
    it('should accept complete exercise structure', () => {
      const exercise: ExerciseSet = {
        name: '标准俯卧撑',
        sets: 3,
        reps: '8-10',
        rest: '60秒',
        intensity: '控制离心阶段（3秒下）',
        notes: '如做不到标准动作，可做跪姿俯卧撑',
        targetMuscle: '胸大肌、三角肌前束、肱三头肌',
      };

      expect(exercise.sets).toBe(3);
      expect(exercise.reps).toBe('8-10');
      expect(exercise.targetMuscle).toBeTruthy();
    });

    it('should accept minimal exercise structure', () => {
      const exercise: ExerciseSet = {
        name: '平板支撑',
        sets: 3,
        reps: '30秒',
        rest: '45秒',
        intensity: '保持标准姿势',
      };

      expect(exercise.notes).toBeUndefined();
      expect(exercise.targetMuscle).toBeUndefined();
    });
  });

  describe('TrainingDay', () => {
    it('should accept complete training day structure', () => {
      const day: TrainingDay = {
        day: '周一',
        type: '力量训练-上肢',
        duration: '45分钟',
        focus: '推类动作（胸、肩、三头）',
        exercises: [
          {
            name: '俯卧撑',
            sets: 3,
            reps: '8-10',
            rest: '60秒',
            intensity: '标准速度',
          },
        ],
        totalVolume: '12组',
      };

      expect(day.day).toBe('周一');
      expect(day.exercises).toHaveLength(1);
      expect(day.totalVolume).toBeTruthy();
    });

    it('should accept training day without optional fields', () => {
      const day: TrainingDay = {
        day: '周三',
        type: '休息日',
        duration: '0分钟',
        focus: '主动恢复',
        exercises: [],
      };

      expect(day.totalVolume).toBeUndefined();
    });
  });

  describe('WeeklySchedule', () => {
    it('should accept complete week structure', () => {
      const week: WeeklySchedule = {
        week: 1,
        focus: '适应期-学习动作模式',
        notes: '感觉疲劳可休息，不要勉强',
        days: [
          {
            day: '周一',
            type: '力量训练',
            duration: '45分钟',
            exercises: [],
          },
        ],
      };

      expect(week.week).toBe(1);
      expect(week.days).toHaveLength(1);
      expect(week.notes).toBeTruthy();
    });

    it('should accept week without notes', () => {
      const week: WeeklySchedule = {
        week: 2,
        focus: '渐进期-增加训练量',
        days: [],
      };

      expect(week.notes).toBeUndefined();
    });
  });

  describe('DetailedExercisePrescription', () => {
    it('should accept complete structure', () => {
      const prescription: DetailedExercisePrescription = {
        overview: '整体运动策略说明',
        goals: ['建立正确的动作模式', '提高心肺功能'],
        equipment: {
          owned: ['哑铃5kgx2'],
          recommended: [],
        },
        weeklySchedule: [
          {
            week: 1,
            focus: '适应期',
            days: [
              {
                day: '周一',
                type: '力量训练',
                duration: '45分钟',
                exercises: [
                  {
                    name: '俯卧撑',
                    sets: 3,
                    reps: '10',
                    rest: '60秒',
                    intensity: '标准',
                  },
                ],
              },
              {
                day: '周二',
                type: '有氧训练',
                duration: '30分钟',
                exercises: [
                  {
                    name: '快走',
                    sets: 1,
                    reps: '30分钟',
                    rest: '0',
                    intensity: '心率110-130',
                  },
                ],
              },
              {
                day: '周三',
                type: '休息日',
                duration: '0分钟',
                exercises: [],
              },
            ],
          },
        ],
        progression: '两周内训练量逐步增加',
        precautions: ['训练前热身', '训练后拉伸'],
        successCriteria: ['能完成标准俯卧撑15个'],
      };

      expect(prescription.goals).toHaveLength(2);
      expect(prescription.weeklySchedule).toHaveLength(1);
      expect(prescription.weeklySchedule[0].days).toHaveLength(3);
    });

    it('should accept minimal but valid structure', () => {
      const prescription: DetailedExercisePrescription = {
        overview: '策略',
        goals: ['目标1'],
        equipment: {
          owned: [],
          recommended: [],
        },
        weeklySchedule: [],
        progression: '进阶',
        precautions: [],
        successCriteria: [],
      };

      expect(prescription.weeklySchedule).toEqual([]);
    });
  });

  describe('Runtime validation', () => {
    it('should validate exercise set required fields', () => {
      const createExerciseSet = (data: any): ExerciseSet => data;

      // Valid exercise set
      const valid: ExerciseSet = {
        name: '俯卧撑',
        sets: 3,
        reps: '10',
        rest: '60秒',
        intensity: '标准',
      };

      expect(() => createExerciseSet(valid)).not.toThrow();

      // Missing required fields should cause type errors (compile time)
      // @ts-expect-error - Missing required field 'name'
      const invalid: ExerciseSet = {
        sets: 3,
        reps: '10',
        rest: '60秒',
        intensity: '标准',
      };

      expect(invalid.name).toBeUndefined();
    });

    it('should validate training day has exercises array', () => {
      const day: TrainingDay = {
        day: '周一',
        type: '力量训练',
        duration: '45分钟',
        exercises: [],
      };

      expect(Array.isArray(day.exercises)).toBe(true);
    });
  });
});

/**
 * 详细运动处方 API 测试
 * 测试建议生成路由的详细运动处方功能
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/db/prisma';

// 测试数据
let testClient: any = null;
let testRecommendation: any = null;

describe('Detailed Exercise Prescription API', () => {
  beforeAll(async () => {
    // 创建测试客户（包含运动详情）
    const clients = await prisma.client.findMany({
      where: { name: { contains: 'Test' } },
      take: 1,
    });

    if (clients.length > 0) {
      testClient = clients[0];
    } else {
      // 如果没有测试客户，创建一个
      testClient = await prisma.client.create({
        data: {
          userId: 'test-user-id', // 需要确保这个用户存在
          name: 'Test User for Exercise',
          gender: 'MALE',
          birthDate: new Date('1990-01-01'),
          height: 175,
          weight: 70,
          activityLevel: 'MODERATE',
          allergies: '[]',
          medicalHistory: '[]',
          healthConcerns: '[]',
          exerciseDetails: JSON.stringify({
            equipment: '哑铃5kgx2、弹力带、瑜伽垫',
            environment: '居家锻炼，客厅约15平米',
            experience: '健身小白，偶尔做瑜伽',
            goals: '希望在家锻炼为主，减重5kg',
          }),
        },
      });
    }
  });

  afterAll(async () => {
    // 清理测试数据（可选）
    // await prisma.client.delete({ where: { id: testClient.id } });
  });

  describe('POST /api/recommendations/generate', () => {
    it('should generate recommendation with detailed exercise prescription', async () => {
      if (!testClient) {
        console.warn('No test client available, skipping test');
        return;
      }

      const response = await fetch('http://localhost:3000/api/recommendations/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: testClient.id,
          reportId: null,
          type: 'COMPREHENSIVE',
        }),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty('content');

      // 验证详细运动处方结构
      const content = data.content;
      expect(content).toHaveProperty('detailedExercisePrescription');

      const prescription = content.detailedExercisePrescription;

      // 验证必需字段
      expect(prescription).toHaveProperty('overview');
      expect(typeof prescription.overview).toBe('string');

      expect(prescription).toHaveProperty('goals');
      expect(Array.isArray(prescription.goals)).toBe(true);

      expect(prescription).toHaveProperty('equipment');
      expect(prescription.equipment).toHaveProperty('owned');
      expect(Array.isArray(prescription.equipment.owned)).toBe(true);
      expect(prescription.equipment).toHaveProperty('recommended');
      expect(Array.isArray(prescription.equipment.recommended)).toBe(true);

      expect(prescription).toHaveProperty('weeklySchedule');
      expect(Array.isArray(prescription.weeklySchedule)).toBe(true);

      expect(prescription).toHaveProperty('progression');
      expect(typeof prescription.progression).toBe('string');

      expect(prescription).toHaveProperty('precautions');
      expect(Array.isArray(prescription.precautions)).toBe(true);

      expect(prescription).toHaveProperty('successCriteria');
      expect(Array.isArray(prescription.successCriteria)).toBe(true);

      // 保存建议用于后续测试
      testRecommendation = data;
    }, 30000); // 30秒超时（AI生成可能较慢）

    it('should have 2 weeks in weekly schedule', () => {
      if (!testRecommendation) {
        console.warn('No test recommendation available, skipping test');
        return;
      }

      const schedule = testRecommendation.content.detailedExercisePrescription.weeklySchedule;
      expect(schedule).toHaveLength(2);

      // 验证每周的结构
      schedule.forEach((week: any) => {
        expect(week).toHaveProperty('week');
        expect(typeof week.week).toBe('number');
        expect(week.week).toBeGreaterThanOrEqual(1);
        expect(week.week).toBeLessThanOrEqual(2);

        expect(week).toHaveProperty('focus');
        expect(typeof week.focus).toBe('string');

        expect(week).toHaveProperty('days');
        expect(Array.isArray(week.days)).toBe(true);
        expect(week.days).toHaveLength(7); // 每周7天
      });
    });

    it('should have complete exercise data for each training day', () => {
      if (!testRecommendation) {
        console.warn('No test recommendation available, skipping test');
        return;
      }

      const schedule = testRecommendation.content.detailedExercisePrescription.weeklySchedule;

      schedule.forEach((week: any) => {
        week.days.forEach((day: any) => {
          // 验证每天的基本字段
          expect(day).toHaveProperty('day');
          expect(day).toHaveProperty('type');
          expect(day).toHaveProperty('duration');
          expect(day).toHaveProperty('exercises');
          expect(Array.isArray(day.exercises)).toBe(true);

          // 如果有训练动作，验证动作的完整性
          if (day.exercises.length > 0) {
            day.exercises.forEach((exercise: any) => {
              expect(exercise).toHaveProperty('name');
              expect(typeof exercise.name).toBe('string');

              expect(exercise).toHaveProperty('sets');
              expect(typeof exercise.sets).toBe('number');

              expect(exercise).toHaveProperty('reps');
              expect(typeof exercise.reps).toBe('string');

              expect(exercise).toHaveProperty('rest');
              expect(typeof exercise.rest).toBe('string');

              expect(exercise).toHaveProperty('intensity');
              expect(typeof exercise.intensity).toBe('string');
            });
          }
        });
      });
    });

    it('should include equipment based on client exercise details', () => {
      if (!testRecommendation) {
        console.warn('No test recommendation available, skipping test');
        return;
      }

      const equipment = testRecommendation.content.detailedExercisePrescription.equipment;

      // 客户提供了哑铃、弹力带、瑜伽垫
      const ownedEquipment = equipment.owned || [];
      expect(ownedEquipment.length).toBeGreaterThan(0);

      // 应该包含客户提到的器材
      const hasExpectedEquipment = ownedEquipment.some((e: string) =>
        e.includes('哑铃') || e.includes('弹力带') || e.includes('瑜伽垫')
      );
      expect(hasExpectedEquipment).toBe(true);
    });
  });

  describe('GET /api/recommendations/:id', () => {
    it('should retrieve recommendation with detailed exercise prescription', async () => {
      if (!testRecommendation) {
        console.warn('No test recommendation available, skipping test');
        return;
      }

      const response = await fetch(`http://localhost:3000/api/recommendations/${testRecommendation.id}`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty('content');
      expect(data.content).toHaveProperty('detailedExercisePrescription');

      // 验证数据完整性
      const prescription = data.content.detailedExercisePrescription;
      expect(prescription.weeklySchedule).toBeDefined();
      expect(prescription.weeklySchedule.length).toBe(2);
    });
  });
});

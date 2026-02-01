import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Unmock the prisma module for this test to use the real database
vi.unmock('@/lib/db/prisma');
import { prisma } from '@/lib/db/prisma';

// 模拟认证会话
const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  },
};

// 辅助函数：清理测试数据
async function cleanupTestData() {
  await prisma.client.deleteMany({
    where: { userId: mockSession.user.id },
  });
}

// 辅助函数：创建测试用户
async function createTestUser() {
  return await prisma.user.upsert({
    where: { email: mockSession.user.email },
    update: { id: mockSession.user.id },
    create: {
      id: mockSession.user.id,
      email: mockSession.user.email as string,
      name: mockSession.user.name,
      password: 'hashed-password',
    },
  });
}

describe('Client API - exerciseDetails 字段测试', () => {
  beforeEach(async () => {
    await cleanupTestData();
    await createTestUser();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('POST /api/clients - 创建客户', () => {
    it('应该能够创建包含 exerciseDetails 的客户', async () => {
      const clientData = {
        name: '测试客户',
        gender: 'MALE',
        birthDate: '1990-01-01',
        height: '175',
        weight: '70',
        activityLevel: 'MODERATE',
        allergies: '[]',
        medicalHistory: '[]',
        healthConcerns: '[]',
        exerciseDetails: '家中有哑铃5kgx2、弹力带、瑜伽垫',
        phone: '13800138000',
        email: 'client@example.com',
      };

      // 直接使用 Prisma 测试（绕过API认证）
      const client = await prisma.client.create({
        data: {
          userId: mockSession.user.id,
          name: clientData.name,
          gender: clientData.gender,
          birthDate: new Date(clientData.birthDate),
          height: parseFloat(clientData.height),
          weight: parseFloat(clientData.weight),
          activityLevel: clientData.activityLevel,
          allergies: clientData.allergies,
          medicalHistory: clientData.medicalHistory,
          healthConcerns: clientData.healthConcerns,
          exerciseDetails: clientData.exerciseDetails,
          phone: clientData.phone,
          email: clientData.email,
        },
      });

      expect(client).toBeDefined();
      expect(client.id).toBeDefined();
      expect(client.exerciseDetails).toBe(clientData.exerciseDetails);
    });

    it('应该能够创建不包含 exerciseDetails 的客户（可选字段）', async () => {
      const clientData = {
        name: '测试客户2',
        gender: 'FEMALE',
        birthDate: '1995-05-15',
        height: '165',
        weight: '55',
        activityLevel: 'LIGHT',
        allergies: '[]',
        medicalHistory: '[]',
        healthConcerns: '[]',
        phone: '13900139000',
      };

      const client = await prisma.client.create({
        data: {
          userId: mockSession.user.id,
          name: clientData.name,
          gender: clientData.gender,
          birthDate: new Date(clientData.birthDate),
          height: parseFloat(clientData.height),
          weight: parseFloat(clientData.weight),
          activityLevel: clientData.activityLevel,
          allergies: clientData.allergies,
          medicalHistory: clientData.medicalHistory,
          healthConcerns: clientData.healthConcerns,
          phone: clientData.phone,
        },
      });

      expect(client).toBeDefined();
      expect(client.exerciseDetails).toBeNull();
    });

    it('应该正确存储多行的 exerciseDetails 内容', async () => {
      const multiLineExerciseDetails = `器材：哑铃5kgx2、弹力带、瑜伽垫
环境：家中客厅，约20平米空间
经验：之前练习过深蹲、俯卧撑，深蹲最大重量30kg
目标：在家锻炼为主，每周3-4次`;

      const client = await prisma.client.create({
        data: {
          userId: mockSession.user.id,
          name: '测试客户3',
          gender: 'MALE',
          birthDate: new Date('1988-03-20'),
          height: 180,
          weight: 75,
          activityLevel: 'ACTIVE',
          allergies: '[]',
          medicalHistory: '[]',
          healthConcerns: '[]',
          exerciseDetails: multiLineExerciseDetails,
        },
      });

      expect(client.exerciseDetails).toBe(multiLineExerciseDetails);
      expect(client.exerciseDetails).toContain('\n');
    });
  });

  describe('PUT /api/clients/[id] - 更新客户', () => {
    it('应该能够更新 exerciseDetails 字段', async () => {
      // 先创建一个客户
      const client = await prisma.client.create({
        data: {
          userId: mockSession.user.id,
          name: '测试客户4',
          gender: 'FEMALE',
          birthDate: new Date('1992-07-10'),
          height: 168,
          weight: 58,
          activityLevel: 'MODERATE',
          allergies: '[]',
          medicalHistory: '[]',
          healthConcerns: '[]',
        },
      });

      // 更新 exerciseDetails
      const updatedClient = await prisma.client.update({
        where: { id: client.id },
        data: {
          exerciseDetails: '新增：家中有瑜伽垫、弹力带，附近有健身房',
        },
      });

      expect(updatedClient.exerciseDetails).toBe('新增：家中有瑜伽垫、弹力带，附近有健身房');
    });

    it('应该能够将 exerciseDetails 从有值更新为 null', async () => {
      // 先创建一个有 exerciseDetails 的客户
      const client = await prisma.client.create({
        data: {
          userId: mockSession.user.id,
          name: '测试客户5',
          gender: 'MALE',
          birthDate: new Date('1985-11-25'),
          height: 178,
          weight: 72,
          activityLevel: 'ACTIVE',
          allergies: '[]',
          medicalHistory: '[]',
          healthConcerns: '[]',
          exerciseDetails: '之前填写的运动详情',
        },
      });

      expect(client.exerciseDetails).toBe('之前填写的运动详情');

      // 更新为 null
      const updatedClient = await prisma.client.update({
        where: { id: client.id },
        data: {
          exerciseDetails: null,
        },
      });

      expect(updatedClient.exerciseDetails).toBeNull();
    });

    it('应该能够在更新其他字段时保持 exerciseDetails 不变', async () => {
      const originalExerciseDetails = '家中有哑铃、弹力带';

      const client = await prisma.client.create({
        data: {
          userId: mockSession.user.id,
          name: '测试客户6',
          gender: 'FEMALE',
          birthDate: new Date('1990-01-01'),
          height: 165,
          weight: 55,
          activityLevel: 'LIGHT',
          allergies: '[]',
          medicalHistory: '[]',
          healthConcerns: '[]',
          exerciseDetails: originalExerciseDetails,
        },
      });

      // 只更新体重，不更新 exerciseDetails
      const updatedClient = await prisma.client.update({
        where: { id: client.id },
        data: {
          weight: 56,
        },
      });

      expect(updatedClient.weight).toBe(56);
      expect(updatedClient.exerciseDetails).toBe(originalExerciseDetails);
    });
  });

  describe('GET /api/clients - 查询客户', () => {
    it('查询客户列表时应该包含 exerciseDetails 字段', async () => {
      // 创建两个客户，一个有 exerciseDetails，一个没有
      await prisma.client.create({
        data: {
          userId: mockSession.user.id,
          name: '客户A',
          gender: 'MALE',
          birthDate: new Date('1990-01-01'),
          height: 175,
          weight: 70,
          activityLevel: 'MODERATE',
          allergies: '[]',
          medicalHistory: '[]',
          healthConcerns: '[]',
          exerciseDetails: '家中有哑铃',
        },
      });

      await prisma.client.create({
        data: {
          userId: mockSession.user.id,
          name: '客户B',
          gender: 'FEMALE',
          birthDate: new Date('1995-01-01'),
          height: 165,
          weight: 55,
          activityLevel: 'LIGHT',
          allergies: '[]',
          medicalHistory: '[]',
          healthConcerns: '[]',
        },
      });

      const clients = await prisma.client.findMany({
        where: { userId: mockSession.user.id },
        orderBy: { createdAt: 'desc' },
      });

      expect(clients).toHaveLength(2);
      expect(clients[0].exerciseDetails).toBe('家中有哑铃');
      expect(clients[1].exerciseDetails).toBeNull();
    });

    it('查询单个客户详情时应该包含 exerciseDetails 字段', async () => {
      const exerciseDetails = `器材：哑铃5kgx2、弹力带
经验：练习过深蹲、俯卧撑
环境：家中客厅，约20平米`;

      const client = await prisma.client.create({
        data: {
          userId: mockSession.user.id,
          name: '测试客户C',
          gender: 'MALE',
          birthDate: new Date('1988-03-20'),
          height: 180,
          weight: 75,
          activityLevel: 'ACTIVE',
          allergies: '[]',
          medicalHistory: '[]',
          healthConcerns: '[]',
          exerciseDetails: exerciseDetails,
        },
      });

      const foundClient = await prisma.client.findFirst({
        where: { id: client.id },
      });

      expect(foundClient).toBeDefined();
      expect(foundClient!.exerciseDetails).toBe(exerciseDetails);
    });
  });

  describe('边界情况测试', () => {
    it('应该接受空字符串作为 exerciseDetails', async () => {
      const client = await prisma.client.create({
        data: {
          userId: mockSession.user.id,
          name: '测试客户D',
          gender: 'FEMALE',
          birthDate: new Date('1992-07-10'),
          height: 168,
          weight: 58,
          activityLevel: 'MODERATE',
          allergies: '[]',
          medicalHistory: '[]',
          healthConcerns: '[]',
          exerciseDetails: '',
        },
      });

      expect(client.exerciseDetails).toBe('');
    });

    it('应该接受很长的 exerciseDetails 内容', async () => {
      const longExerciseDetails = 'A'.repeat(5000); // 5000个字符

      const client = await prisma.client.create({
        data: {
          userId: mockSession.user.id,
          name: '测试客户E',
          gender: 'MALE',
          birthDate: new Date('1985-11-25'),
          height: 178,
          weight: 72,
          activityLevel: 'ACTIVE',
          allergies: '[]',
          medicalHistory: '[]',
          healthConcerns: '[]',
          exerciseDetails: longExerciseDetails,
        },
      });

      expect(client.exerciseDetails).toHaveLength(5000);
    });

    it('应该接受包含特殊字符的 exerciseDetails', async () => {
      const specialChars = '器材：哑铃、弹力带、瑜伽垫\n经验：深蹲30kg、俯卧撑20个\n环境：20㎡客厅\n备注：注意膝盖保护！';

      const client = await prisma.client.create({
        data: {
          userId: mockSession.user.id,
          name: '测试客户F',
          gender: 'FEMALE',
          birthDate: new Date('1990-01-01'),
          height: 165,
          weight: 55,
          activityLevel: 'LIGHT',
          allergies: '[]',
          medicalHistory: '[]',
          healthConcerns: '[]',
          exerciseDetails: specialChars,
        },
      });

      expect(client.exerciseDetails).toBe(specialChars);
    });
  });
});

import { prisma } from '@/lib/db/prisma';
import type { Client } from '@prisma/client';

/**
 * 权限验证结果
 */
export interface ClientAccessResult {
  exists: boolean;
  client?: Client;
  error?: string;
  statusCode?: number;
}

/**
 * 验证用户是否有权限访问指定客户
 *
 * @param clientId - 客户 ID
 * @param userId - 用户 ID
 * @returns 验证结果
 */
export async function verifyClientAccess(
  clientId: string,
  userId: string
): Promise<ClientAccessResult> {
  try {
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: userId,
      },
    });

    if (!client) {
      return {
        exists: false,
        error: '客户不存在',
        statusCode: 404,
      };
    }

    return {
      exists: true,
      client,
    };
  } catch (error) {
    console.error('Client access verification error:', error);
    return {
      exists: false,
      error: '验证失败',
      statusCode: 500,
    };
  }
}

/**
 * 验证用户是否有权限访问指定客户（抛出错误版本）
 * 用于中间件或需要立即返回错误的场景
 *
 * @param clientId - 客户 ID
 * @param userId - 用户 ID
 * @throws {Error} 当客户不存在时抛出错误
 * @returns 客户对象
 */
export async function requireClientAccess(
  clientId: string,
  userId: string
): Promise<Client> {
  const result = await verifyClientAccess(clientId, userId);

  if (!result.exists || !result.client) {
    const error = new Error(result.error || '客户不存在');
    (error as any).statusCode = result.statusCode || 404;
    throw error;
  }

  return result.client;
}

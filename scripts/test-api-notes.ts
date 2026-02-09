/**
 * API测试脚本 - 通过实际HTTP请求测试备注功能
 */

const BASE_URL = 'http://localhost:3001';

async function testNotesAPI() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   API备注功能测试                                    ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // 1. 获取测试客户ID
  console.log('📋 步骤1: 获取测试客户...');
  const clientsResponse = await fetch(`${BASE_URL}/api/clients`, {
    headers: {
      'Cookie': process.env.TEST_COOKIE || ''
    }
  });

  if (!clientsResponse.ok) {
    console.error('❌ 获取客户列表失败:', clientsResponse.status);
    console.error('   需要登录Cookie才能测试API');
    console.error('   请设置环境变量: TEST_COOKIE="next-auth.session-token=..."');
    return;
  }

  const clientsData = await clientsResponse.json();
  const testClient = clientsData.clients?.find((c: any) => c.email === 'test-client@example.com');

  if (!testClient) {
    console.error('❌ 测试客户不存在，请先运行 test-notes-functionality.ts 创建测试数据');
    return;
  }

  console.log(`✓ 找到测试客户: ${testClient.name} (ID: ${testClient.id})\n`);

  // 2. 获取食谱组数据
  console.log('📋 步骤2: 获取食谱组...');
  const mealGroupsResponse = await fetch(`${BASE_URL}/api/clients/${testClient.id}/meal-groups`, {
    headers: {
      'Cookie': process.env.TEST_COOKIE || ''
    }
  });

  if (!mealGroupsResponse.ok) {
    console.error('❌ 获取食谱组失败:', mealGroupsResponse.status);
    return;
  }

  const mealGroupsData = await mealGroupsResponse.json();
  const mealGroups = mealGroupsData.mealGroups || [];

  console.log(`✓ 找到 ${mealGroups.length} 个食谱组\n`);

  // 3. 显示每个食谱组的备注信息
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 食谱组备注信息');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const mg of mealGroups) {
    console.log(`📅 ${mg.name} (${mg.date})`);
    console.log(`   食谱组备注: "${mg.notes || '无'}"`);

    if (mg.photos && mg.photos.length > 0) {
      for (const photo of mg.photos) {
        console.log(`   照片备注: "${photo.notes || '无'}"`);
        console.log(`   分析状态: ${photo.analyzedAt ? '✓ 已分析' : '✗ 未分析'}`);

        if (photo.analysis) {
          const analysis = JSON.parse(photo.analysis);
          const redFoods = analysis.complianceEvaluation?.foodTrafficLightCompliance?.redFoods || [];
          const greenFoods = analysis.complianceEvaluation?.foodTrafficLightCompliance?.greenFoods || [];
          const score = analysis.complianceEvaluation?.overallScore;

          console.log(`   分析结果:`);
          console.log(`     - 评分: ${score || 'N/A'}`);
          console.log(`     - 绿灯食物: ${greenFoods.join(', ') || '无'}`);
          console.log(`     - 红灯食物: ${redFoods.join(', ') || '无'}`);

          // 验证备注是否生效
          const hasNote = (photo.notes || mg.notes || '').includes('素鸡');
          const hasWrongFood = redFoods.some((f: string) =>
            f.includes('肉排') || f.includes('肉饼') || f.includes('炸肉')
          );

          if (hasNote && !hasWrongFood) {
            console.log(`     ✅ 备注生效: 素鸡未被识别为红灯食物`);
          } else if (hasNote && hasWrongFood) {
            console.log(`     ❌ 备注未生效: 素鸡仍被识别为红灯食物`);
          }
        }
      }
    }
    console.log('');
  }

  // 4. 测试重新分析功能（如果存在未分析的食谱组）
  const unanalyzedGroup = mealGroups.find((mg: any) =>
    mg.photos?.some((p: any) => !p.analyzedAt)
  );

  if (unanalyzedGroup) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 测试分析API');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`📸 分析食谱组: ${unanalyzedGroup.name}`);

    const analyzeResponse = await fetch(`${BASE_URL}/api/clients/${testClient.id}/meal-groups/${unanalyzedGroup.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': process.env.TEST_COOKIE || ''
      }
    });

    if (!analyzeResponse.ok) {
      const error = await analyzeResponse.json();
      console.error('❌ 分析失败:', error.error || error.details);
      return;
    }

    const result = await analyzeResponse.json();
    console.log('✓ 分析完成!');
    console.log(`   评分: ${result.totalScore || 'N/A'}`);
    console.log(`   等级: ${result.overallRating || 'N/A'}`);
  }

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   测试完成                                            ║');
  console.log('╚════════════════════════════════════════════════════════╝');
}

// 运行测试
testNotesAPI().catch(console.error);

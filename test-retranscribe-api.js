/**
 * 测试重新转录 API 端点
 * 使用方法：在浏览器控制台中运行此脚本
 */

// 注意：需要替换为实际的 clientId, consultationId, audioId
async function testRetranscribeAPI() {
  // 从当前页面的 URL 获取参数
  const pathParts = window.location.pathname.split('/');
  const clientIdIndex = pathParts.indexOf('clients') + 1;
  const consultationIdIndex = pathParts.indexOf('consultations') + 1;

  const clientId = pathParts[clientIdIndex];
  const consultationId = pathParts[consultationIdIndex];

  console.log('[Test] Client ID:', clientId);
  console.log('[Test] Consultation ID: consultationId);

  // 首先获取咨询详情，找到第一个音频文件
  const consultRes = await fetch(`/api/clients/${clientId}/consultations/${consultationId}`);
  const consultData = await consultRes.json();
  console.log('[Test] Consultation data:', consultData);

  if (!consultData.consultation || !consultData.consultation.audioFiles || consultData.consultation.audioFiles.length === 0) {
    console.error('[Test] 没有找到音频文件');
    return;
  }

  const audioId = consultData.consultation.audioFiles[0].id;
  console.log('[Test] Audio ID:', audioId);
  console.log('[Test] Current transcription status:', consultData.consultation.audioFiles[0].transcriptionStatus);

  // 测试重新转录 API
  const url = `/api/clients/${clientId}/consultations/${consultationId}/audio/${audioId}/retranscribe`;
  console.log('[Test] Testing retranscribe API:', url);

  try {
    const res = await fetch(url, {
      method: 'POST',
    });

    console.log('[Test] Response status:', res.status);
    const data = await res.json();
    console.log('[Test] Response data:', data);

    if (res.ok) {
      console.log('[Test] ✅ API 工作正常！');
    } else {
      console.error('[Test] ❌ API 返回错误:', data.error);
    }
  } catch (error) {
    console.error('[Test] ❌ 请求失败:', error);
  }
}

// 运行测试
testRetranscribeAPI();

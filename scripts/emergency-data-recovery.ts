/**
 * 紧急数据恢复脚本
 * 尝试从API缓存或日志中恢复数据
 */

const fs = require('fs');
const path = require('path');

console.log('⚠️  紧急数据恢复');
console.log('==================================================\n');

// 1. 检查服务器日志
const logFiles = [
  '/tmp/dev-server-fresh.log',
  '/tmp/dev-server-test.log',
  '/tmp/dev-server.log',
];

logFiles.forEach(logFile => {
  if (fs.existsSync(logFile)) {
    console.log(`📋 检查日志文件: ${logFile}`);
    const content = fs.readFileSync(logFile, 'utf8');

    // 查找mealGroups相关的API调用
    const mealGroupCalls = content.match(/GET \/api\/clients\/[^\/]+\/meal-groups[^\n]*/g);
    if (mealGroupCalls) {
      console.log(`  找到 ${mealGroupCalls.length} 个meal-groups API调用`);
    }
  }
});

// 2. 检查是否有浏览器请求缓存
console.log('\n💾 检查浏览器缓存...');

console.log('\n⚠️  建议：');
console.log('1. 如果有Time Machine备份，立即恢复：');
console.log('   ~/Desktop/ClaudeCode/nutricoach-pro/prisma/dev.db');
console.log('2. 检查浏览器开发工具的Network标签，看是否有API响应缓存');
console.log('3. 如果部署在Vercel，检查生产数据库');

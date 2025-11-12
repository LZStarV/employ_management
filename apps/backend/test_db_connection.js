// 测试数据库连接的简化脚本
console.log('开始测试数据库连接...');

const dotenv = require('dotenv');
const { sequelize } = require('./config/database');

// 加载环境变量
dotenv.config();

// 打印当前的数据库配置，验证是否使用了正确的用户
console.log('当前数据库配置:');
console.log(`- 数据库名: ${process.env.DB_NAME}`);
console.log(`- 用户名: ${process.env.DB_USER}`);
console.log(`- 主机: ${process.env.DB_HOST}:${process.env.DB_PORT}`);

// 测试数据库连接
async function testConnection() {
  try {
    console.log('测试数据库连接...');
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功!');
    
    // 只测试连接，不尝试创建表
    console.log('✅ 连接测试完成，数据库配置正确!');
    
    return true;
  } catch (error) {
    console.error('❌ 连接测试失败:', error.message);
    console.error('错误详情:', error);
    return false;
  } finally {
    // 关闭连接
    await sequelize.close();
  }
}

// 执行测试
testConnection().then(success => {
  console.log('\n测试结果:', success ? '成功' : '失败');
  process.exit(success ? 0 : 1);
});
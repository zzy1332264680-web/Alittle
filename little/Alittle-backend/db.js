// Alittle-backend/db.js 数据库连接配置（适配你的已有结构）
const mysql = require('mysql2/promise');

// 替换为你的MySQL配置（和你建表时的配置一致）
const dbConfig = {
  host: 'localhost',
  user: 'root',        // 你的MySQL用户名
  password: '123456', // 你的MySQL密码
  database: 'little-shop'   // 你的数据库名（和建表时一致）
};

// 创建并导出连接池（核心：确保前端能调用）
const pool = mysql.createPool(dbConfig);

// 测试连接（可选，验证是否能连通）
(async () => {
  try {
    const [rows] = await pool.query('SELECT 1');
    console.log('✅ 数据库连接成功（Alittle-backend）');
  } catch (err) {
    console.error('❌ 数据库连接失败：', err);
  }
})();

module.exports = pool; // 必须导出pool，供app.js调用
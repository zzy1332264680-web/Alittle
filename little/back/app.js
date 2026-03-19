// 1. 导入核心依赖
const express = require('express');
const dotenv = require('dotenv/lib/main');
const mysql = require('mysql2/promise');
const cors = require('cors');

// 2. 配置环境变量
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

// 3. 全局中间件
app.use(cors()); // 跨域
app.use(express.json()); // 解析JSON请求体
app.use(express.urlencoded({ extended: true }));

// 4. 数据库连接
let db;
(async () => {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'little-shop'
    });
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败：', error.message);
    process.exit(1);
  }
})();

// 5. 原有登录接口（兼容admin/123456 + 新增注册用户登录）
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json({ code: 400, msg: '账号或密码不能为空' });
    }

    // 兼容逻辑：username可以是手机号/原有admin用户名
    const [rows] = await db.query(
      'SELECT * FROM user WHERE (phone = ? OR username = ?) AND password = ?',
      // 兼容原有user表可能有username字段（admin）+ 新注册的phone
      [username, username, password]
    );

    if (rows.length === 0) {
      return res.json({ code: 401, msg: '账号或密码错误' });
    }

    res.json({
      code: 200,
      msg: '登录成功',
      data: {
        token: `user-token-${rows[0].id}`, // 简易token
        userId: rows[0].id
      }
    });
  } catch (error) {
    console.error('登录接口报错：', error);
    res.json({ code: 500, msg: '服务器内部错误' });
  }
});

// 6. 新增：检查昵称是否已存在（供前端注册验证）
app.post('/api/auth/check-nickname', async (req, res) => {
  try {
    const { nickname } = req.body;
    if (!nickname) {
      return res.json({ code: 400, msg: '昵称不能为空', success: false });
    }

    const [rows] = await db.query(
      'SELECT id FROM user WHERE nickname = ?',
      [nickname]
    );

    // success=true 表示昵称可用，false表示已被占用
    res.json({
      code: 200,
      success: rows.length === 0,
      msg: rows.length > 0 ? '昵称已被使用' : '昵称可用'
    });
  } catch (error) {
    console.error('检查昵称报错：', error);
    res.json({ code: 500, msg: '检查昵称失败', success: false });
  }
});

// 7. 新增：发送验证码（占位，生产环境需对接短信平台）
app.post('/api/auth/send-code', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.json({ code: 400, msg: '手机号不能为空' });
    }

    // 模拟发送验证码（生产环境替换为短信接口）
    const code = '123456'; // 测试验证码
    console.log(`向手机号 ${phone} 发送验证码：${code}`);

    res.json({
      code: 200,
      msg: '验证码发送成功',
      data: { code } // 仅测试用，生产环境不返回验证码
    });
  } catch (error) {
    console.error('发送验证码报错：', error);
    res.json({ code: 500, msg: '验证码发送失败' });
  }
});

// 8. 新增：注册接口（核心）
app.post('/api/auth/register', async (req, res) => {
  try {
    const { phone, code, nickname, password } = req.body;
    // 1. 基础参数验证
    if (!phone || !code || !nickname || !password) {
      return res.json({ code: 400, msg: '请填写所有必填字段' });
    }

    // 2. 验证手机号格式（后端二次校验）
    const phoneReg = /^1[3-9]\d{9}$/;
    if (!phoneReg.test(phone)) {
      return res.json({ code: 400, msg: '手机号格式错误' });
    }

    // 3. 验证昵称格式（2-20位）
    if (nickname.length < 2 || nickname.length > 20) {
      return res.json({ code: 400, msg: '昵称需为2-20位' });
    }

    // 4. 验证密码格式（6-20位，含字母+数字）
    const pwdReg = /^(?=.*[a-zA-Z])(?=.*\d).{6,20}$/;
    if (!pwdReg.test(password)) {
      return res.json({ code: 400, msg: '密码需为6-20位，且包含字母和数字' });
    }

    // 5. 验证验证码（测试环境固定为123456，生产环境需存redis验证）
    if (code !== '123456') {
      return res.json({ code: 400, msg: '验证码错误' });
    }

    // 6. 检查手机号是否已注册
    const [phoneRows] = await db.query(
      'SELECT id FROM user WHERE phone = ?',
      [phone]
    );
    if (phoneRows.length > 0) {
      return res.json({ code: 400, msg: '该手机号已注册' });
    }

    // 7. 检查昵称是否已存在
    const [nicknameRows] = await db.query(
      'SELECT id FROM user WHERE nickname = ?',
      [nickname]
    );
    if (nicknameRows.length > 0) {
      return res.json({ code: 400, msg: '该昵称已被使用' });
    }

    // 8. 插入用户数据到user表
    const [result] = await db.query(
      'INSERT INTO user (phone, nickname, password) VALUES (?, ?, ?)',
      [phone, nickname, password] // 生产环境需加密密码，见文末说明
    );

    res.json({
      code: 200,
      msg: '注册成功',
      data: { userId: result.insertId }
    });
  } catch (error) {
    console.error('注册接口报错：', error);
    // 捕获唯一索引冲突（防并发）
    if (error.code === 'ER_DUP_ENTRY') {
      return res.json({ code: 400, msg: '手机号或昵称已存在' });
    }
    res.json({ code: 500, msg: '注册失败，请稍后重试' });
  }
});

// 9. 原有商品相关接口（保留）
app.get('/api/goods', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM goods');
    res.json({ code: 200, data: rows });
  } catch (error) {
    console.error('获取商品列表报错：', error);
    res.json({ code: 500, msg: '获取商品列表失败' });
  }
});

app.post('/api/goods', async (req, res) => {
  try {
    const { name, price, image } = req.body;
    if (!name || !price) {
      return res.json({ code: 400, msg: '商品名称和价格不能为空' });
    }
    const [result] = await db.query(
      'INSERT INTO goods (name, price, image, create_time) VALUES (?, ?, ?, NOW())',
      [name, price, image || null]
    );
    res.json({ code: 200, msg: '新增商品成功', data: { id: result.insertId } });
  } catch (error) {
    console.error('新增商品报错：', error);
    res.json({ code: 500, msg: '新增商品失败' });
  }
});

app.delete('/api/goods/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return res.json({ code: 400, msg: '商品ID格式错误' });
    }
    await db.query('DELETE FROM goods WHERE id = ?', [id]);
    res.json({ code: 200, msg: '删除商品成功' });
  } catch (error) {
    console.error('删除商品报错：', error);
    res.json({ code: 500, msg: '删除商品失败' });
  }
});

// 10. 启动服务
app.listen(PORT, () => {
  console.log(`✅ 后端服务启动成功：http://localhost:${PORT}`);
  console.log(`🔗 注册接口：POST http://localhost:${PORT}/api/auth/register`);
  console.log(`🔗 检查昵称接口：POST http://localhost:${PORT}/api/auth/check-nickname`);
  console.log(`🔗 发送验证码接口：POST http://localhost:${PORT}/api/auth/send-code`);
});
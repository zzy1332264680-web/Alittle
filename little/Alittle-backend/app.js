// Alittle-backend/app.js 完整代码（终极容错修复版）
const express = require('express');
const cors = require('cors');
const pool = require('./db.js'); // 引入数据库连接
const bcrypt = require('bcryptjs'); // 密码加密

// 1. 先创建app实例（必须在所有接口之前！）
const app = express();
const PORT = 3001; // 后端端口，和前端request.js一致

// 2. 核心中间件（必须配置）
app.use(cors()); // 解决跨域
app.use(express.json({ limit: '10mb' })); // 解析JSON请求体，支持大图片

// ===================== 原有接口1：用户名查重 =====================
app.post('/api/auth/check-nickname', async (req, res) => {
  try {
    const { nickname } = req.body;
    const [rows] = await pool.query('SELECT * FROM `user` WHERE username = ?', [nickname]);
    
    if (rows.length > 0) {
      res.json({ success: false, msg: '用户名已被使用' });
    } else {
      res.json({ success: true, msg: '用户名可用' });
    }
  } catch (error) {
    console.error('【用户名查重失败】：', error);
    res.status(500).json({ success: false, msg: '用户名验证失败，请稍后重试' });
  }
});

// ===================== 原有接口2：用户注册 =====================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nickname, email, password } = req.body;

    // 1. 查重
    const [nicknameRows] = await pool.query('SELECT * FROM `user` WHERE username = ?', [nickname]);
    if (nicknameRows.length > 0) {
      return res.json({ code: 400, msg: '用户名已被注册' });
    }
    const [emailRows] = await pool.query('SELECT * FROM `user` WHERE email = ?', [email]);
    if (emailRows.length > 0) {
      return res.json({ code: 400, msg: '邮箱已被注册' });
    }

    // 2. 密码加密（bcrypt加密后约60位，需数据库password字段为varchar(100)）
    const salt = bcrypt.genSaltSync(10);
    const encryptPassword = bcrypt.hashSync(password, salt);

    // 3. 插入数据库（确保password字段长度≥100）
    await pool.query(
      'INSERT INTO `user` (username, email, password) VALUES (?, ?, ?)',
      [nickname, email, encryptPassword]
    );

    res.json({ code: 200, msg: '注册成功' });
  } catch (error) {
    console.error('【用户注册失败】：', error);
    // 专门提示密码字段长度错误
    if (error.code === 'ER_DATA_TOO_LONG') {
      res.status(500).json({ code: 500, msg: '密码字段长度不足，请修改数据库password为varchar(100)' });
    } else {
      res.status(500).json({ code: 500, msg: '注册失败，请稍后重试' });
    }
  }
});

// ===================== 原有接口3：用户登录 =====================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { account, password } = req.body;

    // 1. 查询用户（支持用户名/邮箱登录）
    let [userRows] = await pool.query('SELECT * FROM `user` WHERE username = ?', [account]);
    if (userRows.length === 0) {
      [userRows] = await pool.query('SELECT * FROM `user` WHERE email = ?', [account]);
    }

    // 2. 检查用户是否存在
    if (userRows.length === 0) {
      return res.json({ code: 400, msg: '用户名/邮箱或密码错误' });
    }
    const user = userRows[0];

    // 3. 验证密码（对比明文和加密密码）
    const isPwdCorrect = bcrypt.compareSync(password, user.password);
    if (!isPwdCorrect) {
      return res.json({ code: 400, msg: '用户名/邮箱或密码错误' });
    }

    // 4. 登录成功
    res.json({
      code: 200,
      msg: '登录成功',
      data: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    console.error('【用户登录失败】：', error);
    res.status(500).json({ code: 500, msg: '登录失败，请稍后重试' });
  }
});

// ===================== 原有接口4：发布闲置商品 =====================
app.post('/api/goods/publish', async (req, res) => {
  try {
    // 接收前端传来的商品数据
    const { user_id, name, price, description, image } = req.body;

    // 基础参数校验
    if (!user_id || !name || !price) {
      return res.json({ code: 400, msg: '商品名称、价格、发布用户不能为空' });
    }

    // 插入数据库
    const [result] = await pool.query(
      'INSERT INTO `goods` (user_id, name, price, description, image) VALUES (?, ?, ?, ?, ?)',
      [user_id, name, price, description || '', image || '']
    );

    // 发布成功
    res.json({
      code: 200,
      msg: '商品发布成功',
      data: { id: result.insertId } // 返回新增的商品ID
    });
  } catch (error) {
    console.error('【商品发布失败】：', error);
    res.status(500).json({ code: 500, msg: '商品发布失败，请稍后重试' });
  }
});

// ===================== 原有接口5：获取商品列表 =====================
app.get('/api/goods/list', async (req, res) => {
  try {
    // 查询所有上架的商品，按发布时间倒序（最新的在最前面）
    const [rows] = await pool.query(
      'SELECT g.*, u.username as publisher_name FROM `goods` g LEFT JOIN `user` u ON g.user_id = u.id WHERE g.status = 1 ORDER BY g.create_time DESC'
    );

    res.json({
      code: 200,
      msg: '获取成功',
      data: rows // 返回商品列表
    });
  } catch (error) {
    console.error('【商品列表获取失败】：', error);
    res.status(500).json({ code: 500, msg: '商品列表获取失败，请稍后重试' });
  }
});

// ===================== 原有接口6：获取用户个人信息 =====================
app.get('/api/user/info', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) {
      return res.json({ code: 400, msg: '用户ID不能为空' });
    }

    const [rows] = await pool.query('SELECT id, username, email, avatar, nickname, phone, bio, create_time FROM `user` WHERE id = ?', [user_id]);
    if (rows.length === 0) {
      return res.json({ code: 404, msg: '用户不存在' });
    }

    res.json({
      code: 200,
      msg: '获取成功',
      data: rows[0]
    });
  } catch (error) {
    console.error('【获取用户信息失败】：', error);
    res.status(500).json({ code: 500, msg: '获取用户信息失败，请稍后重试' });
  }
});

// ===================== 原有接口7：修改用户个人信息 =====================
app.put('/api/user/update', async (req, res) => {
  try {
    const { user_id, nickname, phone, bio, avatar } = req.body;
    if (!user_id) {
      return res.json({ code: 400, msg: '用户ID不能为空' });
    }

    // 构建更新语句
    const updateFields = [];
    const updateValues = [];
    if (nickname !== undefined) { updateFields.push('nickname = ?'); updateValues.push(nickname); }
    if (phone !== undefined) { updateFields.push('phone = ?'); updateValues.push(phone); }
    if (bio !== undefined) { updateFields.push('bio = ?'); updateValues.push(bio); }
    if (avatar !== undefined) { updateFields.push('avatar = ?'); updateValues.push(avatar); }
    
    if (updateFields.length === 0) {
      return res.json({ code: 400, msg: '没有需要更新的信息' });
    }

    updateValues.push(user_id);
    await pool.query(
      `UPDATE \`user\` SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ code: 200, msg: '更新成功' });
  } catch (error) {
    console.error('【更新用户信息失败】：', error);
    res.status(500).json({ code: 500, msg: '更新用户信息失败，请稍后重试' });
  }
});

// ===================== 新增接口8：获取话题列表 =====================
app.get('/api/topics/list', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM `topics` ORDER BY id ASC');
    res.json({ code: 200, msg: '获取成功', data: rows });
  } catch (error) {
    console.error('【获取话题列表失败】：', error);
    res.status(500).json({ code: 500, msg: '获取话题列表失败' });
  }
});

// ===================== 新增接口9：发布帖子 =====================
app.post('/api/posts/publish', async (req, res) => {
  try {
    const { user_id, title, content, images, topics, is_anonymous, visibility } = req.body;

    // 基础参数校验
    if (!user_id) {
      return res.json({ code: 400, msg: '用户信息异常，请重新登录' });
    }
    if (!title || title.trim().length === 0) {
      return res.json({ code: 400, msg: '帖子标题不能为空' });
    }
    if (title.length > 200) {
      return res.json({ code: 400, msg: '标题不能超过200字' });
    }
    if (!content || content.trim().length === 0) {
      return res.json({ code: 400, msg: '帖子内容不能为空' });
    }
    if (content.length > 10000) {
      return res.json({ code: 400, msg: '内容不能超过10000字' });
    }
    if (images && images.length > 9) {
      return res.json({ code: 400, msg: '最多只能上传9张图片' });
    }

    // 插入数据库
    const [result] = await pool.query(
      'INSERT INTO `posts` (user_id, title, content, images, topics, is_anonymous, visibility) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        user_id,
        title.trim(),
        content.trim(),
        JSON.stringify(images || []),
        JSON.stringify(topics || []),
        is_anonymous ? 1 : 0,
        visibility || 'public'
      ]
    );

    res.json({
      code: 200,
      msg: '发布成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('【发布帖子失败】：', error);
    res.status(500).json({ code: 500, msg: '发布失败，请稍后重试' });
  }
});

// ===================== 新增接口10：获取帖子列表（终极容错修复版） =====================
app.get('/api/posts/list', async (req, res) => {
  try {
    // 兼容版SQL，只查询你表里一定存在的字段
    const [rows] = await pool.query(`
      SELECT 
        p.id, p.user_id, p.title, p.content, p.images, p.topics, p.create_time, p.is_anonymous,
        u.username as publisher_name
      FROM \`posts\` p
      LEFT JOIN \`user\` u ON p.user_id = u.id
      ORDER BY p.id DESC
    `);

    // 安全的JSON解析函数：解析失败直接返回空数组，不会崩溃
    const safeJsonParse = (str) => {
      // 空值、null、空字符串直接返回空数组
      if (!str || str === 'null' || str === '') return [];
      try {
        const result = JSON.parse(str);
        // 确保返回的是数组，不是其他格式
        return Array.isArray(result) ? result : [];
      } catch (e) {
        // 解析失败打印警告，返回空数组
        console.warn('JSON内容解析失败，原始内容：', str);
        return [];
      }
    };

    // 处理每行数据，全程带容错
    const processedRows = rows.map(row => ({
      ...row,
      images: safeJsonParse(row.images),
      topics: safeJsonParse(row.topics),
      is_anonymous: row.is_anonymous || 0,
      view_count: row.view_count || 0,
      like_count: row.like_count || 0,
      comment_count: row.comment_count || 0
    }));

    res.json({ code: 200, msg: '获取成功', data: processedRows });
  } catch (error) {
    // 把具体错误打印到后端终端，方便后续排查
    console.error('【获取帖子列表失败】：', error);
    res.status(500).json({ code: 500, msg: '获取帖子列表失败', error: error.message });
  }
});

// ===================== 启动服务（必须在所有接口之后！） =====================
app.listen(PORT, () => {
  console.log(`✅ 后端服务已启动：http://localhost:${PORT}`);
  console.log(`✅ 接口列表：`);
  console.log(`  - 查重：POST /api/auth/check-nickname`);
  console.log(`  - 注册：POST /api/auth/register`);
  console.log(`  - 登录：POST /api/auth/login`);
  console.log(`  - 发布商品：POST /api/goods/publish`);
  console.log(`  - 商品列表：GET /api/goods/list`);
  console.log(`  - 获取用户信息：GET /api/user/info`);
  console.log(`  - 更新用户信息：PUT /api/user/update`);
  console.log(`  - 话题列表：GET /api/topics/list`);
  console.log(`  - 发布帖子：POST /api/posts/publish`);
  console.log(`  - 帖子列表：GET /api/posts/list`);
});
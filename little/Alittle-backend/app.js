// Alittle-backend/app.js 完整代码（最终版，包含所有接口+会话右键菜单支持）
const express = require('express');
const cors = require('cors');
const pool = require('./db.js'); // 引入数据库连接
const bcrypt = require('bcryptjs'); // 密码加密

// 1. 先创建app实例（必须在所有接口之前！）
const app = express();
const PORT = 3001; // 后端端口，和前端request.js一致

// 2. 核心中间件（必须配置）
app.use(cors()); // 解决跨域
app.use(express.json({ limit: '20mb' })); // 解析JSON请求体，支持大图片

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
      data: { id: user.id, username: user.username, email: user.email, avatar: user.avatar }
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
      'SELECT g.*, u.username as publisher_name, u.avatar as publisher_avatar FROM `goods` g LEFT JOIN `user` u ON g.user_id = u.id WHERE g.status = 1 ORDER BY g.create_time DESC'
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

    const [rows] = await pool.query('SELECT id, username, email, avatar, nickname, phone, bio, create_time, username_last_modified FROM `user` WHERE id = ?', [user_id]);
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

// ===================== 接口7：修改用户个人信息（高级版，支持用户名/邮箱修改） =====================
app.put('/api/user/update', async (req, res) => {
  try {
    const { user_id, username, email, nickname, phone, bio, avatar } = req.body;
    if (!user_id) {
      return res.json({ code: 400, msg: '用户ID不能为空' });
    }

    // 1. 获取当前用户信息
    const [currentUserRows] = await pool.query('SELECT * FROM `user` WHERE id = ?', [user_id]);
    if (currentUserRows.length === 0) {
      return res.json({ code: 404, msg: '用户不存在' });
    }
    const currentUser = currentUserRows[0];

    // 2. 构建更新语句
    const updateFields = [];
    const updateValues = [];

    // 处理用户名修改（有3个月限制）
    if (username !== undefined && username !== currentUser.username) {
      // 检查是否3个月内修改过
      if (currentUser.username_last_modified) {
        const lastModified = new Date(currentUser.username_last_modified);
        const now = new Date();
        const diffMonths = (now.getFullYear() - lastModified.getFullYear()) * 12 + (now.getMonth() - lastModified.getMonth());
        if (diffMonths < 3) {
          return res.json({ code: 400, msg: '用户名每3个月只能修改一次，请稍后再试' });
        }
      }

      // 检查新用户名是否已被占用
      const [checkRows] = await pool.query('SELECT * FROM `user` WHERE username = ? AND id != ?', [username, user_id]);
      if (checkRows.length > 0) {
        return res.json({ code: 400, msg: '该用户名已被其他用户使用' });
      }

      // 添加到更新语句
      updateFields.push('username = ?');
      updateValues.push(username);
      updateFields.push('username_last_modified = NOW()');
    }

    // 处理邮箱修改
    if (email !== undefined && email !== currentUser.email) {
      // 检查新邮箱是否已被占用
      const [checkEmailRows] = await pool.query('SELECT * FROM `user` WHERE email = ? AND id != ?', [email, user_id]);
      if (checkEmailRows.length > 0) {
        return res.json({ code: 400, msg: '该邮箱已被其他用户使用' });
      }
      updateFields.push('email = ?');
      updateValues.push(email);
    }

    // 处理其他字段
    if (nickname !== undefined) { updateFields.push('nickname = ?'); updateValues.push(nickname); }
    if (phone !== undefined) { updateFields.push('phone = ?'); updateValues.push(phone); }
    if (bio !== undefined) { updateFields.push('bio = ?'); updateValues.push(bio); }
    if (avatar !== undefined) { updateFields.push('avatar = ?'); updateValues.push(avatar); }

    if (updateFields.length === 0) {
      return res.json({ code: 400, msg: '没有需要更新的内容' });
    }

    // 3. 执行更新
    updateValues.push(user_id);
    await pool.query(
      `UPDATE \`user\` SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // 4. 返回更新后的用户信息
    const [updatedUserRows] = await pool.query('SELECT id, username, email, avatar, nickname, phone, bio FROM `user` WHERE id = ?', [user_id]);
    res.json({ code: 200, msg: '更新成功', data: updatedUserRows[0] });
  } catch (error) {
    console.error('【更新用户信息失败】：', error);
    res.status(500).json({ code: 500, msg: '更新用户信息失败，请稍后重试' });
  }
});

// ===================== 原有接口8：获取话题列表 =====================
app.get('/api/topics/list', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM `topics` ORDER BY id ASC');
    res.json({ code: 200, msg: '获取成功', data: rows });
  } catch (error) {
    console.error('【获取话题列表失败】：', error);
    res.status(500).json({ code: 500, msg: '获取话题列表失败' });
  }
});

// ===================== 原有接口9：发布帖子 =====================
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

// ===================== 原有接口10：获取帖子列表（终极容错修复版） =====================
app.get('/api/posts/list', async (req, res) => {
  try {
    // 兼容版SQL，只查询你表里一定存在的字段
    const [rows] = await pool.query(`
      SELECT 
        p.id, p.user_id, p.title, p.content, p.images, p.topics, p.create_time, p.is_anonymous,
        u.username as publisher_name, u.avatar as publisher_avatar
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

// ===================== 新增接口11：获取我的帖子列表 =====================
app.get('/api/my/posts', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) {
      return res.json({ code: 400, msg: '用户ID不能为空' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM `posts` WHERE user_id = ? ORDER BY id DESC',
      [user_id]
    );

    // 安全的JSON解析
    const safeJsonParse = (str) => {
      if (!str || str === 'null' || str === '') return [];
      try {
        const result = JSON.parse(str);
        return Array.isArray(result) ? result : [];
      } catch (e) {
        return [];
      }
    };

    const processedRows = rows.map(row => ({
      ...row,
      images: safeJsonParse(row.images),
      topics: safeJsonParse(row.topics)
    }));

    res.json({ code: 200, msg: '获取成功', data: processedRows });
  } catch (error) {
    console.error('【获取我的帖子失败】：', error);
    res.status(500).json({ code: 500, msg: '获取失败' });
  }
});

// ===================== 新增接口12：获取我的商品列表 =====================
app.get('/api/my/goods', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) {
      return res.json({ code: 400, msg: '用户ID不能为空' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM `goods` WHERE user_id = ? ORDER BY id DESC',
      [user_id]
    );

    res.json({ code: 200, msg: '获取成功', data: rows });
  } catch (error) {
    console.error('【获取我的商品失败】：', error);
    res.status(500).json({ code: 500, msg: '获取失败' });
  }
});

// ===================== 新增接口13：修改帖子 =====================
app.put('/api/posts/update', async (req, res) => {
  try {
    const { post_id, user_id, title, content, images, topics, is_anonymous, visibility } = req.body;
    
    if (!post_id || !user_id) {
      return res.json({ code: 400, msg: '参数不完整' });
    }

    // 验证权限：只能修改自己的帖子
    const [checkRows] = await pool.query('SELECT * FROM `posts` WHERE id = ? AND user_id = ?', [post_id, user_id]);
    if (checkRows.length === 0) {
      return res.json({ code: 403, msg: '无权修改此帖子' });
    }

    // 构建更新语句
    const updateFields = [];
    const updateValues = [];
    if (title !== undefined) { updateFields.push('title = ?'); updateValues.push(title); }
    if (content !== undefined) { updateFields.push('content = ?'); updateValues.push(content); }
    if (images !== undefined) { updateFields.push('images = ?'); updateValues.push(JSON.stringify(images)); }
    if (topics !== undefined) { updateFields.push('topics = ?'); updateValues.push(JSON.stringify(topics)); }
    if (is_anonymous !== undefined) { updateFields.push('is_anonymous = ?'); updateValues.push(is_anonymous ? 1 : 0); }
    if (visibility !== undefined) { updateFields.push('visibility = ?'); updateValues.push(visibility); }

    if (updateFields.length === 0) {
      return res.json({ code: 400, msg: '没有需要更新的内容' });
    }

    updateValues.push(post_id);
    await pool.query(
      `UPDATE \`posts\` SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ code: 200, msg: '修改成功' });
  } catch (error) {
    console.error('【修改帖子失败】：', error);
    res.status(500).json({ code: 500, msg: '修改失败' });
  }
});

// ===================== 新增接口14：删除/隐藏帖子 =====================
app.put('/api/posts/status', async (req, res) => {
  try {
    const { post_id, user_id, status } = req.body;
    
    if (!post_id || !user_id || status === undefined) {
      return res.json({ code: 400, msg: '参数不完整' });
    }

    // 验证权限
    const [checkRows] = await pool.query('SELECT * FROM `posts` WHERE id = ? AND user_id = ?', [post_id, user_id]);
    if (checkRows.length === 0) {
      return res.json({ code: 403, msg: '无权操作此帖子' });
    }

    await pool.query('UPDATE `posts` SET status = ? WHERE id = ?', [status, post_id]);
    res.json({ code: 200, msg: status === 0 ? '已隐藏/删除' : '已恢复' });
  } catch (error) {
    console.error('【操作帖子失败】：', error);
    res.status(500).json({ code: 500, msg: '操作失败' });
  }
});

// ===================== 新增接口15：修改商品 =====================
app.put('/api/goods/update', async (req, res) => {
  try {
    const { goods_id, user_id, name, price, description, image } = req.body;
    
    if (!goods_id || !user_id) {
      return res.json({ code: 400, msg: '参数不完整' });
    }

    // 验证权限
    const [checkRows] = await pool.query('SELECT * FROM `goods` WHERE id = ? AND user_id = ?', [goods_id, user_id]);
    if (checkRows.length === 0) {
      return res.json({ code: 403, msg: '无权修改此商品' });
    }

    // 构建更新语句
    const updateFields = [];
    const updateValues = [];
    if (name !== undefined) { updateFields.push('name = ?'); updateValues.push(name); }
    if (price !== undefined) { updateFields.push('price = ?'); updateValues.push(price); }
    if (description !== undefined) { updateFields.push('description = ?'); updateValues.push(description); }
    if (image !== undefined) { updateFields.push('image = ?'); updateValues.push(image); }

    if (updateFields.length === 0) {
      return res.json({ code: 400, msg: '没有需要更新的内容' });
    }

    updateValues.push(goods_id);
    await pool.query(
      `UPDATE \`goods\` SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ code: 200, msg: '修改成功' });
  } catch (error) {
    console.error('【修改商品失败】：', error);
    res.status(500).json({ code: 500, msg: '修改失败' });
  }
});

// ===================== 新增接口16：删除/隐藏商品 =====================
app.put('/api/goods/status', async (req, res) => {
  try {
    const { goods_id, user_id, status } = req.body;
    
    if (!goods_id || !user_id || status === undefined) {
      return res.json({ code: 400, msg: '参数不完整' });
    }

    // 验证权限
    const [checkRows] = await pool.query('SELECT * FROM `goods` WHERE id = ? AND user_id = ?', [goods_id, user_id]);
    if (checkRows.length === 0) {
      return res.json({ code: 403, msg: '无权操作此商品' });
    }

    await pool.query('UPDATE `goods` SET status = ? WHERE id = ?', [status, goods_id]);
    res.json({ code: 200, msg: status === 0 ? '已隐藏/删除' : '已恢复' });
  } catch (error) {
    console.error('【操作商品失败】：', error);
    res.status(500).json({ code: 500, msg: '操作失败' });
  }
});

// ===================== 标准接口1：GET /api/contacts 获取好友列表 =====================
app.get('/api/contacts', async (req, res) => {
  try {
    const { exclude_user_id } = req.query;
    let sql = 'SELECT id, username, avatar, nickname, online_status, last_online_time FROM `user`';
    let params = [];
    
    if (exclude_user_id) {
      sql += ' WHERE id != ?';
      params.push(exclude_user_id);
    }
    
    sql += ' ORDER BY id ASC';
    
    const [rows] = await pool.query(sql, params);
    res.json({ code: 200, msg: '获取成功', data: rows });
  } catch (error) {
    console.error('【获取好友列表失败】：', error);
    res.status(500).json({ code: 500, msg: '获取好友列表失败' });
  }
});

// ===================== 标准接口2：GET /api/conversations 获取会话列表（支持is_hidden） =====================
app.get('/api/conversations', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) {
      return res.json({ code: 400, msg: '参数不完整：user_id不能为空' });
    }

    const [rows] = await pool.query(`
      SELECT 
        cc.*,
        u.username,
        u.avatar,
        u.nickname,
        u.online_status
      FROM chat_conversations cc
      LEFT JOIN user u ON cc.target_user_id = u.id
      WHERE cc.user_id = ?
      ORDER BY cc.is_pinned DESC, cc.updated_at DESC
    `, [user_id]);

    res.json({ code: 200, msg: '获取成功', data: rows });
  } catch (error) {
    console.error('【获取会话列表失败】：', error);
    res.status(500).json({ code: 500, msg: '获取会话列表失败' });
  }
});

// ===================== 标准接口3：GET /api/messages 分页获取聊天记录 =====================
app.get('/api/messages', async (req, res) => {
  try {
    const { from_user_id, to_user_id, page = 1, page_size = 20 } = req.query;
    if (!from_user_id || !to_user_id) {
      return res.json({ code: 400, msg: '参数不完整：from_user_id和to_user_id不能为空' });
    }

    const offset = (parseInt(page) - 1) * parseInt(page_size);
    
    const [rows] = await pool.query(`
      SELECT 
        cm.*,
        u_from.username as from_username,
        u_from.avatar as from_avatar,
        u_to.username as to_username,
        u_to.avatar as to_avatar
      FROM chat_messages cm
      LEFT JOIN user u_from ON cm.from_user_id = u_from.id
      LEFT JOIN user u_to ON cm.to_user_id = u_to.id
      WHERE ((cm.from_user_id = ? AND cm.to_user_id = ?) OR (cm.from_user_id = ? AND cm.to_user_id = ?))
        AND cm.is_deleted = 0
      ORDER BY cm.create_time DESC
      LIMIT ? OFFSET ?
    `, [from_user_id, to_user_id, to_user_id, from_user_id, parseInt(page_size), offset]);

    res.json({ code: 200, msg: '获取成功', data: rows.reverse() });
  } catch (error) {
    console.error('【获取聊天记录失败】：', error);
    res.status(500).json({ code: 500, msg: '获取聊天记录失败' });
  }
});

// ===================== 标准接口4：POST /api/messages/send 发送消息 =====================
app.post('/api/messages/send', async (req, res) => {
  try {
    const { from_user_id, to_user_id, content, type = 'text' } = req.body;
    if (!from_user_id || !to_user_id || !content || !content.trim()) {
      return res.json({ code: 400, msg: '参数不完整：from_user_id, to_user_id, content不能为空' });
    }

    const [result] = await pool.query(
      'INSERT INTO chat_messages (from_user_id, to_user_id, content, type, status) VALUES (?, ?, ?, ?, ?)',
      [from_user_id, to_user_id, content.trim(), type, 'sent']
    );

    // 更新会话表
    await pool.query(`
      INSERT INTO chat_conversations (user_id, target_user_id, last_message, last_message_time, unread_count)
      VALUES (?, ?, ?, NOW(), 0)
      ON DUPLICATE KEY UPDATE 
        last_message = ?, 
        last_message_time = NOW()
    `, [from_user_id, to_user_id, content.trim(), content.trim()]);

    await pool.query(`
      INSERT INTO chat_conversations (user_id, target_user_id, last_message, last_message_time, unread_count)
      VALUES (?, ?, ?, NOW(), 1)
      ON DUPLICATE KEY UPDATE 
        last_message = ?, 
        last_message_time = NOW(),
        unread_count = unread_count + 1
    `, [to_user_id, from_user_id, content.trim(), content.trim()]);

    res.json({ code: 200, msg: '发送成功', data: { id: result.insertId } });
  } catch (error) {
    console.error('【发送消息失败】：', error);
    res.status(500).json({ code: 500, msg: '发送消息失败' });
  }
});

// ===================== 标准接口5：PUT /api/conversations/top 会话置顶/取消置顶 =====================
app.put('/api/conversations/top', async (req, res) => {
  try {
    const { user_id, target_user_id, is_pinned } = req.body;
    if (!user_id || !target_user_id || is_pinned === undefined) {
      return res.json({ code: 400, msg: '参数不完整' });
    }

    await pool.query(`
      UPDATE chat_conversations 
      SET is_pinned = ?
      WHERE user_id = ? AND target_user_id = ?
    `, [is_pinned, user_id, target_user_id]);

    res.json({ code: 200, msg: is_pinned ? '置顶成功' : '取消置顶成功' });
  } catch (error) {
    console.error('【会话置顶失败】：', error);
    res.status(500).json({ code: 500, msg: '操作失败' });
  }
});

// ===================== 标准接口6：PUT /api/conversations/mute 会话免打扰设置 =====================
app.put('/api/conversations/mute', async (req, res) => {
  try {
    const { user_id, target_user_id, is_muted } = req.body;
    if (!user_id || !target_user_id || is_muted === undefined) {
      return res.json({ code: 400, msg: '参数不完整' });
    }

    await pool.query(`
      UPDATE chat_conversations 
      SET is_muted = ?
      WHERE user_id = ? AND target_user_id = ?
    `, [is_muted, user_id, target_user_id]);

    res.json({ code: 200, msg: is_muted ? '免打扰设置成功' : '取消免打扰成功' });
  } catch (error) {
    console.error('【免打扰设置失败】：', error);
    res.status(500).json({ code: 500, msg: '操作失败' });
  }
});

// ===================== 标准接口7：DELETE /api/conversations/:id 删除会话 =====================
app.delete('/api/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    
    if (!id || !user_id) {
      return res.json({ code: 400, msg: '参数不完整' });
    }

    await pool.query(`
      DELETE FROM chat_conversations 
      WHERE id = ? AND user_id = ?
    `, [id, user_id]);

    res.json({ code: 200, msg: '删除会话成功' });
  } catch (error) {
    console.error('【删除会话失败】：', error);
    res.status(500).json({ code: 500, msg: '删除会话失败' });
  }
});

// ===================== 标准接口8：POST /api/messages/recall 消息撤回 =====================
app.post('/api/messages/recall', async (req, res) => {
  try {
    const { message_id, user_id } = req.body;
    if (!message_id || !user_id) {
      return res.json({ code: 400, msg: '参数不完整' });
    }

    // 检查是否是自己的消息，且在2分钟内
    const [rows] = await pool.query(`
      SELECT * FROM chat_messages 
      WHERE id = ? AND from_user_id = ? AND is_deleted = 0
    `, [message_id, user_id]);

    if (rows.length === 0) {
      return res.json({ code: 403, msg: '无权撤回此消息' });
    }

    const messageTime = new Date(rows[0].create_time);
    const now = new Date();
    const diffMinutes = (now - messageTime) / (1000 * 60);

    if (diffMinutes > 2) {
      return res.json({ code: 400, msg: '消息超过2分钟，无法撤回' });
    }

    await pool.query(`
      UPDATE chat_messages 
      SET is_recalled = 1, content = '消息已撤回'
      WHERE id = ?
    `, [message_id]);

    res.json({ code: 200, msg: '撤回成功' });
  } catch (error) {
    console.error('【撤回消息失败】：', error);
    res.status(500).json({ code: 500, msg: '撤回消息失败' });
  }
});

// ===================== 标准接口9：POST /api/upload/image 图片/文件上传 =====================
app.post('/api/upload/image', async (req, res) => {
  try {
    const { image, user_id } = req.body;
    if (!image || !user_id) {
      return res.json({ code: 400, msg: '参数不完整' });
    }

    // 当前版本：直接返回base64作为URL（后续可扩展为上传到服务器或云存储）
    res.json({ 
      code: 200, 
      msg: '上传成功', 
      data: { url: image } 
    });
  } catch (error) {
    console.error('【图片上传失败】：', error);
    res.status(500).json({ code: 500, msg: '图片上传失败' });
  }
});

// ===================== 标准接口10：GET /api/user/online-status 获取用户在线状态 =====================
app.get('/api/user/online-status', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) {
      return res.json({ code: 400, msg: '参数不完整' });
    }

    const [rows] = await pool.query(`
      SELECT id, online_status, last_online_time 
      FROM user 
      WHERE id = ?
    `, [user_id]);

    if (rows.length === 0) {
      return res.json({ code: 404, msg: '用户不存在' });
    }

    res.json({ code: 200, msg: '获取成功', data: rows[0] });
  } catch (error) {
    console.error('【获取在线状态失败】：', error);
    res.status(500).json({ code: 500, msg: '获取在线状态失败' });
  }
});

// ===================== 兼容原有接口（保留旧接口路径，避免前端报错） =====================
app.get('/api/user/list', async (req, res) => {
  try {
    const { exclude_user_id } = req.query;
    let sql = 'SELECT id, username, avatar, nickname FROM `user`';
    let params = [];
    
    if (exclude_user_id) {
      sql += ' WHERE id != ?';
      params.push(exclude_user_id);
    }
    
    sql += ' ORDER BY id ASC';
    
    const [rows] = await pool.query(sql, params);
    res.json({ code: 200, msg: '获取成功', data: rows });
  } catch (error) {
    console.error('【获取用户列表失败】：', error);
    res.status(500).json({ code: 500, msg: '获取用户列表失败' });
  }
});

app.get('/api/chat/messages', async (req, res) => {
  try {
    const { from_user_id, to_user_id, offset = 0, limit = 20 } = req.query;
    if (!from_user_id || !to_user_id) {
      return res.json({ code: 400, msg: '参数不完整' });
    }

    const [rows] = await pool.query(`
      SELECT 
        cm.*,
        u_from.username as from_username,
        u_from.avatar as from_avatar,
        u_to.username as to_username,
        u_to.avatar as to_avatar
      FROM chat_messages cm
      LEFT JOIN user u_from ON cm.from_user_id = u_from.id
      LEFT JOIN user u_to ON cm.to_user_id = u_to.id
      WHERE ((cm.from_user_id = ? AND cm.to_user_id = ?) OR (cm.from_user_id = ? AND cm.to_user_id = ?))
        AND cm.is_deleted = 0
      ORDER BY cm.create_time DESC
      LIMIT ? OFFSET ?
    `, [from_user_id, to_user_id, to_user_id, from_user_id, parseInt(limit), parseInt(offset)]);

    res.json({ code: 200, msg: '获取成功', data: rows.reverse() });
  } catch (error) {
    console.error('【获取聊天记录失败】：', error);
    res.status(500).json({ code: 500, msg: '获取聊天记录失败' });
  }
});

app.post('/api/chat/send', async (req, res) => {
  try {
    const { from_user_id, to_user_id, content, type = 'text' } = req.body;
    if (!from_user_id || !to_user_id || !content || !content.trim()) {
      return res.json({ code: 400, msg: '参数不完整' });
    }

    const [result] = await pool.query(
      'INSERT INTO chat_messages (from_user_id, to_user_id, content, type, status) VALUES (?, ?, ?, ?, ?)',
      [from_user_id, to_user_id, content.trim(), type, 'sent']
    );

    await pool.query(`
      INSERT INTO chat_conversations (user_id, target_user_id, last_message, last_message_time, unread_count)
      VALUES (?, ?, ?, NOW(), 0)
      ON DUPLICATE KEY UPDATE 
        last_message = ?, 
        last_message_time = NOW()
    `, [from_user_id, to_user_id, content.trim(), content.trim()]);

    await pool.query(`
      INSERT INTO chat_conversations (user_id, target_user_id, last_message, last_message_time, unread_count)
      VALUES (?, ?, ?, NOW(), 1)
      ON DUPLICATE KEY UPDATE 
        last_message = ?, 
        last_message_time = NOW(),
        unread_count = unread_count + 1
    `, [to_user_id, from_user_id, content.trim(), content.trim()]);

    res.json({ code: 200, msg: '发送成功', data: { id: result.insertId } });
  } catch (error) {
    console.error('【发送消息失败】：', error);
    res.status(500).json({ code: 500, msg: '发送消息失败' });
  }
});

// ===================== 替换：兼容旧接口 GET /api/chat/conversations（也支持is_hidden） =====================
app.get('/api/chat/conversations', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) {
      return res.json({ code: 400, msg: '参数不完整' });
    }

    const [rows] = await pool.query(`
      SELECT 
        cc.*,
        u.username,
        u.avatar,
        u.nickname
      FROM chat_conversations cc
      LEFT JOIN user u ON cc.target_user_id = u.id
      WHERE cc.user_id = ?
      ORDER BY cc.is_pinned DESC, cc.updated_at DESC
    `, [user_id]);

    res.json({ code: 200, msg: '获取成功', data: rows });
  } catch (error) {
    console.error('【获取会话列表失败】：', error);
    res.status(500).json({ code: 500, msg: '获取会话列表失败' });
  }
});

app.put('/api/chat/recall', async (req, res) => {
  try {
    const { message_id, user_id } = req.body;
    if (!message_id || !user_id) {
      return res.json({ code: 400, msg: '参数不完整' });
    }

    const [rows] = await pool.query(`
      SELECT * FROM chat_messages 
      WHERE id = ? AND from_user_id = ? AND is_deleted = 0
    `, [message_id, user_id]);

    if (rows.length === 0) {
      return res.json({ code: 403, msg: '无权撤回此消息' });
    }

    const messageTime = new Date(rows[0].create_time);
    const now = new Date();
    const diffMinutes = (now - messageTime) / (1000 * 60);

    if (diffMinutes > 2) {
      return res.json({ code: 400, msg: '消息超过2分钟，无法撤回' });
    }

    await pool.query(`
      UPDATE chat_messages 
      SET is_recalled = 1, content = '消息已撤回'
      WHERE id = ?
    `, [message_id]);

    res.json({ code: 200, msg: '撤回成功' });
  } catch (error) {
    console.error('【撤回消息失败】：', error);
    res.status(500).json({ code: 500, msg: '撤回消息失败' });
  }
});

// ===================== 补充：标记消息已读接口 =====================
app.put('/api/chat/mark-read', async (req, res) => {
  try {
    const { from_user_id, to_user_id } = req.body;
    if (!from_user_id || !to_user_id) {
      return res.json({ code: 400, msg: '参数不完整' });
    }

    // 把对方发给我的消息标记为已读
    await pool.query(`
      UPDATE chat_messages 
      SET status = 'read'
      WHERE from_user_id = ? AND to_user_id = ? AND status != 'read'
    `, [from_user_id, to_user_id]);

    // 把会话的未读数清零
    await pool.query(`
      UPDATE chat_conversations 
      SET unread_count = 0
      WHERE user_id = ? AND target_user_id = ?
    `, [to_user_id, from_user_id]);

    res.json({ code: 200, msg: '标记成功' });
  } catch (error) {
    console.error('【标记已读失败】：', error);
    res.status(500).json({ code: 500, msg: '标记已读失败' });
  }
});

// ===================== 补充：删除消息接口（前端右键菜单用到） =====================
app.put('/api/chat/delete', async (req, res) => {
  try {
    const { message_id, user_id } = req.body;
    if (!message_id || !user_id) {
      return res.json({ code: 400, msg: '参数不完整' });
    }

    await pool.query(`
      UPDATE chat_messages 
      SET is_deleted = 1
      WHERE id = ? AND (from_user_id = ? OR to_user_id = ?)
    `, [message_id, user_id, user_id]);

    res.json({ code: 200, msg: '删除成功' });
  } catch (error) {
    console.error('【删除消息失败】：', error);
    res.status(500).json({ code: 500, msg: '删除消息失败' });
  }
});

// ===================== 新增：PUT /api/conversations/hide 隐藏/取消隐藏对话 =====================
app.put('/api/conversations/hide', async (req, res) => {
  try {
    const { user_id, target_user_id, is_hidden } = req.body;
    if (!user_id || !target_user_id || is_hidden === undefined) {
      return res.json({ code: 400, msg: '参数不完整' });
    }

    await pool.query(`
      UPDATE chat_conversations 
      SET is_hidden = ?
      WHERE user_id = ? AND target_user_id = ?
    `, [is_hidden, user_id, target_user_id]);

    res.json({ code: 200, msg: is_hidden ? '隐藏成功' : '显示成功' });
  } catch (error) {
    console.error('【隐藏对话失败】：', error);
    res.status(500).json({ code: 500, msg: '操作失败' });
  }
});

// ===================== 新增：好友系统接口 =====================

// 1. 搜索用户（支持用户名/邮箱/手机号）
app.get('/api/user/search', async (req, res) => {
  try {
    const { keyword, exclude_user_id } = req.query;
    if (!keyword || keyword.trim() === '') {
      return res.json({ code: 400, msg: '搜索关键词不能为空' });
    }

    const searchKey = `%${keyword.trim()}%`;
    let sql = `
      SELECT id, username, email, phone, avatar, nickname 
      FROM user 
      WHERE (username LIKE ? OR email LIKE ? OR phone LIKE ?)
    `;
    let params = [searchKey, searchKey, searchKey];
    
    if (exclude_user_id) {
      sql += ' AND id != ?';
      params.push(exclude_user_id);
    }
    
    const [rows] = await pool.query(sql, params);
    res.json({ code: 200, msg: '搜索成功', data: rows });
  } catch (error) {
    console.error('【搜索用户失败】：', error);
    res.status(500).json({ code: 500, msg: '搜索失败' });
  }
});

// 2. 发送好友申请
app.post('/api/friend/apply', async (req, res) => {
  try {
    const { from_user_id, to_user_id, apply_reason = '我想添加你为好友' } = req.body;
    if (!from_user_id || !to_user_id) {
      return res.json({ code: 400, msg: '参数不完整' });
    }
    if (from_user_id === to_user_id) {
      return res.json({ code: 400, msg: '不能添加自己为好友' });
    }

    // 检查是否已经是好友
    const [checkFriend] = await pool.query(`
      SELECT * FROM friend_relation 
      WHERE user_id = ? AND friend_id = ? AND status = 1
    `, [from_user_id, to_user_id]);
    if (checkFriend.length > 0) {
      return res.json({ code: 400, msg: '对方已经是你的好友了' });
    }

    // 检查是否已经发送过申请
    const [checkApply] = await pool.query(`
      SELECT * FROM friend_apply 
      WHERE from_user_id = ? AND to_user_id = ? AND status = 0
    `, [from_user_id, to_user_id]);
    if (checkApply.length > 0) {
      return res.json({ code: 400, msg: '已经发送过好友申请，请等待对方处理' });
    }

    // 插入申请
    await pool.query(
      'INSERT INTO friend_apply (from_user_id, to_user_id, apply_reason) VALUES (?, ?, ?)',
      [from_user_id, to_user_id, apply_reason]
    );

    res.json({ code: 200, msg: '好友申请已发送' });
  } catch (error) {
    console.error('【发送好友申请失败】：', error);
    res.status(500).json({ code: 500, msg: '发送失败' });
  }
});

// 3. 获取好友申请列表（我收到的）
app.get('/api/friend/apply/list', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) {
      return res.json({ code: 400, msg: '参数不完整' });
    }

    const [rows] = await pool.query(`
      SELECT 
        fa.*,
        u_from.username as from_username,
        u_from.avatar as from_avatar,
        u_from.nickname as from_nickname
      FROM friend_apply fa
      LEFT JOIN user u_from ON fa.from_user_id = u_from.id
      WHERE fa.to_user_id = ?
      ORDER BY fa.created_at DESC
    `, [user_id]);

    res.json({ code: 200, msg: '获取成功', data: rows });
  } catch (error) {
    console.error('【获取好友申请失败】：', error);
    res.status(500).json({ code: 500, msg: '获取失败' });
  }
});

// 4. 处理好友申请（同意/拒绝）
app.put('/api/friend/apply/handle', async (req, res) => {
  try {
    const { apply_id, user_id, status } = req.body;
    if (!apply_id || !user_id || status === undefined) {
      return res.json({ code: 400, msg: '参数不完整' });
    }

    // 检查申请
    const [applyRows] = await pool.query(`
      SELECT * FROM friend_apply 
      WHERE id = ? AND to_user_id = ? AND status = 0
    `, [apply_id, user_id]);
    if (applyRows.length === 0) {
      return res.json({ code: 400, msg: '申请不存在或已处理' });
    }

    const apply = applyRows[0];

    // 更新申请状态
    await pool.query(
      'UPDATE friend_apply SET status = ? WHERE id = ?',
      [status, apply_id]
    );

    // 如果同意，添加好友关系
    if (status === 1) {
      // 双向添加好友关系
      await pool.query(`
        INSERT INTO friend_relation (user_id, friend_id, status)
        VALUES (?, ?, 1)
        ON DUPLICATE KEY UPDATE status = 1
      `, [user_id, apply.from_user_id]);
      
      await pool.query(`
        INSERT INTO friend_relation (user_id, friend_id, status)
        VALUES (?, ?, 1)
        ON DUPLICATE KEY UPDATE status = 1
      `, [apply.from_user_id, user_id]);
    }

    res.json({ code: 200, msg: status === 1 ? '已同意好友申请' : '已拒绝好友申请' });
  } catch (error) {
    console.error('【处理好友申请失败】：', error);
    res.status(500).json({ code: 500, msg: '处理失败' });
  }
});

// 5. 获取我的好友列表
app.get('/api/friend/list', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) {
      return res.json({ code: 400, msg: '参数不完整' });
    }

    const [rows] = await pool.query(`
      SELECT 
        fr.*,
        u.id as friend_user_id,
        u.username,
        u.avatar,
        u.nickname,
        u.online_status
      FROM friend_relation fr
      LEFT JOIN user u ON fr.friend_id = u.id
      WHERE fr.user_id = ? AND fr.status = 1
      ORDER BY u.username ASC
    `, [user_id]);

    res.json({ code: 200, msg: '获取成功', data: rows });
  } catch (error) {
    console.error('【获取好友列表失败】：', error);
    res.status(500).json({ code: 500, msg: '获取失败' });
  }
});

// ===================== 启动服务（必须在所有接口之后！） =====================
app.listen(PORT, () => {
  console.log(`✅ 后端服务已启动：http://localhost:${PORT}`);
  console.log(`✅ 完整接口列表已加载`);
  console.log(`✅ 标准接口列表：`);
  console.log(`  1. GET  /api/contacts              - 获取好友列表`);
  console.log(`  2. GET  /api/conversations         - 获取会话列表`);
  console.log(`  3. GET  /api/messages              - 分页获取聊天记录`);
  console.log(`  4. POST /api/messages/send         - 发送消息`);
  console.log(`  5. PUT  /api/conversations/top     - 会话置顶/取消置顶`);
  console.log(`  6. PUT  /api/conversations/mute    - 会话免打扰设置`);
  console.log(`  7. DELETE /api/conversations/:id   - 删除会话`);
  console.log(`  8. POST /api/messages/recall       - 消息撤回`);
  console.log(`  9. POST /api/upload/image          - 图片/文件上传`);
  console.log(` 10. GET  /api/user/online-status    - 获取用户在线状态`);
  console.log(` 11. PUT  /api/conversations/hide    - 隐藏/取消隐藏对话`);
});
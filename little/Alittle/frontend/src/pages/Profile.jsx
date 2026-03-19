// src/pages/Profile.jsx 个人中心页面
import { useState, useEffect } from 'react';
import request from '../api/request';

const Profile = () => {
  const [userInfo, setUserInfo] = useState({});
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');

  // 获取用户信息
  const getUserInfo = async () => {
    try {
      const res = await request.get('/api/user/info', { params: { user_id: currentUser.id } });
      if (res.code === 200) {
        setUserInfo(res.data);
        setForm(res.data);
      }
    } catch (err) {
      console.error('获取用户信息失败：', err);
    }
  };

  // 表单变化
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // 保存修改
  const handleSave = async () => {
    try {
      setLoading(true);
      const res = await request.put('/api/user/update', {
        user_id: currentUser.id,
        nickname: form.nickname,
        phone: form.phone,
        bio: form.bio,
        avatar: form.avatar
      });

      if (res.code === 200) {
        alert('保存成功！');
        setEditing(false);
        getUserInfo();
      } else {
        alert(res.msg || '保存失败');
      }
    } catch (err) {
      console.error('保存失败：', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserInfo();
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">个人中心</h2>
        <p className="text-gray-600">管理你的个人资料</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        {/* 头像区域 */}
        <div className="flex items-center gap-6 mb-8 pb-8 border-b">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-4xl text-blue-600 overflow-hidden">
            {userInfo.avatar ? (
              <img src={userInfo.avatar} alt="头像" className="w-full h-full object-cover" />
            ) : (
              (userInfo.username || 'U').charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">{userInfo.nickname || userInfo.username}</h3>
            <p className="text-gray-500">{userInfo.email}</p>
            <p className="text-sm text-gray-400 mt-1">注册时间：{userInfo.create_time ? new Date(userInfo.create_time).toLocaleDateString() : '-'}</p>
          </div>
        </div>

        {/* 个人资料表单 */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2">用户名</label>
              <input
                type="text"
                value={userInfo.username || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-400 mt-1">用户名不可修改</p>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">昵称</label>
              <input
                type="text"
                name="nickname"
                value={form.nickname || ''}
                onChange={handleFormChange}
                disabled={!editing}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none ${editing ? 'border-gray-300 focus:border-blue-500' : 'border-gray-200 bg-gray-50'}`}
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">邮箱</label>
              <input
                type="email"
                value={userInfo.email || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">手机号</label>
              <input
                type="text"
                name="phone"
                value={form.phone || ''}
                onChange={handleFormChange}
                disabled={!editing}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none ${editing ? 'border-gray-300 focus:border-blue-500' : 'border-gray-200 bg-gray-50'}`}
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-700 mb-2">个人简介</label>
            <textarea
              name="bio"
              value={form.bio || ''}
              onChange={handleFormChange}
              disabled={!editing}
              rows={4}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none resize-none ${editing ? 'border-gray-300 focus:border-blue-500' : 'border-gray-200 bg-gray-50'}`}
              placeholder="介绍一下自己吧..."
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">头像链接</label>
            <input
              type="text"
              name="avatar"
              value={form.avatar || ''}
              onChange={handleFormChange}
              disabled={!editing}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none ${editing ? 'border-gray-300 focus:border-blue-500' : 'border-gray-200 bg-gray-50'}`}
              placeholder="粘贴头像图片链接"
            />
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-4 mt-8 pt-6 border-t">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              编辑资料
            </button>
          ) : (
            <>
              <button
                onClick={() => { setEditing(false); setForm(userInfo); }}
                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
              >
                {loading ? '保存中...' : '保存修改'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
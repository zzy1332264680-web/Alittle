// src/pages/Profile.jsx 个人中心页面（优化头像上传版）
import { useState, useEffect, useRef } from 'react';
import request from '../api/request';

const Profile = () => {
  const [userInfo, setUserInfo] = useState({});
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const fileInputRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');

  // 获取用户信息
  const getUserInfo = async () => {
    try {
      const res = await request.get('/api/user/info', { params: { user_id: currentUser.id } });
      if (res.code === 200) {
        setUserInfo(res.data);
        setForm(res.data);
        setAvatarPreview(res.data.avatar || '');
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

  // 头像本地上传+压缩处理
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 验证文件格式
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('只支持上传 JPG、PNG 格式的图片');
      return;
    }

    // 验证文件大小（限制2MB，避免base64过长）
    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过 2MB');
      return;
    }

    // 图片压缩+预览
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        // 限制图片最大宽高为800px，压缩尺寸
        const canvas = document.createElement('canvas');
        const maxWidth = 800;
        const maxHeight = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = height * (maxWidth / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = width * (maxHeight / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // 转为压缩后的base64
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        setAvatarPreview(compressedBase64);
        setForm({ ...form, avatar: compressedBase64 });
      };
    };
    reader.readAsDataURL(file);
  };

  // 保存修改
  const handleSave = async () => {
    try {
      setLoading(true);
      const res = await request.put('/api/user/update', {
        user_id: currentUser.id,
        username: form.username,
        email: form.email,
        nickname: form.nickname,
        phone: form.phone,
        bio: form.bio,
        avatar: form.avatar
      });

      if (res.code === 200) {
        alert('保存成功！');
        // 更新本地存储的用户信息
        const updatedUser = { ...currentUser, ...res.data };
        localStorage.setItem('userInfo', JSON.stringify(updatedUser));
        setEditing(false);
        getUserInfo();
        // 刷新页面，让全局头像同步更新
        window.location.reload();
      } else {
        alert(res.msg || '保存失败');
      }
    } catch (err) {
      console.error('保存失败：', err);
    } finally {
      setLoading(false);
    }
  };

  // 计算是否可以修改用户名
  const canModifyUsername = () => {
    if (!userInfo.username_last_modified) return true;
    const lastModified = new Date(userInfo.username_last_modified);
    const now = new Date();
    const diffMonths = (now.getFullYear() - lastModified.getFullYear()) * 12 + (now.getMonth() - lastModified.getMonth());
    return diffMonths >= 3;
  };

  // 获取下次可修改用户名的时间
  const getNextModifyTime = () => {
    if (!userInfo.username_last_modified) return null;
    const lastModified = new Date(userInfo.username_last_modified);
    const nextTime = new Date(lastModified);
    nextTime.setMonth(nextTime.getMonth() + 3);
    return nextTime.toLocaleDateString();
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
        {/* 头像区域（支持本地上传） */}
        <div className="flex items-center gap-6 mb-8 pb-8 border-b">
          <div className="relative">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-4xl text-blue-600 font-bold overflow-hidden">
              {avatarPreview ? (
                <img src={avatarPreview} alt="头像" className="w-full h-full object-cover" />
              ) : (
                (userInfo.username || 'U').charAt(0).toUpperCase()
              )}
            </div>
            {editing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors shadow"
              >
                📷
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              hidden
              onChange={handleAvatarUpload}
            />
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
            {/* 用户名（可修改，有3个月限制） */}
            <div>
              <label className="block text-gray-700 mb-2">用户名</label>
              <input
                type="text"
                name="username"
                value={form.username || ''}
                onChange={handleFormChange}
                disabled={!editing || !canModifyUsername()}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none ${
                  editing && canModifyUsername()
                    ? 'border-gray-300 focus:border-blue-500'
                    : 'border-gray-200 bg-gray-50 text-gray-500'
                }`}
              />
              {editing && !canModifyUsername() && (
                <p className="text-xs text-orange-500 mt-1">
                  用户名每3个月只能修改一次，下次可修改时间：{getNextModifyTime()}
                </p>
              )}
              {!editing && (
                <p className="text-xs text-gray-400 mt-1">点击「编辑资料」可修改用户名</p>
              )}
            </div>

            {/* 昵称 */}
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

            {/* 邮箱（可修改） */}
            <div>
              <label className="block text-gray-700 mb-2">邮箱</label>
              <input
                type="email"
                name="email"
                value={form.email || ''}
                onChange={handleFormChange}
                disabled={!editing}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none ${editing ? 'border-gray-300 focus:border-blue-500' : 'border-gray-200 bg-gray-50'}`}
              />
            </div>

            {/* 手机号 */}
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

          {/* 个人简介 */}
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
                onClick={() => { setEditing(false); setForm(userInfo); setAvatarPreview(userInfo.avatar || ''); }}
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
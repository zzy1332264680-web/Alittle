import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx'; // 新增：导入鉴权钩子
import request from '../api/request';

const Login = () => {
  // 登录表单状态
  const [form, setForm] = useState({
    account: '',    // 用户名/邮箱
    password: ''    // 密码
  });

  // 错误提示
  const [errors, setErrors] = useState({
    account: '',
    password: ''
  });

  // 密码显隐
  const [showPwd, setShowPwd] = useState(false);
  // 加载状态
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); // 新增：获取更新登录状态的方法

  // 账号输入验证
  const handleAccountChange = (e) => {
    const value = e.target.value;
    setForm({ ...form, account: value });
    let error = '';
    if (value && value.length < 2) {
      error = '请输入正确的用户名/邮箱';
    }
    setErrors({ ...errors, account: error });
  };

  // 密码输入验证
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setForm({ ...form, password: value });
    let error = '';
    if (value && value.length < 6) {
      error = '密码长度需为6-20位';
    }
    setErrors({ ...errors, password: error });
  };

  // 登录提交（对接后端登录接口）
  const handleSubmit = async (e) => {
    e.preventDefault();
    let hasError = false;
    const newErrors = { ...errors };

    // 前端验证
    if (!form.account) {
      newErrors.account = '请输入用户名/邮箱';
      hasError = true;
    }
    if (!form.password) {
      newErrors.password = '请输入密码';
      hasError = true;
    } else if (form.password.length < 6 || form.password.length > 20) {
      newErrors.password = '密码长度需为6-20位';
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    // 调用后端登录接口
    try {
      setLoading(true);
      const res = await request.post('/api/auth/login', {
        account: form.account, // 用户名/邮箱
        password: form.password
      });

      if (res.code === 200) {
        alert('登录成功！');
        // 核心：更新登录状态，触发鉴权逻辑
        login(res.data.id);
        // 存储用户完整信息，供后续页面使用
        localStorage.setItem('userInfo', JSON.stringify(res.data));
        // 跳转到首页
        navigate('/');
      } else {
        alert(res.msg || '登录失败，请检查账号密码');
      }
    } catch (err) {
      console.error('登录失败：', err);
      // 404错误的特殊提示
      if (err.response?.status === 404) {
        alert('登录接口未找到，请检查后端是否添加了/api/auth/login接口');
      } else {
        alert(err.response?.data?.msg || '网络错误，请检查后端服务是否启动');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-8 text-blue-600">登录</h2>
        
        <form onSubmit={handleSubmit}>
          {/* 用户名/邮箱输入框 */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">邮箱/用户名</label>
            <input
              type="text"
              value={form.account}
              onChange={handleAccountChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none ${errors.account ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
              placeholder="请输入用户名或邮箱"
            />
            {errors.account && <p className="text-red-500 text-sm mt-1">{errors.account}</p>}
          </div>

          {/* 密码输入框 + 显隐按钮 */}
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">密码</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={handlePasswordChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none ${errors.password ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                placeholder="请输入密码"
                maxLength={20}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPwd ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          {/* 登录按钮 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        {/* 注册跳转链接 */}
        <div className="text-center mt-6 text-sm text-gray-600">
          还没有账号？<Link to="/register" className="text-blue-600 hover:underline">立即注册</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
// src/pages/Login.jsx（多语言修复版）
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useLanguage } from '../hooks/useLanguage.jsx';
import request from '../api/request';

const Login = () => {
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    account: '',
    password: ''
  });

  const [errors, setErrors] = useState({
    account: '',
    password: ''
  });

  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccountChange = (e) => {
    const value = e.target.value;
    setForm({ ...form, account: value });
    let error = '';
    if (value && value.length < 2) {
      error = '请输入正确的用户名/邮箱';
    }
    setErrors({ ...errors, account: error });
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setForm({ ...form, password: value });
    let error = '';
    if (value && value.length < 6) {
      error = '密码长度需为6-20位';
    }
    setErrors({ ...errors, password: error });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let hasError = false;
    const newErrors = { ...errors };

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

    try {
      setLoading(true);
      const res = await request.post('/api/auth/login', {
        account: form.account,
        password: form.password
      });

      if (res.code === 200) {
        alert(t('login.loginSuccess'));
        login(res.data.id);
        localStorage.setItem('userInfo', JSON.stringify(res.data));
        navigate('/');
      } else {
        alert(res.msg || t('login.loginFailed'));
      }
    } catch (err) {
      console.error('登录失败：', err);
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
        <h2 className="text-2xl font-bold text-center mb-8 text-blue-600">{t('login.title')}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">{t('login.account')}</label>
            <input
              type="text"
              value={form.account}
              onChange={handleAccountChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none ${errors.account ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
              placeholder={t('login.accountPlaceholder')}
            />
            {errors.account && <p className="text-red-500 text-sm mt-1">{errors.account}</p>}
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">{t('login.password')}</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={handlePasswordChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none ${errors.password ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                placeholder={t('login.passwordPlaceholder')}
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t('common.loading') : t('login.login')}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-600">
          {t('login.noAccount')}<Link to="/register" className="text-blue-600 hover:underline">{t('login.registerNow')}</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
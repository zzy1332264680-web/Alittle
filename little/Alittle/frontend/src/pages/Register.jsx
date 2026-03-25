// src/pages/Register.jsx（多语言修复版）
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import request from '../api/request';

const validateEmail = (email) => {
  const reg = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return reg.test(email);
};

const validateNickname = (nickname) => {
  const reg = /^[\u4e00-\u9fa5a-zA-Z0-9_]{2,20}$/;
  return reg.test(nickname);
};

const getPasswordStrength = (password) => {
  if (password.length < 8) return 'weak';
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);
  if (hasLetter && hasNumber && hasSymbol) return 'strong';
  if ((hasLetter && hasNumber) || (hasLetter && hasSymbol) || (hasNumber && hasSymbol)) return 'medium';
  return 'weak';
};

const Register = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nickname: '',
    email: '',
    password: '',
    confirmPwd: '',
    agree: false
  });

  const [errors, setErrors] = useState({
    nickname: '',
    email: '',
    password: '',
    confirmPwd: ''
  });

  const [showPwd, setShowPwd] = useState(false);
  const [pwdStrength, setPwdStrength] = useState('weak');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState('');

  const handleNicknameChange = async (e) => {
    const value = e.target.value;
    setForm({ ...form, nickname: value });
    let error = '';

    if (value.length < 2 || value.length > 20) {
      error = '用户名需为2-20位';
    } else if (!validateNickname(value)) {
      error = '用户名仅允许中文、字母、数字、下划线';
    }

    if (!error && value) {
      try {
        const res = await request.post('/api/auth/check-nickname', { nickname: value });
        if (!res.success) {
          error = res.msg || t('register.nicknameExists');
        }
      } catch (err) {
        console.error('检查用户名失败：', err);
        error = '用户名验证失败，请稍后重试';
      }
    }

    setErrors({ ...errors, nickname: error });
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setForm({ ...form, email: value });
    let error = '';
    if (value && !validateEmail(value)) {
      error = '请输入正确的邮箱';
    }
    setErrors({ ...errors, email: error });
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setForm({ ...form, password: value });
    let error = '';

    if (value && (value.length < 6 || value.length > 20)) {
      error = '密码长度需为6-20位';
    } else if (value && !(/[a-zA-Z]/.test(value) && /\d/.test(value))) {
      error = '密码需包含字母和数字';
    }

    setErrors({ ...errors, password: error });
    setPwdStrength(getPasswordStrength(value));
    if (form.confirmPwd) {
      handleConfirmPwdChange({ target: { value: form.confirmPwd } });
    }
  };

  const handleConfirmPwdChange = (e) => {
    const value = e.target.value;
    setForm({ ...form, confirmPwd: value });
    let error = '';
    if (value && value !== form.password) {
      error = t('register.passwordNotMatch');
    }
    setErrors({ ...errors, confirmPwd: error });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let hasError = false;
    const newErrors = { ...errors };

    if (!form.nickname) {
      newErrors.nickname = '请输入用户名';
      hasError = true;
    } else if (form.nickname.length < 2 || form.nickname.length > 20) {
      newErrors.nickname = '用户名需为2-20位';
      hasError = true;
    } else if (!validateNickname(form.nickname)) {
      newErrors.nickname = '用户名仅允许中文、字母、数字、下划线';
      hasError = true;
    }

    if (!form.email) {
      newErrors.email = '请输入邮箱';
      hasError = true;
    } else if (!validateEmail(form.email)) {
      newErrors.email = '请输入正确的邮箱';
      hasError = true;
    }

    if (!form.password) {
      newErrors.password = '请输入密码';
      hasError = true;
    } else if (form.password.length < 6 || form.password.length > 20) {
      newErrors.password = '密码长度需为6-20位';
      hasError = true;
    } else if (!(/[a-zA-Z]/.test(form.password) && /\d/.test(form.password))) {
      newErrors.password = '密码需包含字母和数字';
      hasError = true;
    }

    if (!form.confirmPwd) {
      newErrors.confirmPwd = '请确认密码';
      hasError = true;
    } else if (form.confirmPwd !== form.password) {
      newErrors.confirmPwd = t('register.passwordNotMatch');
      hasError = true;
    }

    if (!form.agree) {
      alert('请同意用户协议和隐私政策');
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const res = await request.post('/api/auth/register', {
        nickname: form.nickname,
        email: form.email,
        password: form.password
      });

      if (res.code === 200) {
        alert(t('register.registerSuccess'));
        navigate('/login');
      } else {
        alert(res.msg || t('common.failed'));
      }
    } catch (err) {
      console.error('注册失败：', err);
      alert(err.response?.data?.msg || '网络错误，请检查后端服务是否启动');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthStyle = () => {
    switch (pwdStrength) {
      case 'weak': return 'bg-red-400 w-1/3';
      case 'medium': return 'bg-yellow-400 w-2/3';
      case 'strong': return 'bg-green-400 w-full';
      default: return 'bg-gray-200 w-0';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-8 text-blue-600">{t('register.title')}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">{t('register.nickname')}</label>
            <input
              type="text"
              value={form.nickname}
              onChange={handleNicknameChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none ${errors.nickname ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
              placeholder={t('register.nicknamePlaceholder')}
              maxLength={20}
            />
            {errors.nickname && <p className="text-red-500 text-sm mt-1">{errors.nickname}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">{t('register.email')}</label>
            <input
              type="email"
              value={form.email}
              onChange={handleEmailChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none ${errors.email ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
              placeholder={t('register.emailPlaceholder')}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div className="mb-2">
            <label className="block text-gray-700 mb-2">{t('register.password')}</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={handlePasswordChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none ${errors.password ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                placeholder={t('register.passwordPlaceholder')}
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

          {form.password && (
            <div className="mb-4 h-2 w-full bg-gray-200 rounded overflow-hidden">
              <div className={`h-full ${getStrengthStyle()} transition-all duration-300`}></div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">{t('register.confirmPassword')}</label>
            <input
              type={showPwd ? 'text' : 'password'}
              value={form.confirmPwd}
              onChange={handleConfirmPwdChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none ${errors.confirmPwd ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
              placeholder={t('register.confirmPasswordPlaceholder')}
              maxLength={20}
            />
            {errors.confirmPwd && <p className="text-red-500 text-sm mt-1">{errors.confirmPwd}</p>}
          </div>

          <div className="mb-6 flex items-center">
            <input
              type="checkbox"
              checked={form.agree}
              onChange={(e) => setForm({ ...form, agree: e.target.checked })}
              className="mr-2 h-4 w-4 text-blue-600"
            />
            <p className="text-sm text-gray-600">
              我已阅读并同意
              <span 
                onClick={() => setShowModal('agreement')} 
                className="text-blue-600 cursor-pointer ml-1 hover:underline"
              >《用户协议》</span>
              和
              <span 
                onClick={() => setShowModal('privacy')} 
                className="text-blue-600 cursor-pointer ml-1 hover:underline"
              >《隐私政策》</span>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !form.agree}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t('common.loading') : t('register.register')}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-600">
          {t('register.hasAccount')}<Link to="/login" className="text-blue-600 hover:underline">{t('register.loginNow')}</Link>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-800">
              {showModal === 'agreement' ? '用户协议' : '隐私政策'}
            </h3>
            <div className="text-gray-600 text-sm leading-relaxed">
              {showModal === 'agreement' ? (
                <>
                  <p className="mb-2">1. 注册条件：您必须年满18周岁，方可注册并使用本平台服务。</p>
                  <p className="mb-2">2. 账号使用：您应对自己的账号密码保密，禁止转借、出租账号。</p>
                  <p className="mb-2">3. 责任限制：平台不对您的操作失误、网络问题导致的损失承担责任。</p>
                  <p>4. 协议变更：平台可修改本协议，修改后将通过站内通知告知您。</p>
                </>
              ) : (
                <>
                  <p className="mb-2">1. 信息收集：我们仅收集必要的邮箱、用户名等信息，用于账号注册和登录。</p>
                  <p className="mb-2">2. 信息使用：您的个人信息仅用于提供服务，不会用于其他商业用途。</p>
                  <p className="mb-2">3. 信息保护：我们采用加密技术保护您的信息，防止泄露。</p>
                  <p>4. 信息删除：您可随时申请注销账号，我们将删除您的所有个人信息。</p>
                </>
              )}
            </div>
            <button
              onClick={() => setShowModal('')}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              我知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
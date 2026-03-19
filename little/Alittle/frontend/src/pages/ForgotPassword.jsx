// src/pages/ForgotPassword.jsx
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-6 text-blue-600">忘记密码</h2>
        <p className="text-gray-600 mb-8">该功能正在开发中，您可以返回登录页尝试其他方式登录。</p>
        <Link
          to="/login"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          返回登录
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
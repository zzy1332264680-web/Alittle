import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-8">页面不存在 😕</p>
      <button
        onClick={() => navigate('/')}
        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
      >
        返回首页
      </button>
    </div>
  );
};

// 关键：必须用export default导出，否则会报"没有default导出"错误
export default NotFound;
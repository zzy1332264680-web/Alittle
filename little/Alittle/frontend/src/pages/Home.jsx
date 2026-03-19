// src/pages/Home.jsx 首页功能导航
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  // 功能导航数据
  const features = [
    {
      id: 1,
      title: '好友聊天',
      description: '和好友实时聊天，分享生活点滴',
      icon: '💬',
      path: '/chat',
      color: 'blue'
    },
    {
      id: 2,
      title: '论坛发帖',
      description: '分享想法，参与讨论，认识新朋友',
      icon: '📝',
      path: '/forum',
      color: 'purple'
    },
    {
      id: 3,
      title: '闲置交易',
      description: '买卖闲置物品，让资源流动起来',
      icon: '🛒',
      path: '/market',
      color: 'green'
    }
  ];

  // 颜色映射
  const colorMap = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    green: 'bg-green-600 hover:bg-green-700'
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* 首页欢迎区 */}
      <div className="text-center mb-12 pt-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">欢迎来到 Little Shop</h2>
        <p className="text-gray-600 text-lg">选择下方功能，开始你的体验</p>
      </div>

      {/* 功能导航卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature) => (
          <div 
            key={feature.id}
            className="bg-white rounded-lg shadow-md p-8 hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
            onClick={() => navigate(feature.path)}
          >
            <div className="text-5xl mb-4">{feature.icon}</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">{feature.title}</h3>
            <p className="text-gray-600 mb-6">{feature.description}</p>
            <button className={`w-full py-3 text-white rounded-md transition-colors ${colorMap[feature.color]}`}>
              立即进入
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
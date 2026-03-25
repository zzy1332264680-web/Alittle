// src/pages/Home.jsx 首页功能导航（多语言修复版）
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';

const Home = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // 功能导航数据
  const features = [
    {
      id: 1,
      titleKey: 'nav.chat',
      descKey: 'home.chatDesc',
      icon: '💬',
      path: '/chat',
      color: 'blue'
    },
    {
      id: 2,
      titleKey: 'nav.forum',
      descKey: 'home.forumDesc',
      icon: '📝',
      path: '/forum',
      color: 'purple'
    },
    {
      id: 3,
      titleKey: 'nav.market',
      descKey: 'home.marketDesc',
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
        <h2 className="text-3xl font-bold text-gray-800 mb-4">{t('home.title')}</h2>
        <p className="text-gray-600 text-lg">{t('home.subtitle')}</p>
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
            <h3 className="text-2xl font-bold text-gray-800 mb-3">{t(feature.titleKey)}</h3>
            <p className="text-gray-600 mb-6">{t(feature.descKey)}</p>
            <button className={`w-full py-3 text-white rounded-md transition-colors ${colorMap[feature.color]}`}>
              {t('home.enterNow')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
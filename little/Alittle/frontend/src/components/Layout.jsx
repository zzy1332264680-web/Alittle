// src/components/Layout.jsx 带头像下拉菜单+个人中心导航的全局布局（支持用户头像）
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useState, useRef, useEffect } from 'react';

const Layout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 退出登录逻辑
  const handleLogout = () => {
    logout();
    localStorage.removeItem('userInfo');
    alert('退出登录成功！');
    navigate('/login');
  };

  // 导航菜单数据（新增个人中心）
  const navItems = [
    { path: '/', label: '首页' },
    { path: '/chat', label: '好友聊天' },
    { path: '/forum', label: '论坛发帖' },
    { path: '/market', label: '闲置交易' },
    { path: '/dashboard', label: '个人中心' }
  ];

  // 下拉菜单数据
  const dropdownItems = [
    { path: '/profile', label: '个人中心', icon: '👤' },
    { path: '/settings', label: '设置', icon: '⚙️' },
    { type: 'divider' },
    { label: '退出登录', icon: '🚪', onClick: handleLogout }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* 头部导航 */}
      <header className="bg-blue-600 text-white">
        {/* 顶部栏：Logo + 头像下拉菜单 */}
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold cursor-pointer" onClick={() => navigate('/')}>
            Alittle
          </h1>
          
          {/* 头像下拉菜单 */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 hover:bg-blue-700 px-3 py-2 rounded-md transition-colors"
            >
              {/* 头像（支持用户上传的头像） */}
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                {userInfo.avatar ? (
                  <img src={userInfo.avatar} alt="头像" className="w-full h-full object-cover" />
                ) : (
                  (userInfo.username || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <span className="text-sm">{userInfo.username || '用户'}</span>
              <span className={`transform transition-transform ${showDropdown ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {/* 下拉菜单内容 */}
            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                {dropdownItems.map((item, index) => (
                  item.type === 'divider' ? (
                    <div key={index} className="border-t border-gray-100 my-2" />
                  ) : (
                    <button
                      key={index}
                      onClick={() => {
                        setShowDropdown(false);
                        if (item.onClick) {
                          item.onClick();
                        } else if (item.path) {
                          navigate(item.path);
                        }
                      }}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  )
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 功能导航栏 */}
        <nav className="bg-blue-700">
          <div className="container mx-auto px-6">
            <ul className="flex gap-8">
              {navItems.map((item) => (
                <li key={item.path}>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`py-3 px-2 transition-colors ${
                      location.pathname === item.path 
                        ? 'border-b-2 border-white font-semibold' 
                        : 'text-blue-100 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </header>
      
      {/* 主内容区（渲染对应页面） */}
      <main className="flex-1 container mx-auto py-8 px-6 bg-gray-50">
        <Outlet />
      </main>
      
      {/* 底部 */}
      <footer className="bg-gray-200 py-4 px-6 text-center text-gray-600 text-sm">
        © 2026 Alittle 版权所有
      </footer>
    </div>
  );
};

export default Layout;
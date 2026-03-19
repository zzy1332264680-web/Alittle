import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ShoppingCart, User, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Header = () => {
  const { isLogin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // 移动端菜单开关

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-primary text-2xl font-bold">
          SimpleShop
        </Link>

        {/* PC端导航（768px以上显示） */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="hover:text-primary transition-colors">首页</Link>
          <Link to="/chat" className="hover:text-primary transition-colors">聊天</Link>
          <Link to="#" className="hover:text-primary transition-colors flex items-center gap-1">
            <ShoppingCart size={18} /> 购物车
          </Link>
          {isLogin ? (
            <button onClick={logout} className="text-gray-600 hover:text-primary">登出</button>
          ) : (
            <Link to="/login" className="btn-primary">登录</Link>
          )}
        </nav>

        {/* 移动端菜单按钮（768px以下显示） */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-gray-700"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* 移动端导航菜单 */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white px-4 py-2 shadow-md">
          <nav className="flex flex-col gap-3 py-2">
            <Link to="/" className="hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>首页</Link>
            <Link to="/chat" className="hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>聊天</Link>
            <Link to="#" className="hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>购物车</Link>
            {isLogin ? (
              <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="text-gray-600 hover:text-primary text-left">登出</button>
            ) : (
              <Link to="/login" className="btn-primary text-center" onClick={() => setMobileMenuOpen(false)}>登录</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
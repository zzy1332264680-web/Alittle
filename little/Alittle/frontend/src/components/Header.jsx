// src/components/Header.jsx（最终修复版，Logo固定为Чуть-чуть，多语言适配）
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Header = () => {
  const { isLogin, logout } = useAuth();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* 【核心修复】Logo固定为 Чуть-чуть，彻底删除Alittle */}
        <Link to="/" className="text-primary text-2xl font-bold">
          Чуть-чуть
        </Link>

        {/* PC端导航栏（多语言版） */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="hover:text-primary transition-colors">{t('nav.home')}</Link>
          <Link to="/chat" className="hover:text-primary transition-colors">{t('nav.chat')}</Link>
          <Link to="/forum" className="hover:text-primary transition-colors">{t('nav.forum')}</Link>
          <Link to="/market" className="hover:text-primary transition-colors">{t('nav.market')}</Link>
          <Link to="/profile" className="hover:text-primary transition-colors">{t('nav.profile')}</Link>
          <Link to="#" className="hover:text-primary transition-colors flex items-center gap-1">
            <ShoppingCart size={18} /> {t('nav.cart')}
          </Link>
          {isLogin ? (
            <button onClick={logout} className="text-gray-600 hover:text-primary">{t('nav.logout')}</button>
          ) : (
            <Link to="/login" className="btn-primary">{t('nav.login')}</Link>
          )}
        </nav>

        {/* 移动端菜单按钮 */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-gray-700"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* 移动端导航菜单（多语言版） */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white px-4 py-2 shadow-md">
          <nav className="flex flex-col gap-3 py-2">
            <Link to="/" className="hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>{t('nav.home')}</Link>
            <Link to="/chat" className="hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>{t('nav.chat')}</Link>
            <Link to="/forum" className="hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>{t('nav.forum')}</Link>
            <Link to="/market" className="hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>{t('nav.market')}</Link>
            <Link to="/profile" className="hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>{t('nav.profile')}</Link>
            <Link to="#" className="hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>{t('nav.cart')}</Link>
            {isLogin ? (
              <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="text-gray-600 hover:text-primary text-left">{t('nav.logout')}</button>
            ) : (
              <Link to="/login" className="btn-primary text-center" onClick={() => setMobileMenuOpen(false)}>{t('nav.login')}</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
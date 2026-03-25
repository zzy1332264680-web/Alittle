// src/hooks/useLanguage.jsx 语言全局状态管理
import { createContext, useContext, useState, useEffect } from 'react';
import { locales } from '../utils/locales';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // 从 localStorage 读取上次的选择，默认中文
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('app_language') || 'zh-CN';
  });

  // 语言变化时保存到 localStorage
  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  // 翻译函数：t('nav.home') 或 t('settings.title')
  const t = (key) => {
    const keys = key.split('.');
    let value = locales[language];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key; // 如果找不到翻译，返回 key 本身
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// 自定义 Hook，方便在组件中使用
export const useLanguage = () => useContext(LanguageContext);
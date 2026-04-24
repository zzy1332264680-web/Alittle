import { useEffect, useState } from 'react';
import { LanguageContext } from './language-context.js';
import { locales } from '../utils/locales.js';

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem('app_language') || 'zh-CN');

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  const t = (key) => {
    const keys = key.split('.');
    let value = locales[language];

    for (const currentKey of keys) {
      value = value?.[currentKey];
    }

    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

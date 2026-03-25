// src/components/Footer.jsx（最终修复版，Logo固定为Чуть-чуть，多语言适配）
import { useLanguage } from '../hooks/useLanguage';

const Footer = () => {
  const { t } = useLanguage();
  return (
    <footer className="bg-gray-50 border-t mt-auto py-6">
      <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
        <p>© 2026 Чуть-чуть {t('common.allRightsReserved')}</p>
      </div>
    </footer>
  );
};

export default Footer;
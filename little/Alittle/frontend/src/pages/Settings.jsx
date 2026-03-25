// src/pages/Settings.jsx 设置页面（多语言版）
import { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage'; // 新增

const Settings = () => {
  const { language, setLanguage, t } = useLanguage(); // 新增
  
  // 模拟设置数据
  const [settings, setSettings] = useState({
    theme: 'light',
    notifications: {
      chat: true,
      forum: true,
      market: false
    },
    privacy: {
      showEmail: false,
      showPhone: false
    }
  });

  // 保存设置
  const handleSave = () => {
    alert(t('settings.saveSuccess'));
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">{t('settings.title')}</h2>
        <p className="text-gray-600">{t('settings.subtitle')}</p>
      </div>

      <div className="space-y-6">
        {/* 通用设置 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">{t('settings.general')}</h3>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 mb-2">{t('settings.language')}</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)} // 直接修改全局语言
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                >
                  <option value="zh-CN">简体中文</option>
                  <option value="en-US">English</option>
                  <option value="ru-RU">Русский</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">{t('settings.theme')}</label>
                <select
                  value={settings.theme}
                  onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                >
                  <option value="light">{t('settings.light')}</option>
                  <option value="dark">{t('settings.dark')}</option>
                  <option value="auto">{t('settings.auto')}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 通知设置 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">{t('settings.notifications')}</h3>
          <div className="space-y-4">
            {[
              { key: 'chat', label: t('settings.chatNotify'), desc: t('settings.chatNotifyDesc') },
              { key: 'forum', label: t('settings.forumNotify'), desc: t('settings.forumNotifyDesc') },
              { key: 'market', label: t('settings.marketNotify'), desc: t('settings.marketNotifyDesc') }
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <p className="text-gray-800 font-medium">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
                <button
                  onClick={() => setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      [item.key]: !settings.notifications[item.key]
                    }
                  })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.notifications[item.key] ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    settings.notifications[item.key] ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 隐私设置 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">{t('settings.privacy')}</h3>
          <div className="space-y-4">
            {[
              { key: 'showEmail', label: t('settings.showEmail'), desc: t('settings.showEmailDesc') },
              { key: 'showPhone', label: t('settings.showPhone'), desc: t('settings.showPhoneDesc') }
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <p className="text-gray-800 font-medium">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
                <button
                  onClick={() => setSettings({
                    ...settings,
                    privacy: {
                      ...settings.privacy,
                      [item.key]: !settings.privacy[item.key]
                    }
                  })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.privacy[item.key] ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    settings.privacy[item.key] ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 保存按钮 */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {t('settings.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
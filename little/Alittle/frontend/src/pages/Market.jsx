// src/pages/Market.jsx 完整闲置交易页面（统一发布按钮样式+多语言版）
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage'; // 新增
import request from '../api/request';

const Market = () => {
  const navigate = useNavigate();
  const { t } = useLanguage(); // 新增
  const [goodsList, setGoodsList] = useState([]);
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

  // 获取商品列表
  const getGoodsList = async () => {
    try {
      const res = await request.get('/api/goods/list');
      if (res.code === 200) {
        setGoodsList(res.data);
      }
    } catch (err) {
      console.error('获取商品列表失败：', err);
    }
  };

  useEffect(() => {
    getGoodsList();
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      {/* 页面头部 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{t('nav.market')}</h2>
          <p className="text-gray-600">{t('market.subtitle')}</p>
        </div>
        {/* 发布商品按钮 */}
        <button
          onClick={() => navigate('/market/create')}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>+</span>
          <span>{t('market.publishGoods')}</span>
        </button>
      </div>

      {/* 商品列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goodsList.length > 0 ? (
          goodsList.map((goods) => (
            <div key={goods.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* 商品图片 */}
              <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                {goods.image ? (
                  <img src={goods.image} alt={goods.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-500">{t('common.noData')}</span>
                )}
              </div>
              {/* 商品信息 */}
              <div className="p-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-1">{goods.name}</h4>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {goods.description || t('common.noData')}
                </p>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xl font-bold text-red-600">{t('market.price')}{Number(goods.price).toFixed(2)}</span>
                  <span className="text-sm text-gray-500">{t('market.publisher')}：{goods.publisher_name}</span>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(goods.create_time).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500">
            {t('market.noGoods')}
          </div>
        )}
      </div>
    </div>
  );
};

export default Market;
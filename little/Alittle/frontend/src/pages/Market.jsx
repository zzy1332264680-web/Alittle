// src/pages/Market.jsx 完整闲置交易页面（统一发布按钮样式）
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import request from '../api/request';

const Market = () => {
  const navigate = useNavigate();
  // 商品列表数据
  const [goodsList, setGoodsList] = useState([]);
  // 获取当前登录的用户信息
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

  // ===================== 核心方法 =====================
  // 1. 获取商品列表
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

  // 页面加载时自动获取商品列表
  useEffect(() => {
    getGoodsList();
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      {/* 页面头部（和论坛发帖完全一致的布局） */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">闲置交易</h2>
          <p className="text-gray-600">买卖闲置物品，让资源流动起来</p>
        </div>
        {/* 发布商品按钮（和论坛发帖按钮完全一致的样式） */}
        <button
          onClick={() => navigate('/market/create')}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>+</span>
          <span>发布闲置商品</span>
        </button>
      </div>

      {/* 商品列表（从数据库获取） */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goodsList.length > 0 ? (
          goodsList.map((goods) => (
            <div key={goods.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* 商品图片 */}
              <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                {goods.image ? (
                  <img src={goods.image} alt={goods.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-500">暂无商品图片</span>
                )}
              </div>
              {/* 商品信息 */}
              <div className="p-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-1">{goods.name}</h4>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {goods.description || '暂无商品描述'}
                </p>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xl font-bold text-red-600">¥{Number(goods.price).toFixed(2)}</span>
                  <span className="text-sm text-gray-500">发布者：{goods.publisher_name}</span>
                </div>
                <div className="text-xs text-gray-400">
                  发布时间：{new Date(goods.create_time).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500">
            暂无闲置商品，快来发布第一个商品吧～
          </div>
        )}
      </div>
    </div>
  );
};

export default Market;
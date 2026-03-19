// src/pages/Market.jsx 完整闲置交易页面（对接后端数据库）
import { useState, useEffect } from 'react';
import request from '../api/request';

const Market = () => {
  // 商品列表数据
  const [goodsList, setGoodsList] = useState([]);
  // 发布弹窗显示状态
  const [showModal, setShowModal] = useState(false);
  // 加载状态
  const [loading, setLoading] = useState(false);
  // 发布表单数据
  const [form, setForm] = useState({
    name: '',
    price: '',
    description: '',
    image: ''
  });
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

  // 2. 表单输入变化
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // 3. 提交发布商品
  const handlePublish = async (e) => {
    e.preventDefault();
    // 前端校验
    if (!form.name.trim()) {
      alert('请输入商品名称');
      return;
    }
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) {
      alert('请输入正确的商品价格');
      return;
    }
    if (!userInfo.id) {
      alert('用户信息异常，请重新登录');
      return;
    }

    // 调用后端接口
    try {
      setLoading(true);
      const res = await request.post('/api/goods/publish', {
        user_id: userInfo.id,
        name: form.name.trim(),
        price: Number(form.price),
        description: form.description.trim(),
        image: form.image.trim()
      });

      if (res.code === 200) {
        alert('商品发布成功！');
        // 重置表单，关闭弹窗
        setForm({ name: '', price: '', description: '', image: '' });
        setShowModal(false);
        // 刷新商品列表
        getGoodsList();
      } else {
        alert(res.msg || '发布失败，请重试');
      }
    } catch (err) {
      console.error('发布商品失败：', err);
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时自动获取商品列表
  useEffect(() => {
    getGoodsList();
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">闲置交易</h2>
        <p className="text-gray-600">买卖闲置物品，让资源流动起来</p>
      </div>

      {/* 发布商品按钮 */}
      <div className="mb-8">
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          + 发布闲置商品
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

      {/* 发布商品弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* 弹窗头部 */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">发布闲置商品</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ×
                </button>
              </div>

              {/* 发布表单 */}
              <form onSubmit={handlePublish} className="space-y-4">
                {/* 商品名称 */}
                <div>
                  <label className="block text-gray-700 mb-1">商品名称 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-green-500"
                    placeholder="请输入商品名称"
                    maxLength={100}
                  />
                </div>

                {/* 商品价格 */}
                <div>
                  <label className="block text-gray-700 mb-1">商品价格（元） <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-green-500"
                    placeholder="请输入商品价格"
                    step="0.01"
                    min="0.01"
                  />
                </div>

                {/* 商品描述 */}
                <div>
                  <label className="block text-gray-700 mb-1">商品描述</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-green-500 resize-none"
                    placeholder="请输入商品描述、新旧程度等信息"
                    rows={3}
                    maxLength={500}
                  />
                </div>

                {/* 商品图片链接 */}
                <div>
                  <label className="block text-gray-700 mb-1">商品图片链接</label>
                  <input
                    type="text"
                    name="image"
                    value={form.image}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-green-500"
                    placeholder="请输入商品图片的网络链接"
                  />
                  <p className="text-xs text-gray-500 mt-1">可粘贴图片的网络地址，后续可扩展本地上传功能</p>
                </div>

                {/* 提交按钮 */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 transition-colors"
                  >
                    {loading ? '发布中...' : '确认发布'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Market;
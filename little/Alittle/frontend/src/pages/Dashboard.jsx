// src/pages/Dashboard.jsx（多语言修复版）
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import request from '../api/request';

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const [activeTab, setActiveTab] = useState('posts');
  const [myPosts, setMyPosts] = useState([]);
  const [myGoods, setMyGoods] = useState([]);
  const [loading, setLoading] = useState(false);

  // 获取我的帖子
  const getMyPosts = async () => {
    try {
      const res = await request.get('/api/my/posts', { params: { user_id: userInfo.id } });
      if (res.code === 200) {
        setMyPosts(res.data);
      }
    } catch (err) {
      console.error('获取我的帖子失败', err);
    }
  };

  // 获取我的商品
  const getMyGoods = async () => {
    try {
      const res = await request.get('/api/my/goods', { params: { user_id: userInfo.id } });
      if (res.code === 200) {
        setMyGoods(res.data);
      }
    } catch (err) {
      console.error('获取我的商品失败', err);
    }
  };

  // 操作帖子状态
  const handlePostStatus = async (postId, status) => {
    const confirmMsg = status === 0 ? '确定要隐藏这个帖子吗？' : '确定要恢复这个帖子吗？';
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await request.put('/api/posts/status', {
        post_id: postId,
        user_id: userInfo.id,
        status
      });
      if (res.code === 200) {
        alert(res.msg);
        getMyPosts();
      } else {
        alert(res.msg || t('common.failed'));
      }
    } catch (err) {
      console.error('操作失败', err);
    }
  };

  // 删除帖子
  const handleDeletePost = async (postId) => {
    if (!window.confirm('确定要永久删除这个帖子吗？此操作不可恢复！')) return;

    try {
      const res = await request.put('/api/posts/status', {
        post_id: postId,
        user_id: userInfo.id,
        status: -1
      });
      if (res.code === 200) {
        alert(t('common.success'));
        getMyPosts();
      } else {
        alert(res.msg || t('common.failed'));
      }
    } catch (err) {
      console.error('删除失败', err);
    }
  };

  // 操作商品状态
  const handleGoodsStatus = async (goodsId, status) => {
    const confirmMsg = status === 0 ? '确定要隐藏这个商品吗？' : '确定要恢复这个商品吗？';
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await request.put('/api/goods/status', {
        goods_id: goodsId,
        user_id: userInfo.id,
        status
      });
      if (res.code === 200) {
        alert(res.msg);
        getMyGoods();
      } else {
        alert(res.msg || t('common.failed'));
      }
    } catch (err) {
      console.error('操作失败', err);
    }
  };

  // 删除商品
  const handleDeleteGoods = async (goodsId) => {
    if (!window.confirm('确定要永久删除这个商品吗？此操作不可恢复！')) return;

    try {
      const res = await request.put('/api/goods/status', {
        goods_id: goodsId,
        user_id: userInfo.id,
        status: -1
      });
      if (res.code === 200) {
        alert(t('common.success'));
        getMyGoods();
      } else {
        alert(res.msg || t('common.failed'));
      }
    } catch (err) {
      console.error('删除失败', err);
    }
  };

  const isValidImageUrl = (url) => {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image');
  };

  useEffect(() => {
    if (activeTab === 'posts') {
      getMyPosts();
    } else {
      getMyGoods();
    }
  }, [activeTab]);

  return (
    <div className="max-w-6xl mx-auto">
      {/* 页面头部 */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">{t('profile.title')}</h2>
        <p className="text-gray-600">{t('profile.myPosts')} & {t('profile.myGoods')}</p>
      </div>

      {/* 标签切换 */}
      <div className="flex gap-4 mb-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('posts')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'posts'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('profile.myPosts')}
        </button>
        <button
          onClick={() => setActiveTab('goods')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'goods'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('profile.myGoods')}
        </button>
      </div>

      {/* 我的帖子列表 */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {myPosts.length > 0 ? (
            myPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{post.title}</h3>
                      {post.status === 0 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">已隐藏</span>
                      )}
                      {post.status === -1 && (
                        <span className="px-2 py-1 bg-red-100 text-red-500 rounded-full text-xs">已删除</span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2 line-clamp-2">{post.content}</p>
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>{new Date(post.create_time).toLocaleString()}</span>
                    </div>
                  </div>
                  {/* 操作按钮 */}
                  <div className="flex flex-row gap-2 ml-4 flex-shrink-0">
                    {post.status !== -1 && (
                      <button
                        onClick={() => navigate(`/forum/edit/${post.id}`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                      >
                        {t('common.edit')}
                      </button>
                    )}
                    {post.status === 1 ? (
                      <button
                        onClick={() => handlePostStatus(post.id, 0)}
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm whitespace-nowrap"
                      >
                        隐藏
                      </button>
                    ) : post.status === 0 ? (
                      <button
                        onClick={() => handlePostStatus(post.id, 1)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
                      >
                        恢复
                      </button>
                    ) : null}
                    {post.status !== -1 && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors text-sm whitespace-nowrap"
                      >
                        {t('common.delete')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <p className="text-gray-500 text-lg">你还没有发布过帖子</p>
              <button
                onClick={() => navigate('/forum/create')}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {t('forum.createPost')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 我的商品列表 */}
      {activeTab === 'goods' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myGoods.length > 0 ? (
            myGoods.map((goods) => (
              <div key={goods.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* 商品图片 */}
                <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden relative">
                  {isValidImageUrl(goods.image) ? (
                    <img src={goods.image} alt={goods.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-500">{t('common.noData')}</span>
                  )}
                  {goods.status === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="px-3 py-1 bg-white text-gray-800 rounded-full text-sm font-medium">已隐藏</span>
                    </div>
                  )}
                  {goods.status === -1 && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-medium">已删除</span>
                    </div>
                  )}
                </div>
                {/* 商品信息 */}
                <div className="p-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-1">{goods.name}</h4>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {goods.description || t('common.noData')}
                  </p>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xl font-bold text-red-600">{t('market.price')}{Number(goods.price).toFixed(2)}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(goods.create_time).toLocaleDateString()}
                    </span>
                  </div>
                  {/* 操作按钮 */}
                  <div className="flex gap-2">
                    {goods.status !== -1 && (
                      <button
                        onClick={() => navigate(`/market/edit/${goods.id}`)}
                        className="flex-1 px-2 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                      >
                        {t('common.edit')}
                      </button>
                    )}
                    {goods.status === 1 ? (
                      <button
                        onClick={() => handleGoodsStatus(goods.id, 0)}
                        className="flex-1 px-2 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
                      >
                        隐藏
                      </button>
                    ) : goods.status === 0 ? (
                      <button
                        onClick={() => handleGoodsStatus(goods.id, 1)}
                        className="flex-1 px-2 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                      >
                        恢复
                      </button>
                    ) : null}
                    {goods.status !== -1 && (
                      <button
                        onClick={() => handleDeleteGoods(goods.id)}
                        className="flex-1 px-2 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors text-sm"
                      >
                        {t('common.delete')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-white rounded-lg shadow-md">
              <p className="text-gray-500 text-lg">你还没有发布过闲置商品</p>
              <button
                onClick={() => navigate('/market')}
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                {t('market.publishGoods')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
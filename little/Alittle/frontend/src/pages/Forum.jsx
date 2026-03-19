// src/pages/Forum.jsx 完整论坛页面（支持用户头像）
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import request from '../api/request';

const Forum = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  // 获取帖子列表
  const getPosts = async () => {
    try {
      setLoading(true);
      const res = await request.get('/api/posts/list');
      if (res.code === 200) {
        setPosts(res.data);
      }
    } catch (err) {
      console.error('获取帖子列表失败', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPosts();
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      {/* 页面头部 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">论坛发帖</h2>
          <p className="text-gray-600">分享你的想法，和大家一起讨论</p>
        </div>
        {/* 发帖按钮 */}
        <button
          onClick={() => navigate('/forum/create')}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>+</span>
          <span>发布帖子</span>
        </button>
      </div>

      {/* 帖子列表 */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              {/* 帖子头部：作者信息（支持用户头像） */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                    {post.is_anonymous 
                      ? '匿' 
                      : post.publisher_avatar ? (
                        <img src={post.publisher_avatar} alt="作者头像" className="w-full h-full object-cover" />
                      ) : (
                        (post.publisher_name || 'U').charAt(0).toUpperCase()
                      )
                    }
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {post.is_anonymous ? '匿名用户' : post.publisher_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(post.create_time).toLocaleString()}
                    </p>
                  </div>
                </div>
                {/* 话题标签 */}
                {post.topics && post.topics.length > 0 && (
                  <div className="flex gap-2">
                    {post.topics.slice(0, 3).map((topic, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        #{topic}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 帖子标题 */}
              <h3 className="text-xl font-bold text-gray-800 mb-3 hover:text-blue-600 cursor-pointer">
                {post.title}
              </h3>

              {/* 帖子内容预览 */}
              <p className="text-gray-600 mb-4 line-clamp-3">
                {post.content}
              </p>

              {/* 帖子图片预览 */}
              {post.images && post.images.length > 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  {post.images.slice(0, 3).map((img, index) => (
                    <div key={index} className="w-24 h-24 flex-shrink-0 rounded-md overflow-hidden border border-gray-200">
                      <img src={img} alt={`帖子图片${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {post.images.length > 3 && (
                    <div className="w-24 h-24 flex-shrink-0 rounded-md bg-gray-100 flex items-center justify-center text-gray-500">
                      +{post.images.length - 3}
                    </div>
                  )}
                </div>
              )}

              {/* 帖子底部：互动数据 */}
              <div className="flex items-center gap-6 pt-4 border-t border-gray-100 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  👁️ {post.view_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  👍 {post.like_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  💬 {post.comment_count || 0}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-500 text-lg">暂无帖子，快来发布第一个帖子吧～</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Forum;
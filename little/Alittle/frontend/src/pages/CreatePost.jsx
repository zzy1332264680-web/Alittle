// src/pages/CreatePost.jsx 完整发布帖子页面
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import request from '../api/request';

const CreatePost = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

  // 表单数据
  const [form, setForm] = useState({
    title: '',
    content: '',
    images: [],
    topics: [],
    isAnonymous: false,
    visibility: 'public'
  });

  // 话题数据
  const [allTopics, setAllTopics] = useState([]);
  const [customTopic, setCustomTopic] = useState('');
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);

  // 状态
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState([]);

  // 字数限制
  const TITLE_MAX = 200;
  const CONTENT_MAX = 10000;
  const IMAGE_MAX = 9;

  // ===================== 草稿逻辑：页面加载时恢复草稿 =====================
  useEffect(() => {
    const savedDraft = localStorage.getItem('post_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setForm(draft);
      } catch (e) {
        console.error('草稿解析失败', e);
      }
    }
  }, []);

  // ===================== 草稿逻辑：内容变化时自动保存 =====================
  useEffect(() => {
    localStorage.setItem('post_draft', JSON.stringify(form));
  }, [form]);

  // ===================== 获取话题列表 =====================
  const getTopics = async () => {
    try {
      const res = await request.get('/api/topics/list');
      if (res.code === 200) {
        setAllTopics(res.data);
      }
    } catch (err) {
      console.error('获取话题失败', err);
    }
  };

  useEffect(() => {
    getTopics();
  }, []);

  // ===================== 表单输入处理 =====================
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // ===================== 图片处理 =====================
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (form.images.length + files.length > IMAGE_MAX) {
      alert(`最多只能上传${IMAGE_MAX}张图片`);
      return;
    }

    // 模拟上传进度
    const newUploadingImages = files.map((file, index) => ({
      id: Date.now() + index,
      file,
      progress: 0,
      url: URL.createObjectURL(file) // 本地预览
    }));

    setUploadingImages(prev => [...prev, ...newUploadingImages]);

    // 模拟上传过程
    newUploadingImages.forEach(img => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          // 上传完成，添加到form.images
          setForm(prev => ({
            ...prev,
            images: [...prev.images, img.url] // 实际项目中这里应该是后端返回的图片URL
          }));
          // 从上传列表移除
          setUploadingImages(prev => prev.filter(i => i.id !== img.id));
        }
        // 更新进度
        setUploadingImages(prev => prev.map(i => 
          i.id === img.id ? { ...i, progress } : i
        ));
      }, 200);
    });
  };

  const removeImage = (index) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // ===================== 话题处理 =====================
  const toggleTopic = (topic) => {
    setForm(prev => {
      const isSelected = prev.topics.includes(topic.name);
      return {
        ...prev,
        topics: isSelected
          ? prev.topics.filter(t => t !== topic.name)
          : [...prev.topics, topic.name]
      };
    });
  };

  const addCustomTopic = () => {
    if (!customTopic.trim()) return;
    if (form.topics.includes(customTopic.trim())) {
      setCustomTopic('');
      return;
    }
    setForm(prev => ({
      ...prev,
      topics: [...prev.topics, customTopic.trim()]
    }));
    setCustomTopic('');
    setShowTopicDropdown(false);
  };

  const removeTopic = (topic) => {
    setForm(prev => ({
      ...prev,
      topics: prev.topics.filter(t => t !== topic)
    }));
  };

  // ===================== 表单校验 =====================
  const validateForm = () => {
    if (!form.title.trim()) {
      alert('请输入帖子标题');
      return false;
    }
    if (form.title.length > TITLE_MAX) {
      alert(`标题不能超过${TITLE_MAX}字`);
      return false;
    }
    if (!form.content.trim()) {
      alert('请输入帖子内容');
      return false;
    }
    if (form.content.length > CONTENT_MAX) {
      alert(`内容不能超过${CONTENT_MAX}字`);
      return false;
    }
    if (form.images.length > IMAGE_MAX) {
      alert(`最多只能上传${IMAGE_MAX}张图片`);
      return false;
    }
    if (uploadingImages.length > 0) {
      alert('图片正在上传中，请稍候');
      return false;
    }
    return true;
  };

  // ===================== 发布帖子 =====================
  const handlePublish = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const res = await request.post('/api/posts/publish', {
        user_id: userInfo.id,
        title: form.title,
        content: form.content,
        images: form.images,
        topics: form.topics,
        is_anonymous: form.isAnonymous,
        visibility: form.visibility
      });

      if (res.code === 200) {
        alert('发布成功！');
        // 清除草稿
        localStorage.removeItem('post_draft');
        // 跳回论坛列表
        navigate('/forum');
      } else {
        alert(res.msg || '发布失败，请重试');
      }
    } catch (err) {
      console.error('发布失败', err);
    } finally {
      setLoading(false);
    }
  };

  // ===================== 取消发布 =====================
  const handleCancel = () => {
    const hasContent = form.title.trim() || form.content.trim() || form.images.length > 0;
    if (hasContent) {
      if (!window.confirm('你有未保存的内容，确定要退出吗？')) {
        return;
      }
    }
    // 清除草稿
    localStorage.removeItem('post_draft');
    navigate('/forum');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* 页面头部 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">发布帖子</h2>
          <p className="text-gray-600">分享你的想法，和大家一起讨论</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        {/* 标题输入 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-gray-700 font-medium">帖子标题 <span className="text-red-500">*</span></label>
            <span className={`text-sm ${form.title.length > TITLE_MAX ? 'text-red-500' : 'text-gray-400'}`}>
              {form.title.length}/{TITLE_MAX}
            </span>
          </div>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleInputChange}
            placeholder="请输入帖子标题..."
            className={`w-full px-4 py-3 border rounded-md focus:outline-none transition-colors ${
              form.title.length > TITLE_MAX 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:border-blue-500'
            }`}
          />
        </div>

        {/* 正文输入 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-gray-700 font-medium">正文内容 <span className="text-red-500">*</span></label>
            <span className={`text-sm ${form.content.length > CONTENT_MAX ? 'text-red-500' : 'text-gray-400'}`}>
              {form.content.length}/{CONTENT_MAX}
            </span>
          </div>
          <textarea
            name="content"
            value={form.content}
            onChange={handleInputChange}
            placeholder="请输入帖子内容..."
            rows={12}
            className={`w-full px-4 py-3 border rounded-md focus:outline-none resize-none transition-colors ${
              form.content.length > CONTENT_MAX 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:border-blue-500'
            }`}
          />
        </div>

        {/* 图片上传 */}
        <div className="mb-6">
          <label className="text-gray-700 font-medium mb-2 block">
            图片上传 <span className="text-gray-400 text-sm">（最多{IMAGE_MAX}张）</span>
          </label>
          
          {/* 图片预览区 */}
          <div className="flex flex-wrap gap-3 mb-3">
            {/* 已上传的图片 */}
            {form.images.map((img, index) => (
              <div key={index} className="relative w-24 h-24 rounded-md overflow-hidden border border-gray-200">
                <img src={img} alt={`图片${index + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
                >
                  ×
                </button>
              </div>
            ))}
            
            {/* 上传中的图片 */}
            {uploadingImages.map((img) => (
              <div key={img.id} className="relative w-24 h-24 rounded-md overflow-hidden border border-gray-200 bg-gray-50">
                <img src={img.url} alt="上传中" className="w-full h-full object-cover opacity-50" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-12 h-1 bg-gray-300 rounded-full overflow-hidden mb-1">
                    <div 
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${img.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">{Math.round(img.progress)}%</span>
                </div>
              </div>
            ))}

            {/* 上传按钮 */}
            {form.images.length + uploadingImages.length < IMAGE_MAX && (
              <label className="w-24 h-24 rounded-md border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <span className="text-2xl text-gray-400">+</span>
                <span className="text-xs text-gray-500 mt-1">添加图片</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleImageSelect}
                />
              </label>
            )}
          </div>
        </div>

        {/* 话题标签 */}
        <div className="mb-6">
          <label className="text-gray-700 font-medium mb-2 block">话题标签</label>
          
          {/* 已选话题 */}
          {form.topics.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {form.topics.map((topic, index) => (
                <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  #{topic}
                  <button
                    onClick={() => removeTopic(topic)}
                    className="ml-1 hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* 话题选择器 */}
          <div className="relative">
            <div 
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:border-blue-500"
              onClick={() => setShowTopicDropdown(!showTopicDropdown)}
            >
              <span className="text-gray-500">选择或输入话题...</span>
              <span className="ml-auto text-gray-400">▼</span>
            </div>

            {showTopicDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                {/* 预设话题 */}
                <div className="p-2">
                  <p className="text-xs text-gray-400 px-2 py-1">推荐话题</p>
                  {allTopics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => toggleTopic(topic)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        form.topics.includes(topic.name)
                          ? 'bg-blue-50 text-blue-700'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      #{topic.name}
                    </button>
                  ))}
                </div>
                
                {/* 自定义话题输入 */}
                <div className="p-2 border-t border-gray-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTopic())}
                      placeholder="输入自定义话题..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={addCustomTopic}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                    >
                      添加
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 发布设置 */}
        <div className="mb-8 pt-6 border-t border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">发布设置</h3>
          <div className="space-y-4">
            {/* 可见性 */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-800 font-medium">可见范围</p>
                <p className="text-sm text-gray-500">谁可以看到这篇帖子</p>
              </div>
              <select
                name="visibility"
                value={form.visibility}
                onChange={handleInputChange}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              >
                <option value="public">公开</option>
                <option value="fans">仅粉丝可见</option>
              </select>
            </div>

            {/* 匿名发布 */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-800 font-medium">匿名发布</p>
                <p className="text-sm text-gray-500">隐藏你的用户名</p>
              </div>
              <button
                onClick={() => setForm(prev => ({ ...prev, isAnonymous: !prev.isAnonymous }))}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  form.isAnonymous ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  form.isAnonymous ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-4 pt-6 border-t border-gray-100">
          <button
            onClick={handleCancel}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handlePublish}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
          >
            {loading ? '发布中...' : '发布帖子'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
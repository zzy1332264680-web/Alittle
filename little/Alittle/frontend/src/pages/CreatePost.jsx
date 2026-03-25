// src/pages/CreatePost.jsx（最终无错完整版，修复标签闭合+语法错误）
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import request from '../api/request';

const CreatePost = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { id } = useParams();
  const isEditMode = !!id;
  const fileInputRef = useRef(null);
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

  const [form, setForm] = useState({
    title: '',
    content: '',
    images: [],
    topics: [],
    isAnonymous: false,
    visibility: 'public'
  });

  const [allTopics, setAllTopics] = useState([]);
  const [customTopic, setCustomTopic] = useState('');
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);

  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState([]);
  const [fetchingPost, setFetchingPost] = useState(false);

  const TITLE_MAX = 200;
  const CONTENT_MAX = 10000;
  const IMAGE_MAX = 9;

  // 可见范围配置（修正翻译key）
  const visibilityOptions = [
    { value: 'public', labelKey: 'createPost.visibilityOptions.public' },
    { value: 'fans', labelKey: 'createPost.visibilityOptions.fans' }
  ];

  const getPostDetail = async () => {
    if (!isEditMode) return;
    try {
      setFetchingPost(true);
      const res = await request.get('/api/my/posts', { params: { user_id: userInfo.id } });
      if (res.code === 200) {
        const post = res.data.find(p => p.id === Number(id));
        if (post) {
          setForm({
            title: post.title,
            content: post.content,
            images: post.images || [],
            topics: post.topics || [],
            isAnonymous: !!post.is_anonymous,
            visibility: post.visibility || 'public'
          });
        } else {
          alert(t('common.failed'));
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error('获取帖子详情失败', err);
    } finally {
      setFetchingPost(false);
    }
  };

  useEffect(() => {
    getPostDetail();
  }, [id]);

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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (form.images.length + files.length > IMAGE_MAX) {
      alert(t('createPost.imageMaxTip').replace('{max}', IMAGE_MAX));
      return;
    }

    const newUploadingImages = files.map((file, index) => ({
      id: Date.now() + index,
      file,
      progress: 0,
      url: URL.createObjectURL(file)
    }));

    setUploadingImages(prev => [...prev, ...newUploadingImages]);

    newUploadingImages.forEach(img => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setForm(prev => ({
            ...prev,
            images: [...prev.images, img.url]
          }));
          setUploadingImages(prev => prev.filter(i => i.id !== img.id));
        }
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

  const validateForm = () => {
    if (!form.title.trim()) {
      alert(t('createPost.titleRequired'));
      return false;
    }
    if (form.title.length > TITLE_MAX) {
      alert(`${t('createPost.postTitle')} ${t('common.maxLength').replace('{max}', TITLE_MAX)}`);
      return false;
    }
    if (!form.content.trim()) {
      alert(t('createPost.contentRequired'));
      return false;
    }
    if (form.content.length > CONTENT_MAX) {
      alert(`${t('createPost.postContent')} ${t('common.maxLength').replace('{max}', CONTENT_MAX)}`);
      return false;
    }
    if (form.images.length > IMAGE_MAX) {
      alert(t('createPost.imageMaxTip').replace('{max}', IMAGE_MAX));
      return false;
    }
    if (uploadingImages.length > 0) {
      alert(t('common.loading'));
      return false;
    }
    return true;
  };

  const handlePublish = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      let res;
      
      if (isEditMode) {
        res = await request.put('/api/posts/update', {
          post_id: id,
          user_id: userInfo.id,
          title: form.title,
          content: form.content,
          images: form.images,
          topics: form.topics,
          is_anonymous: form.isAnonymous,
          visibility: form.visibility
        });
      } else {
        res = await request.post('/api/posts/publish', {
          user_id: userInfo.id,
          title: form.title,
          content: form.content,
          images: form.images,
          topics: form.topics,
          is_anonymous: form.isAnonymous,
          visibility: form.visibility
        });
      }

      if (res.code === 200) {
        alert(t('common.success'));
        localStorage.removeItem('post_draft');
        navigate('/dashboard');
      } else {
        alert(res.msg || t('common.failed'));
      }
    } catch (err) {
      console.error('操作失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    const hasContent = form.title.trim() || form.content.trim() || form.images.length > 0;
    if (hasContent) {
      if (!window.confirm(t('common.confirmExit'))) {
        return;
      }
    }
    localStorage.removeItem('post_draft');
    navigate('/dashboard');
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.topic-dropdown-container')) {
        setShowTopicDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (fetchingPost) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-gray-500">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {isEditMode ? t('createPost.editTitle') : t('createPost.title')}
          </h2>
          <p className="text-gray-600">
            {isEditMode ? t('createPost.editTitle') : t('forum.subtitle')}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-gray-700 font-medium">{t('createPost.postTitle')} <span className="text-red-500">*</span></label>
            <span className={`text-sm ${form.title.length > TITLE_MAX ? 'text-red-500' : 'text-gray-400'}`}>
              {form.title.length}/{TITLE_MAX}
            </span>
          </div>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleInputChange}
            placeholder={t('createPost.titlePlaceholder')}
            className={`w-full px-4 py-3 border rounded-md focus:outline-none transition-colors ${
              form.title.length > TITLE_MAX 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:border-blue-500'
            }`}
          />
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-gray-700 font-medium">{t('createPost.postContent')} <span className="text-red-500">*</span></label>
            <span className={`text-sm ${form.content.length > CONTENT_MAX ? 'text-red-500' : 'text-gray-400'}`}>
              {form.content.length}/{CONTENT_MAX}
            </span>
          </div>
          <textarea
            name="content"
            value={form.content}
            onChange={handleInputChange}
            placeholder={t('createPost.contentPlaceholder')}
            rows={12}
            className={`w-full px-4 py-3 border rounded-md focus:outline-none resize-none transition-colors ${
              form.content.length > CONTENT_MAX 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:border-blue-500'
            }`}
          />
        </div>

        <div className="mb-6">
          <label className="text-gray-700 font-medium mb-2 block">
            {t('createPost.imageUpload')} <span className="text-gray-400 text-sm">({t('createPost.imageMaxTip').replace('{max}', IMAGE_MAX)})</span>
          </label>
          
          <div className="flex flex-wrap gap-3 mb-3">
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

            {form.images.length + uploadingImages.length < IMAGE_MAX && (
              <label className="w-24 h-24 rounded-md border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <span className="text-2xl text-gray-400">+</span>
                <span className="text-xs text-gray-500 mt-1">{t('createGoods.uploadImage')}</span>
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

        <div className="mb-6 topic-dropdown-container">
          <label className="text-gray-700 font-medium mb-2 block">{t('createPost.selectTopics')}</label>
          
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

          <div className="relative">
            <div 
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:border-blue-500"
              onClick={() => setShowTopicDropdown(!showTopicDropdown)}
            >
              <span className="text-gray-500">{t('createPost.selectTopicPlaceholder')}</span>
              <span className="ml-auto text-gray-400">▼</span>
            </div>

            {showTopicDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                <div className="p-2">
                  <p className="text-xs text-gray-400 px-2 py-1">{t('createPost.recommendTopics')}</p>
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
                
                <div className="p-2 border-t border-gray-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTopic())}
                      placeholder={t('createPost.customTopicPlaceholder')}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={addCustomTopic}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                    >
                      {t('createPost.add')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-8 pt-6 border-t border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('createPost.publishSettings')}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-800 font-medium">{t('createPost.visibility')}</p>
                <p className="text-sm text-gray-500">{t('createPost.visibilityDesc')}</p>
              </div>
              <select
                name="visibility"
                value={form.visibility}
                onChange={handleInputChange}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              >
                {visibilityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-800 font-medium">{t('createPost.isAnonymous')}</p>
                <p className="text-sm text-gray-500">{t('createPost.isAnonymousDesc')}</p>
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

        <div className="flex gap-4 pt-6 border-t border-gray-100">
          <button
            onClick={handleCancel}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handlePublish}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
          >
            {loading ? t('common.loading') : (isEditMode ? t('common.save') : t('createPost.publish'))}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
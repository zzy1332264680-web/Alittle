// src/pages/CreateGoods.jsx（最终无错版）
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import request from '../api/request';

const CreateGoods = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { id } = useParams();
  const fileInputRef = useRef(null);
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: '',
    price: '',
    category: '',
    condition: 'new',
    description: '',
    images: []
  });

  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState([]);
  const [pageLoading, setPageLoading] = useState(false);

  const NAME_MAX = 100;
  const DESC_MAX = 2000;
  const IMAGE_MAX = 9;

  // 分类和新旧程度配置（修正翻译key）
  const categories = [
    { value: 'digital', labelKey: 'createGoods.categoryOptions.digital' },
    { value: 'clothing', labelKey: 'createGoods.categoryOptions.clothing' },
    { value: 'home', labelKey: 'createGoods.categoryOptions.home' },
    { value: 'book', labelKey: 'createGoods.categoryOptions.book' },
    { value: 'sports', labelKey: 'createGoods.categoryOptions.sports' },
    { value: 'other', labelKey: 'createGoods.categoryOptions.other' }
  ];

  const conditions = [
    { value: 'new', labelKey: 'createGoods.conditionOptions.new' },
    { value: 'like_new', labelKey: 'createGoods.conditionOptions.like_new' },
    { value: 'good', labelKey: 'createGoods.conditionOptions.good' },
    { value: 'usable', labelKey: 'createGoods.conditionOptions.usable' }
  ];

  const loadGoodsData = async () => {
    if (!isEdit) return;

    try {
      setPageLoading(true);
      const res = await request.get('/api/my/goods', { params: { user_id: userInfo.id } });
      if (res.code === 200) {
        const goods = res.data.find(g => g.id === Number(id));
        if (goods) {
          let category = '';
          let condition = 'new';
          let pureDescription = goods.description || '';
          
          if (pureDescription.includes('【分类】')) {
            const categoryMatch = pureDescription.match(/【分类】(.*?)(\n|$)/);
            if (categoryMatch) {
              const categoryLabel = categoryMatch[1].trim();
              const foundCategory = categories.find(c => t(c.labelKey) === categoryLabel);
              if (foundCategory) {
                category = foundCategory.value;
              }
              pureDescription = pureDescription.replace(/【分类】.*?(\n|$)/, '');
            }
          }
          if (pureDescription.includes('【新旧程度】')) {
            const conditionMatch = pureDescription.match(/【新旧程度】(.*?)(\n|$)/);
            if (conditionMatch) {
              const conditionLabel = conditionMatch[1].trim();
              const foundCondition = conditions.find(c => t(c.labelKey) === conditionLabel);
              if (foundCondition) {
                condition = foundCondition.value;
              }
              pureDescription = pureDescription.replace(/【新旧程度】.*?(\n|$)/, '');
            }
          }

          setForm({
            name: goods.name || '',
            price: goods.price ? String(goods.price) : '',
            category: category || '',
            condition: condition,
            description: pureDescription.trim(),
            images: goods.image ? [goods.image] : []
          });
        } else {
          alert(t('common.failed'));
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error('加载商品数据失败', err);
      alert(t('common.failed'));
      navigate('/dashboard');
    } finally {
      setPageLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (form.images.length + files.length > IMAGE_MAX) {
      alert(t('createGoods.imageTip').replace('{max}', IMAGE_MAX));
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

  const validateForm = () => {
    if (!form.name.trim()) {
      alert(t('createGoods.nameRequired'));
      return false;
    }
    if (form.name.length > NAME_MAX) {
      alert(`${t('createGoods.goodsName')} ${t('common.maxLength').replace('{max}', NAME_MAX)}`);
      return false;
    }
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) {
      alert(t('createGoods.priceRequired'));
      return false;
    }
    if (!form.category) {
      alert(t('createGoods.selectCategory'));
      return false;
    }
    if (form.description.length > DESC_MAX) {
      alert(`${t('createGoods.goodsDesc')} ${t('common.maxLength').replace('{max}', DESC_MAX)}`);
      return false;
    }
    if (form.images.length > IMAGE_MAX) {
      alert(t('createGoods.imageTip').replace('{max}', IMAGE_MAX));
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
      const selectedCategory = categories.find(c => c.value === form.category);
      const selectedCondition = conditions.find(c => c.value === form.condition);
      const requestData = {
        user_id: userInfo.id,
        name: form.name.trim(),
        price: Number(form.price),
        description: `【分类】${t(selectedCategory.labelKey)}\n【新旧程度】${t(selectedCondition.labelKey)}\n\n${form.description.trim()}`,
        image: form.images[0] || ''
      };

      let res;
      if (isEdit) {
        res = await request.put('/api/goods/update', {
          goods_id: id,
          ...requestData
        });
      } else {
        res = await request.post('/api/goods/publish', requestData);
      }

      if (res.code === 200) {
        alert(t('common.success'));
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
    const hasContent = form.name.trim() || form.description.trim() || form.images.length > 0;
    if (hasContent) {
      if (!window.confirm(t('common.confirmExit'))) {
        return;
      }
    }
    navigate('/dashboard');
  };

  useEffect(() => {
    loadGoodsData();
  }, []);

  if (pageLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {isEdit ? t('createGoods.editTitle') : t('createGoods.title')}
          </h2>
          <p className="text-gray-600">
            {isEdit ? t('createGoods.editTitle') : t('market.subtitle')}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-gray-700 font-medium">{t('createGoods.goodsName')} <span className="text-red-500">*</span></label>
            <span className={`text-sm ${form.name.length > NAME_MAX ? 'text-red-500' : 'text-gray-400'}`}>
              {form.name.length}/{NAME_MAX}
            </span>
          </div>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleInputChange}
            placeholder={t('createGoods.namePlaceholder')}
            className={`w-full px-4 py-3 border rounded-md focus:outline-none transition-colors ${
              form.name.length > NAME_MAX 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:border-blue-500'
            }`}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="text-gray-700 font-medium mb-2 block">{t('createGoods.goodsPrice')} <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">{t('market.price')}</span>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-gray-700 font-medium mb-2 block">{t('createGoods.category')} <span className="text-red-500">*</span></label>
            <select
              name="category"
              value={form.category}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
            >
              <option value="">{t('createGoods.selectCategory')}</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>{t(cat.labelKey)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="text-gray-700 font-medium mb-3 block">{t('createGoods.condition')}</label>
          <div className="flex flex-wrap gap-3">
            {conditions.map((cond) => (
              <button
                key={cond.value}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, condition: cond.value }))}
                className={`px-4 py-2 rounded-md border transition-colors ${
                  form.condition === cond.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                }`}
              >
                {t(cond.labelKey)}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-gray-700 font-medium">{t('createGoods.goodsDesc')}</label>
            <span className={`text-sm ${form.description.length > DESC_MAX ? 'text-red-500' : 'text-gray-400'}`}>
              {form.description.length}/{DESC_MAX}
            </span>
          </div>
          <textarea
            name="description"
            value={form.description}
            onChange={handleInputChange}
            placeholder={t('createGoods.descPlaceholder')}
            rows={8}
            className={`w-full px-4 py-3 border rounded-md focus:outline-none resize-none transition-colors ${
              form.description.length > DESC_MAX 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:border-blue-500'
            }`}
          />
        </div>

        <div className="mb-8">
          <label className="text-gray-700 font-medium mb-2 block">
            {t('createGoods.goodsImage')} <span className="text-gray-400 text-sm">({t('createGoods.imageTip').replace('{max}', IMAGE_MAX)})</span>
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
                  accept="image/jpeg,image/png,image/jpg,image/gif"
                  multiple
                  hidden
                  onChange={handleImageSelect}
                />
              </label>
            )}
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
            {loading ? t('common.loading') : (isEdit ? t('common.save') : t('createGoods.publish'))}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGoods;
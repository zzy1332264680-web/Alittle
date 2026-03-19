// src/pages/CreateGoods.jsx 完整发布/编辑闲置商品页面
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import request from '../api/request';

const CreateGoods = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // 获取商品ID（编辑模式）
  const fileInputRef = useRef(null);
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const isEdit = !!id; // 是否为编辑模式

  // 表单数据
  const [form, setForm] = useState({
    name: '',
    price: '',
    category: '',
    condition: 'new',
    description: '',
    images: []
  });

  // 状态
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState([]);
  const [pageLoading, setPageLoading] = useState(false);

  // 限制
  const NAME_MAX = 100;
  const DESC_MAX = 2000;
  const IMAGE_MAX = 9;

  // 商品分类
  const categories = [
    '数码产品', '服饰鞋包', '家居生活', '图书文具', '运动户外', '其他'
  ];

  // 新旧程度
  const conditions = [
    { value: 'new', label: '全新' },
    { value: 'like_new', label: '几乎全新' },
    { value: 'good', label: '品相良好' },
    { value: 'usable', label: '轻微使用' }
  ];

  // ===================== 加载商品数据（编辑模式） =====================
  const loadGoodsData = async () => {
    if (!isEdit) return;

    try {
      setPageLoading(true);
      // 这里可以新增一个获取单个商品详情的接口，或者从myGoods里找
      // 为了简化，我们先从myGoods接口获取所有商品，再找到对应的那个
      const res = await request.get('/api/my/goods', { params: { user_id: userInfo.id } });
      if (res.code === 200) {
        const goods = res.data.find(g => g.id === Number(id));
        if (goods) {
          // 解析原有描述里的分类和新旧程度
          let category = '';
          let condition = 'new';
          let pureDescription = goods.description || '';
          
          // 尝试从描述里提取分类和新旧程度
          if (pureDescription.includes('【分类】')) {
            const categoryMatch = pureDescription.match(/【分类】(.*?)(\n|$)/);
            if (categoryMatch) {
              category = categoryMatch[1].trim();
              pureDescription = pureDescription.replace(/【分类】.*?(\n|$)/, '');
            }
          }
          if (pureDescription.includes('【新旧程度】')) {
            const conditionMatch = pureDescription.match(/【新旧程度】(.*?)(\n|$)/);
            if (conditionMatch) {
              const conditionLabel = conditionMatch[1].trim();
              const foundCondition = conditions.find(c => c.label === conditionLabel);
              if (foundCondition) {
                condition = foundCondition.value;
              }
              pureDescription = pureDescription.replace(/【新旧程度】.*?(\n|$)/, '');
            }
          }

          // 填充表单
          setForm({
            name: goods.name || '',
            price: goods.price ? String(goods.price) : '',
            category: category || '',
            condition: condition,
            description: pureDescription.trim(),
            images: goods.image ? [goods.image] : []
          });
        } else {
          alert('商品不存在');
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error('加载商品数据失败', err);
      alert('加载商品数据失败');
      navigate('/dashboard');
    } finally {
      setPageLoading(false);
    }
  };

  // ===================== 表单输入处理 =====================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ===================== 图片处理（和论坛发帖完全一致） =====================
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

  // ===================== 表单校验 =====================
  const validateForm = () => {
    if (!form.name.trim()) {
      alert('请输入商品名称');
      return false;
    }
    if (form.name.length > NAME_MAX) {
      alert(`商品名称不能超过${NAME_MAX}字`);
      return false;
    }
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) {
      alert('请输入正确的商品价格');
      return false;
    }
    if (!form.category) {
      alert('请选择商品分类');
      return false;
    }
    if (form.description.length > DESC_MAX) {
      alert(`商品描述不能超过${DESC_MAX}字`);
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

  // ===================== 发布/修改商品 =====================
  const handlePublish = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const requestData = {
        user_id: userInfo.id,
        name: form.name.trim(),
        price: Number(form.price),
        description: `【分类】${form.category}\n【新旧程度】${conditions.find(c => c.value === form.condition)?.label}\n\n${form.description.trim()}`,
        image: form.images[0] || '' // 第一张图作为主图
      };

      let res;
      if (isEdit) {
        // 编辑模式：调用修改接口
        res = await request.put('/api/goods/update', {
          goods_id: id,
          ...requestData
        });
      } else {
        // 发布模式：调用发布接口
        res = await request.post('/api/goods/publish', requestData);
      }

      if (res.code === 200) {
        alert(isEdit ? '商品修改成功！' : '商品发布成功！');
        // 跳回个人中心
        navigate('/dashboard');
      } else {
        alert(res.msg || '操作失败，请重试');
      }
    } catch (err) {
      console.error('操作失败', err);
    } finally {
      setLoading(false);
    }
  };

  // ===================== 取消发布/编辑 =====================
  const handleCancel = () => {
    const hasContent = form.name.trim() || form.description.trim() || form.images.length > 0;
    if (hasContent) {
      if (!window.confirm('你有未保存的内容，确定要退出吗？')) {
        return;
      }
    }
    navigate('/dashboard');
  };

  // 页面加载时，如果是编辑模式，加载商品数据
  useEffect(() => {
    loadGoodsData();
  }, []);

  if (pageLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* 页面头部（和论坛发帖完全一致） */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {isEdit ? '编辑闲置商品' : '发布闲置商品'}
          </h2>
          <p className="text-gray-600">
            {isEdit ? '修改你的商品信息' : '让你的闲置物品流动起来'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        {/* 商品名称 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-gray-700 font-medium">商品名称 <span className="text-red-500">*</span></label>
            <span className={`text-sm ${form.name.length > NAME_MAX ? 'text-red-500' : 'text-gray-400'}`}>
              {form.name.length}/{NAME_MAX}
            </span>
          </div>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleInputChange}
            placeholder="请输入商品名称..."
            className={`w-full px-4 py-3 border rounded-md focus:outline-none transition-colors ${
              form.name.length > NAME_MAX 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:border-blue-500'
            }`}
          />
        </div>

        {/* 价格和分类（一行两列） */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* 商品价格 */}
          <div>
            <label className="text-gray-700 font-medium mb-2 block">商品价格（元） <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">¥</span>
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

          {/* 商品分类 */}
          <div>
            <label className="text-gray-700 font-medium mb-2 block">商品分类 <span className="text-red-500">*</span></label>
            <select
              name="category"
              value={form.category}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
            >
              <option value="">请选择分类</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 新旧程度 */}
        <div className="mb-6">
          <label className="text-gray-700 font-medium mb-3 block">新旧程度</label>
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
                {cond.label}
              </button>
            ))}
          </div>
        </div>

        {/* 商品描述 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-gray-700 font-medium">商品描述</label>
            <span className={`text-sm ${form.description.length > DESC_MAX ? 'text-red-500' : 'text-gray-400'}`}>
              {form.description.length}/{DESC_MAX}
            </span>
          </div>
          <textarea
            name="description"
            value={form.description}
            onChange={handleInputChange}
            placeholder="请详细描述商品的细节、使用情况、是否有瑕疵等信息..."
            rows={8}
            className={`w-full px-4 py-3 border rounded-md focus:outline-none resize-none transition-colors ${
              form.description.length > DESC_MAX 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:border-blue-500'
            }`}
          />
        </div>

        {/* 图片上传（和论坛发帖完全一致） */}
        <div className="mb-8">
          <label className="text-gray-700 font-medium mb-2 block">
            商品图片 <span className="text-gray-400 text-sm">（最多{IMAGE_MAX}张，支持jpg、png等格式）</span>
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
                  accept="image/jpeg,image/png,image/jpg,image/gif"
                  multiple
                  hidden
                  onChange={handleImageSelect}
                />
              </label>
            )}
          </div>
        </div>

        {/* 操作按钮（和论坛发帖完全一致） */}
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
            {loading ? '保存中...' : (isEdit ? '保存修改' : '发布商品')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGoods;
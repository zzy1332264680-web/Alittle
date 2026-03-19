// frontend/src/api/request.js 完整代码（适配后端端口3001）
import axios from 'axios';

// 创建axios实例，baseURL指向你的后端服务地址
const request = axios.create({
  baseURL: 'http://localhost:3001', // 必须和后端app.js的PORT=3001一致
  timeout: 5000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
});

// 请求拦截器（可选，统一处理请求头）
request.interceptors.request.use(
  (config) => {
    // 若有token，可在此添加（登录后使用）
    // const token = localStorage.getItem('token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    console.error('请求拦截器错误：', error);
    return Promise.reject(error);
  }
);

// 响应拦截器（可选，统一处理错误）
request.interceptors.response.use(
  (response) => {
    // 只返回响应数据
    return response.data;
  },
  (error) => {
    console.error('响应拦截器错误：', error);
    // 统一提示网络错误
    alert(error.message || '网络请求失败，请检查后端服务是否启动');
    return Promise.reject(error);
  }
);

export default request;
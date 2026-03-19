// src/components/AuthRoute.jsx 路由鉴权组件
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

// 功能：未登录的用户，自动跳转到登录页；已登录则正常显示页面
const AuthRoute = ({ children }) => {
  const { token } = useAuth();

  // 没有token=未登录，强制跳转到登录页
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 已登录，渲染传入的页面组件
  return children;
};

export default AuthRoute;
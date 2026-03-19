import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// 导入所有核心组件
import { AuthProvider } from './hooks/useAuth.jsx';
import AuthRoute from './components/AuthRoute.jsx'; // 导入鉴权组件
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import Home from './pages/Home.jsx';
// 导入新增的功能页面
import Chat from './pages/Chat.jsx';
import Forum from './pages/Forum.jsx';
import CreatePost from './pages/CreatePost.jsx'; // 发布帖子
import Market from './pages/Market.jsx';
import Profile from './pages/Profile.jsx'; // 个人中心
import Settings from './pages/Settings.jsx'; // 设置

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* 公开路由：不需要登录就能访问 */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* 受保护路由：必须登录才能访问，嵌套在Layout下 */}
          <Route 
            path="/" 
            element={
              <AuthRoute>
                <Layout />
              </AuthRoute>
            } 
          >
            {/* 嵌套子路由：对应不同功能页面 */}
            <Route index element={<Home />} /> {/* 首页 */}
            <Route path="chat" element={<Chat />} /> {/* 好友聊天 */}
            <Route path="forum" element={<Forum />} /> {/* 论坛列表 */}
            <Route path="forum/create" element={<CreatePost />} /> {/* 发布帖子 */}
            <Route path="market" element={<Market />} /> {/* 闲置交易 */}
            <Route path="profile" element={<Profile />} /> {/* 个人中心 */}
            <Route path="settings" element={<Settings />} /> {/* 设置 */}
          </Route>
          
          {/* 兜底路由：所有未匹配的地址，强制跳转到登录页 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
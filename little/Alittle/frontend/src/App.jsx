import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/AuthProvider.jsx';
import { LanguageProvider } from './hooks/LanguageProvider.jsx';
import AuthRoute from './components/AuthRoute.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import Home from './pages/Home.jsx';
import Chat from './pages/Chat.jsx';
import Forum from './pages/Forum.jsx';
import CreatePost from './pages/CreatePost.jsx';
import CreateGoods from './pages/CreateGoods.jsx';
import Market from './pages/Market.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
import Dashboard from './pages/Dashboard.jsx';

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            <Route 
              path="/" 
              element={
                <AuthRoute>
                  <Layout />
                </AuthRoute>
              } 
            >
              <Route index element={<Home />} />
              <Route path="chat" element={<Chat />} />
              <Route path="forum" element={<Forum />} />
              <Route path="forum/create" element={<CreatePost />} />
              <Route path="forum/edit/:id" element={<CreatePost />} />
              <Route path="market" element={<Market />} />
              <Route path="market/create" element={<CreateGoods />} />
              <Route path="market/edit/:id" element={<CreateGoods />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="dashboard" element={<Dashboard />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;

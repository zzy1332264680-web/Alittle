// src/pages/Chat.jsx 适配后的聊天页面
import { useState } from 'react';
// 注意：如果你的项目里没有 useSocket，可以先注释掉相关代码，用模拟数据
// import { useSocket } from '../hooks/useSocket';

const Chat = () => {
  // 模拟消息数据（如果没有 useSocket）
  const [messages, setMessages] = useState([
    { userId: '用户1', time: '20:00', content: '你好！欢迎使用聊天功能' },
    { userId: '用户2', time: '20:01', content: '你好！这个功能看起来不错' }
  ]);
  const [inputValue, setInputValue] = useState('');

  // 发送消息（模拟）
  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    // 添加新消息
    setMessages([
      ...messages,
      {
        userId: '我',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        content: inputValue.trim()
      }
    ]);
    setInputValue('');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">实时聊天</h2>
        <p className="text-gray-600">和好友实时沟通</p>
      </div>

      {/* 聊天容器 */}
      <div className="bg-white rounded-lg shadow-md h-[65vh] flex flex-col">
        {/* 消息列表 */}
        <div className="flex-grow overflow-y-auto p-6 space-y-4">
          {messages.length > 0 ? (
            messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.userId === '我' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-md ${msg.userId === '我' ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className="flex items-center mb-1 gap-2">
                    <span className="text-sm text-gray-500">{msg.userId}</span>
                    <span className="text-xs text-gray-400">{msg.time}</span>
                  </div>
                  <div className={`px-4 py-2 rounded-lg ${
                    msg.userId === '我' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              暂无消息，开始聊天吧～
            </div>
          )}
        </div>
        {/* 发送消息表单 */}
        <form onSubmit={handleSend} className="p-4 border-t bg-gray-50">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="输入消息..."
              className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
            />
            <button 
              type="submit" 
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              发送
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;
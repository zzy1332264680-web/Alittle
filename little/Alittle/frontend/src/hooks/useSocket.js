import { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);

  // 初始化Socket连接
  useEffect(() => {
    // 连接到后端Socket服务（地址和API一致）
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    // 监听聊天消息
    newSocket.on('chat message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    // 组件卸载时关闭连接
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // 发送消息方法
  const sendMessage = useCallback((content) => {
    if (socket) {
      socket.emit('chat message', {
        content,
        userId: localStorage.getItem('userId') || 'guest', // 模拟用户ID
        time: new Date().toLocaleTimeString(),
      });
    }
  }, [socket]);

  return { socket, messages, sendMessage };
};
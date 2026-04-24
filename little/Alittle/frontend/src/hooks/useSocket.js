import { useCallback, useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const connection = io('http://localhost:3001');
    socketRef.current = connection;

    connection.on('connect', () => {
      setSocket(connection);
    });

    connection.on('chat message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      connection.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, []);

  const sendMessage = useCallback((content) => {
    if (!socketRef.current) {
      return;
    }

    socketRef.current.emit('chat message', {
      content,
      userId: localStorage.getItem('userId') || 'guest',
      time: new Date().toLocaleTimeString(),
    });
  }, []);

  return { socket, messages, sendMessage };
};

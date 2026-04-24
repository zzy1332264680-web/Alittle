// src/pages/Chat.jsx（多语言修复版）
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import request from '../api/request';

const Chat = () => {
  const { t } = useLanguage();
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const imagePreviewRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState('conversation');
  const [conversations, setConversations] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [messageOffset, setMessageOffset] = useState(0);
  const [showExtensionMenu, setShowExtensionMenu] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  
  const [messageContextMenu, setMessageContextMenu] = useState(null);
  const [convContextMenu, setConvContextMenu] = useState(null);
  
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [applyReason, setApplyReason] = useState('我想添加你为好友');
  const [friendApplies, setFriendApplies] = useState([]);

  const PAGE_SIZE = 20;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const scrollToTop = useCallback(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = 100;
    }
  }, []);

  const getConversations = useCallback(async () => {
    try {
      const res = await request.get('/api/chat/conversations', { 
        params: { user_id: userInfo.id } 
      });
      if (res.code === 200) {
        const visibleConvs = (res.data || []).filter(conv => !conv.is_hidden);
        setConversations(visibleConvs);
      }
    } catch (err) {
      console.error('获取会话列表失败', err);
    }
  }, [userInfo.id]);

  const getFriends = useCallback(async () => {
    try {
      const res = await request.get('/api/friend/list', { 
        params: { user_id: userInfo.id } 
      });
      if (res.code === 200) {
        setFriends(res.data);
      }
    } catch (err) {
      console.error('获取好友列表失败', err);
    }
  }, [userInfo.id]);

  const getFriendApplies = useCallback(async () => {
    try {
      const res = await request.get('/api/friend/apply/list', { 
        params: { user_id: userInfo.id } 
      });
      if (res.code === 200) {
        setFriendApplies(res.data);
      }
    } catch (err) {
      console.error('获取好友申请失败', err);
    }
  }, [userInfo.id]);

  const handleSearchUser = async () => {
    if (!searchKeyword.trim()) return;
    
    try {
      setSearching(true);
      const res = await request.get('/api/user/search', {
        params: { 
          keyword: searchKeyword.trim(), 
          exclude_user_id: userInfo.id 
        }
      });
      if (res.code === 200) {
        setSearchResults(res.data);
      }
    } catch (err) {
      console.error('搜索用户失败', err);
      alert('搜索失败');
    } finally {
      setSearching(false);
    }
  };

  const handleSendApply = async (targetUser) => {
    if (!applyReason.trim()) {
      alert('请输入申请理由');
      return;
    }

    try {
      const res = await request.post('/api/friend/apply', {
        from_user_id: userInfo.id,
        to_user_id: targetUser.id,
        apply_reason: applyReason.trim()
      });
      
      if (res.code === 200) {
        alert('好友申请已发送');
        setShowAddFriendModal(false);
        setSearchKeyword('');
        setSearchResults([]);
        setApplyReason('我想添加你为好友');
      } else {
        alert(res.msg || '发送失败');
      }
    } catch (err) {
      console.error('发送好友申请失败', err);
    }
  };

  const handleApply = async (apply, status) => {
    try {
      const res = await request.put('/api/friend/apply/handle', {
        apply_id: apply.id,
        user_id: userInfo.id,
        status: status
      });
      
      if (res.code === 200) {
        alert(res.msg);
        getFriendApplies();
        getFriends();
      } else {
        alert(res.msg || '处理失败');
      }
    } catch (err) {
      console.error('处理好友申请失败', err);
    }
  };

  const getMessages = async (targetUserId, isLoadMore = false) => {
    if (!targetUserId) return;
    
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      }
      
      const res = await request.get('/api/chat/messages', {
        params: {
          from_user_id: userInfo.id,
          to_user_id: targetUserId,
          offset: isLoadMore ? messageOffset + PAGE_SIZE : 0,
          limit: PAGE_SIZE
        }
      });

      if (res.code === 200) {
        if (isLoadMore) {
          setMessages(prev => [...res.data, ...prev]);
          setHasMore(res.data.length === PAGE_SIZE);
          scrollToTop();
        } else {
          setMessages(res.data);
          setHasMore(res.data.length === PAGE_SIZE);
          setMessageOffset(0);
          scrollToBottom();
        }
      }
    } catch (err) {
      console.error('获取聊天记录失败', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !selectedUser || sending) return;

    try {
      setSending(true);
      const res = await request.post('/api/chat/send', {
        from_user_id: userInfo.id,
        to_user_id: selectedUser.id,
        content: inputValue.trim(),
        type: 'text'
      });

      if (res.code === 200) {
        setInputValue('');
        setShowExtensionMenu(false);
        getMessages(selectedUser.id);
        getConversations();
      } else {
        alert(res.msg || '发送失败');
      }
    } catch (err) {
      console.error('发送失败', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setSending(true);
        const res = await request.post('/api/chat/send', {
          from_user_id: userInfo.id,
          to_user_id: selectedUser.id,
          content: event.target.result,
          type: 'image'
        });

        if (res.code === 200) {
          getMessages(selectedUser.id);
          getConversations();
        }
      } catch (err) {
        console.error('发送图片失败', err);
      } finally {
        setSending(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    setMessages([]);
    setMessageOffset(0);
    setHasMore(true);
    setMessageContextMenu(null);
    setConvContextMenu(null);
    
    await request.put('/api/chat/mark-read', {
      from_user_id: user.id,
      to_user_id: userInfo.id
    });
    
    getMessages(user.id);
    getConversations();
  };

  const handleMessageContextMenu = (e, message) => {
    e.preventDefault();
    e.stopPropagation();
    setConvContextMenu(null);
    setMessageContextMenu({
      x: e.clientX,
      y: e.clientY,
      message
    });
  };

  const handleCopyText = () => {
    if (messageContextMenu?.message) {
      navigator.clipboard.writeText(messageContextMenu.message.content);
      setMessageContextMenu(null);
    }
  };

  const handleRecallMessage = async () => {
    if (!messageContextMenu?.message) return;
    
    try {
      const res = await request.put('/api/chat/recall', {
        message_id: messageContextMenu.message.id,
        user_id: userInfo.id
      });
      
      if (res.code === 200) {
        alert('撤回成功');
        getMessages(selectedUser.id);
      } else {
        alert(res.msg || '撤回失败');
      }
    } catch (err) {
      console.error('撤回失败', err);
    } finally {
      setMessageContextMenu(null);
    }
  };

  const handleDeleteMessage = async () => {
    if (!messageContextMenu?.message) return;
    
    if (!window.confirm('确定要删除这条消息吗？')) return;
    
    try {
      const res = await request.put('/api/chat/delete', {
        message_id: messageContextMenu.message.id,
        user_id: userInfo.id
      });
      
      if (res.code === 200) {
        getMessages(selectedUser.id);
      }
    } catch (err) {
      console.error('删除失败', err);
    } finally {
      setMessageContextMenu(null);
    }
  };

  const handleConvContextMenu = (e, conv) => {
    e.preventDefault();
    e.stopPropagation();
    setMessageContextMenu(null);
    setConvContextMenu({
      x: e.clientX,
      y: e.clientY,
      conv
    });
  };

  const handleTogglePin = async () => {
    if (!convContextMenu?.conv) return;
    const conv = convContextMenu.conv;
    const newPinStatus = conv.is_pinned ? 0 : 1;
    
    try {
      const res = await request.put('/api/conversations/top', {
        user_id: userInfo.id,
        target_user_id: conv.target_user_id,
        is_pinned: newPinStatus
      });
      
      if (res.code === 200) {
        getConversations();
      }
    } catch (err) {
      console.error('置顶操作失败', err);
    } finally {
      setConvContextMenu(null);
    }
  };

  const handleHideConv = async () => {
    if (!convContextMenu?.conv) return;
    const conv = convContextMenu.conv;
    
    if (!window.confirm('确定要隐藏这个对话吗？')) return;

    try {
      const res = await request.put('/api/conversations/hide', {
        user_id: userInfo.id,
        target_user_id: conv.target_user_id,
        is_hidden: 1
      });
      
      if (res.code === 200) {
        if (selectedUser?.id === conv.target_user_id) {
          setSelectedUser(null);
        }
        getConversations();
      }
    } catch (err) {
      console.error('隐藏失败', err);
    } finally {
      setConvContextMenu(null);
    }
  };

  const handleDeleteConv = async () => {
    if (!convContextMenu?.conv) return;
    const conv = convContextMenu.conv;
    
    if (!window.confirm('确定要删除这个对话吗？（仅删除会话记录，不删除聊天消息）')) return;

    try {
      const res = await request.delete(`/api/conversations/${conv.id}`, {
        data: { user_id: userInfo.id }
      });
      
      if (res.code === 200) {
        if (selectedUser?.id === conv.target_user_id) {
          setSelectedUser(null);
        }
        getConversations();
      }
    } catch (err) {
      console.error('删除失败', err);
    } finally {
      setConvContextMenu(null);
    }
  };

  const handleScroll = (e) => {
    const { scrollTop } = e.target;
    if (scrollTop <= 50 && hasMore && !loadingMore && selectedUser) {
      setMessageOffset(prev => prev + PAGE_SIZE);
      getMessages(selectedUser.id, true);
    }
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setMessageContextMenu(null);
      setConvContextMenu(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    getConversations();
    getFriends();
    getFriendApplies();
  }, [getConversations, getFriendApplies, getFriends]);

  useEffect(() => {
    if (!loadingMore) {
      scrollToBottom();
    }
  }, [messages, loadingMore, scrollToBottom]);

  useEffect(() => {
    if (inputValue.trim()) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [inputValue]);

  const formatMessageTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 5) return '';
    
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const shouldShowTimeDivider = (index, messages) => {
    if (index === 0) return true;
    const prevTime = new Date(messages[index - 1].create_time);
    const currTime = new Date(messages[index].create_time);
    return (currTime - prevTime) > 5 * 60 * 1000;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{t('chat.title')}</h2>
          <p className="text-gray-600">{t('chat.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowAddFriendModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          {t('chat.addFriend')}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md h-[70vh] flex">
        <div className="w-72 border-r bg-gray-50 flex flex-col">
          <div className="flex border-b bg-white">
            <button
              onClick={() => setActiveTab('conversation')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'conversation' 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t('chat.conversation')}
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'contact' 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t('chat.contacts')}
              {friendApplies.filter(a => a.status === 0).length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full">
                  {friendApplies.filter(a => a.status === 0).length}
                </span>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === 'conversation' && (
              <>
                {conversations.length > 0 ? (
                  conversations.map((conv) => (
                    <div
                      key={`conv-${conv.id}`}
                      onClick={() => handleSelectUser({
                        id: conv.target_user_id,
                        username: conv.username,
                        avatar: conv.avatar,
                        nickname: conv.nickname
                      })}
                      onContextMenu={(e) => handleConvContextMenu(e, conv)}
                      className={`p-4 cursor-pointer hover:bg-gray-100 transition-colors border-b relative ${
                        selectedUser?.id === conv.target_user_id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold overflow-hidden relative">
                          {conv.avatar ? (
                            <img src={conv.avatar} alt={conv.username} className="w-full h-full object-cover" />
                          ) : (
                            (conv.nickname || conv.username || 'U').charAt(0).toUpperCase()
                          )}
                          {conv.unread_count > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <p className="font-medium text-gray-800 truncate flex items-center gap-1">
                              {conv.is_pinned && <span className="text-xs text-blue-500">[置顶]</span>}
                              {conv.nickname || conv.username}
                            </p>
                            {conv.last_message_time && (
                              <span className="text-xs text-gray-400">
                                {new Date(conv.last_message_time).toLocaleTimeString('zh-CN', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            {conv.last_message || t('chat.noMessages')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    {t('chat.noConversation')}
                  </div>
                )}
              </>
            )}

            {activeTab === 'contact' && (
              <>
                {friendApplies.filter(a => a.status === 0).length > 0 && (
                  <div className="border-b border-gray-200">
                    <div className="px-4 py-2 text-xs text-gray-400 bg-gray-100">{t('chat.newFriendApply')}</div>
                    {friendApplies.filter(a => a.status === 0).map((apply) => (
                      <div key={`apply-${apply.id}`} className="p-4 border-b bg-yellow-50">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                            {apply.from_avatar ? (
                              <img src={apply.from_avatar} alt={apply.from_username} className="w-full h-full object-cover" />
                            ) : (
                              (apply.from_nickname || apply.from_username || 'U').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">
                              {apply.from_nickname || apply.from_username}
                            </p>
                            <p className="text-sm text-gray-500">
                              {apply.apply_reason}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApply(apply, 2)}
                            className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                          >
                            拒绝
                          </button>
                          <button
                            onClick={() => handleApply(apply, 1)}
                            className="flex-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            同意
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="px-4 py-2 text-xs text-gray-400 bg-gray-100">{t('chat.myFriends')} ({friends.length})</div>
                {friends.length > 0 ? (
                  friends.map((friend) => (
                    <div
                      key={`friend-${friend.id}`}
                      onClick={() => handleSelectUser({
                        id: friend.friend_user_id,
                        username: friend.username,
                        avatar: friend.avatar,
                        nickname: friend.nickname
                      })}
                      className={`p-4 cursor-pointer hover:bg-gray-100 transition-colors border-b ${
                        selectedUser?.id === friend.friend_user_id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold overflow-hidden relative">
                          {friend.avatar ? (
                            <img src={friend.avatar} alt={friend.username} className="w-full h-full object-cover" />
                          ) : (
                            (friend.nickname || friend.username || 'U').charAt(0).toUpperCase()
                          )}
                          {friend.online_status === 'online' && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">
                            {friend.nickname || friend.username}
                          </p>
                          <p className="text-xs text-gray-400">
                            {friend.online_status === 'online' ? t('chat.online') : t('chat.offline')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    {t('chat.noContacts')}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedUser && (
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                  {selectedUser.avatar ? (
                    <img src={selectedUser.avatar} alt={selectedUser.username} className="w-full h-full object-cover" />
                  ) : (
                    (selectedUser.nickname || selectedUser.username || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    {selectedUser.nickname || selectedUser.username}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isTyping ? t('chat.typing') : t('chat.online')}
                  </p>
                </div>
              </div>
              <button 
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                onClick={() => alert('查看对方资料页（预留入口）')}
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          )}

          <div 
            ref={messageContainerRef}
            className="flex-grow overflow-y-auto p-6 space-y-4 bg-gray-50"
            onScroll={handleScroll}
            onContextMenu={(e) => e.preventDefault()}
          >
            {!selectedUser ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                {t('chat.selectContact')}
              </div>
            ) : messages.length > 0 ? (
              <>
                {loadingMore && (
                  <div className="text-center text-gray-400 text-sm py-2">
                    {t('chat.loadMore')}
                  </div>
                )}
                
                {messages.map((msg, index) => {
                  const isSenderMe = msg.from_user_id === userInfo.id;
                  const isMe = isSenderMe; 
                  const showTime = shouldShowTimeDivider(index, messages);
                  
                  return (
                    <div key={msg.id}>
                      {showTime && (
                        <div className="text-center my-4">
                          <span className="px-3 py-1 bg-gray-200 text-gray-500 text-xs rounded-full">
                            {new Date(msg.create_time).toLocaleString('zh-CN', {
                              month: 'numeric',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}

                      <div 
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        onContextMenu={(e) => !msg.is_recalled && handleMessageContextMenu(e, msg)}
                      >
                        <div className={`max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                          <div className="flex items-center mb-1 gap-2">
                            <span className="text-sm text-gray-500">
                              {isMe ? '我' : (selectedUser?.nickname || selectedUser?.username || '对方')}
                            </span>
                            {formatMessageTime(msg.create_time) && (
                              <span className="text-xs text-gray-400">
                                {formatMessageTime(msg.create_time)}
                              </span>
                            )}
                          </div>
                          
                          {msg.is_recalled ? (
                            <div className="px-4 py-2 rounded-lg bg-gray-100 text-gray-400 text-sm italic">
                              {msg.content}
                            </div>
                          ) : msg.type === 'image' ? (
                            <div 
                              className="rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity max-w-xs"
                              onClick={() => setPreviewImage(msg.content)}
                            >
                              <img 
                                src={msg.content} 
                                alt="消息图片" 
                                className="w-full h-auto"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'block';
                                }}
                              />
                              <div className="hidden px-4 py-8 bg-gray-200 text-gray-500 text-center">
                                图片加载失败
                              </div>
                            </div>
                          ) : (
                            <div className={`px-4 py-2 rounded-lg whitespace-pre-wrap break-words ${
                              isMe 
                                ? 'bg-blue-600 text-white rounded-tr-none' 
                                : 'bg-white text-gray-800 rounded-tl-none shadow-sm'
                            }`}>
                              {msg.content}
                            </div>
                          )}
                          
                          {isMe && !msg.is_recalled && (
                            <div className="flex items-center mt-1 gap-1">
                              {msg.status === 'sending' && (
                                <span className="text-xs text-gray-400">{t('chat.sending')}</span>
                              )}
                              {msg.status === 'failed' && (
                                <span className="text-xs text-red-500">发送失败</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                {t('chat.noMessages')}
              </div>
            )}
          </div>

          {selectedUser && (
            <div className="border-t bg-white">
              {showExtensionMenu && (
                <div className="p-4 border-b bg-gray-50 flex gap-4">
                  <label className="flex flex-col items-center gap-2 cursor-pointer hover:bg-gray-100 p-3 rounded-lg transition-colors">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2h-5.586a1 1 0 01-.707.293l-5.414 5.414a1 1 0 01-.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-600">相册</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleImageSelect}
                    />
                  </label>
                  <button 
                    className="flex flex-col items-center gap-2 hover:bg-gray-100 p-3 rounded-lg transition-colors"
                    onClick={() => alert('文件发送（预留入口）')}
                  >
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-600">文件</span>
                  </button>
                </div>
              )}

              <div className="p-4">
                <div className="flex items-end gap-3">
                  <button
                    className={`p-2 rounded-full transition-colors ${
                      showExtensionMenu ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'
                    }`}
                    onClick={() => setShowExtensionMenu(!showExtensionMenu)}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>

                  <button
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                    onClick={() => alert('表情功能（预留入口）')}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>

                  <div className="flex-1 relative">
                    <textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={t('chat.inputPlaceholder')}
                      disabled={sending}
                      rows={1}
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500 resize-none disabled:bg-gray-100"
                      style={{
                        maxHeight: '120px',
                        minHeight: '48px',
                        height: 'auto'
                      }}
                    />
                  </div>

                  <button
                    onClick={handleSend}
                    disabled={!selectedUser || sending || !inputValue.trim()}
                    className={`px-6 py-3 rounded-2xl font-medium transition-colors whitespace-nowrap ${
                      inputValue.trim() && !sending
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {sending ? t('chat.sending') : t('chat.send')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddFriendModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">{t('chat.addFriend')}</h3>
              <button 
                onClick={() => {
                  setShowAddFriendModal(false);
                  setSearchKeyword('');
                  setSearchResults([]);
                  setApplyReason('我想添加你为好友');
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-4">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                  placeholder="输入用户名、邮箱或手机号搜索"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleSearchUser}
                  disabled={searching || !searchKeyword.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {searching ? t('common.loading') : '搜索'}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {searchResults.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                          ) : (
                            (user.nickname || user.username || 'U').charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {user.nickname || user.username}
                          </p>
                          {user.email && (
                            <p className="text-xs text-gray-400">{user.email}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleSendApply(user)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        {t('chat.addFriend')}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    申请理由
                  </label>
                  <input
                    type="text"
                    value={applyReason}
                    onChange={(e) => setApplyReason(e.target.value)}
                    placeholder="请输入申请理由"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {!searching && searchKeyword && searchResults.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  未找到相关用户
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {messageContextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border py-2 z-50 min-w-[160px]"
          style={{
            left: messageContextMenu.x,
            top: messageContextMenu.y,
            transform: messageContextMenu.x > window.innerWidth / 2 ? 'translateX(-100%)' : 'none'
          }}
        >
          {messageContextMenu.message.type === 'text' && !messageContextMenu.message.is_recalled && (
            <button
              className="w-full px-4 py-2 text-left hover:bg-gray-100 text-gray-700 flex items-center gap-2"
              onClick={handleCopyText}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {t('chat.copy')}
            </button>
          )}
          {messageContextMenu.message.from_user_id === userInfo.id && !messageContextMenu.message.is_recalled && (
            <button
              className="w-full px-4 py-2 text-left hover:bg-gray-100 text-gray-700 flex items-center gap-2"
              onClick={handleRecallMessage}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              {t('chat.recall')}
            </button>
          )}
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600 flex items-center gap-2"
            onClick={handleDeleteMessage}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {t('chat.delete')}
          </button>
        </div>
      )}

      {convContextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border py-2 z-50 min-w-[160px]"
          style={{
            left: convContextMenu.x,
            top: convContextMenu.y,
            transform: convContextMenu.x > window.innerWidth / 2 ? 'translateX(-100%)' : 'none'
          }}
        >
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-gray-700 flex items-center gap-2"
            onClick={handleTogglePin}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V5z" />
            </svg>
            {convContextMenu.conv.is_pinned ? t('chat.unpin') : t('chat.pin')}
          </button>
          
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-gray-700 flex items-center gap-2"
            onClick={handleHideConv}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
            {t('chat.hide')}
          </button>
          
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600 flex items-center gap-2"
            onClick={handleDeleteConv}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {t('chat.deleteConv')}
          </button>
        </div>
      )}

      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300"
            onClick={() => setPreviewImage(null)}
          >
            ×
          </button>
          <img 
            src={previewImage} 
            alt="预览" 
            className="max-w-[90vw] max-h-[90vh] object-contain"
            ref={imagePreviewRef}
          />
        </div>
      )}
    </div>
  );
};

export default Chat;

import React, { useState, useEffect, useRef } from 'react';
import './MessengerSystem.css';
import { io } from 'socket.io-client';

const socket = io('http://35.225.63.41:3080'); 

const MessengerSystem = () => {
  const [showMessenger, setShowMessenger] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [popupPosition, setPopupPosition] = useState({ x: 1100, y: 350 });
  const [popupSize, setPopupSize] = useState({ width: 700, height: 500 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);

  // 사용자 이름 리스트
  const userNames = [
    '김의사', '박간호사', '이기사', '최원장', '김상묵', '홍관리자',
    '심보람', '양진모', '윤수진', '임철수', '조영희', '송민우',
    '강태현', '김채윤', '권혜진', '남도훈', '이나영', '허민정'
  ];

  // 3개 채팅방
  const chatRooms = [
    { id: 'room1', name: '일반 상담실', icon: '💬' },
    { id: 'room2', name: '응급 상황실', icon: '🚨' },
    { id: 'room3', name: '휴게실', icon: '☕' }
  ];

  // 알림음 초기화
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvGogCjaK0fPTgjMGHm7A7+OZUQ0PVqzn77BdGAg+ltryxnkpBSl+zPLaizsIGGS57OihUgwLTKXh8bllHgg2jdXzzn0vBSF0xe/glEILElyx6OyrWBUIQ5zd8sFuIAU2jdT0z4AzBh5qvu7mnVEODlOq5O+zYBoGPJPY88p9KwUme8rx3I4+CRZiturqpVQNC0ml4PK8aB4GMo/U9M2AMAYfcsLu45ZFDBFYr+ftrVoXCECY3PLEcSEELIHO8diJOQcZZ73s5Z9NEAxPqOPwtmMcBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvGogCjaK0fPTgjMGHm7A7eSaUQ0PVqzn77BeGQc9ltnzxXEhBSyBzvHYiTkHGWe97OWfTgwMT6jj8LZjHAY4ktfyzXkrBSR3x/DdkEAKFF606OuoVRQKRp/g8rxqIAo2itHz04IzBh5uwO/kmlENDlas5++wXhkHPZbZ88NwIAUsgs/y2Ik5BxhkuuzkoVINC06k4PG8aR4GNY/U9M2AMAYfcsLu45ZFDBFYr+ftrVoXCECY3PLEcSEGJ4DO8tiIOQcZZ73s5Z9ODAw=');
  }, []);

  // 소켓 이벤트 리스너 설정
  useEffect(() => {
    // 사용자 입장 시 랜덤 이름 생성
    if (!currentUser) {
      const randomName = userNames[Math.floor(Math.random() * userNames.length)];
      const userId = `user_${Date.now()}`;
      setCurrentUser({ id: userId, name: randomName });
      socket.emit('user join', { id: userId, name: randomName });
    }

    // 메시지 수신
    socket.on('message', (data) => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        content: data.message,
        sender: data.sender,
        senderName: data.senderName,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        room: data.room
      }]);

      // 알림 추가 (현재 선택된 방이 아닌 경우)
      if (data.room !== selectedRoom && data.sender !== currentUser?.id) {
        addNotification(`${data.senderName}님이 메시지를 보냈습니다`, data.room);
        playNotificationSound();
      }

      scrollToBottom();
    });

    // 온라인 사용자 목록 업데이트
    socket.on('users update', (users) => {
      setOnlineUsers(users);
    });

    // // 사용자 입장/퇴장 알림
    // socket.on('user joined', (data) => {
    //   addNotification(`${data.name}님이 입장했습니다`);
    // });

    // socket.on('user left', (data) => {
    //   addNotification(`${data.name}님이 퇴장했습니다`);
    // });

    return () => {
      socket.off('message');
      socket.off('users update');
      // socket.off('user joined');
      // socket.off('user left');
    };
  }, [currentUser, selectedRoom]);

  // 메시지 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 알림 추가
  const addNotification = (message, room = null) => {
    const notification = {
      id: Date.now(),
      message,
      room,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };
    setNotifications(prev => [...prev, notification]);

    // 5초 후 알림 자동 제거
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // 알림음 재생
  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
  };

  // 방 선택
  const handleRoomSelect = (roomId) => {
    if (selectedRoom) {
      socket.emit('leave room', selectedRoom);
    }
    
    setSelectedRoom(roomId);
    socket.emit('join room', roomId);
    setMessages([]);

    // 해당 방의 알림 제거
    setNotifications(prev => prev.filter(n => n.room !== roomId));
  };

  // 메시지 전송
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedRoom || !currentUser) return;

    const messageData = {
      room: selectedRoom,
      message: newMessage,
      sender: currentUser.id,
      senderName: currentUser.name
    };

    socket.emit('send message', messageData);
    setNewMessage('');
  };

  // 드래그 관련 함수들
  const handleMouseDown = (e) => {
    if (e.target.closest('.messenger-header')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - popupPosition.x,
        y: e.clientY - popupPosition.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPopupPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    } else if (isResizing) {
      const newWidth = Math.max(400, resizeStart.width + (e.clientX - resizeStart.x));
      const newHeight = Math.max(300, resizeStart.height + (e.clientY - resizeStart.y));
      setPopupSize({ width: newWidth, height: newHeight });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: popupSize.width,
      height: popupSize.height
    });
  };

  // 전역 마우스 이벤트 리스너
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragOffset, resizeStart]);

  // 현재 방의 메시지만 필터링
  const currentRoomMessages = messages.filter(msg => msg.room === selectedRoom);

  return (
    <>
      {/* 알림 토스트 */}
      <div className="notification-container">
        {notifications.map(notification => (
          <div key={notification.id} className="notification-toast">
            <div className="notification-content">
              <div className="notification-message">{notification.message}</div>
              <div className="notification-time">{notification.time}</div>
            </div>
            <button 
              className="notification-close"
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* 플로팅 채팅 버튼 */}
      <button
        className="floating-chat-btn"
        onClick={() => setShowMessenger(true)}
        title="메신저"
      >
        💬
        {notifications.length > 0 && (
          <span className="notification-badge">{notifications.length}</span>
        )}
      </button>

      {/* 메신저 팝업 */}
      {showMessenger && (
        <div 
          className="messenger-window"
          style={{
            left: `${popupPosition.x}px`,
            top: `${popupPosition.y}px`,
            width: `${popupSize.width}px`,
            height: `${popupSize.height}px`
          }}
          onMouseDown={handleMouseDown}
        >
          {/* 메신저 헤더 */}
          <div className="messenger-header draggable">
            <div className="header-left">
              <h2>실시간 메신저</h2>
              {currentUser && (
                <span className="current-user">({currentUser.name})</span>
              )}
            </div>
            <div className="window-controls">
              <button 
                className="messenger-close"
                onClick={() => setShowMessenger(false)}
                title="닫기"
              >
                ×
              </button>
            </div>
          </div>

          <div className="messenger-content">
            {/* 좌측 패널 - 채팅방 목록 */}
            <div className="messenger-sidebar">
              <div className="sidebar-header">
                <h3>채팅방</h3>
                <div className="online-count">
                  온라인: {onlineUsers.length}명
                </div>
              </div>

              <div className="room-list">
                {chatRooms.map(room => (
                  <div 
                    key={room.id}
                    className={`room-item ${selectedRoom === room.id ? 'active' : ''}`}
                    onClick={() => handleRoomSelect(room.id)}
                  >
                    <div className="room-icon">{room.icon}</div>
                    <div className="room-info">
                      <div className="room-name">{room.name}</div>
                      <div className="room-users">
                        {onlineUsers.filter(u => u.room === room.id).length}명 참여중
                      </div>
                    </div>
                    {notifications.some(n => n.room === room.id) && (
                      <div className="room-notification-dot"></div>
                    )}
                  </div>
                ))}
              </div>

              {/* 온라인 사용자 목록 */}
              <div className="online-users">
                <h4>현재 접속자</h4>
                <div className="user-list">
                  {onlineUsers.map(user => (
                    <div key={user.id} className="online-user">
                      <div className="user-avatar">👤</div>
                      <div className="user-name">{user.name}</div>
                      <div className="online-indicator"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 우측 패널 - 채팅 영역 */}
            <div className="chat-panel">
              {!selectedRoom ? (
                <div className="messenger-empty">
                  <div className="messenger-empty-content">
                    <div className="messenger-empty-icon">💬</div>
                    <p className="messenger-empty-title">채팅방을 선택하세요</p>
                    <p className="messenger-empty-subtitle">왼쪽에서 참여할 채팅방을 선택해주세요</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* 채팅 헤더 */}
                  <div className="chat-header">
                    <div className="chat-room-info">
                      <h3>{chatRooms.find(r => r.id === selectedRoom)?.name}</h3>
                      <p>{onlineUsers.filter(u => u.room === selectedRoom).length}명 참여중</p>
                    </div>
                  </div>

                  {/* 메시지 영역 */}
                  <div className="chat-messages">
                    {currentRoomMessages.length > 0 ? (
                      currentRoomMessages.map(msg => (
                        <div key={msg.id} className={`message ${msg.sender === currentUser?.id ? 'message-me' : 'message-other'}`}>
                          {msg.sender !== currentUser?.id && (
                            <div className="message-sender">{msg.senderName}</div>
                          )}
                          <div className="message-bubble">
                            {msg.content}
                          </div>
                          <div className="message-time">{msg.time}</div>
                        </div>
                      ))
                    ) : (
                      <div className="chat-empty">
                        새로운 대화를 시작하세요
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* 입력 영역 */}
                  <div className="chat-input-area">
                    <div className="chat-input-container">
                      <input 
                        type="text" 
                        placeholder="메시지를 입력하세요..."
                        className="chat-input"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <button 
                        className="chat-send-btn"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                      >
                        전송
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 리사이징 핸들 */}
          <div 
            className="resize-handle"
            onMouseDown={handleResizeStart}
          ></div>
        </div>
      )}
    </>
  );
};

export default MessengerSystem;
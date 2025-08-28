const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// CORS 설정
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"]
}));

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 사용자 및 방 정보 저장
const users = new Map();
const rooms = new Map();

// 3개의 채팅방 초기화
const chatRooms = ['room1', 'room2', 'room3'];
chatRooms.forEach(room => {
  rooms.set(room, new Set());
});

io.on('connection', (socket) => {
  console.log(`사용자 연결됨: ${socket.id}`);

  // 사용자 입장
  socket.on('user join', (userData) => {
    users.set(socket.id, {
      id: userData.id,
      name: userData.name,
      socketId: socket.id,
      room: null
    });

    console.log(`${userData.name}님이 입장했습니다.`);
    
    // 모든 클라이언트에게 사용자 입장 알림
    socket.broadcast.emit('user joined', userData);
    
    // 현재 온라인 사용자 목록 전송
    updateOnlineUsers();
  });

  // 방 입장
  socket.on('join room', (roomId) => {
    const user = users.get(socket.id);
    if (!user) return;

    // 이전 방에서 나가기
    if (user.room) {
      socket.leave(user.room);
      rooms.get(user.room)?.delete(socket.id);
    }

    // 새로운 방 입장
    socket.join(roomId);
    user.room = roomId;
    rooms.get(roomId)?.add(socket.id);

    console.log(`${user.name}님이 ${roomId}에 입장했습니다.`);
    
    // 해당 방의 사용자들에게 입장 알림
    socket.to(roomId).emit('user joined room', {
      user: user,
      room: roomId
    });

    // 온라인 사용자 목록 업데이트
    updateOnlineUsers();
  });

  // 방 나가기
  socket.on('leave room', (roomId) => {
    const user = users.get(socket.id);
    if (!user) return;

    socket.leave(roomId);
    rooms.get(roomId)?.delete(socket.id);
    user.room = null;

    console.log(`${user.name}님이 ${roomId}에서 나갔습니다.`);
    
    // 해당 방의 사용자들에게 퇴장 알림
    socket.to(roomId).emit('user left room', {
      user: user,
      room: roomId
    });

    // 온라인 사용자 목록 업데이트
    updateOnlineUsers();
  });

  // 메시지 전송
  socket.on('send message', (data) => {
    const user = users.get(socket.id);
    if (!user || !data.room) return;

    const messageData = {
      id: Date.now(),
      message: data.message,
      sender: data.sender,
      senderName: data.senderName,
      room: data.room,
      timestamp: new Date().toISOString()
    };

    console.log(`[${data.room}] ${data.senderName}: ${data.message}`);

    // 해당 방의 모든 사용자에게 메시지 전송 (본인 포함)
    io.to(data.room).emit('message', messageData);

    // 메시지 로그 저장 (옵션)
    saveMessageLog(messageData);
  });

  // 타이핑 상태 전송
  socket.on('typing start', (data) => {
    socket.to(data.room).emit('user typing', {
      userId: data.userId,
      userName: data.userName,
      room: data.room
    });
  });

  socket.on('typing stop', (data) => {
    socket.to(data.room).emit('user stop typing', {
      userId: data.userId,
      room: data.room
    });
  });

  // 연결 해제
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      console.log(`${user.name}님이 연결을 해제했습니다.`);
      
      // 사용자가 있던 방에서 제거
      if (user.room) {
        rooms.get(user.room)?.delete(socket.id);
        socket.to(user.room).emit('user left room', {
          user: user,
          room: user.room
        });
      }

      // 모든 클라이언트에게 사용자 퇴장 알림
      socket.broadcast.emit('user left', user);
      
      // 사용자 정보 삭제
      users.delete(socket.id);
      
      // 온라인 사용자 목록 업데이트
      updateOnlineUsers();
    }
  });

  // 온라인 사용자 목록 업데이트 함수
  function updateOnlineUsers() {
    const onlineUsers = Array.from(users.values()).map(user => ({
      id: user.id,
      name: user.name,
      room: user.room
    }));
    
    io.emit('users update', onlineUsers);
  }

  // 메시지 로그 저장 함수 (선택사항)
  function saveMessageLog(messageData) {
    // 여기에 데이터베이스 저장 로직 추가 가능
    // 예: MongoDB, MySQL 등에 메시지 저장
    console.log('메시지 로그 저장:', messageData);
  }
});

// 서버 상태 확인 엔드포인트
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    users: users.size,
    rooms: Array.from(rooms.entries()).map(([roomId, userSet]) => ({
      roomId,
      userCount: userSet.size
    })),
    timestamp: new Date().toISOString()
  });
});

// 채팅방 정보 엔드포인트
app.get('/rooms', (req, res) => {
  const roomsInfo = Array.from(rooms.entries()).map(([roomId, userSet]) => {
    const roomUsers = Array.from(userSet).map(socketId => {
      const user = users.get(socketId);
      return user ? { id: user.id, name: user.name } : null;
    }).filter(Boolean);

    return {
      roomId,
      userCount: userSet.size,
      users: roomUsers
    };
  });

  res.json(roomsInfo);
});

// 서버 시작
const PORT = process.env.PORT || 3080;
server.listen(PORT, () => {
  console.log(`소켓 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`상태 확인: http://localhost:${PORT}/status`);
  console.log(`채팅방 정보: http://localhost:${PORT}/rooms`);
});

// 우아한 종료 처리
process.on('SIGINT', () => {
  console.log('\n서버를 종료합니다...');
  server.close(() => {
    console.log('서버가 종료되었습니다.');
    process.exit(0);
  });
});

// 에러 처리
process.on('uncaughtException', (error) => {
  console.error('예상치 못한 오류:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('처리되지 않은 Promise 거부:', reason);
});
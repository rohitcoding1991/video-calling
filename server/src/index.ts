import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST"]
  }
});

app.use(cors());

interface User {
  id: string;
  name: string;
}

const users: Record<string, User> = {};

io.on('connection', (socket) => {
  const name = socket.handshake.auth.name;
  
  if (!name) {
    console.log('User connected without name, disconnecting...');
    socket.disconnect();
    return;
  }

  console.log(`User connected: ${name} (${socket.id})`);
  
  // Register user
  users[socket.id] = { id: socket.id, name };
  
  // Broadcast updated user list to ALL clients
  io.emit('users:list', Object.values(users));

  // WebRTC Signaling
  socket.on('call-user', ({ userToCall, signalData, from, isVideo }) => {
    io.to(userToCall).emit('call-made', { signal: signalData, from, isVideo });
  });

  socket.on('make-answer', ({ to, signal }) => {
    io.to(to).emit('answer-made', { signal, to });
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    io.to(to).emit('ice-candidate', { candidate, from: socket.id });
  });
  
  socket.on('end-call', ({ to }) => {
    io.to(to).emit('call-ended', { from: socket.id });
  });

  socket.on('media-state-changed', ({ to, videoEnabled }) => {
    io.to(to).emit('media-state-changed', { from: socket.id, videoEnabled });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${users[socket.id]?.name}`);
    delete users[socket.id];
    io.emit('users:list', Object.values(users));
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

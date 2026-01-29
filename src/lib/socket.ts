import { io, Socket } from 'socket.io-client';

// Singleton socket instance
let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io('http://localhost:3001', {
      autoConnect: false,
    });
  }
  return socket;
};

export const connectSocket = (name: string) => {
  const s = getSocket();
  s.auth = { name };
  s.connect();
  return s;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

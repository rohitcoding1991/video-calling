import React, { createContext, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';

interface User {
  id: string;
  name: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  currentUser: User | null;
  onlineUsers: User[];
  join: (name: string) => void;
  logout: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

  const join = (name: string) => {
    const s = connectSocket(name);
    setSocket(s);

    s.on('connect', () => {
      setIsConnected(true);
      setCurrentUser({ id: s.id!, name });
    });

    s.on('disconnect', () => {
      setIsConnected(false);
      setCurrentUser(null);
    });
    
    s.on('users:list', (users: User[]) => {
      setOnlineUsers(users);
    });
  };

  const logout = () => {
    disconnectSocket();
    setSocket(null);
    setIsConnected(false);
    setCurrentUser(null);
    setOnlineUsers([]);
  };

  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, currentUser, onlineUsers, join, logout }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

import { createContext, useEffect, useState, type ReactNode } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];
  initializeSocketAndJoin: (userId: string) => void;
  emitDisconnect: () => void;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  onlineUsers: [],
  initializeSocketAndJoin: (_userId) => {},
  emitDisconnect: () => {},
});

const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    return () => {
      socket?.disconnect();
    };
  }, [socket]);

  const initializeSocketAndJoin = (userId: string) => {
    const newSocket = io(import.meta.env.VITE_SOCKET_API);

    newSocket.on("connect", () => {
      console.log("connected to socket server");

      newSocket.emit("join", userId);
    });

    newSocket.on("online-users", function (users: string[]) {
      setOnlineUsers(users);
    });

    setSocket(newSocket);
  };

  const emitDisconnect = () => {
    socket?.disconnect();
    setSocket(null);
    setOnlineUsers([]);
  };

  return (
    <SocketContext.Provider
      value={{ socket, onlineUsers, initializeSocketAndJoin, emitDisconnect }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;

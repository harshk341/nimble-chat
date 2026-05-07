import { createContext, useEffect, useState, type ReactNode } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];
  showTimerPopup: boolean;
  roomId: string | null;
  initializeSocketAndJoin: (userId: string) => void;
  emitDisconnect: () => void;
  initializeRandomChat: () => void;
  closeTimerPopup: () => void;
  disconnectRandomChat: () => void;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  showTimerPopup: false,
  onlineUsers: [],
  roomId: null,
  initializeSocketAndJoin: (_userId) => {},
  emitDisconnect: () => {},
  initializeRandomChat: () => {},
  closeTimerPopup: () => {},
  disconnectRandomChat: () => {},
});

const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [showTimerPopup, setShowTimerPopup] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      socket?.disconnect();
    };
  }, [socket]);

  const initializeSocketAndJoin = (userId: string) => {
    const newSocket = io(import.meta.env.VITE_SOCKET_GENERAL_API, {
      reconnectionAttempts: 3,
      timeout: 3000,
    });

    newSocket.on("connect", () => {
      newSocket.emit("join", userId);
    });

    newSocket.on("online-users", function (users: string[]) {
      setOnlineUsers(users);
    });

    newSocket.io.on("reconnect_failed", () => {
      alert("Server is down, Please try later.");
    });

    setSocket(newSocket);
  };

  const initializeRandomChat = () => {
    const newSocket = io(import.meta.env.VITE_SOCKET_RANDOM_API, {
      reconnectionAttempts: 3,
      timeout: 3000,
    });

    newSocket.on("connect", () => {
      setShowTimerPopup(true);
    });

    newSocket.io.on("reconnect_failed", () => {
      alert("Server is down, Please try later.");
      setShowTimerPopup(false);
    });

    newSocket.on("waiting", () => {
      setShowTimerPopup(true);
    });

    newSocket.on("paired", (roomId) => {
      setShowTimerPopup(false);
      setRoomId(roomId);
    });

    setSocket(newSocket);
  };

  const closeTimerPopup = () => {
    if (socket?.connected) {
      socket.disconnect();
    }
    setShowTimerPopup(false);
    setSocket(null);
  };

  const disconnectRandomChat = () => {
    socket?.disconnect();
    setSocket(null);
    setRoomId(null);
  };

  const emitDisconnect = () => {
    socket?.disconnect();
    setSocket(null);
    setOnlineUsers([]);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        showTimerPopup,
        onlineUsers,
        roomId,
        initializeSocketAndJoin,
        emitDisconnect,
        initializeRandomChat,
        closeTimerPopup,
        disconnectRandomChat,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;

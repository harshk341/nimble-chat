import { Server } from "socket.io";
import { logger } from "../helpers";
import Message from "../models/Message";
import { Server as HttpServer } from "node:http";

const onlineUser = new Map<string, Set<string>>();
const socketToUser = new Map<string, string>();
let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, { cors: { origin: "*" } });

  logger("✅socket setup");

  io.on("connection", (socket) => {
    socket.on("join", (userId: string) => {
      if (!onlineUser.has(userId)) {
        onlineUser.set(userId, new Set());
      }

      onlineUser.get(userId)!.add(socket.id);
      socketToUser.set(socket.id, userId);

      io.emit("online-users", Array.from(onlineUser.keys()));
    });

    socket.on("disconnect", () => {
      const userId = socketToUser.get(socket.id);
      if (!userId) return;

      const sockets = onlineUser.get(userId);

      if (sockets) {
        sockets.delete(socket.id);

        if (sockets.size === 0) {
          onlineUser.delete(userId);
        }
      }

      socketToUser.delete(socket.id);

      io.emit("online-users", Array.from(onlineUser.keys()));
    });

    socket.on("send-message", async ({ sender, receiver, content }) => {
      const message = await Message.create({ sender, receiver, content });

      const receiverSocketIds = onlineUser.get(receiver);
      const senderSocketIds = onlineUser.get(sender);

      if (receiverSocketIds) {
        io.to([...receiverSocketIds]).emit("receiver-message", message);
      }

      if (senderSocketIds) {
        io.to([...senderSocketIds]).emit("receiver-message", message);
      }
    });

    socket.on("typing", ({ sender, receiver }) => {
      const receiverSocketIds = onlineUser.get(receiver);

      if (receiverSocketIds) {
        io.to([...receiverSocketIds]).emit("user-typing", sender);
      }
    });
  });
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

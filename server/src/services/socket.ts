import { Server, Namespace } from "socket.io";
import { logger } from "../helpers";
import Message from "../models/Message";
import { Server as HttpServer } from "node:http";
import { randomUUID } from "node:crypto";

const onlineUser = new Map<string, Set<string>>();
const socketToUser = new Map<string, string>();
const waitingUsers: string[] = [];
let generalChannel: Namespace;

export const initSocket = (server: HttpServer) => {
  const io = new Server(server, { cors: { origin: "*" } });

  generalChannel = io.of("/general");
  const randomChannel = io.of("/random");

  logger("✅socket setup");

  // working after JWT authentication using REST
  generalChannel.on("connection", (socket) => {
    socket.on("join", (userId: string) => {
      if (!onlineUser.has(userId)) {
        onlineUser.set(userId, new Set());
      }

      onlineUser.get(userId)!.add(socket.id);
      socketToUser.set(socket.id, userId);

      generalChannel.emit("online-users", Array.from(onlineUser.keys()));
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

      generalChannel.emit("online-users", Array.from(onlineUser.keys()));
    });

    socket.on("send-message", async ({ sender, receiver, content }) => {
      const message = await Message.create({ sender, receiver, content });

      const receiverSocketIds = onlineUser.get(receiver);
      const senderSocketIds = onlineUser.get(sender);

      if (receiverSocketIds) {
        generalChannel
          .to([...receiverSocketIds])
          .emit("receiver-message", message);
      }

      if (senderSocketIds) {
        generalChannel
          .to([...senderSocketIds])
          .emit("receiver-message", message);
      }
    });

    socket.on("typing", ({ sender, receiver }) => {
      const receiverSocketIds = onlineUser.get(receiver);

      if (receiverSocketIds) {
        generalChannel.to([...receiverSocketIds]).emit("user-typing", sender);
      }
    });
  });

  randomChannel.on("connection", (socket) => {
    if (waitingUsers.length > 0) {
      const partner = waitingUsers.shift()!;
      const roomId = `${partner}_${socket.id}`;

      socket.join(roomId);
      randomChannel.sockets.get(partner)?.join(roomId);

      randomChannel.to(roomId).emit("paired", roomId);
    } else {
      waitingUsers.push(socket.id);
      socket.emit("waiting");
    }

    socket.on("send-message", ({ roomId, ...data }) => {
      randomChannel
        .to(roomId)
        .emit("receive-message", { id: randomUUID(), ...data });
    });

    socket.on("disconnecting", () => {
      const rooms = [...socket.rooms].filter((r) => r !== socket.id);

      rooms.forEach((roomId) => {
        randomChannel.to(roomId).emit("partner-disconnected");
      });
    });

    socket.on("disconnect", () => {
      const index = waitingUsers.indexOf(socket.id);
      if (index > -1) {
        waitingUsers.splice(index, 1);
      }
    });
  });
};

export const getGeneralChannel = () => {
  if (!generalChannel) {
    throw new Error("Socket.io not initialized");
  }
  return generalChannel;
};

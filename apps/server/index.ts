import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { randomBytes } from "crypto";

interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: string;
  timestamp: Date;
}

interface RoomData {
  name?: string;
  users: Set<string>;
  messages: Message[];
  lastActive: number;
  public: boolean;
  createdAt: number;
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
  },
});

const rooms = new Map<string, RoomData>();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("set-user-id", (userId: string) => {});
  socket.on("create-room", (data) => {
    const { name, isPublic = true } = data || {};
    const roomCode = randomBytes(3).toString("hex").toUpperCase();
    const now = Date.now();
    const roomData = {
      users: new Set<string>(),
      messages: [],
      lastActive: now,
      public: isPublic,
      name: name || `Room ${roomCode}`,
      createdAt: now,
    };
    rooms.set(roomCode, roomData);

    socket.emit("room-created", roomCode);

    if (isPublic) {
      io.emit("new-public-room", {
        code: roomCode,
        name: roomData.name,
        userCount: 0,
        lastActive: now,
        createdAt: now,
      });
    }
  });

  socket.on("list-public-rooms", () => {
    const publicRooms = Array.from(rooms.entries())
      .filter(([_, room]) => room.public)
      .map(([roomCode, room]) => ({
        code: roomCode,
        name: room.name || `Room ${roomCode}`,
        userCount: room.users.size,
        lastActive: room.lastActive,
        createdAt: room.createdAt,
      }))
      .sort((a, b) => b.lastActive - a.lastActive);

    socket.emit("public-rooms-list", publicRooms);
  });

  socket.on("get-room-stats", () => {
    const stats = {
      totalRooms: rooms.size,
      publicRooms: Array.from(rooms.values()).filter((room) => room.public)
        .length,
      privateRooms: Array.from(rooms.values()).filter((room) => !room.public)
        .length,
      totalUsers: Array.from(rooms.values()).reduce(
        (sum, room) => sum + room.users.size,
        0
      ),
    };
    socket.emit("room-stats", stats);
  });

  socket.on("join-public-room", ({ roomCode, userId, name }) => {
    const room = rooms.get(roomCode);

    if (!room) {
      socket.emit("error", "Room not found");
      return;
    }

    if (!room.public) {
      socket.emit("error", "Room is private");
      return;
    }

    socket.join(roomCode);
    room.users.add(socket.id);
    room.lastActive = Date.now();
    socket.emit("joined-room", {
      roomCode,
      messages: room.messages,
      roomName: room.name,
    });
    io.to(roomCode).emit("user-joined", {
      userCount: room.users.size,
      userName: name,
    });

    io.emit("public-room-updated", {
      code: roomCode,
      userCount: room.users.size,
      lastActive: room.lastActive,
    });
  });

  socket.on("join-room", (data) => {
    const parsedData = JSON.parse(data);
    const roomCode = parsedData.roomId;
    const room = rooms.get(roomCode);

    if (!room) {
      socket.emit("error", "Room not found");
      return;
    }
    socket.join(roomCode);
    room.users.add(socket.id);
    room.lastActive = Date.now();
    socket.emit("joined-room", {
      roomCode,
      messages: room.messages,
      roomName: room.name,
    });
    io.to(roomCode).emit("user-joined", room.users.size);

    if (room.public) {
      io.emit("public-room-updated", {
        code: roomCode,
        userCount: room.users.size,
        lastActive: room.lastActive,
      });
    }
  });

  socket.on("send-message", ({ roomCode, message, userId, name }) => {
    const room = rooms.get(roomCode);
    if (room) {
      room.lastActive = Date.now();
      const messageData: Message = {
        id: randomBytes(4).toString("hex"),
        content: message,
        senderId: userId,
        sender: name,
        timestamp: new Date(),
      };
      room.messages.push(messageData);
      io.to(roomCode).emit("new-message", messageData);
    }
  });
  socket.on("disconnect", () => {
    rooms.forEach((room, roomCode) => {
      if (room.users.has(socket.id)) {
        room.users.delete(socket.id);
        io.to(roomCode).emit("user-left", room.users.size);

        if (room.public && room.users.size > 0) {
          io.emit("public-room-updated", {
            code: roomCode,
            userCount: room.users.size,
            lastActive: Date.now(),
          });
        }

        if (room.users.size === 0) {
          console.log(`Deleting empty room: ${roomCode}`);
          if (room.public) {
            io.emit("public-room-deleted", roomCode);
          }
          rooms.delete(roomCode);
        }
      }
    });
  });
});

setInterval(() => {
  const now = Date.now();
  rooms.forEach((room, roomCode) => {
    if (room.users.size === 0 && now - room.lastActive > 3600000) {
      console.log(`Cleaning up inactive room: ${roomCode}`);
      if (room.public) {
        io.emit("public-room-deleted", roomCode);
      }
      rooms.delete(roomCode);
    }
  });
}, 3600000);

const PORT = process.env.SERVER_PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

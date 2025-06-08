"use client";

import React, { createContext, useContext, useState } from "react";
import { Socket } from "socket.io-client";
import { toast } from "sonner";
import {
  connectSocket,
  disconnectSocket,
  Message,
  PublicRoom,
  RoomStats,
} from "@/lib/socket";

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  currentRoom: string | null;
  currentRoomName: string | null;
  messages: Message[];
  publicRooms: PublicRoom[];
  roomStats: RoomStats | null;
  privateRoomAlert: {
    isOpen: boolean;
    roomData: { code: string; name: string } | null;
  };
  connect: () => void;
  disconnect: () => void;
  createRoom: (name: string, isPublic?: boolean) => void;
  joinRoom: (roomCode: string, userId: string, name: string) => void;
  joinPublicRoom: (roomCode: string, userId: string, name: string) => void;
  sendMessage: (
    roomCode: string,
    message: string,
    userId: string,
    name: string
  ) => void;
  listPublicRooms: () => void;
  getRoomStats: () => void;
  leaveRoom: () => void;
  closePrivateRoomAlert: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [currentRoomName, setCurrentRoomName] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
  const [roomStats, setRoomStats] = useState<RoomStats | null>(null);
  const [privateRoomAlert, setPrivateRoomAlert] = useState<{
    isOpen: boolean;
    roomData: { code: string; name: string } | null;
  }>({
    isOpen: false,
    roomData: null,
  });
  const connect = () => {
    if (socket?.connected) return;

    const socketInstance = connectSocket();
    setSocket(socketInstance);
    socketInstance.removeAllListeners();
    socketInstance.on("connect", () => {
      setConnected(true);
    });
    socketInstance.on("disconnect", () => {
      setConnected(false);
      setCurrentRoom(null);
      setCurrentRoomName(null);
      setMessages([]);
    });

    socketInstance.on(
      "room-created",
      (roomData: { code: string; name: string; isPublic: boolean }) => {
        console.log("Room created:", roomData);
        if (!roomData.isPublic) {
          setPrivateRoomAlert({
            isOpen: true,
            roomData: { code: roomData.code, name: roomData.name },
          });
        }
      }
    );

    socketInstance.on("room-creation-failed", (error: string) => {
      toast.error(`Failed to create room: ${error}`);
    });
    socketInstance.on(
      "joined-room",
      (data: { roomCode: string; messages: Message[]; roomName?: string }) => {
        setCurrentRoom(data.roomCode);
        setCurrentRoomName(data.roomName || null);
        setMessages(data.messages);
      }
    );
    socketInstance.on("join-failed", (error: string) => {
      console.log("Join failed:", error);
    });

    socketInstance.on("new-message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });
    socketInstance.on(
      "user-joined",
      (data: { userCount: number; userName?: string }) => {
        console.log("User joined:", data);
        if (data.userName) {
          toast.info(`${data.userName} joined the room`);
        }
      }
    );

    socketInstance.on(
      "user-left",
      (data: { userCount: number; userName?: string }) => {
        console.log("User left, count:", data.userCount);
        if (data.userName) {
          toast.info(`${data.userName} left the room`);
        }
      }
    );

    socketInstance.on("public-rooms-list", (rooms: PublicRoom[]) => {
      setPublicRooms(rooms);
    });

    socketInstance.on("room-stats", (stats: RoomStats) => {
      setRoomStats(stats);
    });

    socketInstance.on("new-public-room", (room: PublicRoom) => {
      setPublicRooms((prev) => [room, ...prev]);
    });

    socketInstance.on(
      "public-room-updated",
      (update: { code: string; userCount: number; lastActive: number }) => {
        setPublicRooms((prev) =>
          prev.map((room) =>
            room.code === update.code
              ? {
                  ...room,
                  userCount: update.userCount,
                  lastActive: update.lastActive,
                }
              : room
          )
        );
      }
    );

    socketInstance.on("public-room-deleted", (roomCode: string) => {
      setPublicRooms((prev) => prev.filter((room) => room.code !== roomCode));
    });
    socketInstance.on("error", (error: string) => {
      console.error("Socket error:", error);
      toast.error(`Error: ${error}`);
    });
    socketInstance.on("room-not-found", () => {
      console.log("Room not found");
    });
    socketInstance.on("room-full", () => {
      console.log("Room full");
    });

    socketInstance.on("already-in-room", () => {
      toast.warning("You are already in this room.");
    });
  };
  const disconnect = () => {
    if (socket) {
      disconnectSocket();
      setSocket(null);
      setConnected(false);
      setCurrentRoom(null);
      setCurrentRoomName(null);
      setMessages([]);
    }
  };
  const createRoom = (name: string, isPublic: boolean = true) => {
    if (socket) {
      if (!name.trim()) {
        toast.error("Room name cannot be empty");
        return;
      }
      socket.emit("create-room", { name, isPublic });
    } else {
      toast.error("Not connected to server. Please try again.");
    }
  };
  const joinRoom = (roomCode: string, userId: string, name: string) => {
    if (socket) {
      if (!roomCode.trim()) {
        toast.error("Room code cannot be empty");
        return;
      }
      socket.emit("join-room", { roomCode, userId, name });
    } else {
      toast.error("Not connected to server. Please try again.");
    }
  };

  const joinPublicRoom = (roomCode: string, userId: string, name: string) => {
    if (socket) {
      if (!roomCode.trim()) {
        toast.error("Room code cannot be empty");
        return;
      }
      socket.emit("join-public-room", { roomCode, userId, name });
    } else {
      toast.error("Not connected to server. Please try again.");
    }
  };
  const sendMessage = (
    roomCode: string,
    message: string,
    userId: string,
    name: string
  ) => {
    if (socket && message.trim()) {
      socket.emit("send-message", { roomCode, message, userId, name });
    } else if (!socket) {
      toast.error("Not connected to server. Message not sent.");
    }
  };

  const listPublicRooms = () => {
    if (socket) {
      socket.emit("list-public-rooms");
    }
  };

  const getRoomStats = () => {
    if (socket) {
      socket.emit("get-room-stats");
    }
  };
  const leaveRoom = () => {
    if (currentRoom) {
      setCurrentRoom(null);
      setCurrentRoomName(null);
      setMessages([]);
      disconnect();
      connect();
    }
  };

  const closePrivateRoomAlert = () => {
    setPrivateRoomAlert({
      isOpen: false,
      roomData: null,
    });
  };
  const value: SocketContextType = {
    socket,
    connected,
    currentRoom,
    currentRoomName,
    messages,
    publicRooms,
    roomStats,
    privateRoomAlert,
    connect,
    disconnect,
    createRoom,
    joinRoom,
    joinPublicRoom,
    sendMessage,
    listPublicRooms,
    getRoomStats,
    leaveRoom,
    closePrivateRoomAlert,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

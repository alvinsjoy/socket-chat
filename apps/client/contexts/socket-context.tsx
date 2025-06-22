"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Socket } from "socket.io-client";
import { toast } from "sonner";
import {
  connectSocket,
  disconnectSocket,
  Message,
  PublicRoom,
  RoomStats,
} from "@/lib/socket";
import { getStoredUser } from "@/lib/user";

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  currentRoom: string | null;
  currentRoomName: string | null;
  messages: Message[];
  publicRooms: PublicRoom[];
  roomStats: RoomStats | null;
  joinError: string | null;
  wasAutoJoined: boolean;
  newPrivateRoom: { code: string; name: string } | null;
  typingUsers: string[];
  connect: () => void;
  disconnect: () => void;
  createRoom: (name: string, isPublic?: boolean) => void;
  joinRoom: (roomCode: string, userId: string, name: string) => void;
  sendMessage: (
    roomCode: string,
    message: string,
    userId: string,
    name: string
  ) => void;
  listPublicRooms: () => void;
  getRoomStats: () => void;
  leaveRoom: () => void;
  clearJoinError: () => void;
  clearNewPrivateRoom: () => void;
  startTyping: (roomCode: string) => void;
  stopTyping: (roomCode: string) => void;
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
  const [joinError, setJoinError] = useState<string | null>(null);
  const [wasAutoJoined, setWasAutoJoined] = useState(false);
  const [newPrivateRoom, setNewPrivateRoom] = useState<{
    code: string;
    name: string;
  } | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const connect = useCallback(() => {
    if (socket?.connected) return;

    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }

    const socketInstance = connectSocket();
    setSocket(socketInstance);

    const setupEventListeners = () => {
      socketInstance.on("connect", () => {
        setConnected(true);
      });
      socketInstance.on("disconnect", () => {
        setConnected(false);
        setCurrentRoom(null);
        setCurrentRoomName(null);
        setMessages([]);
        setWasAutoJoined(false);
      });
      socketInstance.on(
        "room-created",
        (roomData: {
          code: string;
          name: string;
          isPublic: boolean;
          autoJoined?: boolean;
        }) => {
          if (!roomData.isPublic) {
            setNewPrivateRoom({
              code: roomData.code,
              name: roomData.name,
            });
          }
          if (roomData.autoJoined) {
            setCurrentRoom(roomData.code);
            setCurrentRoomName(roomData.name);
            setJoinError(null);
            setWasAutoJoined(true);
          }
        }
      );

      socketInstance.on("room-creation-failed", (error: string) => {
        toast.error(`Failed to create room: ${error}`);
      });
      socketInstance.on(
        "joined-room",
        (data: {
          roomCode: string;
          messages: Message[];
          roomName?: string;
        }) => {
          setCurrentRoom(data.roomCode);
          setCurrentRoomName(data.roomName || null);
          setMessages(data.messages);
          setJoinError(null);
          setWasAutoJoined(false);
        }
      );

      socketInstance.on("join-failed", (error: string) => {
        setJoinError(error);
        toast.error(`Failed to join room: ${error}`);
      });

      socketInstance.on("new-message", (message: Message) => {
        setMessages((prev) => [...prev, message]);
      });
      socketInstance.on(
        "user-joined",
        (data: { userCount: number; userName?: string }) => {
          if (data.userName) {
            toast.info(`${data.userName} joined the room`);
          }
        }
      );

      socketInstance.on(
        "user-left",
        (data: { userCount: number; userName?: string }) => {
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

      socketInstance.on("already-in-room", () => {
        toast.warning("You are already in this room.");
      });

      socketInstance.on(
        "user-typing-start",
        (data: { userName: string; userId: string }) => {
          setTypingUsers((prev) => {
            if (!prev.includes(data.userName)) {
              return [...prev, data.userName];
            }
            return prev;
          });
        }
      );

      socketInstance.on(
        "user-typing-stop",
        (data: { userName: string; userId: string }) => {
          setTypingUsers((prev) =>
            prev.filter((name) => name !== data.userName)
          );
        }
      );
    };

    setupEventListeners();
  }, [socket]);
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

      const user = getStoredUser();
      if (user) {
        socket.emit("create-room", {
          name,
          isPublic,
          userId: user.id,
          userName: user.name,
        });
      } else {
        socket.emit("create-room", { name, isPublic });
      }
    } else {
      toast.error("Not connected to server. Please try again.");
    }
  };
  const joinRoom = useCallback(
    (roomCode: string, userId: string, name: string) => {
      if (!socket || !socket.connected) {
        toast.error("Not connected to server. Please try again.");
        return;
      }

      if (!roomCode.trim()) {
        toast.error("Room code cannot be empty");
        return;
      }

      console.log("Attempting to join room:", roomCode);
      setJoinError(null);
      socket.emit("join-room", { roomCode, userId, name });
    },
    [socket]
  );
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
    if (currentRoom && socket) {
      const user = getStoredUser();
      socket.emit("leave-room", {
        roomCode: currentRoom,
        name: user?.name,
      });
      setCurrentRoom(null);
      setCurrentRoomName(null);
      setMessages([]);
      setWasAutoJoined(false);
      setNewPrivateRoom(null);
      setTypingUsers([]);
    }
  };
  const clearJoinError = useCallback(() => {
    setJoinError(null);
  }, []);
  const clearNewPrivateRoom = useCallback(() => {
    setNewPrivateRoom(null);
  }, []);

  const startTyping = useCallback(
    (roomCode: string) => {
      if (socket && socket.connected) {
        const user = getStoredUser();
        socket.emit("typing-start", {
          roomCode,
          userName: user?.name,
          userId: user?.id,
        });
      }
    },
    [socket]
  );

  const stopTyping = useCallback(
    (roomCode: string) => {
      if (socket && socket.connected) {
        const user = getStoredUser();
        socket.emit("typing-stop", {
          roomCode,
          userName: user?.name,
          userId: user?.id,
        });
      }
    },
    [socket]
  );

  const value: SocketContextType = {
    socket,
    connected,
    currentRoom,
    currentRoomName,
    messages,
    publicRooms,
    roomStats,
    joinError,
    wasAutoJoined,
    newPrivateRoom,
    typingUsers,
    connect,
    disconnect,
    createRoom,
    joinRoom,
    sendMessage,
    listPublicRooms,
    getRoomStats,
    leaveRoom,
    clearJoinError,
    clearNewPrivateRoom,
    startTyping,
    stopTyping,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

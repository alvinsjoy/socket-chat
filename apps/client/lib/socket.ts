import { io, Socket } from "socket.io-client";

export interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: string;
  timestamp: Date;
}

export interface PublicRoom {
  code: string;
  name: string;
  userCount: number;
  lastActive: number;
  createdAt: number;
}

export interface RoomStats {
  totalRooms: number;
  publicRooms: number;
  privateRooms: number;
  totalUsers: number;
}

export interface JoinedRoomData {
  roomCode: string;
  messages: Message[];
  roomName?: string;
}

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000", {
      autoConnect: false,
    });
  }
  return socket;
};

export const connectSocket = (): Socket => {
  const socketInstance = getSocket();
  if (!socketInstance.connected) {
    socketInstance.connect();
  }
  return socketInstance;
};

export const disconnectSocket = (): void => {
  if (socket?.connected) {
    socket.disconnect();
  }
};

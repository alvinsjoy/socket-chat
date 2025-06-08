"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSocket } from "@/contexts/socket-context";
import { getStoredUser } from "@/lib/user";
import ChatRoom from "@/components/chat-room";
import UserSetup from "@/components/user-setup";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.roomCode as string;
  const { connected, currentRoom, connect, leaveRoom, joinRoom } = useSocket();
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    if (user && !connected) {
      connect();
    }
  }, [user, connected, connect]);

  useEffect(() => {
    if (user && connected && !currentRoom && roomCode && !isJoining) {
      setIsJoining(true);
      joinRoom(roomCode.toUpperCase(), user.id, user.name);
    }
  }, [user, connected, currentRoom, roomCode, joinRoom, isJoining]);

  useEffect(() => {
    if (currentRoom) {
      setIsJoining(false);
    }
  }, [currentRoom]);

  const handleUserCreated = (newUser: { id: string; name: string }) => {
    setUser(newUser);
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    router.push("/");
  };

  if (!user) {
    return <UserSetup onUserCreated={handleUserCreated} />;
  }

  if (!connected) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Connecting to server...</p>
        </div>
      </div>
    );
  }
  if (isJoining || !currentRoom) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">
            Joining room {roomCode.toUpperCase()}...
          </p>
        </div>
      </div>
    );
  }

  return (
    <ChatRoom
      onLeaveRoom={handleLeaveRoom}
      userId={user.id}
      userName={user.name}
    />
  );
}

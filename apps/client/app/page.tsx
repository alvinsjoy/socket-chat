"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import UserSetup from "@/components/user-setup";
import CreateRoom from "@/components/create-room";
import JoinRoom from "@/components/join-room";
import PublicRooms from "@/components/public-rooms";
import RoomStats from "@/components/room-stats";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/contexts/socket-context";
import { getStoredUser } from "@/lib/user";

export default function Home() {
  const router = useRouter();
  const { connected, connect, listPublicRooms } = useSocket();
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);

  React.useEffect(() => {
    setUser(getStoredUser());
  }, []);

  React.useEffect(() => {
    if (user && !connected) {
      connect();
    }
  }, [user, connected, connect]);

  React.useEffect(() => {
    if (connected) {
      listPublicRooms();
    }
  }, [connected, listPublicRooms]);

  const handleUserCreated = (newUser: { id: string; name: string }) => {
    setUser(newUser);
  };

  const handleRoomSelect = (roomCode: string) => {
    router.push(`/room/${roomCode}`);
  };

  if (!user) {
    return <UserSetup onUserCreated={handleUserCreated} />;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid lg:grid-cols-3 gap-6 h-full">
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Chat Rooms</h2>
            <div className="flex flex-col space-y-2">
              <Button
                onClick={() => setShowCreateRoom(true)}
                disabled={!connected}
              >
                Create New Room
              </Button>
              <Button
                onClick={() => setShowJoinRoom(true)}
                variant="outline"
                disabled={!connected}
              >
                Join with Code
              </Button>
            </div>
          </div>
          <RoomStats />
        </div>

        <div className="lg:col-span-2">
          <PublicRooms
            onRoomSelect={handleRoomSelect}
            userId={user.id}
            userName={user.name}
          />
        </div>
      </div>

      <CreateRoom
        isOpen={showCreateRoom}
        onClose={() => setShowCreateRoom(false)}
      />
      <JoinRoom isOpen={showJoinRoom} onClose={() => setShowJoinRoom(false)} />
    </div>
  );
}

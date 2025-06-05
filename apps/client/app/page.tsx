"use client";

import React, { useState } from "react";
import ThemeSwitcher from "@/components/theme-switch";
import UserSetup from "@/components/user-setup";
import CreateRoom from "@/components/create-room";
import JoinRoom from "@/components/join-room";
import PublicRooms from "@/components/public-rooms";
import ChatRoom from "@/components/chat-room";
import RoomStats from "@/components/room-stats";
import { PrivateRoomAlert } from "@/components/private-room-alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSocket } from "@/contexts/socket-context";
import { getStoredUser } from "@/lib/user";

export default function Home() {
  const {
    connected,
    currentRoom,
    connect,
    leaveRoom,
    listPublicRooms,
    privateRoomAlert,
    closePrivateRoomAlert,
    joinRoom,
  } = useSocket();
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

  const handleRoomSelect = () => {};

  const handleLeaveRoom = () => {
    leaveRoom();
  };

  const handleJoinPrivateRoom = () => {
    if (privateRoomAlert.roomData && user) {
      joinRoom(privateRoomAlert.roomData.code, user.id, user.name);
    }
  };

  const ConnectionIndicator = () => (
    <Badge
      variant={connected ? "default" : "destructive"}
      className="flex items-center gap-2"
    >
      <div
        className={`w-2 h-2 rounded-full ${
          connected ? "bg-green-400" : "bg-red-400"
        }`}
      />
      {connected ? "Connected" : "Disconnected"}
    </Badge>
  );

  if (!user) {
    return <UserSetup onUserCreated={handleUserCreated} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex justify-between items-center p-4 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-foreground">Socket Chat</h1>
          <ConnectionIndicator />
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            Welcome, {user.name}
          </span>
          <ThemeSwitcher />
        </div>
      </header>

      <main className="container mx-auto p-6 h-[calc(100vh-80px)]">
        {currentRoom ? (
          <ChatRoom
            onLeaveRoom={handleLeaveRoom}
            userId={user.id}
            userName={user.name}
          />
        ) : (
          <div className="grid lg:grid-cols-3 gap-6 h-full">
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">
                  Chat Rooms
                </h2>
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
        )}
      </main>

      <CreateRoom
        isOpen={showCreateRoom}
        onClose={() => setShowCreateRoom(false)}
      />
      <JoinRoom
        isOpen={showJoinRoom}
        onClose={() => setShowJoinRoom(false)}
        userId={user.id}
        userName={user.name}
      />

      {privateRoomAlert.roomData && (
        <PrivateRoomAlert
          isOpen={privateRoomAlert.isOpen}
          onClose={closePrivateRoomAlert}
          roomData={privateRoomAlert.roomData}
          onJoinRoom={handleJoinPrivateRoom}
        />
      )}
    </div>
  );
}

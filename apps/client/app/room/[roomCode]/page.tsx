"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSocket } from "@/contexts/socket-context";
import { getStoredUser } from "@/lib/user";
import ChatRoom from "@/components/chat-room";
import UserSetup from "@/components/user-setup";
import { Button } from "@/components/ui/button";
import { LuOctagonAlert } from "react-icons/lu";
import Link from "next/link";
import { PrivateRoomAlert } from "@/components/private-room-alert";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.roomCode as string;
  const {
    connected,
    currentRoom,
    connect,
    leaveRoom,
    joinRoom,
    joinError,
    clearJoinError,
    wasAutoJoined,
    newPrivateRoom,
    clearNewPrivateRoom,
  } = useSocket();
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [hasAttemptedJoin, setHasAttemptedJoin] = useState(false);
  const [hasLeftRoom, setHasLeftRoom] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);
  useEffect(() => {
    if (user && !connected) {
      connect();
    }
  }, [user, connected, connect]);
  useEffect(() => {
    const shouldAttemptJoin =
      user &&
      connected &&
      !currentRoom &&
      roomCode &&
      !isJoining &&
      !joinError &&
      !hasAttemptedJoin &&
      !wasAutoJoined &&
      !hasLeftRoom;
    if (shouldAttemptJoin) {
      setIsJoining(true);
      setHasAttemptedJoin(true);
      joinRoom(roomCode.toUpperCase(), user.id, user.name);
    }
  }, [
    user,
    connected,
    currentRoom,
    roomCode,
    joinRoom,
    isJoining,
    joinError,
    hasAttemptedJoin,
    clearJoinError,
    wasAutoJoined,
    hasLeftRoom,
  ]);
  useEffect(() => {
    if (currentRoom) {
      setIsJoining(false);
      setHasAttemptedJoin(false);
      setHasLeftRoom(false);
    }
  }, [currentRoom]);
  useEffect(() => {
    if (joinError) {
      setIsJoining(false);
    }
  }, [joinError]);
  const handleUserCreated = useCallback(
    (newUser: { id: string; name: string }) => {
      setUser(newUser);
    },
    []
  );
  const handleRetry = useCallback(() => {
    if (user) {
      clearJoinError();
      setIsJoining(true);
      setHasAttemptedJoin(false);
      setHasLeftRoom(false);
      joinRoom(roomCode.toUpperCase(), user.id, user.name);
    }
  }, [user, clearJoinError, joinRoom, roomCode]);
  const handleLeaveRoom = useCallback(() => {
    setHasLeftRoom(true);
    leaveRoom();
    clearJoinError();
    router.push("/");
  }, [leaveRoom, clearJoinError, router]);

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
  if (joinError || (hasAttemptedJoin && !isJoining && !currentRoom)) {
    const errorMessage = joinError || "Unable to join room";
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4 max-w-md px-4 flex flex-col items-center">
          <LuOctagonAlert className="text-destructive text-6xl mb-4" />
          <h2 className="text-2xl font-bold text-foreground">
            {joinError === "Room not found" ? "Room Not Found" : "Join Failed"}
          </h2>{" "}
          <p className="text-muted-foreground">
            {joinError === "Room not found"
              ? `The room "${roomCode.toUpperCase()}" could not be found. It may have been deleted or the code is incorrect.`
              : `Unable to join room "${roomCode.toUpperCase()}". ${errorMessage}.`}
          </p>{" "}
          <div className="space-y-2">
            <Button onClick={handleRetry} className="w-full" variant="default">
              Try Again
            </Button>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
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
            {hasLeftRoom ? "Leaving" : "Joining"} room {roomCode.toUpperCase()}
          </p>
        </div>
      </div>
    );
  }
  return (
    <>
      <ChatRoom
        onLeaveRoom={handleLeaveRoom}
        userId={user.id}
        userName={user.name}
      />{" "}
      {newPrivateRoom && newPrivateRoom.code === roomCode.toUpperCase() && (
        <PrivateRoomAlert
          isOpen={true}
          onClose={clearNewPrivateRoom}
          roomData={newPrivateRoom}
        />
      )}
    </>
  );
}

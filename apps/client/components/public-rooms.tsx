"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { useSocket } from "@/contexts/socket-context";
import { LuClock } from "react-icons/lu";
import { Loader } from "@/components/loader";

interface PublicRoomsProps {
  onRoomSelect: (roomCode: string) => void;
  userId: string;
  userName: string;
}

export default function PublicRooms({
  onRoomSelect,
  userId,
  userName,
}: PublicRoomsProps) {
  const { publicRooms, listPublicRooms, connected, joinRoom } = useSocket();

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };
  const handleJoinRoom = (roomCode: string) => {
    try {
      joinRoom(roomCode, userId, userName);
      onRoomSelect(roomCode);
    } catch {
      toast.error("Failed to join room. Please try again.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">Public Rooms</h3>
        <Button
          onClick={listPublicRooms}
          variant="outline"
          size="sm"
          disabled={!connected}
        >
          Refresh
        </Button>
      </div>{" "}
      {!connected && (
        <div className="space-y-4">
          <div className="text-center text-muted-foreground py-8">
            <Loader />
            <p className="mt-4">Connecting to server...</p>
          </div>
          <div className="bg-chart-1/10 border border-chart-1/20 rounded-lg p-4">
            <p className="text-sm text-chart-1 font-medium flex items-center gap-2">
              <LuClock className="h-4 w-4" />
              Server is hosted on Render (Free Tier)
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              The server may take up to <strong>50 seconds</strong> to boot up
              as Render spins down a Free web service that goes 15 minutes
              without traffic.
            </p>
          </div>
        </div>
      )}
      {connected && publicRooms.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          No public rooms available. Create one to get started!
        </div>
      )}{" "}
      <div className="space-y-4">
        {publicRooms.map((room) => (
          <Card key={room.code}>
            <CardHeader>
              <CardTitle>{room.name}</CardTitle>
              <CardAction>
                <Button
                  onClick={() => handleJoinRoom(room.code)}
                  size="sm"
                  disabled={!connected}
                >
                  Join
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Room: {room.code}
                </p>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-foreground">
                    {room.userCount} {room.userCount === 1 ? "user" : "users"}
                  </span>
                  <span className="text-muted-foreground">
                    {formatTime(room.lastActive)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

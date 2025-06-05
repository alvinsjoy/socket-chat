"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { useSocket } from "@/contexts/socket-context";

export default function RoomStats() {
  const { roomStats, getRoomStats, connected } = useSocket();

  useEffect(() => {
    if (connected) {
      getRoomStats();
      const interval = setInterval(getRoomStats, 30000);
      return () => clearInterval(interval);
    }
  }, [connected, getRoomStats]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Server Stats</CardTitle>
        <CardAction>
          <Button
            onClick={getRoomStats}
            variant="ghost"
            size="sm"
            disabled={!connected}
          >
            Refresh
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {!roomStats ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {roomStats.totalRooms}
              </p>
              <p className="text-sm text-muted-foreground">Total Rooms</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {roomStats.totalUsers}
              </p>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {roomStats.publicRooms}
              </p>
              <p className="text-sm text-muted-foreground">Public Rooms</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {roomStats.privateRooms}
              </p>
              <p className="text-sm text-muted-foreground">Private Rooms</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

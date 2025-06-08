"use client";

import React from "react";
import { useSocket } from "@/contexts/socket-context";
import { getStoredUser } from "@/lib/user";
import ThemeSwitcher from "@/components/theme-switch";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface NavbarProps {
  showBackButton?: boolean;
  backButtonText?: string;
  onBackClick?: () => void;
}

export default function Navbar({}: NavbarProps) {
  const { connected } = useSocket();
  const [user, setUser] = React.useState<{ id: string; name: string } | null>(
    null
  );

  React.useEffect(() => {
    setUser(getStoredUser());
  }, []);

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
  return (
    <header className="flex justify-between items-center p-4 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center space-x-4">
        <Link href="/" className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-foreground">Socket Chat</h1>
        </Link>
        <ConnectionIndicator />
      </div>
      <div className="flex items-center space-x-4">
        {user && (
          <span className="text-sm text-muted-foreground">
            Welcome, {user.name}
          </span>
        )}
        <ThemeSwitcher />
      </div>
    </header>
  );
}

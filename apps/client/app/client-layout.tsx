"use client";

import { getStoredUser } from "@/lib/user";
import { useEffect, useState } from "react";
import Navbar from "@/components/navbar";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="h-[calc(100vh-80px)]">{children}</main>
    </div>
  );
}

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

  const showNavbar = true;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {showNavbar && <Navbar />}
      <main className={showNavbar ? "h-[calc(100vh-80px)]" : "min-h-screen"}>
        {children}
      </main>
    </div>
  );
}

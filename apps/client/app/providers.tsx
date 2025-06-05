"use client";

import { ThemeProvider } from "next-themes";
import { SocketProvider } from "@/contexts/socket-context";
import { Toaster } from "@/components/ui/sonner";

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" enableSystem>
      <SocketProvider>
        {children}
        <Toaster richColors />
      </SocketProvider>
    </ThemeProvider>
  );
}

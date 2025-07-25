"use client";

import { useState } from "react";
import {
  LuCopy,
  LuCheck,
  LuMessageCircleDashed,
  LuOctagonAlert,
} from "react-icons/lu";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface PrivateRoomAlertProps {
  isOpen: boolean;
  onClose: () => void;
  roomData: {
    code: string;
    name: string;
  };
}

export function PrivateRoomAlert({
  isOpen,
  onClose,
  roomData,
}: PrivateRoomAlertProps) {
  const [copied, setCopied] = useState(false);
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomData.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy room code");
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <LuMessageCircleDashed className="h-5 w-5" />
            Private Room Created
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div className="text-center">
              <div className="mb-2">
                Your private room &ldquo;<strong>{roomData.name}</strong>&rdquo;
                has been created.
              </div>
              <div
                className="bg-muted p-4 rounded-lg border-2 border-dashed cursor-pointer hover:bg-muted/80 transition-colors relative group"
                onClick={handleCopyCode}
              >
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-2">
                    Room Code
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <div className="text-2xl font-bold font-mono tracking-wider">
                      {roomData.code}
                    </div>
                    {copied ? (
                      <LuCheck className="h-5 w-5 text-green-500" />
                    ) : (
                      <LuCopy className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2 opacity-0 group-hover:opacity-100 transition-opacity text-center">
                  Click to copy
                </div>
              </div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3">
              <div className="text-sm text-amber-800 dark:text-amber-200 font-medium flex items-center gap-2">
                <LuOctagonAlert />
                Save this room code now!
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                This code will not be shown again. You and{" "}
                <strong>your friend</strong> cannot join this private room
                without it.
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialogCancel onClick={onClose} className="w-full">
            Got it
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

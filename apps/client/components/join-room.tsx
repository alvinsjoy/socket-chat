"use client";

import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useSocket } from "@/contexts/socket-context";
import { toast } from "sonner";

const joinRoomSchema = z.object({
  roomCode: z.string().length(6, "Room code must be exactly 6 characters"),
});

type JoinRoomFormData = z.infer<typeof joinRoomSchema>;

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

export default function JoinRoom({
  isOpen,
  onClose,
  userId,
  userName,
}: JoinRoomModalProps) {
  const { joinRoom, socket } = useSocket();

  const form = useForm<JoinRoomFormData>({
    resolver: zodResolver(joinRoomSchema),
    defaultValues: {
      roomCode: "",
    },
  });

  const handleClose = useCallback(() => {
    form.reset();
    onClose();
  }, [form, onClose]);

  useEffect(() => {
    if (socket) {
      const handleJoinFailed = (error: string) => {
        toast.error(`Failed to join room: ${error}`);
      };

      const handleRoomNotFound = () => {};

      const handleRoomFull = () => {
        toast.error("Room is full. Cannot join at this time.");
      };

      socket.on("join-failed", handleJoinFailed);
      socket.on("room-not-found", handleRoomNotFound);
      socket.on("room-full", handleRoomFull);

      return () => {
        socket.off("join-failed", handleJoinFailed);
        socket.off("room-not-found", handleRoomNotFound);
        socket.off("room-full", handleRoomFull);
      };
    }
  }, [socket]);

  const onSubmit = (data: JoinRoomFormData) => {
    try {
      joinRoom(data.roomCode.toUpperCase(), userId, userName);
      handleClose();
    } catch {
      toast.error("Failed to join room. Please try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Room</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="roomCode"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={form.formState.isSubmitting}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </FormControl>
                  <FormDescription className="text-center">
                    Enter the 6-character room code
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleClose}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={
                  !form.formState.isValid || form.formState.isSubmitting
                }
              >
                {form.formState.isSubmitting ? "Joining..." : "Join Room"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

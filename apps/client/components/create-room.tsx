"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useSocket } from "@/contexts/socket-context";

const createRoomSchema = z.object({
  roomName: z
    .string()
    .min(1, "Room name is required")
    .max(50, "Room name must be 50 characters or less")
    .trim(),
  isPublic: z.boolean(),
});

type CreateRoomFormData = z.infer<typeof createRoomSchema>;

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateRoom({ isOpen, onClose }: CreateRoomModalProps) {
  const router = useRouter();
  const { createRoom, socket } = useSocket();

  const form = useForm<CreateRoomFormData>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      roomName: "",
      isPublic: true,
    },
  });
  const handleClose = useCallback(() => {
    form.reset();
    onClose();
  }, [form, onClose]);
  useEffect(() => {
    if (socket) {
      const handleRoomCreated = (roomData: {
        code: string;
        name: string;
        isPublic: boolean;
        autoJoined?: boolean;
      }) => {
        handleClose();
        if (roomData.isPublic || roomData.autoJoined) {
          router.push(`/room/${roomData.code}`);
        }
      };

      const handleRoomCreationFailed = (error: string) => {
        toast.error(`Failed to create room: ${error}`);
      };

      socket.on("room-created", handleRoomCreated);
      socket.on("room-creation-failed", handleRoomCreationFailed);

      return () => {
        socket.off("room-created", handleRoomCreated);
        socket.off("room-creation-failed", handleRoomCreationFailed);
      };
    }
  }, [socket, handleClose, router]);
  const onSubmit = (data: CreateRoomFormData) => {
    try {
      createRoom(data.roomName, data.isPublic);
    } catch {
      toast.error("Failed to create room. Please try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Room</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="roomName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="My Awesome Room"
                      disabled={form.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        id="isPublic"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={form.formState.isSubmitting}
                      />
                    </FormControl>
                    <div className="flex-1">
                      <FormLabel
                        htmlFor="isPublic"
                        className="text-sm text-foreground"
                      >
                        Make room public
                      </FormLabel>
                      <p className="text-muted-foreground text-xs">
                        Public rooms can be joined by anyone. Private rooms
                        require an invite link to join.
                      </p>
                    </div>
                  </div>
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
                {form.formState.isSubmitting ? "Creating..." : "Create Room"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

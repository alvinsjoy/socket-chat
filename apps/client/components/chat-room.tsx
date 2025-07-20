"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LuCopy, LuCheck, LuSend } from "react-icons/lu";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from "@/components/ui/card";
import { useSocket } from "@/contexts/socket-context";
import { Message } from "@/lib/socket";
import { Typing } from "@/components/typing";

const messageSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(500, "Message too long")
    .trim(),
});

type MessageFormData = z.infer<typeof messageSchema>;

interface ChatRoomProps {
  onLeaveRoom: () => void;
  userId: string;
  userName: string;
}

export default function ChatRoom({
  onLeaveRoom,
  userId,
  userName,
}: ChatRoomProps) {
  const {
    currentRoom,
    currentRoomName,
    messages,
    sendMessage,
    startTyping,
    stopTyping,
    typingUsers,
  } = useSocket();
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      message: "",
    },
  });
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleKeyDown = () => {
      if (inputRef.current && document.activeElement !== inputRef.current) {
        inputRef.current.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCopyCode = async () => {
    if (currentRoom) {
      try {
        await navigator.clipboard.writeText(currentRoom);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error("Failed to copy room code");
      }
    }
  };
  const onSubmit = (data: MessageFormData) => {
    if (currentRoom) {
      try {
        if (isTyping) {
          setIsTyping(false);
          stopTyping(currentRoom);
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
        }

        sendMessage(currentRoom, data.message, userId, userName);
        form.reset();
      } catch {
        toast.error("Failed to send message. Please try again.");
      }
    } else {
      toast.error("Not connected to a room. Please join a room first.");
    }
  };
  const handleInputChange = (value: string) => {
    if (!currentRoom) return;

    if (value.trim() && !isTyping) {
      setIsTyping(true);
      startTyping(currentRoom);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        stopTyping(currentRoom);
      }
    }, 2000);

    if (!value.trim() && isTyping) {
      setIsTyping(false);
      stopTyping(currentRoom);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (isTyping && currentRoom) {
        stopTyping(currentRoom);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isTyping, currentRoom, stopTyping]);

  const formatMessageTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMessageDate = (timestamp: Date) => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return "Today";
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  const shouldShowDateDivider = (currentMessage: Message, index: number) => {
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    const currentDate = new Date(currentMessage.timestamp).toDateString();
    const prevDate = new Date(prevMessage.timestamp).toDateString();
    return currentDate !== prevDate;
  };

  if (!currentRoom) {
    return null;
  }
  return (
    <div className="flex flex-col h-full">
      <Card className="rounded-none border-x-0 border-t-0 shadow-none">
        <CardHeader>
          <CardTitle>{currentRoomName || "Chat Room"}</CardTitle>
          <CardDescription>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Room Code:</span>
              <div
                className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs font-mono cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={handleCopyCode}
              >
                <span>{currentRoom}</span>
                {copied ? (
                  <LuCheck className="h-3 w-3 text-green-500" />
                ) : (
                  <LuCopy className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors" />
                )}
              </div>
            </div>
          </CardDescription>
          <CardAction>
            <Button onClick={onLeaveRoom} variant="destructive" size="sm">
              Leave Room
            </Button>
          </CardAction>
        </CardHeader>
      </Card>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={message.id}>
              {shouldShowDateDivider(message, index) && (
                <div className="flex justify-center my-4">
                  <span className="px-3 py-1 text-xs bg-muted text-muted-foreground rounded-full">
                    {formatMessageDate(message.timestamp)}
                  </span>
                </div>
              )}
              <div
                className={`flex ${
                  message.senderId === userId ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.senderId === userId
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {message.senderId !== userId && (
                    <p className="text-xs font-medium mb-1 opacity-70">
                      {message.sender}
                    </p>
                  )}
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {formatMessageTime(message.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-border bg-card">
        <Typing typingUsers={typingUsers.filter((user) => user !== userName)} />
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className={`flex items-end gap-2 transition-all duration-300 ${
              typingUsers.filter((user) => user !== userName).length > 0
                ? "mt-3"
                : ""
            }`}
            autoComplete="off"
          >
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <div
                      className={`transition-all duration-300 ${
                        form.formState.isValid && !form.formState.isSubmitting
                          ? "pr-2"
                          : ""
                      }`}
                    >
                      <Input
                        placeholder="Type a message..."
                        className="w-full"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleInputChange(e.target.value);
                        }}
                        autoFocus
                        ref={inputRef}
                      />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
            <div
              className={`transition-all duration-300 ease-out ${
                form.formState.isValid && !form.formState.isSubmitting
                  ? "w-10 opacity-100 translate-x-0"
                  : "w-0 opacity-0 translate-x-4 overflow-hidden"
              }`}
            >
              <Button
                type="submit"
                className="w-10 h-10 rounded-full transform transition-transform duration-200 hover:scale-105 active:scale-95"
                disabled={
                  !form.formState.isValid || form.formState.isSubmitting
                }
              >
                <LuSend />
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

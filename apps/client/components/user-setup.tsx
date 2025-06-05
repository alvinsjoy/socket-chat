"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createUser, storeUser } from "@/lib/user";

const userSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(30, "Name must be 30 characters or less")
    .trim(),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserSetupProps {
  onUserCreated: (user: { id: string; name: string }) => void;
}

export default function UserSetup({ onUserCreated }: UserSetupProps) {
  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
    },
  });
  const onSubmit = (data: UserFormData) => {
    try {
      const user = createUser(data.name);
      storeUser(user);
      onUserCreated(user);
    } catch {
      toast.error("Failed to create user. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome to Socket Chat
          </h1>
          <p className="text-muted-foreground">
            Choose a display name to get started
          </p>
        </div>{" "}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" maxLength={30} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={!form.formState.isValid || form.formState.isSubmitting}
            >
              Continue
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

export interface User {
  id: string;
  name: string;
}

const USER_STORAGE_KEY = "socket-chat-user";

export const getStoredUser = (): User | null => {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const storeUser = (user: User): void => {
  if (typeof window === "undefined") return;

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

export const createUser = (name: string): User => {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
  };
};

export const clearStoredUser = (): void => {
  if (typeof window === "undefined") return;

  localStorage.removeItem(USER_STORAGE_KEY);
};

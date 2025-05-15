"use client";
// contexts/SocketContext.tsx
import React, { createContext, useContext, ReactNode } from "react";
import { useChat } from "@/hooks/useChat";

// 1. Define a proper type for the context value
type SocketContextType = ReturnType<typeof useChat> | null;

// 2. Initialize context with proper default value
const SocketContext = createContext<SocketContextType>(null);

// 3. Define props interface with proper children type
interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  // เรียกใช้ useChat เพียงครั้งเดียว
  const chatState = useChat();

  return (
    <SocketContext.Provider value={chatState}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (context === null) {
    throw new Error("useSocketContext must be used within a SocketProvider");
  }
  return context;
}

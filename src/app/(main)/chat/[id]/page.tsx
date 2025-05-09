"use client"

import { Suspense } from "react";
import ChatPage from "@/components/chat/chat-page";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";

export default function ChatRoom() {
  const params = useParams();
  const roomId = params.id as string;

  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p className="text-muted-foreground">กำลังโหลดข้อความ...</p>
        </div>
      }
    >
      <ChatPage roomId={roomId} />
    </Suspense>
  );
}

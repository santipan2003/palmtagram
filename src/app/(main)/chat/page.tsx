// app/chat/page.tsx
import { Suspense } from "react";
import ChatRoomList from "@/components/chat/chat-room-list";
import { MessageSquare } from "lucide-react";

export default function ChatInboxPage() {
  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <MessageSquare className="mr-2 h-6 w-6" />
          ข้อความของคุณ
        </h1>
      </div>

      <Suspense
        fallback={
          <div className="p-8 flex justify-center">
            <div className="animate-pulse flex flex-col w-full max-w-2xl space-y-4">
              <div className="h-12 bg-muted rounded-lg w-full"></div>
              <div className="h-20 bg-muted rounded-lg w-full"></div>
              <div className="h-20 bg-muted rounded-lg w-full"></div>
              <div className="h-20 bg-muted rounded-lg w-full"></div>
            </div>
          </div>
        }
      >
        <ChatRoomList />
      </Suspense>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useMobile } from "@/hooks/use-mobile";
import ChatConversation from "@/components/chat/chat-conversation";
import ConversationList from "@/components/chat/conversation-list";
import { mockConversations } from "@/lib/data/mock-data";
import { useSidebar } from "@/components/ui/sidebar";

export default function ChatPage() {
  const isMobile = useMobile();
  const [activeChat, setActiveChat] = useState<string | null>("1");
  const { setOpen } = useSidebar();

  // Auto-collapse sidebar on chat page for desktop
  useEffect(() => {
    if (!isMobile) {
      setOpen(false);
    }
  }, [isMobile, setOpen]);

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-6rem)] border rounded-lg overflow-hidden">
      {/* Conversations Sidebar */}
      {(!isMobile || (isMobile && !activeChat)) && (
        <div
          className={`${isMobile ? "w-full" : "w-80"} border-r flex-shrink-0`}
        >
          <ConversationList
            conversations={mockConversations}
            activeChat={activeChat}
            onSelectChat={(id) => setActiveChat(id)}
          />
        </div>
      )}

      {/* Chat Area */}
      {(!isMobile || (isMobile && activeChat)) && (
        <div className="flex-1 flex flex-col min-w-0">
          {activeChat ? (
            <ChatConversation
              conversation={mockConversations.find((c) => c.id === activeChat)!}
              onBack={() => isMobile && setActiveChat(null)}
              isMobile={isMobile}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-medium">Select a conversation</h3>
                <p className="text-muted-foreground">
                  Choose a conversation from the list to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

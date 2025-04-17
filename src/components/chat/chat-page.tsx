"use client";

import { useState, useEffect } from "react";
import { useMobile } from "@/hooks/use-mobile";
import ChatConversation from "@/components/chat/chat-conversation";
import ConversationList from "@/components/chat/conversation-list";
import { mockConversations } from "@/lib/data/mock-data";
import { useSidebar } from "@/components/ui/sidebar";

export default function ChatPage() {
  const isMobile = useMobile();
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const { setOpen } = useSidebar();

  // Set initial chat for desktop users only
  useEffect(() => {
    // Clear activeChat on component mount for mobile
    if (isMobile) {
      setActiveChat(null);
    } else {
      setActiveChat("1");
    }
  }, [isMobile]);

  // Auto-collapse sidebar on chat page for desktop
  useEffect(() => {
    if (!isMobile) {
      setOpen(false);
    }
  }, [isMobile, setOpen]);

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-6rem)] border rounded-lg overflow-hidden">
      {/* For mobile: Show ConversationList when no active chat */}
      {isMobile && !activeChat && (
        <div className="w-full">
          <ConversationList
            conversations={mockConversations}
            activeChat={activeChat}
            onSelectChat={(id) => setActiveChat(id)}
          />
        </div>
      )}

      {/* For mobile: Show ChatConversation when there's an active chat */}
      {isMobile && activeChat && (
        <div className="flex-1 flex flex-col min-w-0">
          <ChatConversation
            conversation={mockConversations.find((c) => c.id === activeChat)!}
            onBack={() => setActiveChat(null)}
            isMobile={true}
          />
        </div>
      )}

      {/* For desktop: Show split view with ConversationList and ChatArea */}
      {!isMobile && (
        <>
          <div className="w-80 border-r flex-shrink-0">
            <ConversationList
              conversations={mockConversations}
              activeChat={activeChat}
              onSelectChat={(id) => setActiveChat(id)}
            />
          </div>
          <div className="flex-1 flex flex-col min-w-0">
            {activeChat ? (
              <ChatConversation
                conversation={
                  mockConversations.find((c) => c.id === activeChat)!
                }
                onBack={() => {}}
                isMobile={false}
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
        </>
      )}
    </div>
  );
}

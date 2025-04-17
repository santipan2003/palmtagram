"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Phone,
  Video,
  Info,
  Send,
  ImageIcon,
  Smile,
} from "lucide-react";

type Conversation = {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  lastMessage: string;
  time: string;
  unread: number;
};

type Message = {
  id: string;
  content: string;
  sender: "user" | "other";
  time: string;
};

interface ChatConversationProps {
  conversation: Conversation;
  onBack: () => void;
  isMobile: boolean;
}

export default function ChatConversation({
  conversation,
  onBack,
  isMobile,
}: ChatConversationProps) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Mock messages data
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hey there! How's it going?",
      sender: "other",
      time: "10:30 AM",
    },
    {
      id: "2",
      content:
        "Hi! I'm doing well, thanks for asking. Just working on that project we discussed.",
      sender: "user",
      time: "10:32 AM",
    },
    {
      id: "3",
      content: "That sounds great! How's the progress so far?",
      sender: "other",
      time: "10:33 AM",
    },
    {
      id: "4",
      content:
        "It's coming along nicely. I've completed about 70% of it. Should be done by tomorrow.",
      sender: "user",
      time: "10:35 AM",
    },
    {
      id: "5",
      content:
        "That's impressive! Let me know if you need any help with the remaining parts.",
      sender: "other",
      time: "10:36 AM",
    },
    {
      id: "6",
      content: "Will do. Thanks for offering!",
      sender: "user",
      time: "10:38 AM",
    },
    {
      id: "7",
      content:
        "By the way, are we still meeting tomorrow to discuss the next steps?",
      sender: "other",
      time: "10:40 AM",
    },
  ]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const newMsg: Message = {
        id: `msg-${Date.now()}`,
        content: newMessage,
        sender: "user",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages([...messages, newMsg]);
      setNewMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Header - Fixed height */}
      <div className="py-3 px-4 border-b flex items-center bg-background z-10">
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <Avatar className="h-10 w-10 mr-3">
          <AvatarImage
            src={conversation.user.avatar}
            alt={conversation.user.name}
          />
          <AvatarFallback>{conversation.user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{conversation.user.name}</p>
          <p className="text-xs text-muted-foreground">Active now</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Info className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Chat Messages - Flexible height, scrollable */}
      <ScrollArea className="flex-1 p-4 overflow-y-auto" ref={scrollAreaRef}>
        <div className="space-y-4 pb-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div className="flex items-end gap-2 max-w-[80%]">
                {message.sender === "other" && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={conversation.user.avatar}
                      alt={conversation.user.name}
                    />
                    <AvatarFallback>
                      {conversation.user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-2xl px-4 py-2 ${
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="break-words">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender === "user"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {message.time}
                  </p>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Chat Input - Fixed height */}
      <div className="p-3 border-t bg-background">
        <div className="flex items-center gap-2 max-w-full">
          <div className="flex gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex h-9 w-9"
            >
              <ImageIcon className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex h-9 w-9"
            >
              <Smile className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 relative">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pr-10 py-2 h-9"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

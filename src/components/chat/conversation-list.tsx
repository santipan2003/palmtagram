"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Edit } from "lucide-react";

interface ConversationUser {
  name: string;
  avatar: string;
}

interface ConversationProps {
  id: string;
  user: ConversationUser;
  lastMessage: string;
  time: string;
  unread: number;
}

interface ConversationListProps {
  conversations: ConversationProps[];
  activeChat: string | null;
  onSelectChat: (id: string) => void;
}

export default function ConversationList({
  conversations,
  activeChat,
  onSelectChat,
}: ConversationListProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Messages</h2>
          <Button variant="ghost" size="icon">
            <Edit className="h-5 w-5" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search messages" className="pl-8" />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`flex items-center p-3 rounded-lg cursor-pointer ${
                activeChat === conversation.id
                  ? "bg-accent"
                  : "hover:bg-accent/50"
              }`}
              onClick={() => onSelectChat(conversation.id)}
            >
              <Avatar className="h-12 w-12 mr-3 flex-shrink-0">
                <AvatarImage
                  src={conversation.user.avatar}
                  alt={conversation.user.name}
                />
                <AvatarFallback>
                  {conversation.user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between w-full">
                  <p className="font-medium truncate">
                    {conversation.user.name}
                  </p>
                  <p className="text-xs text-muted-foreground ml-2 shrink-0">
                    {conversation.time}
                  </p>
                </div>
                <div className="flex items-center justify-between w-full">
                  <p className="text-sm text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap max-w-[60%]">
                    {conversation.lastMessage}
                  </p>
                  {conversation.unread > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground shrink-0">
                      {conversation.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

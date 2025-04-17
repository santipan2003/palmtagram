"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, Smile, MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function CreatePostCard() {
  const [postContent, setPostContent] = useState("");

  const handleSubmit = () => {
    // Handle post submission
    console.log("Submitting post:", postContent);
    setPostContent("");
  };

  return (
    <Card className="overflow-hidden border-none shadow-md bg-card">
      <CardContent className="p-4 pt-5">
        <div className="flex space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/img/avatar1.png" alt="User" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="What's on your mind?"
              className="resize-none border-none focus-visible:ring-0 p-0 text-base min-h-[60px] bg-transparent"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="p-3 flex items-center justify-between bg-card">
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground rounded-full h-9 w-9 p-0"
          >
            <ImageIcon className="h-5 w-5" />
            <span className="sr-only">Add Photo</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground rounded-full h-9 w-9 p-0"
          >
            <Smile className="h-5 w-5" />
            <span className="sr-only">Add Feeling</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground rounded-full h-9 w-9 p-0"
          >
            <MapPin className="h-5 w-5" />
            <span className="sr-only">Add Location</span>
          </Button>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!postContent.trim()}
          className="rounded-full px-5"
        >
          Post
        </Button>
      </CardFooter>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Send,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

interface PostUser {
  name: string;
  username: string;
  avatar: string;
}

interface PostProps {
  id: number;
  user: PostUser;
  content: string;
  image: string | null;
  likes: number;
  comments: number;
  time: string;
}

export default function PostCard({ post }: { post: PostProps }) {
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);

  // Mock comments data
  const comments = [
    {
      id: 1,
      user: {
        name: "Sarah Williams",
        username: "sarahw",
        avatar: "/img/post2.png",
      },
      content: "This looks amazing! Where was this taken?",
      time: "1h ago",
    },
    {
      id: 2,
      user: {
        name: "Mike Chen",
        username: "mikec",
        avatar: "/img/post1.png",
      },
      content: "Great shot! Love the composition.",
      time: "30m ago",
    },
  ];

  const handleSubmitComment = () => {
    if (commentText.trim()) {
      console.log("Submitting comment:", commentText);
      setCommentText("");
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  return (
    <Card className="overflow-hidden border-none shadow-md">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={post.user.avatar} alt={post.user.name} />
              <AvatarFallback>{post.user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{post.user.name}</p>
              <p className="text-sm text-muted-foreground">
                @{post.user.username} · {post.time}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="mb-3">{post.content}</p>
        {post.image && (
          <div className="rounded-md overflow-hidden relative w-full h-[300px]">
            <Image
              src={post.image}
              alt="Post content"
              fill
              sizes="(max-width: 768px) 100vw, 700px"
              className="object-cover"
              placeholder="blur"
              blurDataURL="/placeholder.svg"
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-col">
        <div className="flex items-center justify-between w-full mb-2">
          <div className="flex items-center space-x-6">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-1 text-muted-foreground"
            >
              <Heart className="h-5 w-5" />
              <span>{post.likes}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-1 text-muted-foreground"
              onClick={toggleComments}
            >
              <MessageCircle className="h-5 w-5" />
              <span>{post.comments}</span>
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Share2 className="h-5 w-5" />
          </Button>
        </div>

        {showComments && (
          <>
            <Separator className="my-2" />

            {/* Comments section */}
            <div className="space-y-3 mt-2 w-full">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={comment.user.avatar}
                      alt={comment.user.name}
                    />
                    <AvatarFallback>
                      {comment.user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-muted rounded-2xl px-3 py-2">
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-sm">{comment.user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {comment.time}
                      </p>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Comment input */}
            <div className="flex items-center space-x-2 mt-3 w-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/img/avatar1.png" alt="User" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="flex-1 relative">
                <Input
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="pr-10 rounded-full bg-muted"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim()}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 rounded-full"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  );
}

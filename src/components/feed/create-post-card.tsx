"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, Smile, X, FileVideo } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { MediaItem, CreatePostCardProps } from "@/interfaces/post.interface";
import { postService } from "@/services/feed/post.service";

export default function CreatePostCard({
  userData,
  onPostCreated,
}: CreatePostCardProps) {
  const [postContent, setPostContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newMedia: MediaItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileType = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
        ? "video"
        : null;

      if (!fileType) continue; // Skip unsupported file types

      newMedia.push({
        type: fileType,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    setMedia([...media, ...newMedia]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeMedia = (index: number) => {
    const updatedMedia = [...media];

    // Release object URL to prevent memory leaks
    if (updatedMedia[index].previewUrl) {
      URL.revokeObjectURL(updatedMedia[index].previewUrl!);
    }

    updatedMedia.splice(index, 1);
    setMedia(updatedMedia);
  };

  const handleSubmit = async () => {
    if (!postContent.trim() && media.length === 0) return;

    setIsSubmitting(true);

    try {
      // ใช้ postService แทนการเรียก API โดยตรง
      await postService.createPost(postContent, media);

      // Reset form
      setPostContent("");
      setMedia([]);

      // Notify parent component to refresh posts
      onPostCreated();
    } catch (error) {
      console.error("Error creating post:", error);
      alert("เกิดข้อผิดพลาดในการสร้างโพสต์");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="overflow-hidden border shadow-md bg-card mb-4">
      <CardContent className="p-4 pt-5">
        <div className="flex space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={
                userData?.profile?.avatarUrl || "/img/avatar-placeholder.png"
              }
              alt={userData?.username || "User"}
            />
            <AvatarFallback>
              {userData?.username?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="คุณกำลังคิดอะไรอยู่?"
              className="resize-none border-none focus-visible:ring-0 px-3 py-2 text-base min-h-[60px] bg-transparent"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
            />

            {/* Media Preview Area */}
            {media.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                {media.map((item, index) => (
                  <div
                    key={index}
                    className="relative rounded-md overflow-hidden bg-muted/20 aspect-square"
                  >
                    {item.type === "image" && item.previewUrl && (
                      <Image
                        src={item.previewUrl}
                        alt="Media preview"
                        fill
                        className="object-cover"
                      />
                    )}
                    {item.type === "video" && item.previewUrl && (
                      <video
                        src={item.previewUrl}
                        className="w-full h-full object-cover"
                        controls
                      />
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 rounded-full"
                      onClick={() => removeMedia(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <Separator />

      <CardFooter className="p-3 flex items-center justify-between bg-card">
        <div className="flex items-center space-x-1">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleMediaChange}
          />
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground rounded-full h-9 w-9 p-0"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="h-5 w-5" />
            <span className="sr-only">Add Photo</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground rounded-full h-9 w-9 p-0"
          >
            <FileVideo className="h-5 w-5" />
            <span className="sr-only">Add Video</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground rounded-full h-9 w-9 p-0"
          >
            <Smile className="h-5 w-5" />
            <span className="sr-only">Add Feeling</span>
          </Button>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || (!postContent.trim() && media.length === 0)}
          className={cn(
            "rounded-full px-5",
            isSubmitting && "opacity-50 cursor-not-allowed"
          )}
        >
          {isSubmitting ? "กำลังโพสต์..." : "โพสต์"}
        </Button>
      </CardFooter>
    </Card>
  );
}

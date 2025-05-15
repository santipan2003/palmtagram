import React from "react"; // เพิ่มการนำเข้า React
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, CornerDownRight } from "lucide-react";
import { ExtendedComment } from "@/interfaces/feed.interface";
import { cn } from "@/lib/utils";

interface PostCardCommentProps {
  comment: ExtendedComment;
  index: number;
  isReply?: boolean;
  replyIndex?: number;
  notificationId?: string;
  formatPostDate: (dateString: string) => string;
  navigateToProfile: (username: string) => void;
  handleCommentLike: (
    commentId: string,
    index: number,
    replyIndex?: number
  ) => Promise<void>;
  handleReply: (commentId: string, username: string) => void;
  toggleReplies: (index: number) => void;
  renderComment: (
    comment: ExtendedComment,
    index: number,
    isReply?: boolean,
    replyIndex?: number
  ) => React.ReactElement; // แก้จาก JSX.Element เป็น React.ReactElement
  showUser: boolean;
}

export default function PostCardComment({
  comment,
  index,
  isReply = false,
  replyIndex,
  formatPostDate,
  navigateToProfile,
  handleCommentLike,
  handleReply,
  toggleReplies,
  renderComment,
  showUser = true,
}: PostCardCommentProps) {
  const username = comment.authorId?.username || "";

  return (
    <div className={cn("flex items-start space-x-2", isReply && "ml-8 mt-2")}>
      <Avatar
        className="h-8 w-8 cursor-pointer"
        onClick={() => navigateToProfile(username)}
      >
        <AvatarImage
          src={
            comment.authorId?.profile?.avatarUrl ||
            "/img/avatar-placeholder.png"
          }
          alt={username || "ผู้ใช้"}
        />
        <AvatarFallback>{username.charAt(0) || "?"}</AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <div className="bg-muted/50 rounded-2xl px-3 py-2">
          <div className="flex justify-between items-center">
            <p
              className="font-medium text-xs cursor-pointer hover:underline"
              onClick={() => navigateToProfile(username)}
            >
              {username || "ผู้ใช้"}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {formatPostDate(comment.createdAt)}
              </p>
              {/* ปุ่มไลค์คอมเมนต์ */}
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "flex items-center h-6 p-0 min-w-6",
                  comment.isLiked ? "text-red-500" : "text-muted-foreground"
                )}
                onClick={() =>
                  isReply && replyIndex !== undefined
                    ? handleCommentLike(comment._id, index, replyIndex)
                    : handleCommentLike(comment._id, index)
                }
              >
                <Heart
                  className={cn(
                    "h-3.5 w-3.5",
                    comment.isLiked && "fill-current text-red-500"
                  )}
                />
              </Button>
            </div>
          </div>

          {/* เนื้อหาคอมเมนต์ */}
          <p className="text-sm">{comment.content}</p>

          {/* แสดงจำนวนไลค์และปุ่มตอบกลับ */}
          <div className="flex items-center gap-3 mt-1">
            {comment.likeCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {comment.likeCount} คนถูกใจสิ่งนี้
              </p>
            )}

            {!isReply && showUser && (
              <button
                onClick={() => handleReply(comment._id, username)}
                className="text-xs text-muted-foreground hover:text-primary"
              >
                ตอบกลับ
              </button>
            )}
          </div>
        </div>

        {/* ปุ่มดูการตอบกลับ (แสดงเฉพาะหากมีการตอบกลับ) */}
        {!isReply && (comment.replyCount || 0) > 0 && (
          <button
            onClick={() => toggleReplies(index)}
            className="flex items-center text-xs text-muted-foreground hover:text-primary mt-1 ml-3"
          >
            <CornerDownRight className="mr-1 h-3 w-3" />
            {comment.showReplies
              ? "ซ่อนการตอบกลับ"
              : `ดูการตอบกลับทั้งหมด (${comment.replyCount})`}
          </button>
        )}

        {/* การตอบกลับของคอมเมนต์นี้ */}
        {!isReply && comment.showReplies && (
          <div className="mt-2 space-y-2">
            {comment.isLoading ? (
              <p className="text-xs text-muted-foreground ml-3">
                กำลังโหลดการตอบกลับ...
              </p>
            ) : (
              comment.replies?.map((reply, rIndex) =>
                renderComment(reply, index, true, rIndex)
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

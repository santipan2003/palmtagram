import React, { useState } from "react"; // เพิ่มการนำเข้า React
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, CornerDownRight, Ellipsis, Loader2, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { postService } from "@/services/post.service";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

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
  onCommentDeleted?: (
    commentId: string,
    isReply: boolean,
    parentIndex?: number
  ) => void;
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
  onCommentDeleted,
}: PostCardCommentProps) {
  const { user } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const username = comment.authorId?.username || "";

  // ตรวจสอบว่าผู้ใช้ปัจจุบันเป็นเจ้าของคอมเมนต์หรือไม่
  const isCommentOwner = user && user._id === comment.authorId?._id;

  // ฟังก์ชันลบคอมเมนต์
  const handleDeleteComment = async () => {
    if (!isCommentOwner || isDeleting) return;

    setIsDeleting(true);

    try {
      await postService.deleteComment(comment._id);
      setShowDeleteDialog(false);

      // แจ้งการลบสำเร็จ
      toast.success("ลบความคิดเห็นสำเร็จ");

      // แจ้งให้คอมโพเนนต์หลักทราบว่าคอมเมนต์ถูกลบแล้ว
      if (onCommentDeleted) {
        onCommentDeleted(comment._id, isReply, isReply ? index : undefined);
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการลบคอมเมนต์:", error);
      toast.error("ไม่สามารถลบความคิดเห็นได้ โปรดลองอีกครั้ง");
    } finally {
      setIsDeleting(false);
    }
  };

  // เพิ่มฟังก์ชัน formatCommentText ก่อน return ในฟังก์ชัน PostCardComment
  const formatCommentText = (text: string) => {
    // ใช้ regex เพื่อค้นหารูปแบบ @username ในข้อความ
    const mentionRegex = /@([a-zA-Z0-9._]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    // หา @username ทั้งหมดในข้อความและแปลงเป็น JSX elements
    while ((match = mentionRegex.exec(text)) !== null) {
      // เพิ่มข้อความก่อน @username
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // เพิ่ม @username ที่มีการจัดรูปแบบและ event handler
      const username = match[1];
      parts.push(
        <strong
          key={match.index}
          className="font-semibold text-primary cursor-pointer hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            navigateToProfile(username);
          }}
        >
          @{username}
        </strong>
      );

      lastIndex = match.index + match[0].length;
    }

    // เพิ่มข้อความที่เหลือหลัง @username ตัวสุดท้าย
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  return (
    <div
      className={cn("flex items-start space-x-2 group", isReply && "ml-8 mt-2")}
    >
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
          <p className="text-sm">{formatCommentText(comment.content)}</p>

          {/* แสดงจำนวนไลค์และปุ่มตอบกลับ */}
          <div className="flex items-center gap-3 mt-1">
            {comment.likeCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {comment.likeCount} คนถูกใจสิ่งนี้
              </p>
            )}

            {showUser && (
              <button
                onClick={() => {
                  if (isReply) {
                    // กรณีตอบกลับ reply ให้ส่ง parentCommentId ของมันเป็น parentCommentId ของคอมเมนต์ใหม่ด้วย
                    handleReply(
                      comment.parentCommentId || comment._id,
                      username
                    );
                  } else {
                    // กรณีคอมเมนต์หลัก ทำแบบเดิม
                    handleReply(comment._id, username);
                  }
                }}
                className="text-xs text-muted-foreground hover:text-primary"
              >
                ตอบกลับ
              </button>
            )}

            {/* Delete Comment - แก้ไขให้ opacity เป็น 0 ปกติ และเมื่อ hover จะเป็น 1 */}
            {isCommentOwner && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteDialog(true);
                }}
                className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <Ellipsis className="h-4 w-4" />
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
      {/* Dialog สำหรับยืนยันการลบคอมเมนต์ */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>ลบความคิดเห็น</DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบความคิดเห็นนี้?
              การกระทำนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="sm:flex-1"
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteComment}
              disabled={isDeleting}
              className="sm:flex-1"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังลบ...
                </>
              ) : (
                <>
                  <Trash className="mr-2 h-4 w-4" />
                  ลบความคิดเห็น
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

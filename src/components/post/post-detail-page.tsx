"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CornerDownRight, Heart, Loader2, Trash, Ellipsis } from "lucide-react";
import { cn } from "@/lib/utils";
import { postService } from "@/services/post.service";
import { ApiPost, User, ExtendedComment } from "@/interfaces/profile.interface";
import { PostDetailDialog } from "./post-detail";
import { useSocketContext } from "@/contexts/SocketContext";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PostDetailContainerProps {
  post: ApiPost | null;
  user: User;
  username: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
}

export function PostDetailContainer({
  post,
  user,
  username,
  isOpen,
  onClose,
}: PostDetailContainerProps) {
  const router = useRouter();
  const { markNotificationAsRead } = useSocketContext();
  const { user: authUser } = useAuth();
  console.log("user", user);
  const [postComments, setPostComments] = useState<ExtendedComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    username: string;
  } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // เพิ่มฟังก์ชันนำทางไปยังหน้าโปรไฟล์
  const navigateToProfile = (username: string) => {
    if (username) {
      router.push(`/${username}`);
      if (onClose) {
        onClose();
      }
    }
  };

  // ตรวจสอบว่าผู้ใช้ไลค์โพสต์นี้แล้วหรือยัง
  const checkLikeStatus = useCallback(async () => {
    if (!post) return;

    try {
      const isLiked = await postService.checkPostLikeStatus(post._id);
      setLiked(isLiked);
    } catch (err) {
      console.error("Error checking like status:", err);
    }
  }, [post]);

  // จัดการการกดไลค์โพสต์
  const handleLike = async () => {
    if (!post || !authUser) return;

    try {
      if (!liked) {
        // กดไลค์
        await postService.likePost(post._id);
        if (post.likeCount !== undefined) {
          post.likeCount += 1;
        }
      } else {
        // ยกเลิกไลค์
        await postService.unlikePost(post._id);
        if (post.likeCount !== undefined) {
          post.likeCount = Math.max(0, post.likeCount - 1);
        }
      }

      // สลับสถานะไลค์
      setLiked(!liked);
    } catch (err) {
      console.error("Error toggling like:", err);
      toast.error("เกิดข้อผิดพลาด กรุณาลองอีกครั้ง");
    }
  };

  // จัดการการกดไลค์คอมเมนต์
  const handleCommentLike = async (
    commentId: string,
    commentIndex: number,
    replyIndex?: number
  ) => {
    if (!authUser) return;

    try {
      const updatedComments = [...postComments];

      // กรณีเป็นการไลค์ reply
      if (replyIndex !== undefined && updatedComments[commentIndex].replies) {
        const reply = updatedComments[commentIndex].replies![replyIndex];
        const isLiked = reply.isLiked || false;

        if (!isLiked) {
          await postService.likeComment(reply._id);
          updatedComments[commentIndex].replies![replyIndex] = {
            ...reply,
            isLiked: true,
            likeCount: (reply.likeCount || 0) + 1,
          };
        } else {
          await postService.unlikeComment(reply._id);
          updatedComments[commentIndex].replies![replyIndex] = {
            ...reply,
            isLiked: false,
            likeCount: Math.max(0, (reply.likeCount || 1) - 1),
          };
        }
      }
      // กรณีเป็นการไลค์คอมเมนต์หลัก
      else {
        const comment = updatedComments[commentIndex];
        const isLiked = comment.isLiked || false;

        if (!isLiked) {
          await postService.likeComment(commentId);
          updatedComments[commentIndex] = {
            ...comment,
            isLiked: true,
            likeCount: (comment.likeCount || 0) + 1,
          };
        } else {
          await postService.unlikeComment(commentId);
          updatedComments[commentIndex] = {
            ...comment,
            isLiked: false,
            likeCount: Math.max(0, (comment.likeCount || 1) - 1),
          };
        }
      }

      setPostComments(updatedComments);
    } catch (err) {
      console.error("Error toggling comment like:", err);
      toast.error("ไม่สามารถกดไลค์ได้ กรุณาลองอีกครั้ง");
    }
  };

  // จัดการการกดปุ่มตอบกลับคอมเมนต์
  const handleReply = (commentId: string, username: string) => {
    setReplyingTo({ commentId, username });
    // โฟกัสช่องข้อความและเพิ่ม @username
    setTimeout(() => {
      const inputElement = document.getElementById("desktop-comment-input");
      if (inputElement) {
        inputElement.focus();
        // ถ้ายังไม่มีข้อความ ให้เพิ่ม @username อัตโนมัติ
        if (commentText.trim() === "") {
          setCommentText(`@${username} `);
        }
      }
    }, 0);
  };

  // ยกเลิกการตอบกลับ
  const cancelReply = () => {
    setReplyingTo(null);
    // ลบ @username ออกจากข้อความ
    if (commentText.startsWith("@")) {
      const spaceIndex = commentText.indexOf(" ");
      if (spaceIndex > 0) {
        setCommentText(commentText.substring(spaceIndex + 1).trim());
      }
    }
  };

  // Fetch comments
  const fetchComments = useCallback(
    async (postId: string) => {
      if (!postId) return;

      try {
        setLoadingComments(true);

        // ดึงคอมเมนต์และข้อมูลไลค์
        let comments = await postService.getPostComments(postId);

        // กรองเอาแต่คอมเมนต์หลักที่ไม่มี parentCommentId
        comments = comments.filter((comment) => !comment.parentCommentId);

        // เรียงคอมเมนต์จากเก่าไปใหม่ (คอมเมนต์เก่าอยู่บน)
        comments.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        // ตรวจสอบสถานะไลค์สำหรับแต่ละคอมเมนต์ถ้าผู้ใช้ล็อกอิน
        if (authUser && comments.length > 0) {
          comments = await postService.checkCommentsLikeStatus(comments);
        }

        setPostComments(comments as ExtendedComment[]);
      } catch (err) {
        console.error("Error fetching comments:", err);
        setPostComments([]);
        toast.error("ไม่สามารถโหลดความคิดเห็นได้");
      } finally {
        setLoadingComments(false);
      }
    },
    [authUser]
  );

  // ส่งข้อมูลคอมเมนต์หรือการตอบกลับไปยัง API
  const handleSubmitComment = async () => {
    if (!commentText.trim() || !authUser || !post) return;

    try {
      const payload = replyingTo
        ? {
            content: commentText,
            postId: post._id,
            parentCommentId: replyingTo.commentId,
          }
        : {
            content: commentText,
            postId: post._id,
          };

      // สร้างคอมเมนต์หรือตอบกลับ
      const newComment = await postService.createComment(payload);
      console.log("Comment created:", newComment);

      // สร้างข้อมูลผู้ใช้เพื่อแสดงผลคอมเมนต์ทันที
      const enhancedComment = {
        ...newComment,
        authorId: {
          _id: authUser._id,
          username: authUser.username,
          profile: authUser.profile,
        },
      };

      // ล้างข้อความและการตอบกลับ
      setCommentText("");
      setReplyingTo(null);

      // ตรวจสอบว่าผู้คอมเมนต์ไม่ใช่เจ้าของโพสต์
      // แก้ไขการตรวจสอบเจ้าของโพสต์โดยดูจากหลายเงื่อนไข
      const isCommentingOwnPost =
        // กรณี post.authorId เป็น object
        (typeof post.authorId === "object" &&
          post.authorId?._id === authUser._id) ||
        // กรณี post.authorId เป็น string
        (typeof post.authorId === "string" && post.authorId === authUser._id) ||
        // กรณีตรวจสอบจาก user ที่รับมาจาก prop
        user._id === authUser._id;

      console.log("isCommentingOwnPost check:");
      console.log("- typeof post.authorId:", typeof post.authorId);
      console.log("- post.authorId:", post.authorId);
      console.log("- authUser._id:", authUser._id);
      console.log("- user._id:", user._id);
      console.log("- isCommentingOwnPost:", isCommentingOwnPost);

      // แสดง toast ยืนยันการคอมเมนต์
      if (!isCommentingOwnPost) {
        toast.success("ส่งความคิดเห็นสำเร็จ", {
          description: replyingTo
            ? `คุณได้ตอบกลับความคิดเห็นของ @${replyingTo.username}`
            : `คุณได้แสดงความคิดเห็นในโพสต์ของ @${
                typeof post.authorId === "object"
                  ? post.authorId?.username || "ผู้ใช้"
                  : username
              }`,
        });
      } else {
        // กรณีคอมเมนต์โพสต์ตัวเอง
        toast.success("ส่งความคิดเห็นสำเร็จ");
      }

      if (replyingTo) {
        // กรณีตอบกลับ - อัพเดตเฉพาะคอมเมนต์ที่ถูกตอบกลับ
        const commentIndex = postComments.findIndex(
          (c) => c._id === replyingTo.commentId
        );
        if (commentIndex > -1) {
          // เพิ่ม replyCount
          const updatedComments = [...postComments];
          updatedComments[commentIndex] = {
            ...updatedComments[commentIndex],
            replyCount: (updatedComments[commentIndex].replyCount || 0) + 1,
          };

          // ถ้าการตอบกลับยังแสดงอยู่ ให้โหลดใหม่
          if (updatedComments[commentIndex].showReplies) {
            loadReplies(replyingTo.commentId, commentIndex);
          }

          setPostComments(updatedComments);
        }
      } else {
        // กรณีคอมเมนต์หลัก - เพิ่มคอมเมนต์ใหม่ลงในรายการโดยไม่ต้องเรียก API อีกครั้ง
        setPostComments((prev) => [
          ...prev,
          enhancedComment as ExtendedComment,
        ]);

        // เพิ่มจำนวนคอมเมนต์
        if (post.commentCount !== undefined) {
          post.commentCount += 1;
        }
      }
    } catch (err) {
      console.error("Error posting comment:", err);
      toast.error("ไม่สามารถส่งความคิดเห็นได้ กรุณาลองอีกครั้ง");
    }
  };

  // เพิ่มฟังก์ชันสำหรับโหลดการตอบกลับของคอมเมนต์
  const loadReplies = async (commentId: string, index: number) => {
    try {
      // Set loading state for this comment
      const updatedComments = [...postComments];
      updatedComments[index] = {
        ...updatedComments[index],
        isLoading: true,
        showReplies: true,
      };
      setPostComments(updatedComments);

      // Fetch replies
      let replies = await postService.getCommentReplies(commentId);

      // ตรวจสอบสถานะไลค์สำหรับแต่ละการตอบกลับถ้าผู้ใช้ล็อกอิน
      if (authUser && replies.length > 0) {
        replies = await postService.checkCommentsLikeStatus(replies);
      }

      // Update the comments with replies
      const finalUpdatedComments = [...postComments];
      finalUpdatedComments[index] = {
        ...finalUpdatedComments[index],
        replies: replies as ExtendedComment[],
        isLoading: false,
        showReplies: true,
      };

      setPostComments(finalUpdatedComments);
    } catch (err) {
      console.error("Error loading replies:", err);
      toast.error("ไม่สามารถโหลดการตอบกลับได้");

      // Reset loading state
      const updatedComments = [...postComments];
      updatedComments[index] = {
        ...updatedComments[index],
        isLoading: false,
        showReplies: false,
      };
      setPostComments(updatedComments);
    }
  };

  // เพิ่มฟังก์ชันสลับการแสดง/ซ่อนการตอบกลับ
  const toggleReplies = (index: number) => {
    const comment = postComments[index];
    const updatedComments = [...postComments];

    // ถ้ายังไม่มีข้อมูลการตอบกลับหรือยังไม่เคยโหลด ให้โหลดข้อมูล
    if (!comment.replies || comment.replies.length === 0) {
      loadReplies(comment._id, index);
      return;
    }

    // ถ้ามีข้อมูลแล้วให้สลับการแสดง/ซ่อน
    updatedComments[index] = {
      ...comment,
      showReplies: !comment.showReplies,
    };
    setPostComments(updatedComments);
  };

  // ฟังก์ชันลบคอมเมนต์
  const confirmDeleteComment = (commentId: string) => {
    setDeletingCommentId(commentId);
    setShowDeleteDialog(true);
  };

  const handleDeleteComment = async () => {
    if (!deletingCommentId || isDeleting) return;

    setIsDeleting(true);

    try {
      await postService.deleteComment(deletingCommentId);
      setShowDeleteDialog(false);

      // ค้นหาว่าเป็นคอมเมนต์หลักหรือการตอบกลับ
      const isMainComment = postComments.some(
        (c) => c._id === deletingCommentId
      );

      if (isMainComment) {
        // กรณีเป็นคอมเมนต์หลัก
        setPostComments(
          postComments.filter((c) => c._id !== deletingCommentId)
        );

        // ลดจำนวนคอมเมนต์ของโพสต์
        if (post && post.commentCount) {
          post.commentCount = Math.max(0, post.commentCount - 1);
        }
      } else {
        // กรณีเป็นการตอบกลับ ต้องหาว่าอยู่ในคอมเมนต์หลักใด
        const updatedComments = [...postComments];
        for (let i = 0; i < updatedComments.length; i++) {
          const comment = updatedComments[i];
          if (
            comment.replies &&
            comment.replies.some((r) => r._id === deletingCommentId)
          ) {
            // ลบการตอบกลับ
            comment.replies = comment.replies.filter(
              (r) => r._id !== deletingCommentId
            );
            // ลดจำนวนการตอบกลับ
            comment.replyCount = Math.max(0, (comment.replyCount || 1) - 1);
            break;
          }
        }
        setPostComments(updatedComments);
      }

      toast.success("ลบความคิดเห็นสำเร็จ");
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการลบคอมเมนต์:", error);
      toast.error("ไม่สามารถลบความคิดเห็นได้ โปรดลองอีกครั้ง");
    } finally {
      setIsDeleting(false);
      setDeletingCommentId(null);
    }
  };

  // เพิ่มฟังก์ชันใหม่สำหรับแสดงเวลาแบบย่อ (relative time)
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    // แสดงเป็น "เมื่อสักครู่" ถ้าน้อยกว่า 1 นาที
    if (diffSec < 60) {
      return "เมื่อสักครู่";
    }

    // แสดงเป็นนาที ถ้าน้อยกว่า 1 ชั่วโมง
    if (diffMin < 60) {
      return `${diffMin} นาทีที่แล้ว`;
    }

    // แสดงเป็นชั่วโมง ถ้าน้อยกว่า 24 ชั่วโมง
    if (diffHour < 24) {
      return `${diffHour} ชั่วโมงที่แล้ว`;
    }

    // แสดงเป็นวัน ถ้าน้อยกว่า 7 วัน
    if (diffDay < 7) {
      return `${diffDay} วันที่แล้ว`;
    }

    // สำหรับวันที่เก่ากว่า 7 วัน ให้แสดงเป็นวัน/เดือน/ปี
    return date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
    });
  };

  // ฟังก์ชันสำหรับจัดรูปแบบข้อความที่มี @mentions
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

  const renderComment = (
    comment: ExtendedComment,
    index: number,
    isReply = false,
    replyIndex?: number
  ) => {
    // ตรวจสอบว่าผู้ใช้ปัจจุบันเป็นเจ้าของคอมเมนต์หรือไม่
    const isCommentOwner = authUser && authUser._id === comment.authorId?._id;
    const username = comment.authorId?.username || "";

    return (
      <div
        key={comment._id}
        className={cn(
          "flex items-start space-x-2 group",
          isReply && "ml-8 mt-2"
        )}
      >
        <Avatar
          className="h-8 w-8 cursor-pointer flex-shrink-0"
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
                  {formatRelativeTime(comment.createdAt)}
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

              {authUser && (
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
                    confirmDeleteComment(comment._id);
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
      </div>
    );
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // ติดตามการแจ้งเตือนผ่าน CustomEvent
  useEffect(() => {
    if (!authUser || !post?._id) return;

    // สร้างตัวจัดการเหตุการณ์
    const handleNotification = (event: CustomEvent) => {
      const notification = event.detail;

      // ตรวจสอบว่าการแจ้งเตือนเกี่ยวข้องกับโพสต์นี้หรือไม่
      if (notification.payload?.postId === post._id) {
        // แสดง toast ตามประเภทการแจ้งเตือน
        switch (notification.type) {
          case "like":
            toast.info(
              `${
                notification.sourceUser?.username || "ใครบางคน"
              } ถูกใจโพสต์ของคุณ`,
              {
                action: {
                  label: "ดู",
                  onClick: () => {
                    // เมื่อคลิกให้ mark as read
                    markNotificationAsRead(notification._id);
                  },
                },
              }
            );

            // อัพเดทจำนวนไลค์แบบเรียลไทม์
            if (post.likeCount !== undefined) {
              post.likeCount += 1;
            }
            break;

          case "comment":
            toast.info(
              `${
                notification.sourceUser?.username || "ใครบางคน"
              } แสดงความคิดเห็นในโพสต์ของคุณ`,
              {
                description: notification.metadata?.comment
                  ? `"${notification.metadata.comment}"`
                  : "",
                action: {
                  label: "ดู",
                  onClick: () => {
                    // เมื่อคลิกให้ mark as read และแสดงคอมเมนต์
                    markNotificationAsRead(notification._id);
                    // รีเฟรชคอมเมนต์
                    if (post._id) {
                      fetchComments(post._id);
                    }
                  },
                },
              }
            );

            // อัพเดทจำนวนคอมเมนต์โดยไม่ต้อง refresh หน้า
            if (post.commentCount !== undefined) {
              post.commentCount += 1;
            }
            break;
          case "reply":
            // เพิ่ม case รองรับการแจ้งเตือนการตอบกลับ
            const replyAuthor =
              notification.data?.commentAuthorUsername ||
              notification.sourceUser?.username ||
              "ใครบางคน";
            const replyContent = notification.data?.comment || "";
            const parentCommentId = notification.data?.parentCommentId;

            toast.info(`@${replyAuthor} ตอบกลับความคิดเห็นของคุณ`, {
              description: replyContent ? `"${replyContent}"` : "",
              action: {
                label: "ดูการตอบกลับ",
                onClick: () => {
                  // ทำเครื่องหมายว่าอ่านแล้ว
                  markNotificationAsRead(notification._id);

                  // หาตำแหน่งของคอมเมนต์หลักที่มีการตอบกลับ
                  if (parentCommentId) {
                    const parentIndex = postComments.findIndex(
                      (comment) => comment._id === parentCommentId
                    );

                    if (parentIndex !== -1) {
                      // โหลดและแสดงการตอบกลับ
                      loadReplies(parentCommentId, parentIndex);
                    } else {
                      // กรณีไม่พบคอมเมนต์หลัก ให้โหลดคอมเมนต์ทั้งหมดใหม่
                      fetchComments(post._id);
                    }
                  } else {
                    // กรณีไม่มีข้อมูล parentCommentId ให้โหลดคอมเมนต์ทั้งหมดใหม่
                    fetchComments(post._id);
                  }
                },
              },
            });
            break;
        }

        // ทำเครื่องหมายว่าอ่านแล้วหลังแสดง toast
        markNotificationAsRead(notification._id);
      }
    };

    // ลงทะเบียนตัวรับฟังเหตุการณ์
    window.addEventListener(
      "user:notification-received",
      handleNotification as EventListener
    );

    // ทำความสะอาดเมื่อ component unmount
    return () => {
      window.removeEventListener(
        "user:notification-received",
        handleNotification as EventListener
      );
    };
  }, [authUser, post, markNotificationAsRead, fetchComments]);

  // Load comments when post changes
  useEffect(() => {
    if (post && post._id) {
      fetchComments(post._id);
    }
  }, [post, fetchComments]);

  // Check like status when post changes
  useEffect(() => {
    if (post && authUser) {
      checkLikeStatus();
    }
  }, [post, authUser, checkLikeStatus]);

  return (
    <>
      <PostDetailDialog
        isOpen={isOpen}
        onOpenChange={(open) => !open && onClose?.()}
        post={post}
        user={user}
        username={username}
        liked={liked}
        handleLike={handleLike}
        comments={postComments}
        loadingComments={loadingComments}
        commentText={commentText}
        setCommentText={setCommentText}
        handleSubmitComment={handleSubmitComment}
        replyingTo={replyingTo}
        cancelReply={cancelReply}
        handleCommentLike={handleCommentLike}
        handleReply={handleReply}
        toggleReplies={toggleReplies}
        renderComment={renderComment}
        formatDate={formatDate}
        navigateToProfile={navigateToProfile}
      />

      {/* Dialog ยืนยันการลบคอมเมนต์ */}
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
    </>
  );
}

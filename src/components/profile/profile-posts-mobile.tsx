"use client";

import { useState, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, CornerDownRight } from "lucide-react";
import Image from "next/image";
import { ApiPost, User, ExtendedComment } from "@/interfaces/profile.interface";
import { postService } from "@/services/feed/post.service";
import { cn } from "@/lib/utils";

interface MobilePostDetailProps {
  post: ApiPost;
  onClose: () => void;
  username: string;
  profileUser: User;
}

export default function MobilePostDetail({
  post,
  onClose,
  username,
  profileUser,
}: MobilePostDetailProps) {
  const [postComments, setPostComments] = useState<ExtendedComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    username: string;
  } | null>(null);

  const checkLikeStatus = useCallback(async () => {
    try {
      const isLiked = await postService.checkPostLikeStatus(post._id);
      setLiked(isLiked);
    } catch (err) {
      console.error("Error checking like status:", err);
    }
  }, [post._id]);

  // เพิ่มฟังก์ชัน checkLikeStatus เข้าไปใน dependency array
  useEffect(() => {
    if (profileUser) {
      checkLikeStatus();
    }
  }, [profileUser, checkLikeStatus]);

  // จัดการการกดไลค์โพสต์
  const handleLike = async () => {
    if (!profileUser) return;

    try {
      if (!liked) {
        await postService.likePost(post._id);
        post.likeCount = (post.likeCount || 0) + 1;
      } else {
        await postService.unlikePost(post._id);
        post.likeCount = Math.max(0, (post.likeCount || 1) - 1);
      }
      setLiked(!liked);
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  // จัดการการกดไลค์คอมเมนต์
  const handleCommentLike = async (
    commentId: string,
    commentIndex: number,
    replyIndex?: number
  ) => {
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
    }
  };

  // จัดการการกดปุ่มตอบกลับคอมเมนต์
  const handleReply = (commentId: string, username: string) => {
    setReplyingTo({ commentId, username });
    setTimeout(() => {
      const inputElement = document.getElementById("mobile-comment-input");
      if (inputElement) inputElement.focus();
    }, 0);
  };

  // ยกเลิกการตอบกลับ
  const cancelReply = () => {
    setReplyingTo(null);
  };

  // ส่งข้อมูลคอมเมนต์หรือการตอบกลับ
  const handleSubmitComment = async () => {
    if (!commentText.trim() || !profileUser) return;

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

      await postService.createComment(payload);
      setCommentText("");
      setReplyingTo(null);
      post.commentCount = (post.commentCount || 0) + 1;
      fetchComments(post._id);
    } catch (err) {
      console.error("Error posting comment:", err);
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

    // สำหรับวันที่เก่ากว่า 7 วัน ให้แสดงเป็นวัน/เดือน/ปี แบบสั้น
    return date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
    });
  };

  // เพิ่มฟังก์ชันแสดงคอมเมนต์ที่รองรับการตอบกลับ
  const renderComment = (
    comment: ExtendedComment,
    index: number,
    isReply = false,
    replyIndex?: number
  ) => (
    <div key={comment._id} className={cn("flex gap-2 mb-2", isReply && "ml-5")}>
      <Avatar className="h-8 w-8">
        <AvatarImage
          src={comment.authorId?.profile?.avatarUrl || "/placeholder.svg"}
          alt={comment.authorId?.username || "User"}
        />
        <AvatarFallback>
          {comment.authorId?.username?.charAt(0) || "U"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="bg-muted/50 rounded-2xl px-3 py-2">
          <div className="flex justify-between items-center">
            <p className="font-medium text-sm">
              {comment.authorId?.username || "Anonymous"}
            </p>
            <div className="flex items-center gap-2">
              {/* เปลี่ยนจาก formatDate เป็น formatRelativeTime */}
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(comment.createdAt)}
              </p>
              {profileUser && (
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
              )}
            </div>
          </div>
          <p className="text-sm">{comment.content}</p>

          {/* แสดงจำนวนไลค์และปุ่มตอบกลับ */}
          <div className="flex items-center gap-3 mt-1">
            {comment.likeCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {comment.likeCount} คนถูกใจสิ่งนี้
              </p>
            )}

            {!isReply && profileUser && (
              <button
                onClick={() =>
                  handleReply(comment._id, comment.authorId?.username || "")
                }
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

  // เพิ่มฟังก์ชัน fetchComments
  const fetchComments = useCallback(
    async (postId: string) => {
      if (!postId) return;

      try {
        setLoadingComments(true);
        let comments = await postService.getPostComments(postId);

        // กรองเอาแต่คอมเมนต์หลักที่ไม่มี parentCommentId
        comments = comments.filter((comment) => !comment.parentCommentId);

        // ตรวจสอบสถานะไลค์สำหรับแต่ละคอมเมนต์
        if (profileUser && comments.length > 0) {
          comments = await postService.checkCommentsLikeStatus(comments);
        }

        setPostComments(comments);
      } catch (err) {
        console.error("Error fetching comments:", err);
        setPostComments([]);
      } finally {
        setLoadingComments(false);
      }
    },
    [profileUser]
  );

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
      if (profileUser && replies.length > 0) {
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

  // เพิ่ม useEffect เพื่อโหลดคอมเมนต์เมื่อเปิดโพสต์
  useEffect(() => {
    if (post && post._id) {
      fetchComments(post._id);
    }
  }, [post, fetchComments]);

  // Function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Check if this is a text post
  const isTextPost =
    !post.media?.length || post.media.every((media) => media.type === "text");

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClose}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Button>
        <h2 className="font-semibold text-center">Post</h2>
        <div className="w-8"></div> {/* Spacer for alignment */}
      </div>

      {/* Post Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Post Header */}
        <div className="p-3 flex items-center">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage
              src={profileUser?.profile?.avatarUrl || "/placeholder.svg"}
              alt={profileUser?.profile?.name || username}
            />
            <AvatarFallback>{username.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{username}</p>
            <p className="text-xs text-muted-foreground">Bangkok, Thailand</p>
          </div>
        </div>

        {/* Post Image - only show for image/video posts */}
        {!isTextPost && (
          <div className="w-full aspect-square bg-black relative">
            <Image
              src={post.media[0]?.url || "/placeholder.svg"}
              alt={`Post ${post._id}`}
              fill
              sizes="100vw"
              className="object-contain"
              placeholder="blur"
              blurDataURL="/placeholder.svg"
            />
          </div>
        )}

        {/* Post Actions */}
        <div className="p-3">
          <div className="flex items-center gap-4 mb-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 p-0", liked && "text-red-500")}
              onClick={handleLike}
              disabled={!profileUser}
            >
              <Heart
                className={cn("h-6 w-6", liked && "fill-current text-red-500")}
              />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
              <MessageCircle className="h-6 w-6" />
            </Button>
          </div>
          <p className="font-semibold text-sm">{post.likeCount} likes</p>
          <p className="text-xs text-muted-foreground mb-3">
            {formatDate(post.createdAt)}
          </p>

          {/* Caption */}
          <div className={`flex gap-2 mb-4 ${isTextPost ? "text-lg" : ""}`}>
            <p className={isTextPost ? "text-base" : "text-sm"}>
              <span className="font-semibold mr-2">{username}</span>
              {post.content}
            </p>
          </div>

          {/* Comments */}
          <div className="space-y-4 mt-4">
            {loadingComments ? (
              <p className="text-sm text-muted-foreground text-center py-2">
                Loading comments...
              </p>
            ) : postComments.length > 0 ? (
              postComments.map((comment, index) =>
                renderComment(comment, index)
              )
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Comment Input */}
      <div className="border-t p-3">
        {profileUser && (
          <>
            {replyingTo && (
              <div className="flex justify-between items-center px-2 py-1 mb-2 bg-muted/30 rounded-t-lg text-xs text-muted-foreground">
                <p>
                  กำลังตอบกลับ{" "}
                  <span className="font-medium">@{replyingTo.username}</span>
                </p>
                <button
                  onClick={cancelReply}
                  className="text-xs hover:text-destructive"
                >
                  ยกเลิก
                </button>
              </div>
            )}
            <div className="flex items-center">
              <Input
                id="mobile-comment-input"
                type="text"
                placeholder={
                  replyingTo
                    ? `ตอบกลับ @${replyingTo.username}...`
                    : "เพิ่มความคิดเห็น..."
                }
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm"
              />
              <Button
                variant="ghost"
                className="text-primary text-sm font-semibold"
                onClick={handleSubmitComment}
                disabled={!commentText.trim()}
              >
                Post
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

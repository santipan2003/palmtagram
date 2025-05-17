"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Tabs } from "@/components/ui/tabs";
import { BookmarkIcon, UserIcon, Heart, CornerDownRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { useMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { ApiPost, User, ExtendedComment } from "@/interfaces/profile.interface";
import { postService } from "@/services/post.service";
import MobilePostDetail from "../post/post-detail-mobile";
import { ProfileTabList } from "./profile-tablist";
import { ProfilePostsTab } from "./profile-tab-posts";
import { ProfileThreadsTab } from "./profile-tab-threads";
import { ProfileEmptyTab } from "./profile-tab-empty";
import { PostDetailDialog } from "../post/post-detail";

interface ProfilePostsProps {
  posts: ApiPost[];
  user: User;
  username: string;
  initialPostId?: string;
}

export default function ProfilePosts({
  posts,
  username,
  user,
  initialPostId,
}: ProfilePostsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedPost, setSelectedPost] = useState<ApiPost | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isMobile = useMobile();
  const [postComments, setPostComments] = useState<ExtendedComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  // เพิ่ม state ที่จำเป็น
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    username: string;
  } | null>(null);

  // ตรวจสอบว่าผู้ใช้ไลค์โพสต์นี้แล้วหรือยัง
  const checkLikeStatus = useCallback(async () => {
    if (!selectedPost) return;

    try {
      const isLiked = await postService.checkPostLikeStatus(selectedPost._id);
      setLiked(isLiked);
    } catch (err) {
      console.error("Error checking like status:", err);
    }
  }, [selectedPost]);

  // ตรวจสอบสถานะไลค์เมื่อเลือกโพสต์
  useEffect(() => {
    if (selectedPost && user) {
      checkLikeStatus();
    }
  }, [selectedPost, user, checkLikeStatus]);

  // จัดการการกดไลค์โพสต์
  const handleLike = async () => {
    if (!selectedPost || !user) return;

    try {
      if (!liked) {
        // กดไลค์
        await postService.likePost(selectedPost._id);
        setSelectedPost((prev) =>
          prev
            ? {
                ...prev,
                likeCount: (prev.likeCount || 0) + 1,
              }
            : null
        );
      } else {
        // ยกเลิกไลค์
        await postService.unlikePost(selectedPost._id);
        setSelectedPost((prev) =>
          prev
            ? {
                ...prev,
                likeCount: Math.max(0, (prev.likeCount || 1) - 1),
              }
            : null
        );
      }

      // สลับสถานะไลค์
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
    if (!user) return;

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
    // โฟกัสช่องข้อความ
    setTimeout(() => {
      const inputElement = document.getElementById(
        isMobile ? "mobile-comment-input" : "desktop-comment-input"
      );
      if (inputElement) inputElement.focus();
    }, 0);
  };

  // ยกเลิกการตอบกลับ
  const cancelReply = () => {
    setReplyingTo(null);
  };

  // แก้ไขส่วน fetchComments
  const fetchComments = useCallback(
    async (postId: string) => {
      if (!postId) return;

      try {
        setLoadingComments(true);

        // ดึงคอมเมนต์และข้อมูลไลค์
        let comments = await postService.getPostComments(postId);

        // กรองเอาแต่คอมเมนต์หลักที่ไม่มี parentCommentId
        comments = comments.filter((comment) => !comment.parentCommentId);

        // ตรวจสอบสถานะไลค์สำหรับแต่ละคอมเมนต์ถ้าผู้ใช้ล็อกอิน
        if (user && comments.length > 0) {
          comments = await postService.checkCommentsLikeStatus(comments);
        }

        setPostComments(comments as ExtendedComment[]);
      } catch (err) {
        console.error("Error fetching comments:", err);
        setPostComments([]);
      } finally {
        setLoadingComments(false);
      }
    },
    [user]
  );

  // ส่งข้อมูลคอมเมนต์หรือการตอบกลับไปยัง API
  const handleSubmitComment = async () => {
    if (!commentText.trim() || !user || !selectedPost) return;

    try {
      const payload = replyingTo
        ? {
            content: commentText,
            postId: selectedPost._id,
            parentCommentId: replyingTo.commentId,
          }
        : {
            content: commentText,
            postId: selectedPost._id,
          };

      // สร้างคอมเมนต์หรือตอบกลับ
      await postService.createComment(payload);

      // ล้างข้อความและการตอบกลับ
      setCommentText("");
      setReplyingTo(null);

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
      }

      // อัพเดตจำนวนคอมเมนต์ของโพสต์
      setSelectedPost((prev) =>
        prev
          ? {
              ...prev,
              commentCount: (prev.commentCount || 0) + 1,
            }
          : null
      );

      // ดึงข้อมูลคอมเมนต์ใหม่
      if (!replyingTo) {
        fetchComments(selectedPost._id);
      }
    } catch (err) {
      console.error("Error posting comment:", err);
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
      if (user && replies.length > 0) {
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

  // Fetch comments when a post is selected
  useEffect(() => {
    if (selectedPost && selectedPost._id) {
      fetchComments(selectedPost._id);
    } else {
      setPostComments([]);
    }
  }, [selectedPost, fetchComments]);

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

  const renderComment = (
    comment: ExtendedComment,
    index: number,
    isReply = false,
    replyIndex?: number
  ) => (
    <div
      key={comment._id}
      className={cn("flex gap-2", isReply ? "mb-1" : "mb-3")}
    >
      <Avatar className="h-8 w-8 flex-shrink-0">
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
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(comment.createdAt)}
              </p>
              {user && (
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

          <div className="flex items-center gap-3 mt-1">
            {comment.likeCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {comment.likeCount} คนถูกใจสิ่งนี้
              </p>
            )}

            {!isReply && user && (
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

        {/* ปุ่มดูการตอบกลับ */}
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

        {/* กล่องแสดงการตอบกลับที่มีเส้นเชื่อมด้านข้าง */}
        {!isReply && comment.showReplies && (
          <div className="mt-1 relative pl-4 border-l-2 border-muted ml-4">
            {comment.isLoading ? (
              <p className="text-xs text-muted-foreground py-2">
                กำลังโหลดการตอบกลับ...
              </p>
            ) : (
              comment.replies?.map((reply, rIndex) => (
                <div key={reply._id} className={rIndex !== 0 ? "mt-1" : ""}>
                  {renderComment(reply, index, true, rIndex)}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Filter posts by media type
  const imagePosts = posts.filter(
    (post) =>
      post.media &&
      post.media.some(
        (media) => media.type === "image" || media.type === "video"
      )
  );

  const textPosts = posts.filter(
    (post) =>
      !post.media?.length || post.media.every((media) => media.type === "text")
  );

  // Function to find post by ID
  const findPostById = useCallback(
    (postId: string) => {
      return posts.find((p) => p._id === postId) || null;
    },
    [posts]
  );

  // Handle initial post ID on mount
  useEffect(() => {
    if (initialPostId) {
      const post = findPostById(initialPostId);
      if (post) {
        setSelectedPost(post);
        if (!isMobile) {
          setIsDialogOpen(true);
        }
      }
    }
  }, [initialPostId, findPostById, isMobile]);

  // Update URL pattern handling
  useEffect(() => {
    // Updated regex to match new URL pattern /post/{postId}
    const postIdMatch = pathname.match(/\/post\/([^/]+)/);

    if (postIdMatch) {
      const postId = postIdMatch[1];
      const post = findPostById(postId);

      if (post) {
        setSelectedPost(post);
        // Only open dialog on desktop
        if (!isMobile) {
          setIsDialogOpen(true);
        }
      }
    } else {
      // Close dialog when not on a post URL
      setIsDialogOpen(false);
      setSelectedPost(null);
    }
  }, [pathname, findPostById, isMobile]);

  // Function to open post details
  const openPostDetails = (post: ApiPost) => {
    if (isMobile) {
      // On mobile, navigate to post detail page using just post._id
      router.push(`/post/${post._id}`);
    } else {
      // On desktop, navigate to URL (which will trigger modal via useEffect)
      router.push(`/post/${post._id}`, { scroll: false });
    }
  };

  // Function to close post details
  const closePostDetails = () => {
    setIsDialogOpen(false);
    setSelectedPost(null);
    // Go back to profile page with username
    router.push(`/${username}`, { scroll: false });
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Function to format date in a more readable format for thread posts
  const formatThreadDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // If we're on a mobile post detail page, don't render the posts grid
  if (isMobile && selectedPost && pathname.includes(`/post/`)) {
    return (
      <MobilePostDetail
        post={selectedPost}
        onClose={closePostDetails}
        username={username}
        profileUser={user}
      />
    );
  }

  return (
    <>
      <Tabs defaultValue="posts" className="w-full">
        <ProfileTabList />

        <ProfilePostsTab posts={imagePosts} onPostClick={openPostDetails} />

        <ProfileThreadsTab
          posts={textPosts}
          username={username}
          user={user}
          onPostClick={openPostDetails}
          formatThreadDate={formatThreadDate}
        />

        <ProfileEmptyTab
          tabValue="saved"
          icon={BookmarkIcon}
          title="No Saved Posts Yet"
          description="Save posts to revisit them later. They'll appear here for easy access."
        />

        <ProfileEmptyTab
          tabValue="tagged"
          icon={UserIcon}
          title="No Tagged Posts"
          description="When you're tagged in posts, they'll show up here for you to explore."
        />
      </Tabs>

      {/* Post Detail Modal - แก้ไขปุ่มไลค์และเพิ่มฟอร์มคอมเมนต์ */}
      {!isMobile && (
        <PostDetailDialog
          isOpen={isDialogOpen}
          onOpenChange={(open) => !open && closePostDetails()}
          post={selectedPost}
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
        />
      )}
    </>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Grid,
  BookmarkIcon,
  UserIcon,
  Heart,
  MessageCircle,
  CalendarIcon,
  CornerDownRight,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ApiPost, User, ExtendedComment } from "@/interfaces/profile.interface";
import { postService } from "@/services/feed/post.service";
import MobilePostDetail from "./profile-posts-mobile";

interface ProfilePostsProps {
  posts: ApiPost[];
  user: User;
  username: string;
}

export default function ProfilePosts({
  posts,
  username,
  user,
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

  // Handle URL-based navigation
  useEffect(() => {
    // Updated regex to match new URL pattern /{username}/post/{postId}
    const postIdMatch = pathname.match(new RegExp(`/${username}/post/([^/]+)`));

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
  }, [pathname, findPostById, isMobile, username]);

  // Function to open post details
  const openPostDetails = (post: ApiPost) => {
    if (isMobile) {
      // On mobile, navigate to post detail page using actual post._id
      router.push(`/${username}/post/${post._id}`);
    } else {
      // On desktop, navigate to URL (which will trigger modal via useEffect)
      router.push(`/${username}/post/${post._id}`, { scroll: false });
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
  if (isMobile && selectedPost && pathname.includes(`/${username}/post/`)) {
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
        <TabsList className="w-full grid grid-cols-4 h-14 bg-gradient-to-b from-background to-background/80 border-t border-b border-muted/30 backdrop-blur-sm">
          <TabsTrigger
            value="posts"
            className="relative flex items-center justify-center h-full text-sm font-medium transition-all duration-300 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground hover:bg-muted/20 rounded-none"
          >
            <Grid className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Posts</span>
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-purple-500"
              initial={false}
              animate={{ scaleX: 0 }}
              transition={{ duration: 0.3 }}
              data-state-active="scaleX: 1"
            />
          </TabsTrigger>
          <TabsTrigger
            value="thread"
            className="relative flex items-center justify-center h-full text-sm font-medium transition-all duration-300 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground hover:bg-muted/20 rounded-none"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Thread</span>
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-purple-500"
              initial={false}
              animate={{ scaleX: 0 }}
              transition={{ duration: 0.3 }}
              data-state-active="scaleX: 1"
            />
          </TabsTrigger>
          <TabsTrigger
            value="saved"
            className="relative flex items-center justify-center h-full text-sm font-medium transition-all duration-300 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground hover:bg-muted/20 rounded-none"
          >
            <BookmarkIcon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Saved</span>
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-purple-500"
              initial={false}
              animate={{ scaleX: 0 }}
              transition={{ duration: 0.3 }}
              data-state-active="scaleX: 1"
            />
          </TabsTrigger>
          <TabsTrigger
            value="tagged"
            className="relative flex items-center justify-center h-full text-sm font-medium transition-all duration-300 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground hover:bg-muted/20 rounded-none"
          >
            <UserIcon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Tagged</span>
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-purple-500"
              initial={false}
              animate={{ scaleX: 0 }}
              transition={{ duration: 0.3 }}
              data-state-active="scaleX: 1"
            />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          {imagePosts.length > 0 ? (
            <motion.div
              className="grid grid-cols-3 gap-1 md:gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {imagePosts.map((post) => (
                <motion.div
                  key={post._id}
                  className="relative pb-[100%] aspect-square"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  layout
                >
                  <Card
                    className="w-full h-full absolute inset-0 overflow-hidden border-0 rounded-sm cursor-pointer"
                    onClick={() => openPostDetails(post)}
                  >
                    {/* grid image */}
                    <div className="h-full w-full">
                      <Image
                        src={post.media[0]?.url || "/placeholder.svg"}
                        alt={`Post ${post.media[0]?.type}`}
                        fill
                        sizes="(max-width: 640px) 50vw, 33vw"
                        className="object-cover"
                        placeholder="blur"
                        blurDataURL="/placeholder.svg"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                      <div className="flex gap-4 text-white">
                        <div className="flex items-center gap-1">
                          <Heart className="h-5 w-5" />
                          <span className="font-semibold">
                            {post.likeCount}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-5 w-5" />
                          <span className="font-semibold">
                            {post.commentCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              className="text-center py-16 bg-muted/50 rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Grid className="h-12 w-12 mx-auto text-muted-foreground/70" />
              <h3 className="mt-4 text-xl font-semibold text-foreground">
                No Image or Video Posts Yet
              </h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                When you share photos or videos, they&apos;ll appear here.
              </p>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="thread" className="mt-6">
          {textPosts.length > 0 ? (
            <motion.div
              className="flex flex-col gap-4 w-full max-w-[100%] md:w-full mx-auto px-3 md:px-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {textPosts.map((post) => (
                <motion.div
                  key={post._id}
                  className="border rounded-lg p-3 md:p-4 hover:bg-muted/30 transition-colors duration-200 cursor-pointer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ y: -2 }}
                  onClick={() => openPostDetails(post)}
                >
                  <div className="flex items-start gap-2 md:gap-3">
                    <Avatar className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
                      <AvatarImage
                        src={user?.profile?.avatarUrl || "/placeholder.svg"}
                        alt={user?.profile?.name}
                      />
                      <AvatarFallback>{username.charAt(0)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <p className="font-semibold text-sm md:text-base">
                          {username}
                        </p>
                        <span className="text-muted-foreground text-xs md:text-sm">
                          @{username}
                        </span>
                        <span className="hidden xs:inline text-muted-foreground text-xs">
                          •
                        </span>
                        <span className="text-muted-foreground text-xs w-full xs:w-auto">
                          {formatThreadDate(post.createdAt)}
                        </span>
                      </div>

                      <p className="mt-1 md:mt-2 text-sm md:text-base break-words">
                        {post.content}
                      </p>

                      <div className="flex items-center gap-4 md:gap-6 mt-2 md:mt-3">
                        <div className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                          <MessageCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          <span className="text-xs md:text-sm">
                            {post.commentCount}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground hover:text-rose-500 transition-colors">
                          <Heart className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          <span className="text-xs md:text-sm">
                            {post.likeCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              className="text-center py-12 md:py-16 bg-muted/50 rounded-lg mx-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <CalendarIcon className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground/70" />
              <h3 className="mt-3 md:mt-4 text-lg md:text-xl font-semibold text-foreground">
                No Thread Posts Yet
              </h3>
              <p className="mt-1 md:mt-2 text-xs md:text-sm text-muted-foreground max-w-md mx-auto px-4">
                When you share text posts or threads, they&apos;ll appear here.
              </p>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="saved" className="mt-6">
          <motion.div
            className="text-center py-16 bg-muted/50 rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <BookmarkIcon className="h-12 w-12 mx-auto text-muted-foreground/70" />
            <h3 className="mt-4 text-xl font-semibold text-foreground">
              No Saved Posts Yet
            </h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              Save posts to revisit them later. They&apos;ll appear here for
              easy access.
            </p>
          </motion.div>
        </TabsContent>

        <TabsContent value="tagged" className="mt-6">
          <motion.div
            className="text-center py-16 bg-muted/50 rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <UserIcon className="h-12 w-12 mx-auto text-muted-foreground/70" />
            <h3 className="mt-4 text-xl font-semibold text-foreground">
              No Tagged Posts
            </h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              When you&apos;re tagged in posts, they&apos;ll show up here for
              you to explore.
            </p>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Post Detail Modal - แก้ไขปุ่มไลค์และเพิ่มฟอร์มคอมเมนต์ */}
      {!isMobile && (
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => !open && closePostDetails()}
        >
          <DialogContent className="sm:max-w-6xl p-0 overflow-hidden max-h-[90vh] w-[95vw] md:w-full">
            <DialogTitle className="sr-only">
              {selectedPost ? `Post by ${username}` : "Post Details"}
            </DialogTitle>

            <div className="flex flex-col md:flex-row h-full">
              {/* Post Image - show only for image/video posts */}
              {selectedPost &&
                selectedPost.media &&
                selectedPost.media[0]?.type !== "text" && (
                  <div className="md:w-[60%] bg-black flex items-center justify-center">
                    <motion.img
                      src={selectedPost.media[0]?.url || "/placeholder.svg"}
                      alt={`Post ${selectedPost._id}`}
                      className="max-h-[50vh] md:max-h-[70vh] w-full object-contain"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}

              {/* Post Details */}
              <div
                className={`${
                  selectedPost &&
                  selectedPost.media &&
                  selectedPost.media[0]?.type !== "text"
                    ? "md:w-[40%]"
                    : "w-full"
                } flex flex-col h-full max-h-[50vh] md:max-h-[70vh]`}
              >
                {/* Header */}
                <motion.div
                  className="p-4 flex items-center border-b"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage
                      src={user?.profile?.avatarUrl || "/placeholder.svg"}
                      alt={user?.profile?.name}
                    />
                    <AvatarFallback>
                      {" "}
                      {user?.profile?.name ? user.profile.name.charAt(0) : ""}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{username}</p>
                    <p className="text-xs text-muted-foreground">
                      Bangkok, Thailand
                    </p>
                  </div>
                </motion.div>

                {/* Comments Section */}
                <div className="flex-1 overflow-y-auto p-4">
                  {selectedPost && (
                    <motion.div
                      className="flex gap-2 mb-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={user?.profile?.avatarUrl || "/placeholder.svg"}
                          alt={user?.profile?.name}
                        />
                        <AvatarFallback>
                          {user?.profile?.name
                            ? user.profile.name.charAt(0)
                            : ""}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm">
                          <span className="font-semibold mr-2">{username}</span>
                          {selectedPost.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(selectedPost.createdAt)}
                        </p>
                      </div>
                    </motion.div>
                  )}

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

                {/* Actions */}
                <motion.div
                  className="border-t p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-4 mb-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("h-8 w-8 p-0", liked && "text-red-500")}
                      onClick={handleLike}
                      disabled={!user}
                    >
                      <Heart
                        className={cn(
                          "h-6 w-6",
                          liked && "fill-current text-red-500"
                        )}
                      />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                      <MessageCircle className="h-6 w-6" />
                    </Button>
                  </div>
                  {selectedPost && (
                    <p className="font-semibold text-sm">
                      {selectedPost.likeCount} likes
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {selectedPost ? formatDate(selectedPost.createdAt) : ""}
                  </p>
                </motion.div>

                {/* Comment input */}
                <motion.div
                  className="border-t p-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {user && (
                    <>
                      {replyingTo && (
                        <div className="flex justify-between items-center px-2 py-1 mb-2 bg-muted/30 rounded-t-lg text-xs text-muted-foreground">
                          <p>
                            กำลังตอบกลับ{" "}
                            <span className="font-medium">
                              @{replyingTo.username}
                            </span>
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
                          id="desktop-comment-input"
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
                </motion.div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

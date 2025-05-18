"use client";

import { useState, useEffect, useCallback } from "react";
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
  Bookmark,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { ApiPost, ExtendedComment } from "@/interfaces/feed.interface";
import { postService } from "@/services/post.service";
import { useRouter } from "next/navigation";
import PostCardComment from "./feed-comment";
import { toast } from "sonner";
import { useSocketContext } from "@/contexts/SocketContext";

export default function PostCard({ post }: { post: ApiPost }) {
  const router = useRouter();
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [comments, setComments] = useState<ExtendedComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    username: string;
  } | null>(null);

  const { user } = useAuth();

  const { markNotificationAsRead } = useSocketContext();

  // เพิ่มฟังก์ชันนำทางไปยังหน้าโปรไฟล์
  const navigateToProfile = (username: string) => {
    if (username) {
      router.push(`/${username}`);
    }
  };

  // 2. แปลงเป็น useCallback พร้อมระบุ dependency
  const checkLikeStatus = useCallback(async () => {
    try {
      const isLiked = await postService.checkPostLikeStatus(post._id);
      setLiked(isLiked);
    } catch (err) {
      console.error("Error checking like status:", err);
    }
  }, [post._id]); // เพิ่ม post._id เป็น dependency

  // 3. เพิ่ม checkLikeStatus เข้าไปใน dependency array
  useEffect(() => {
    if (user) {
      checkLikeStatus();
    }
  }, [user, checkLikeStatus]); // เพิ่ม checkLikeStatus ใน dependency array

  // จัดการการกดไลค์โพสต์
  const handleLike = async () => {
    if (!user) return;

    try {
      if (!liked) {
        // กดไลค์
        await postService.likePost(post._id);
        setLikeCount((prevCount) => prevCount + 1);
      } else {
        // ยกเลิกไลค์
        await postService.unlikePost(post._id);
        setLikeCount((prevCount) => prevCount - 1);
      }

      // สลับสถานะไลค์
      setLiked(!liked);
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  // จัดการการกดไลค์คอมเมนต์หรือตอบกลับ
  const handleCommentLike = async (
    commentId: string,
    commentIndex: number,
    replyIndex?: number
  ) => {
    if (!user) return;

    try {
      const updatedComments = [...comments];

      // กรณีเป็นการไลค์ reply
      if (replyIndex !== undefined && updatedComments[commentIndex].replies) {
        const reply = updatedComments[commentIndex].replies![replyIndex];
        const isLiked = reply.isLiked || false;

        if (!isLiked) {
          // กดไลค์ reply
          await postService.likeComment(reply._id);

          // อัพเดทสถานะและจำนวนไลค์แบบ optimistic
          updatedComments[commentIndex].replies![replyIndex] = {
            ...reply,
            isLiked: true,
            likeCount: (reply.likeCount || 0) + 1,
          };
        } else {
          // ยกเลิกไลค์ reply
          await postService.unlikeComment(reply._id);

          // อัพเดทสถานะและจำนวนไลค์แบบ optimistic
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
          // กดไลค์คอมเมนต์
          await postService.likeComment(commentId);

          // อัพเดทสถานะและจำนวนไลค์แบบ optimistic
          updatedComments[commentIndex] = {
            ...comment,
            isLiked: true,
            likeCount: (comment.likeCount || 0) + 1,
          };
        } else {
          // ยกเลิกไลค์คอมเมนต์
          await postService.unlikeComment(commentId);

          // อัพเดทสถานะและจำนวนไลค์แบบ optimistic
          updatedComments[commentIndex] = {
            ...comment,
            isLiked: false,
            likeCount: Math.max(0, (comment.likeCount || 1) - 1),
          };
        }
      }

      setComments(updatedComments);
    } catch (err) {
      console.error("Error toggling comment like:", err);
    }
  };

  // จัดการการกดปุ่มตอบกลับคอมเมนต์
  const handleReply = (commentId: string, username: string) => {
    console.log(`Replying to ${username} (Comment ID: ${commentId})`);
    setReplyingTo({ commentId, username });

    // โฟกัสช่องข้อความโดยใช้ ID เฉพาะของโพสต์นี้
    setTimeout(() => {
      const inputElement = document.getElementById(`comment-input-${post._id}`);
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
  };

  // โหลดการตอบกลับของคอมเมนต์
  const loadReplies = async (commentId: string, index: number) => {
    try {
      // Set loading state for this comment
      const updatedComments = [...comments];
      updatedComments[index] = {
        ...updatedComments[index],
        isLoading: true,
        showReplies: true,
      };
      setComments(updatedComments);

      // Fetch replies
      let replies = await postService.getCommentReplies(commentId);

      // ตรวจสอบสถานะไลค์สำหรับแต่ละการตอบกลับถ้าผู้ใช้ล็อกอิน
      if (user && replies.length > 0) {
        replies = await postService.checkCommentsLikeStatus(replies);
      }

      // Update the comments with replies
      const finalUpdatedComments = [...comments];
      finalUpdatedComments[index] = {
        ...finalUpdatedComments[index],
        replies,
        isLoading: false,
        showReplies: true,
      };

      setComments(finalUpdatedComments);
    } catch (err) {
      console.error("Error loading replies:", err);

      // Reset loading state
      const updatedComments = [...comments];
      updatedComments[index] = {
        ...updatedComments[index],
        isLoading: false,
        showReplies: false,
      };
      setComments(updatedComments);
    }
  };

  // สลับการแสดง/ซ่อนการตอบกลับ
  const toggleReplies = (index: number) => {
    const comment = comments[index];
    const updatedComments = [...comments];

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
    setComments(updatedComments);
  };

  // สร้างฟังก์ชันสำหรับจัดรูปแบบวันที่ (ไม่ใช้ date-fns)
  const formatPostDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // น้อยกว่า 1 นาที
    if (diffInSeconds < 60) {
      return "เมื่อสักครู่";
    }

    // น้อยกว่า 1 ชั่วโมง
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} นาทีที่แล้ว`;
    }

    // น้อยกว่า 24 ชั่วโมง
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ชั่วโมงที่แล้ว`;
    }

    // น้อยกว่า 7 วัน
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} วันที่แล้ว`;
    }

    // มากกว่า 7 วัน แสดงวันที่
    const thaiMonths = [
      "ม.ค.",
      "ก.พ.",
      "มี.ค.",
      "เม.ย.",
      "พ.ค.",
      "มิ.ย.",
      "ก.ค.",
      "ส.ค.",
      "ก.ย.",
      "ต.ค.",
      "พ.ย.",
      "ธ.ค.",
    ];

    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year =
      date.getFullYear() === now.getFullYear()
        ? ""
        : ` ${date.getFullYear() + 543}`;

    return `${day} ${month}${year}`;
  };

  // ดึงข้อมูล comments จาก API
  const fetchComments = async (toggleVisibility = true) => {
    try {
      setLoading(true);

      // ดึงคอมเมนต์ทั้งหมด
      let postComments = await postService.getPostComments(post._id);

      // กรองเอาแต่คอมเมนต์หลักที่ไม่มี parentCommentId
      postComments = postComments.filter(
        (comment: ExtendedComment) => !comment.parentCommentId
      );

      // เรียงคอมเมนต์จากเก่าไปใหม่ (คอมเมนต์เก่าอยู่บน)
      postComments.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      // ตรวจสอบสถานะไลค์สำหรับแต่ละคอมเมนต์ถ้าผู้ใช้ล็อกอิน
      if (user && postComments.length > 0) {
        postComments = await postService.checkCommentsLikeStatus(postComments);
      }

      setComments(postComments);
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setLoading(false);
    }

    // เปลี่ยนการแสดงคอมเมนต์เฉพาะเมื่อต้องการ toggle
    if (toggleVisibility) {
      setShowComments(!showComments);
    }
  };

  // เพิ่ม useEffect เพื่อติดตาม notification

  // ติดตามการแจ้งเตือนผ่าน CustomEvent
  useEffect(() => {
    if (!user || !post._id) return;

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
            setLikeCount((prevCount) => prevCount + 1);
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
                    setShowComments(true);
                    fetchComments(false);
                  },
                },
              }
            );

            // อัพเดทจำนวนคอมเมนต์โดยไม่ต้อง refresh หน้า
            post.commentCount = (post.commentCount || 0) + 1;
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
  }, [
    user,
    post._id,
    markNotificationAsRead,
    comments,
    loadReplies,
    fetchComments,
  ]);

  // ส่งข้อมูล comment หรือ reply ไปยัง API
  const handleSubmitComment = async () => {
    if (!commentText.trim() || !user) return;

    try {
      // เพิ่มการบันทึก parentCommentId ที่ถูกต้อง
      // โดยไม่ว่าจะตอบกลับ comment หลักหรือ reply ก็จะใช้ parentCommentId เดียวกัน
      const payload = replyingTo
        ? {
            content: commentText, // คงข้อความที่มี @mention ไว้
            postId: post._id,
            parentCommentId: replyingTo.commentId,
          }
        : {
            content: commentText,
            postId: post._id,
          };

      console.log("Sending comment payload:", payload);

      // สร้างคอมเมนต์หรือตอบกลับ
      const newComment = await postService.createComment(payload);
      console.log("Comment created:", newComment);

      // ล้างข้อความและการตอบกลับ
      setCommentText("");
      setReplyingTo(null);

      // ตรวจสอบว่าผู้คอมเมนต์ไม่ใช่เจ้าของโพสต์
      const isCommentingOwnPost = user._id === post.authorId?._id;

      // แสดง toast ยืนยันการคอมเมนต์
      if (!isCommentingOwnPost) {
        toast.success("ส่งความคิดเห็นสำเร็จ", {
          description: replyingTo
            ? `คุณได้ตอบกลับความคิดเห็นของ @${replyingTo.username}`
            : `คุณได้แสดงความคิดเห็นในโพสต์ของ @${
                post.authorId?.username || "ผู้ใช้"
              }`,
        });
      } else {
        // กรณีคอมเมนต์โพสต์ตัวเอง
        toast.success("ส่งความคิดเห็นสำเร็จ");
      }

      if (replyingTo) {
        // หาคอมเมนต์หลักที่จะเพิ่มการตอบกลับเข้าไป
        const commentIndex = comments.findIndex(
          (c) => c._id === replyingTo.commentId
        );

        if (commentIndex > -1) {
          // เพิ่ม replyCount
          const updatedComments = [...comments];
          updatedComments[commentIndex] = {
            ...updatedComments[commentIndex],
            replyCount: (updatedComments[commentIndex].replyCount || 0) + 1,
          };

          // ถ้าการตอบกลับยังแสดงอยู่ ให้โหลดใหม่เพื่อแสดงการตอบกลับที่เพิ่งสร้าง
          if (updatedComments[commentIndex].showReplies) {
            loadReplies(replyingTo.commentId, commentIndex);
          }

          setComments(updatedComments);
        }
      } else {
        // กรณีคอมเมนต์หลัก - อัพเดตจำนวนคอมเมนต์ของโพสต์
        post.commentCount = (post.commentCount || 0) + 1;
      }

      // แสดงคอมเมนต์ถ้ายังไม่ได้แสดง
      if (!showComments) {
        setShowComments(true);
        // รอให้ UI อัพเดต
        setTimeout(() => {
          fetchComments(false); // ดึงข้อมูลคอมเมนต์ใหม่โดยไม่สลับสถานะการแสดง
        }, 100);
      } else if (!replyingTo) {
        // ดึงข้อมูลคอมเมนต์หลักใหม่ทันทีถ้าเป็นคอมเมนต์หลัก
        fetchComments(false);
      }
    } catch (err) {
      console.error("Error posting comment:", err);
      toast.error("ไม่สามารถส่งความคิดเห็นได้", {
        description: "กรุณาลองใหม่อีกครั้ง",
      });
    }
  };

  // จัดการเมื่อคอมเมนต์ถูกลบ
  const handleCommentDeleted = (
    commentId: string,
    isReply: boolean,
    parentIndex?: number
  ) => {
    if (isReply && parentIndex !== undefined) {
      // กรณีเป็นการลบการตอบกลับ
      const updatedComments = [...comments];
      const parentComment = updatedComments[parentIndex];

      if (parentComment.replies) {
        // ลบการตอบกลับออกจาก replies array
        parentComment.replies = parentComment.replies.filter(
          (reply) => reply._id !== commentId
        );

        // ลดจำนวน replyCount
        parentComment.replyCount = Math.max(
          0,
          (parentComment.replyCount || 1) - 1
        );

        // อัพเดตข้อมูลคอมเมนต์หลัก
        updatedComments[parentIndex] = parentComment;
        setComments(updatedComments);
      }
    } else {
      // กรณีเป็นการลบคอมเมนต์หลัก
      const updatedComments = comments.filter(
        (comment) => comment._id !== commentId
      );
      setComments(updatedComments);

      // ลดจำนวนคอมเมนต์ของโพสต์
      if (post.commentCount) {
        post.commentCount = Math.max(0, post.commentCount - 1);
      }
    }
  };

  // ฟังก์ชันเปลี่ยนรูปภาพในแกลเลอรี่
  const nextMedia = () => {
    setActiveMediaIndex((prev) =>
      prev < post.media.length - 1 ? prev + 1 : prev
    );
  };

  const prevMedia = () => {
    setActiveMediaIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  // ข้อมูลผู้โพสต์
  const authorName =
    post?.authorId?.profile?.name || post.authorId?.username || "ผู้ใช้งาน";
  const authorUsername = post.authorId?.username || "user";
  const authorAvatar =
    post.authorId?.profile?.avatarUrl || "/img/avatar-placeholder.png";
  const postDate = formatPostDate(post.createdAt);

  // แสดงตัวอย่าง UI คอมเมนต์หรือตอบกลับ
  const renderComment = (
    comment: ExtendedComment,
    index: number,
    isReply = false,
    replyIndex?: number,
    notificationId?: string
  ) => {
    return (
      <PostCardComment
        key={comment._id}
        comment={comment}
        index={index}
        isReply={isReply}
        replyIndex={replyIndex}
        notificationId={notificationId}
        formatPostDate={formatPostDate}
        navigateToProfile={navigateToProfile}
        handleCommentLike={handleCommentLike}
        handleReply={handleReply}
        toggleReplies={toggleReplies}
        renderComment={renderComment}
        showUser={!!user}
        onCommentDeleted={handleCommentDeleted}
      />
    );
  };

  return (
    <Card className="overflow-hidden border-b border-x-0 md:border md:rounded-xl shadow-sm mb-4">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar
              className="h-10 w-10 ring-2 ring-background cursor-pointer"
              onClick={() => navigateToProfile(authorUsername)}
            >
              <AvatarImage src={authorAvatar} alt={authorName} />
              <AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              {/* เพิ่ม onClick ให้กับชื่อผู้สร้างโพสต์ */}
              <p
                className="font-medium text-sm cursor-pointer hover:underline"
                onClick={() => navigateToProfile(authorUsername)}
              >
                {authorName}
              </p>

              {/* เพิ่ม onClick ให้กับ username ของผู้สร้างโพสต์ */}
              <p className="text-xs text-muted-foreground">
                <span
                  className="cursor-pointer hover:underline"
                  onClick={() => navigateToProfile(authorUsername)}
                >
                  @{authorUsername}
                </span>{" "}
                · {postDate}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {post.content && (
          <div className="px-4 pb-3">
            <p className="text-sm">{post.content}</p>
          </div>
        )}

        {/* แสดง media เฉพาะเมื่อเป็นประเภท image หรือ video เท่านั้น */}
        {post.media &&
          post.media.length > 0 &&
          post.media[activeMediaIndex].type !== "text" && (
            <div className="relative w-full aspect-square md:aspect-video bg-muted/20">
              <Image
                src={post.media[activeMediaIndex].url}
                alt="โพสต์"
                fill
                sizes="(max-width: 768px) 100vw, 700px"
                className="object-contain bg-black/5"
                loading="lazy"
              />

              {post.media.length > 1 && (
                <>
                  <div className="absolute top-2 right-2 bg-black/50 text-white rounded-full px-2 py-0.5 text-xs">
                    {activeMediaIndex + 1}/{post.media.length}
                  </div>

                  <Button
                    onClick={prevMedia}
                    disabled={activeMediaIndex === 0}
                    size="icon"
                    variant="ghost"
                    className={cn(
                      "absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-black/30 text-white hover:bg-black/50",
                      activeMediaIndex === 0 && "opacity-0"
                    )}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>

                  <Button
                    onClick={nextMedia}
                    disabled={activeMediaIndex === post.media.length - 1}
                    size="icon"
                    variant="ghost"
                    className={cn(
                      "absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-black/30 text-white hover:bg-black/50",
                      activeMediaIndex === post.media.length - 1 && "opacity-0"
                    )}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>

                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {post.media.map((_, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "h-1.5 rounded-full",
                          idx === activeMediaIndex
                            ? "w-2 bg-primary"
                            : "w-1.5 bg-white/70"
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
      </CardContent>

      <CardFooter className="p-4 flex flex-col">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex items-center space-x-1",
                liked ? "text-red-500" : "text-muted-foreground"
              )}
              onClick={handleLike}
            >
              <Heart
                className={cn("h-5 w-5", liked && "fill-current text-red-500")}
              />
              <span>{likeCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-1 text-muted-foreground"
              onClick={() => fetchComments()}
            >
              <MessageCircle className="h-5 w-5" />
              <span>{post.commentCount || 0}</span>
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Share2 className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={bookmarked ? "text-primary" : "text-muted-foreground"}
              onClick={() => setBookmarked(!bookmarked)}
            >
              <Bookmark
                className={cn("h-5 w-5", bookmarked && "fill-current")}
              />
            </Button>
          </div>
        </div>

        {showComments && (
          <>
            <Separator className="my-3" />

            {/* แสดงข้อความกำลังโหลด */}
            {loading ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  กำลังโหลดความคิดเห็น...
                </p>
              </div>
            ) : (
              <div className="space-y-4 mt-2 w-full">
                {comments.length > 0 ? (
                  comments.map((comment, index) =>
                    renderComment(comment, index)
                  )
                ) : (
                  <p className="text-center text-sm text-muted-foreground">
                    ยังไม่มีความคิดเห็น
                  </p>
                )}
              </div>
            )}

            {/* ช่องใส่ความคิดเห็น */}
            {user && (
              <div className="relative mt-3 w-full">
                {replyingTo && (
                  <div className="flex justify-between items-center px-2 py-1 bg-muted/30 rounded-t-lg text-xs text-muted-foreground">
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

                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={
                        user.profile?.avatarUrl || "/img/avatar-placeholder.png"
                      }
                      alt={user.username}
                    />
                    <AvatarFallback>
                      {user.username?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 relative">
                    <Input
                      id={`comment-input-${post._id}`}
                      placeholder={
                        replyingTo
                          ? `ตอบกลับ @${replyingTo.username}...`
                          : "เพิ่มความคิดเห็น..."
                      }
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="pr-10 rounded-full bg-muted/50"
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
              </div>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}

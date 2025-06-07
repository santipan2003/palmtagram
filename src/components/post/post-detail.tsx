import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bookmark, Heart, MessageCircle, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ApiPost, User, ExtendedComment } from "@/interfaces/profile.interface";
import { useState } from "react";

interface PostDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  post: ApiPost | null;
  user: User;
  username: string;
  liked: boolean;
  handleLike: () => void;
  comments: ExtendedComment[];
  loadingComments: boolean;
  commentText: string;
  setCommentText: (text: string) => void;
  handleSubmitComment: () => void;
  replyingTo: { commentId: string; username: string } | null;
  cancelReply: () => void;
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
  ) => React.ReactElement;
  formatDate: (dateString: string) => string;
  navigateToProfile: (username: string) => void;
}

export function PostDetailDialog({
  isOpen,
  onOpenChange,
  post,
  user,
  username,
  liked,
  handleLike,
  comments,
  loadingComments,
  commentText,
  setCommentText,
  handleSubmitComment,
  replyingTo,
  cancelReply,
  renderComment,
  formatDate,
  navigateToProfile,
}: PostDetailDialogProps) {
  const hasImageContent = post?.media && post.media[0]?.type !== "text";
  const [isBookmarked, setIsBookmarked] = useState(false);

  // ฟังก์ชันสำหรับจัดการการกดปุ่ม bookmark
  const toggleBookmark = () => {
    setIsBookmarked((prev) => !prev);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl p-0 overflow-hidden max-h-[90vh] w-[95vw] md:w-full">
        <DialogTitle className="sr-only">
          {post ? `Post by ${username}` : "Post Details"}
        </DialogTitle>

        <div className="flex flex-col md:flex-row h-full">
          {/* Post Image - show only for image/video posts */}
          {post && hasImageContent && (
            <div className="md:w-[60%] bg-black flex items-center justify-center">
              <motion.img
                src={post.media[0]?.url || "/placeholder.svg"}
                alt={`Post ${post._id}`}
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
              hasImageContent ? "md:w-[40%]" : "w-full"
            } flex flex-col h-full max-h-[50vh] md:max-h-[70vh]`}
          >
            {/* Header */}
            <motion.div
              className="p-4 flex items-center border-b"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Avatar
                className="h-8 w-8 mr-2 cursor-pointer"
                onClick={() => navigateToProfile(username)}
              >
                <AvatarImage
                  src={user?.profile?.avatarUrl || "/placeholder.svg"}
                  alt={user?.profile?.name}
                />
                <AvatarFallback>
                  {user?.profile?.name ? user.profile.name.charAt(0) : ""}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p
                  className="font-semibold text-sm cursor-pointer hover:underline"
                  onClick={() => navigateToProfile(username)}
                >
                  {username}
                </p>
                <p className="text-xs text-muted-foreground">
                  Bangkok, Thailand
                </p>
              </div>
            </motion.div>

            {/* Comments Section */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Post Content */}
              {post && (
                <motion.div
                  className="flex gap-2 mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Avatar
                    className="h-8 w-8 cursor-pointer"
                    onClick={() => navigateToProfile(username)}
                  >
                    <AvatarImage
                      src={user?.profile?.avatarUrl || "/placeholder.svg"}
                      alt={user?.profile?.name}
                    />
                    <AvatarFallback>
                      {user?.profile?.name ? user.profile.name.charAt(0) : ""}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm">
                      <span
                        className="font-semibold mr-2 cursor-pointer hover:underline"
                        onClick={() => navigateToProfile(username)}
                      >
                        {username}
                      </span>
                      {post.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(post.createdAt)}
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
                ) : comments.length > 0 ? (
                  comments.map((comment, index) =>
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
                    disabled={!user}
                  >
                    <Heart
                      className={cn(
                        "h-5 w-5",
                        liked && "fill-current text-red-500"
                      )}
                    />
                    <span>{post?.likeCount || 0}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-1 text-muted-foreground"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>{post?.commentCount || 0}</span>
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className={
                      isBookmarked ? "text-primary" : "text-muted-foreground"
                    }
                    onClick={toggleBookmark}
                  >
                    <Bookmark
                      className={cn("h-5 w-5", isBookmarked && "fill-current")}
                    />
                  </Button>
                </div>
              </div>
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
  );
}

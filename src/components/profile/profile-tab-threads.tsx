import { motion } from "framer-motion";
import { TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, CalendarIcon } from "lucide-react";
import { ApiPost, User } from "@/interfaces/profile.interface";

interface ProfileThreadsTabProps {
  posts: ApiPost[];
  username: string;
  user: User;
  onPostClick: (post: ApiPost) => void;
  formatThreadDate: (dateString: string) => string;
}

export function ProfileThreadsTab({
  posts,
  username,
  user,
  onPostClick,
  formatThreadDate,
}: ProfileThreadsTabProps) {
  return (
    <TabsContent value="thread" className="mt-6">
      {posts.length > 0 ? (
        <motion.div
          className="flex flex-col gap-4 w-full max-w-[100%] md:w-full mx-auto px-3 md:px-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {posts.map((post) => (
            <motion.div
              key={post._id}
              className="border rounded-lg p-3 md:p-4 hover:bg-muted/30 transition-colors duration-200 cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ y: -2 }}
              onClick={() => onPostClick(post)}
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
  );
}

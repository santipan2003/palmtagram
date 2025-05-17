import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Heart, MessageCircle, Grid } from "lucide-react";
import Image from "next/image";
import { ApiPost } from "@/interfaces/profile.interface";

interface ProfilePostsTabProps {
  posts: ApiPost[];
  onPostClick: (post: ApiPost) => void;
}

export function ProfilePostsTab({ posts, onPostClick }: ProfilePostsTabProps) {
  return (
    <TabsContent value="posts" className="mt-6">
      {posts.length > 0 ? (
        <motion.div
          className="grid grid-cols-3 gap-1 md:gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {posts.map((post) => (
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
                onClick={() => onPostClick(post)}
              >
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
                      <span className="font-semibold">{post.likeCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-5 w-5" />
                      <span className="font-semibold">{post.commentCount}</span>
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
  );
}

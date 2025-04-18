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
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { mockProfileUser } from "@/lib/data/mock-data";
import type { ProfilePost } from "@/lib/data/mock-data";
import { motion, AnimatePresence } from "framer-motion";
import { useMobile } from "@/hooks/use-mobile";
import Image from "next/image";

export default function ProfilePosts({ posts }: { posts: ProfilePost[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedPost, setSelectedPost] = useState<ProfilePost | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isMobile = useMobile();

  // Function to find post by ID
  const findPostById = useCallback(
    (id: number) => {
      return posts.find((p) => p.id === id) || null;
    },
    [posts]
  );

  // Handle URL-based navigation
  useEffect(() => {
    const postIdMatch = pathname.match(/\/profile\/post\/(\d+)/);

    if (postIdMatch) {
      const postId = Number.parseInt(postIdMatch[1]);
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
  const openPostDetails = (post: ProfilePost) => {
    if (isMobile) {
      // On mobile, just navigate to post detail page without opening modal
      router.push(`/profile/post/${post.id}`);
    } else {
      // On desktop, navigate to URL (which will trigger modal via useEffect)
      router.push(`/profile/post/${post.id}`, { scroll: false });
    }
  };

  // Function to close post details
  const closePostDetails = () => {
    setIsDialogOpen(false);
    setSelectedPost(null);
    // Go back to profile page
    router.push("/profile", { scroll: false });
  };

  // If we're on a mobile post detail page, don't render the posts grid
  if (isMobile && selectedPost && pathname.includes("/profile/post/")) {
    return <MobilePostDetail post={selectedPost} onClose={closePostDetails} />;
  }

  return (
    <>
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-14 bg-gradient-to-b from-background to-background/80 border-t border-b border-muted/30 backdrop-blur-sm">
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
          <motion.div
            className="grid grid-cols-3 gap-1 md:gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {posts.map((post) => (
              <motion.div
                key={post.id}
                className="relative pb-[100%] aspect-square"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                layout
              >
                <Card
                  className="absolute inset-0 overflow-hidden border-0 rounded-sm cursor-pointer"
                  onClick={() => openPostDetails(post)}
                >
                  {/* grid image */}
                  <div className="h-full w-full">
                    <Image
                      src={post.image || "/placeholder.svg"}
                      alt={`Post ${post.id}`}
                      fill
                      sizes="(max-width: 640px) 50vw, 33vw" 
                      className="object-cover w-full h-full" 
                      placeholder="blur"
                      blurDataURL="/placeholder.svg"
                      priority={post.id <= 4} 
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                    <div className="flex gap-4 text-white">
                      <div className="flex items-center gap-1">
                        <Heart className="h-5 w-5" />
                        <span className="font-semibold">{post.likes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-5 w-5" />
                        <span className="font-semibold">{post.comments}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
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

      {/* Post Detail Modal (Desktop only) */}
      {!isMobile && (
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => !open && closePostDetails()}
        >
          <DialogContent className="sm:max-w-4xl p-0 overflow-hidden max-h-[90vh] w-[95vw] md:w-auto">
            <DialogTitle className="sr-only">
              {selectedPost
                ? `Post by ${mockProfileUser.username}`
                : "Post Details"}
            </DialogTitle>

            <div className="flex flex-col md:flex-row h-full">
              {/* Post Image */}
              <div className="md:w-[60%] bg-black flex items-center justify-center">
                {selectedPost && (
                  <motion.img
                    src={selectedPost.image || "/placeholder.svg"}
                    alt={`Post ${selectedPost.id}`}
                    className="max-h-[50vh] md:max-h-[70vh] w-full object-contain"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </div>

              {/* Post Details */}
              <div className="md:w-[40%] flex flex-col h-full max-h-[50vh] md:max-h-[70vh]">
                {/* Header */}
                <motion.div
                  className="p-4 flex items-center border-b"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage
                      src={mockProfileUser.avatar || "/placeholder.svg"}
                      alt={mockProfileUser.name}
                    />
                    <AvatarFallback>
                      {mockProfileUser.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      {mockProfileUser.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {mockProfileUser.location}
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
                          src={mockProfileUser.avatar || "/placeholder.svg"}
                          alt={mockProfileUser.name}
                        />
                        <AvatarFallback>
                          {mockProfileUser.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm">
                          <span className="font-semibold mr-2">
                            {mockProfileUser.username}
                          </span>
                          {selectedPost.caption}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedPost.time}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Sample comments */}
                  <div className="space-y-4">
                    <AnimatePresence>
                      {selectedPost?.commentData?.map((comment, i) => (
                        <motion.div
                          key={i}
                          className="flex gap-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2, delay: 0.1 + i * 0.05 }}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={comment.avatar || "/placeholder.svg"}
                              alt={comment.username}
                            />
                            <AvatarFallback>
                              {comment.username.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm">
                              <span className="font-semibold mr-2">
                                {comment.username}
                              </span>
                              {comment.text}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {comment.time}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
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
                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                      <Heart className="h-6 w-6" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                      <MessageCircle className="h-6 w-6" />
                    </Button>
                  </div>
                  {selectedPost && (
                    <p className="font-semibold text-sm">
                      {selectedPost.likes} likes
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {selectedPost?.time}
                  </p>
                </motion.div>

                {/* Comment input */}
                <motion.div
                  className="border-t p-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      className="flex-1 bg-transparent border-none outline-none text-sm"
                    />
                    <Button
                      variant="ghost"
                      className="text-primary text-sm font-semibold"
                    >
                      Post
                    </Button>
                  </div>
                </motion.div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

// Mobile Post Detail Component for single post page view
function MobilePostDetail({
  post,
  onClose,
}: {
  post: ProfilePost;
  onClose: () => void;
}) {
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
              src={mockProfileUser.avatar || "/placeholder.svg"}
              alt={mockProfileUser.name}
            />
            <AvatarFallback>{mockProfileUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{mockProfileUser.username}</p>
            <p className="text-xs text-muted-foreground">
              {mockProfileUser.location}
            </p>
          </div>
        </div>

        {/* Post Image */}
        <div className="w-full aspect-square bg-black relative">
          <Image
            src={post.image || "/placeholder.svg"}
            alt={`Post ${post.id}`}
            fill
            sizes="100vw"
            className="object-contain"
            placeholder="blur"
            blurDataURL="/placeholder.svg"
          />
        </div>

        {/* Post Actions */}
        <div className="p-3">
          <div className="flex items-center gap-4 mb-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
              <Heart className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
              <MessageCircle className="h-6 w-6" />
            </Button>
          </div>
          <p className="font-semibold text-sm">{post.likes} likes</p>
          <p className="text-xs text-muted-foreground mb-3">{post.time}</p>

          {/* Caption */}
          <div className="flex gap-2 mb-4">
            <p className="text-sm">
              <span className="font-semibold mr-2">
                {mockProfileUser.username}
              </span>
              {post.caption}
            </p>
          </div>

          {/* Comments */}
          <div className="space-y-4 mt-4">
            {post.commentData?.map((comment, i) => (
              <div key={i} className="flex gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={comment.avatar || "/placeholder.svg"}
                    alt={comment.username}
                  />
                  <AvatarFallback>{comment.username.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm">
                    <span className="font-semibold mr-2">
                      {comment.username}
                    </span>
                    {comment.text}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {comment.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comment Input */}
      <div className="border-t p-3">
        <div className="flex items-center">
          <input
            type="text"
            placeholder="Add a comment..."
            className="flex-1 bg-transparent border-none outline-none text-sm"
          />
          <Button
            variant="ghost"
            className="text-primary text-sm font-semibold"
          >
            Post
          </Button>
        </div>
      </div>
    </div>
  );
}

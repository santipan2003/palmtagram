"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Tabs } from "@/components/ui/tabs";
import { BookmarkIcon, UserIcon } from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";
import { ApiPost, User } from "@/interfaces/profile.interface";
import MobilePostDetail from "../post/post-detail-mobile";
import { ProfileTabList } from "./profile-tablist";
import { ProfilePostsTab } from "./profile-tab-posts";
import { ProfileThreadsTab } from "./profile-tab-threads";
import { ProfileEmptyTab } from "./profile-tab-empty";
import { PostDetailContainer } from "../post/post-detail-page";

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
      // On mobile, still navigate to post detail page
      router.push(`/post/${post._id}`);
    } else {
      // On desktop, just open dialog without URL change
      setSelectedPost(post);
      setIsDialogOpen(true);
    }
  };

  // Function to close post details
  const closePostDetails = () => {
    // Just close dialog without URL change on desktop
    setIsDialogOpen(false);
    setSelectedPost(null);

    // Only navigate on mobile
    if (isMobile && pathname.includes(`/post/`)) {
      router.push(`/${username}`);
    }
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

      {/* Post Detail Modal - ตอนนี้ใช้ PostDetailContainer แทน */}
      {!isMobile && selectedPost && (
        <PostDetailContainer
          post={selectedPost}
          user={user}
          username={username}
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onClose={closePostDetails}
        />
      )}
    </>
  );
}

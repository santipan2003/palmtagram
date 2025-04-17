"use client";

import { useEffect } from "react";
import PostCard from "@/components/feed/post-card";
import CreatePostCard from "@/components/feed/create-post-card";
import { mockPosts } from "@/lib/data/mock-data";
import { useSidebar } from "@/components/ui/sidebar";
import { useMobile } from "@/hooks/use-mobile";

export default function FeedPage() {
  const { setOpen } = useSidebar();
  const isMobile = useMobile();

  // Expand sidebar on feed page for desktop
  useEffect(() => {
    if (!isMobile) {
      setOpen(true);
    }
  }, [isMobile, setOpen]);

  return (
    <div className="max-w-2xl mx-auto">
      <CreatePostCard />

      <div className="space-y-4 mt-6">
        {mockPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}

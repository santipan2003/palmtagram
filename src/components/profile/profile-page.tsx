"use client";

import { useEffect } from "react";
import ProfileHeader from "@/components/profile/profile-header";
import ProfilePosts from "@/components/profile/profile-posts";
import ProfileHighlights from "@/components/profile/profile-highlights";
import {
  mockProfileUser,
  mockProfilePosts,
  mockProfileHighlights,
} from "@/lib/data/mock-data";
import { useSidebar } from "@/components/ui/sidebar";
import { useMobile } from "@/hooks/use-mobile";

export default function ProfilePage() {
  const { setOpen } = useSidebar();
  const isMobile = useMobile();

  // Auto-collapse sidebar on profile page for desktop
  useEffect(() => {
    if (!isMobile) {
      setOpen(false);
    }
  }, [isMobile, setOpen]);

  return (
    <div className="max-w-4xl mx-auto">
      <ProfileHeader user={mockProfileUser} />
      <ProfileHighlights highlights={mockProfileHighlights} />
      <ProfilePosts posts={mockProfilePosts} />
    </div>
  );
}

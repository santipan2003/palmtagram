"use client";

import ProfileHeader from "@/components/profile/profile-header";
import ProfilePosts from "@/components/profile/profile-posts";
import ProfileHighlights from "@/components/profile/profile-highlights";
import {
  mockProfileUser,
  mockProfilePosts,
  mockProfileHighlights,
} from "@/lib/data/mock-data";

export default function ProfilePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <ProfileHeader user={mockProfileUser} />
      <ProfileHighlights highlights={mockProfileHighlights} />
      <ProfilePosts posts={mockProfilePosts} />
    </div>
  );
}

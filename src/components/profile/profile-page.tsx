"use client";

import { useState, useEffect, useCallback } from "react";
import ProfileHeader from "@/components/profile/profile-header";
import ProfilePosts from "@/components/profile/profile-posts";
import ProfileHighlights from "@/components/profile/profile-highlights";
import { mockProfileHighlights } from "@/lib/data/mock-data";
import { profileService } from "@/services/profile/profile.service";
import {
  User,
  ApiPost,
  ProfilePageProps,
} from "@/interfaces/profile.interface";

export default function ProfilePage({ username }: ProfilePageProps) {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      // ใช้ profileService แทนการเรียก axios โดยตรง
      const userData = await profileService.getUserByUsername(username);

      setUser(userData);
      console.log("Fetched user data:", JSON.stringify(userData, null, 2));
    } catch (err) {
      console.error("Error fetching user data:", err);
    } finally {
      setLoading(false);
    }
  }, [username]);

  const fetchUserPosts = useCallback(async (userId: string) => {
    try {
      // ใช้ profileService แทนการเรียก axios โดยตรง
      const postsData = await profileService.getUserPosts(userId);

      setPosts(postsData);
      console.log("Fetched user posts:", JSON.stringify(postsData, null, 2));
    } catch (err) {
      console.error("Error fetching user posts:", err);
    }
  }, []);

  // First fetch user data
  useEffect(() => {
    if (username) {
      fetchUserData();
    }
  }, [username, fetchUserData]);

  // Then fetch posts once user data is available
  useEffect(() => {
    if (user && user._id) {
      fetchUserPosts(user._id);
    }
  }, [user, fetchUserPosts]);

  if (loading && !user) {
    return <div className="max-w-4xl mx-auto p-4">Loading profile...</div>;
  }

  if (!user) {
    return <div className="max-w-4xl mx-auto p-4">User not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <ProfileHeader user={user} />
      <ProfileHighlights highlights={mockProfileHighlights} />
      <ProfilePosts posts={posts} username={username} user={user} />
    </div>
  );
}

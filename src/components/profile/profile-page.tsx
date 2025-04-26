"use client";

import { useState, useEffect, useCallback } from "react";
import ProfileHeader from "@/components/profile/profile-header";
import ProfilePosts from "@/components/profile/profile-posts";
import ProfileHighlights from "@/components/profile/profile-highlights";
import { mockProfilePosts, mockProfileHighlights } from "@/lib/data/mock-data";
import axios from "axios";

interface Profile {
  name: string;
  avatarUrl: string;
  _id: string;
}

interface User {
  _id: string;
  username: string;
  email: string;
  profile: Profile;
  createdAt: string;
  updatedAt: string;
}

interface ProfilePageProps {
  username: string;
}

export default function ProfilePage({ username }: ProfilePageProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/users/username/${username}`
      );

      setUser(response.data);
      console.log("Fetched user data:", JSON.stringify(response.data, null, 2));
    } catch (err) {
      console.error("Error fetching user data:", err);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (username) {
      fetchUserData();
    }
  }, [username, fetchUserData]);

  if (loading) {
    return <div className="max-w-4xl mx-auto p-4">Loading profile...</div>;
  }

  if (!user) {
    return <div className="max-w-4xl mx-auto p-4">User not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <ProfileHeader user={user} />
      <ProfileHighlights highlights={mockProfileHighlights} />
      <ProfilePosts posts={mockProfilePosts} />
    </div>
  );
}

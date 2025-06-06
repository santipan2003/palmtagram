"use client";

import PostCard from "@/components/feed/feed-post";
import CreatePostCard from "@/components/feed/create-post-card";
import { useSidebar } from "@/components/ui/sidebar";
import { useMobile } from "@/hooks/use-mobile";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";
import { feedService } from "@/services/feed.service";
import { User, ApiPost } from "@/interfaces/feed.interface";
import SuggestionSidebar from "./feed-suggestion";

export default function FeedPage() {
  const [userData, setUserData] = useState<User | null>(null);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { setOpen } = useSidebar();
  const isMobile = useMobile();
  const { user, isLoading } = useAuth();

  // ดึงข้อมูลผู้ใช้จาก API - แปลงเป็น useCallback
  const fetchUserData = useCallback(async () => {
    if (!user?._id) return;

    try {
      const data = await feedService.getUserData(user._id);
      setUserData(data);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }, [user?._id]); // dependency คือ user._id

  // ดึงข้อมูลโพสต์ทั้งหมดจาก API - แปลงเป็น useCallback
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const postsData = await feedService.getPosts();
      setPosts(postsData);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  }, []); // ไม่มี dependency

  // เรียกใช้ fetchUserData และ fetchPosts เมื่อ component ถูกโหลด
  useEffect(() => {
    const initData = async () => {
      if (!isLoading && user?._id) {
        await fetchUserData();
        await fetchPosts();
      }
    };

    initData();
  }, [isLoading, user, fetchUserData, fetchPosts]);

  // Expand sidebar on feed page for desktop
  useEffect(() => {
    if (!isMobile) {
      setOpen(true);
    }
  }, [isMobile, setOpen]);

  // แสดง loading state
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-8 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-center mx-auto">
        {/* คอลัมน์หลัก - Feed */}
        <div className="w-full max-w-[800px] mx-auto px-2 md:px-4 py-4">
          <CreatePostCard userData={userData} onPostCreated={fetchPosts} />
          <div className="space-y-4 mt-6">
            {posts.length > 0 ? (
              posts.map((post) => <PostCard key={post._id} post={post} />)
            ) : (
              <div className="text-center p-8 border rounded-lg bg-muted/10">
                <p className="text-muted-foreground">
                  ยังไม่มีโพสต์ในฟีดของคุณ
                </p>
              </div>
            )}
          </div>
        </div>

        {/* คอลัมน์ขวา - ข้อมูลโปรไฟล์และคำแนะนำ */}
        <div className="hidden lg:block w-[400px] shrink-0 border-l">
          <div className="sticky top-0 h-screen p-4 overflow-y-auto">
            <SuggestionSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}

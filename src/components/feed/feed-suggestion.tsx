"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { User } from "@/interfaces/feed.interface";
import { feedService } from "@/services/feed.service";

export default function SuggestionSidebar() {
  const { user } = useAuth();
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลคำแนะนำผู้ใช้
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        // เปลี่ยนเป็น API call จริงเมื่อพร้อม
        const data = await feedService.getSuggestions();
        setSuggestions(data.slice(0, 5)); // แสดงแค่ 5 คำแนะนำ
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        // ใช้ข้อมูลจำลองกรณีมีข้อผิดพลาด
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSuggestions();
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="w-full max-w-[320px]">
      {/* โปรไฟล์ผู้ใช้ปัจจุบัน */}
      <div className="flex items-center space-x-4 mb-6 px-2">
        <Avatar className="h-12 w-12 border">
          <AvatarImage
            src={user.profile?.avatarUrl || "/img/avatar-placeholder.png"}
            alt={user.username || "User"}
          />
          <AvatarFallback>{user.username?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{user.username}</p>
          <p className="text-xs text-muted-foreground truncate">
            {user.profile?.name || ""}
          </p>
        </div>
        <Button variant="link" size="sm" className="text-xs font-medium">
          สลับ
        </Button>
      </div>

      {/* ส่วนหัวคำแนะนำ */}
      <div className="flex justify-between items-center mb-4 px-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          แนะนำสำหรับคุณ
        </h3>
        <Button variant="link" size="sm" className="text-xs font-semibold">
          ดูทั้งหมด
        </Button>
      </div>

      {/* รายการคำแนะนำ */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-center space-x-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2.5 w-16" />
              </div>
              <Skeleton className="h-7 w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.length > 0 ? (
            suggestions.map((suggestion) => (
              <div key={suggestion._id} className="flex items-center space-x-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={
                      suggestion.profile?.avatarUrl ||
                      "/img/avatar-placeholder.png"
                    }
                    alt={suggestion.username || "User"}
                  />
                  <AvatarFallback>
                    {suggestion.username?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold hover:underline cursor-pointer"
                    onClick={() => router.push(`/${suggestion.username}`)}
                  >
                    {suggestion.username}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    มีผู้ติดตามร่วมกัน
                  </p>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs font-semibold text-primary"
                >
                  ติดตาม
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              ไม่มีคำแนะนำในขณะนี้
            </p>
          )}
        </div>
      )}

      {/* ลิงก์และข้อมูลอื่นๆ */}
      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap gap-x-1.5 gap-y-1 text-xs text-muted-foreground/70">
          <a href="#" className="hover:underline">
            เกี่ยวกับ
          </a>
          <span>•</span>
          <a href="#" className="hover:underline">
            ความช่วยเหลือ
          </a>
          <span>•</span>
          <a href="#" className="hover:underline">
            นโยบายความเป็นส่วนตัว
          </a>
          <span>•</span>
          <a href="#" className="hover:underline">
            ข้อกำหนด
          </a>
          <span>•</span>
          <a href="#" className="hover:underline">
            ภาษา
          </a>
        </div>
        <p className="text-xs text-muted-foreground/60">© 2025 PALMTAGRAM</p>
      </div>
    </div>
  );
}

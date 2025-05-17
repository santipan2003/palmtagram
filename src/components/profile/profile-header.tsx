import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Settings,
  Pencil,
  UserCheck,
  UserPlus,
  MessageSquare,
} from "lucide-react";
import Image from "next/image";
import { User } from "@/interfaces/profile.interface";
import { useAuth } from "@/lib/auth-context";
import { profileService } from "@/services/profile.service";
// เปลี่ยนจาก toast มาเป็น sonner
import { toast } from "sonner";
import FollowersDialog from "./profile-follow";
import { useRouter } from "next/navigation";
import { chatService } from "@/services/chat.service";
import { ensureWebSocketToken } from "@/lib/websocket-auth";

export default function ProfileHeader({ user }: { user: User }) {
  // ใช้ useAuth เพื่อเข้าถึงข้อมูลผู้ใช้ที่ล็อกอินอยู่
  const { user: currentUser } = useAuth();
  const router = useRouter();
  // State สำหรับแสดงว่ามีการติดตามผู้ใช้นี้หรือไม่
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);
  const [postsCount, setPostsCount] = useState(0);
  const [showFollowsDialog, setShowFollowsDialog] = useState(false);
  const [dialogTab, setDialogTab] = useState<"followers" | "following">(
    "followers"
  );
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);

  // เพิ่มฟังก์ชัน handleMessageClick
  // Update the handleMessageClick function
  // เพิ่มใน handleMessageClick
  const handleMessageClick = async () => {
    if (!currentUser) {
      toast.error("คุณต้องเข้าสู่ระบบก่อน", {
        description: "กรุณาเข้าสู่ระบบเพื่อส่งข้อความ",
      });
      return;
    }

    setIsLoadingMessage(true);

    try {
      // อัปเดตข้อมูลผู้ใช้ใน localStorage ก่อน
      localStorage.setItem(
        "user_data",
        JSON.stringify({
          _id: currentUser._id,
          username: currentUser.username,
        })
      );

      // เพิ่มการรอเพื่อให้แน่ใจว่า localStorage ถูกอัปเดต
      await new Promise((resolve) => setTimeout(resolve, 100));

      // ตรวจสอบว่ามี WebSocket token
      await ensureWebSocketToken();

      // สร้างหรือดึงห้องแชทส่วนตัวกับผู้ใช้นี้
      const room = await chatService.getPrivateChat(user._id);

      // เพิ่มการหน่วงเวลาอีก 1 วินาที เพื่อให้ backend มีเวลาอัปเดตข้อมูลห้องแชท
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // นำทางไปยังห้องแชท
      router.push(`/chat/${room._id}`);
    } catch (error) {
      console.error("ไม่สามารถสร้างห้องแชทได้:", error);
      toast.error("ไม่สามารถสร้างห้องแชทได้", {
        description: "กรุณาลองใหม่อีกครั้ง",
      });
    } finally {
      setIsLoadingMessage(false);
    }
  };
  // ฟังก์ชันเปิด dialog followers หรือ following
  const openFollowsDialog = (tab: "followers" | "following") => {
    setDialogTab(tab);
    setShowFollowsDialog(true);
  };

  // ตรวจสอบว่ากำลังดูโปรไฟล์ตัวเองหรือไม่
  const isOwnProfile = currentUser?._id === user?._id;

  // ดึงข้อมูลการติดตามและจำนวนผู้ติดตาม/ที่กำลังติดตาม
  useEffect(() => {
    const fetchFollowData = async () => {
      if (!user || !user._id) return;

      try {
        // ตรวจสอบสถานะการติดตาม (เฉพาะเมื่อล็อกอิน)
        if (currentUser && !isOwnProfile) {
          const followStatus = await profileService.checkFollowStatus(user._id);
          setIsFollowing(followStatus);
        }

        // ดึงจำนวนผู้ติดตามและที่กำลังติดตาม
        const followersCountData = await profileService.getFollowersCount(
          user._id
        );
        const followingCountData = await profileService.getFollowingCount(
          user._id
        );
        const MutalFollowData = await profileService.getMutualFollowsList();
        console.log(
          "Mutual Follow Data:",
          JSON.stringify(MutalFollowData, null, 2)
        );

        setFollowersCount(followersCountData);
        setFollowingCount(followingCountData);
      } catch (error) {
        console.error("Error fetching follow data:", error);
      }
    };

    fetchFollowData();
  }, [user, currentUser, isOwnProfile]);

  // ดึงจำนวนโพสต์
  useEffect(() => {
    const fetchPostsCount = async () => {
      if (!user || !user._id) return;

      try {
        const posts = await profileService.getUserPosts(user._id);
        // เพิ่มการตรวจสอบ posts เป็น undefined ก่อนเข้าถึง length
        setPostsCount(posts?.length || 0);
      } catch (error) {
        console.error("Error fetching posts count:", error);
        setPostsCount(0); // กำหนดค่าเริ่มต้นเป็น 0 เมื่อเกิดข้อผิดพลาด
      }
    };

    fetchPostsCount();
  }, [user]);

  // ฟังก์ชันสำหรับการติดตาม/เลิกติดตาม
  const handleFollowToggle = async () => {
    if (!currentUser || !user || !user._id) {
      toast.error("คุณต้องเข้าสู่ระบบก่อน", {
        description: "กรุณาเข้าสู่ระบบเพื่อติดตามผู้ใช้นี้",
      });
      return;
    }

    setIsLoadingFollow(true);

    try {
      if (isFollowing) {
        // ยกเลิกการติดตาม
        await profileService.unfollowUser(user._id);
        setFollowersCount((prev) => Math.max(0, prev - 1));
        toast.success("ยกเลิกการติดตามแล้ว", {
          description: `คุณได้ยกเลิกการติดตาม ${user.username} แล้ว`,
        });
      } else {
        // เริ่มติดตาม
        await profileService.followUser(user._id);
        setFollowersCount((prev) => prev + 1);
        toast.success("เริ่มติดตามแล้ว", {
          description: `คุณได้เริ่มติดตาม ${user.username} แล้ว`,
        });
      }

      // เพิ่มการตรวจสอบอีกครั้งเพื่อให้แน่ใจว่าสถานะได้รับการอัพเดต
      const updatedFollowStatus = await profileService.checkFollowStatus(
        user._id
      );
      setIsFollowing(updatedFollowStatus);
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error("เกิดข้อผิดพลาด", {
        description: "ไม่สามารถดำเนินการได้ กรุณาลองอีกครั้ง",
      });

      // กรณีเกิดข้อผิดพลาด ให้ตรวจสอบสถานะปัจจุบันอีกครั้ง
      try {
        const currentFollowStatus = await profileService.checkFollowStatus(
          user._id
        );
        setIsFollowing(currentFollowStatus);
      } catch (err) {
        console.error("Error re-checking follow status:", err);
      }
    }

    setIsLoadingFollow(false);
  };

  // เพิ่ม useEffect เพื่อตรวจสอบสถานะการติดตามเมื่อคอมโพเนนต์ถูกโหลดหรือ user เปลี่ยน
  useEffect(() => {
    const checkCurrentFollowStatus = async () => {
      if (!currentUser || !user || !user._id || isOwnProfile) return;

      try {
        console.log(
          `Checking follow status for user: ${user.username} (${user._id})`
        );
        const status = await profileService.checkFollowStatus(user._id);
        console.log(
          `Current follow status for ${user.username}: ${
            status ? "Following" : "Not following"
          }`
        );
        console.log(`Raw API response can be seen in the Network tab`);

        setIsFollowing(status);
      } catch (error) {
        console.error("Error checking follow status:", error);
      }
    };

    checkCurrentFollowStatus();
  }, [user, currentUser, isOwnProfile]);

  return (
    <div className="flex flex-col items-center mb-4 md:mb-8 mx-auto max-w-3xl w-full px-4">
      <div className="flex flex-row items-center gap-4 md:gap-24 w-full">
        {/* Avatar Profile */}
        <div>
          <Avatar className="h-20 w-20 md:h-48 md:w-48">
            {user?.profile?.avatarUrl ? (
              <div className="h-full w-full relative overflow-hidden rounded-full">
                <Image
                  src={user?.profile?.avatarUrl}
                  alt={user.profile.name}
                  fill
                  unoptimized={true}
                  className="object-cover"
                  sizes="(max-width: 768px) 80px, 192px"
                  referrerPolicy="no-referrer"
                  priority
                />
              </div>
            ) : (
              <AvatarFallback>
                {user?.profile?.name ? user.profile.name.charAt(0) : ""}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
        {/* User Info */}
        <div className="flex-1">
          <div className="flex flex-row items-center gap-2 md:gap-4 mb-2 mt-4 md:mt-0 md:mb-4 flex-wrap">
            <h1 className="text-base md:text-2xl font-bold">
              {user?.profile?.name}
            </h1>
            <div className="flex gap-1 md:gap-2">
              {isOwnProfile ? (
                // แสดงปุ่ม "แก้ไขโปรไฟล์" สำหรับโปรไฟล์ตัวเอง
                <Button
                  size="sm"
                  variant="outline"
                  className="md:text-base md:py-2 md:px-4 flex items-center gap-2"
                >
                  <Pencil className="h-3 w-3 md:h-4 md:w-4" />
                  แก้ไขโปรไฟล์
                </Button>
              ) : (
                // แสดงปุ่ม Follow และ Message สำหรับโปรไฟล์ของผู้อื่น
                <>
                  <Button
                    size="sm"
                    className={`md:text-base md:py-2 md:px-4 flex items-center gap-1.5 ${
                      isFollowing
                        ? "bg-muted text-foreground hover:bg-muted/80 hover:text-destructive"
                        : ""
                    }`}
                    onClick={handleFollowToggle}
                    disabled={isLoadingFollow}
                    variant={isFollowing ? "outline" : "default"}
                  >
                    {isLoadingFollow ? (
                      <span className="flex items-center">
                        <span className="animate-spin h-4 w-4 mr-2 border-2 border-b-transparent rounded-full"></span>
                        กำลังดำเนินการ...
                      </span>
                    ) : isFollowing ? (
                      <>
                        <UserCheck className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        กำลังติดตาม
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        ติดตาม
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="md:text-base md:py-2 md:px-4 flex items-center gap-1.5"
                    onClick={handleMessageClick}
                    disabled={isLoadingMessage}
                  >
                    {isLoadingMessage ? (
                      <span className="flex items-center">
                        <span className="animate-spin h-4 w-4 mr-2 border-2 border-b-transparent rounded-full"></span>
                        รอสักครู่
                      </span>
                    ) : (
                      <>
                        <MessageSquare className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        ข้อความ
                      </>
                    )}
                  </Button>
                </>
              )}

              {/* แสดงปุ่ม Settings เฉพาะสำหรับโปรไฟล์ตัวเอง */}
              {isOwnProfile && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 md:h-10 md:w-10"
                >
                  <Settings className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex gap-3 md:gap-6 mb-2 md:mb-4">
            <div className="text-center">
              <p className="text-sm md:text-base font-bold">{postsCount}</p>
              <p className="text-xs md:text-sm text-muted-foreground">Posts</p>
            </div>
            <div
              className="text-center cursor-pointer hover:opacity-80"
              onClick={() => openFollowsDialog("followers")}
            >
              <p className="text-sm md:text-base font-bold">{followersCount}</p>
              <p className="text-xs md:text-sm text-muted-foreground">
                Followers
              </p>
            </div>
            <div
              className="text-center cursor-pointer hover:opacity-80"
              onClick={() => openFollowsDialog("following")}
            >
              <p className="text-sm md:text-base font-bold">{followingCount}</p>
              <p className="text-xs md:text-sm text-muted-foreground">
                Following
              </p>
            </div>
          </div>

          {/* User Bio - Hidden on Mobile */}
          <div className="hidden md:block space-y-1">
            <p className="text-base font-medium">@{user.username}</p>
            <p className="text-base">{user?.profile?.bio || ""}</p>
            <p className="text-sm">
              {user?.profile?.website ? (
                <a
                  href={
                    user.profile.website.startsWith("http")
                      ? user.profile.website
                      : `https://${user.profile.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {user.profile.website}
                </a>
              ) : (
                ""
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              {user?.profile?.location || ""}
            </p>
          </div>
        </div>
      </div>

      {/* User Bio - Shown only on Mobile, as a new row */}
      <div className="block md:hidden mt-2 space-y-0.5 w-full self-start">
        <p className="text-sm font-medium">@{user.username}</p>
        <p className="text-sm">{user?.profile?.bio || ""}</p>
        <p className="text-xs">
          {user?.profile?.website ? (
            <a
              href={
                user.profile.website.startsWith("http")
                  ? user.profile.website
                  : `https://${user.profile.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {user.profile.website}
            </a>
          ) : (
            ""
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {user?.profile?.location || ""}
        </p>
      </div>

      <FollowersDialog
        isOpen={showFollowsDialog}
        onClose={() => setShowFollowsDialog(false)}
        userId={user._id}
        username={user.username}
        initialTab={dialogTab}
        followersCount={followersCount}
        followingCount={followingCount}
      />
    </div>
  );
}

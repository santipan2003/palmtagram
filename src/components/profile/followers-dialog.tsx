import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/interfaces/profile.interface";
import { profileService } from "@/services/profile/profile.service";
import { useAuth } from "@/lib/auth-context";
import { UserCheck, UserPlus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface FollowersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  initialTab?: "followers" | "following";
  followersCount: number;
  followingCount: number;
}

export default function FollowersDialog({
  isOpen,
  onClose,
  userId,
  initialTab = "followers",
  followersCount,
  followingCount,
}: FollowersDialogProps) {
  const [activeTab, setActiveTab] = useState<"followers" | "following">(
    initialTab
  );
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingStatus, setFollowingStatus] = useState<
    Record<string, boolean>
  >({});
  const [loadingFollow, setLoadingFollow] = useState<Record<string, boolean>>(
    {}
  );

  const { user: currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // ดึงรายชื่อผู้ติดตามและผู้ที่กำลังติดตาม
  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchData = async () => {
      setLoading(true);

      try {
        if (activeTab === "followers") {
          const followersList = await profileService.getFollowers(userId);
          // เพิ่มการตรวจสอบ followersList ว่าเป็น array หรือไม่
          const validFollowers = Array.isArray(followersList)
            ? followersList
            : [];
          setFollowers(validFollowers);
          console.log(
            "followers data:",
            JSON.stringify(validFollowers, null, 2)
          );
        } else {
          const followingList = await profileService.getFollowing(userId);
          // เพิ่มการตรวจสอบ followingList ว่าเป็น array หรือไม่
          const validFollowing = Array.isArray(followingList)
            ? followingList
            : [];
          setFollowing(validFollowing);
          console.log(
            "following data:",
            JSON.stringify(validFollowing, null, 2)
          );
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching follow data:", error);
        setLoading(false);
        // เซ็ตค่าเป็นอาร์เรย์ว่างเมื่อเกิดข้อผิดพลาด
        if (activeTab === "followers") {
          setFollowers([]);
        } else {
          setFollowing([]);
        }
        toast.error("ไม่สามารถโหลดข้อมูลได้", {
          description: "กรุณาลองใหม่อีกครั้ง",
        });
      }
    };

    fetchData();
  }, [isOpen, userId, activeTab]);

  // แก้ไขในการตรวจสอบสถานะการติดตาม
  useEffect(() => {
    if (!currentUser || !isOpen) return;

    const checkFollowingStatus = async (users: User[]) => {
      const statusMap: Record<string, boolean> = {};

      for (const user of users) {
        if (!user || !user._id || user._id === currentUser._id) continue; // เพิ่มการตรวจสอบ user และ user._id

        try {
          const isFollowing = await profileService.checkFollowStatus(user._id);
          statusMap[user._id] = isFollowing;
        } catch (error) {
          console.error(`Error checking follow status for ${user._id}:`, error);
          statusMap[user._id] = false;
        }
      }

      setFollowingStatus(statusMap);
    };

    // เพิ่มการตรวจสอบ followers และ following ว่าเป็น array หรือไม่
    if (
      activeTab === "followers" &&
      Array.isArray(followers) &&
      followers.length > 0
    ) {
      checkFollowingStatus(followers);
    } else if (
      activeTab === "following" &&
      Array.isArray(following) &&
      following.length > 0
    ) {
      checkFollowingStatus(following);
    }
  }, [followers, following, currentUser, isOpen, activeTab]);
  // เปลี่ยนการติดตาม
  const handleToggleFollow = async (targetUser: User) => {
    if (!currentUser) {
      toast.error("คุณต้องเข้าสู่ระบบก่อน");
      return;
    }

    // ป้องกันการกดซ้ำ
    setLoadingFollow((prev) => ({ ...prev, [targetUser._id]: true }));

    try {
      const isCurrentlyFollowing = followingStatus[targetUser._id];

      if (isCurrentlyFollowing) {
        await profileService.unfollowUser(targetUser._id);
        toast.success(`ยกเลิกการติดตาม ${targetUser.username} แล้ว`);
      } else {
        await profileService.followUser(targetUser._id);
        toast.success(`เริ่มติดตาม ${targetUser.username} แล้ว`);
      }

      // อัปเดตสถานะ
      setFollowingStatus((prev) => ({
        ...prev,
        [targetUser._id]: !isCurrentlyFollowing,
      }));
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error("เกิดข้อผิดพลาด", {
        description: "ไม่สามารถดำเนินการได้ กรุณาลองอีกครั้ง",
      });
    } finally {
      setLoadingFollow((prev) => ({ ...prev, [targetUser._id]: false }));
    }
  };

  const navigateToProfile = (username: string) => {
    router.push(`/${username}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[70vh] flex flex-col">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-center">
            <Tabs
              defaultValue={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as "followers" | "following")
              }
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="followers" className="text-center">
                  ผู้ติดตาม{" "}
                  <span className="ml-1 text-muted-foreground">
                    ({followersCount})
                  </span>
                </TabsTrigger>
                <TabsTrigger value="following" className="text-center">
                  กำลังติดตาม{" "}
                  <span className="ml-1 text-muted-foreground">
                    ({followingCount})
                  </span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 px-1">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : activeTab === "followers" ? (
            <div className="space-y-4">
              {followers.length > 0 ? (
                followers.map((follower) => (
                  <div
                    key={follower._id}
                    className="flex items-center justify-between"
                  >
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => navigateToProfile(follower.username)}
                    >
                      <Avatar className="h-11 w-11">
                        <AvatarImage
                          src={
                            follower.profile?.avatarUrl || "/placeholder.svg"
                          }
                          alt={follower.username}
                        />
                        <AvatarFallback>
                          {follower.username && follower.username.length > 0
                            ? follower.username.charAt(0).toUpperCase()
                            : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {follower.profile?.name ||
                            follower.username ||
                            "ไม่ระบุชื่อ"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          @{follower.username || "ไม่มีชื่อผู้ใช้"}
                        </p>
                      </div>
                    </div>

                    {currentUser && currentUser._id !== follower._id && (
                      <Button
                        size="sm"
                        variant={
                          followingStatus[follower._id] ? "outline" : "default"
                        }
                        className="h-9 text-xs flex items-center gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFollow(follower);
                        }}
                        disabled={!!loadingFollow[follower._id]}
                      >
                        {loadingFollow[follower._id] ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : followingStatus[follower._id] ? (
                          <>
                            <UserCheck className="h-3.5 w-3.5 mr-1" />
                            กำลังติดตาม
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-3.5 w-3.5 mr-1" />
                            ติดตาม
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <p>ยังไม่มีผู้ติดตาม</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {following.length > 0 ? (
                following.map((followedUser) => (
                  <div
                    key={followedUser._id}
                    className="flex items-center justify-between"
                  >
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => navigateToProfile(followedUser.username)}
                    >
                      <Avatar className="h-11 w-11">
                        <AvatarImage
                          src={
                            followedUser.profile?.avatarUrl ||
                            "/placeholder.svg"
                          }
                          alt={followedUser.username}
                        />
                        <AvatarFallback>
                          {followedUser.username &&
                          followedUser.username.length > 0
                            ? followedUser.username.charAt(0).toUpperCase()
                            : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {followedUser.profile?.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          @{followedUser.username}
                        </p>
                      </div>
                    </div>

                    {currentUser && currentUser._id !== followedUser._id && (
                      <Button
                        size="sm"
                        variant={
                          followingStatus[followedUser._id]
                            ? "outline"
                            : "default"
                        }
                        className="h-9 text-xs flex items-center gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFollow(followedUser);
                        }}
                        disabled={!!loadingFollow[followedUser._id]}
                      >
                        {loadingFollow[followedUser._id] ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : followingStatus[followedUser._id] ? (
                          <>
                            <UserCheck className="h-3.5 w-3.5 mr-1" />
                            กำลังติดตาม
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-3.5 w-3.5 mr-1" />
                            ติดตาม
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <p>ยังไม่มีการติดตามผู้ใช้คนอื่น</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

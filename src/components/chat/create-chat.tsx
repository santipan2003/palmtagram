"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { profileService } from "@/services/profile/profile.service";
import { chatService } from "@/services/chat/chat.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, MessageSquare, Search, Send, Users, X } from "lucide-react";
import { toast } from "sonner";
import { User } from "@/interfaces/profile.interface";
import { useAuth } from "@/lib/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { ensureWebSocketToken } from "@/lib/websocket-auth";

interface CreateChatProps {
  onComplete?: () => void;
}

export default function CreateChat({ onComplete }: CreateChatProps) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [followingUsers, setFollowingUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  console.log("followingUsers", followingUsers);
  console.log("filteredUsers", filteredUsers);
  console.log("loadingFollowing", loadingFollowing);
  const [searchTerm, setSearchTerm] = useState("");
  const [startingChat, setStartingChat] = useState(false);
  const [activeTab, setActiveTab] = useState<"private" | "group">("private");

  // เพิ่ม state สำหรับ mutual follows
  const [mutualFollows, setMutualFollows] = useState<User[]>([]);
  const [filteredMutualFollows, setFilteredMutualFollows] = useState<User[]>(
    []
  );
  const [loadingMutual, setLoadingMutual] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [mutualSearchTerm, setMutualSearchTerm] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState("");

  // ดึงรายการผู้ใช้ที่กำลังติดตาม (โค้ดเดิม)
  useEffect(() => {
    const fetchFollowingUsers = async () => {
      if (!currentUser?._id) return;

      try {
        setLoadingFollowing(true);
        const following = await profileService.getFollowing(currentUser._id);
        console.log(
          "ดึงรายชื่อผู้ที่กำลังติดตามสำเร็จ:",
          following.length,
          "คน"
        );
        setFollowingUsers(following);
        setFilteredUsers(following);
      } catch (error) {
        console.error("ไม่สามารถดึงรายชื่อผู้ที่กำลังติดตามได้:", error);
        toast.error("ไม่สามารถดึงรายชื่อผู้ที่คุณกำลังติดตาม", {
          description: "กรุณาลองใหม่อีกครั้ง",
        });
      } finally {
        setLoadingFollowing(false);
      }
    };

    fetchFollowingUsers();
  }, [currentUser]);

  // เพิ่ม useEffect เพื่อดึงรายการผู้ที่ติดตามซึ่งกันและกัน
  useEffect(() => {
    const fetchMutualFollows = async () => {
      if (!currentUser || activeTab !== "group") return;

      try {
        setLoadingMutual(true);
        const mutualUsers = await profileService.getMutualFollowsList();
        console.log(
          "ดึงรายการผู้ที่ติดตามซึ่งกันและกันสำเร็จ:",
          mutualUsers.length,
          "คน"
        );
        setMutualFollows(mutualUsers);
        setFilteredMutualFollows(mutualUsers);
      } catch (error) {
        console.error("ไม่สามารถดึงรายการผู้ที่ติดตามซึ่งกันและกันได้:", error);
        toast.error("ไม่สามารถดึงรายชื่อผู้ที่ติดตามซึ่งกันและกัน", {
          description: "กรุณาลองใหม่อีกครั้ง",
        });
      } finally {
        setLoadingMutual(false);
      }
    };

    fetchMutualFollows();
  }, [currentUser, activeTab]);

  // เพิ่ม useEffect สำหรับกรองรายการ mutual follows ตามคำค้นหา
  useEffect(() => {
    if (!mutualSearchTerm.trim()) {
      setFilteredMutualFollows(mutualFollows);
      return;
    }

    const lowercaseSearch = mutualSearchTerm.toLowerCase();
    const filtered = mutualFollows.filter((user) => {
      const name = user.profile?.name?.toLowerCase() || "";
      const username = user.username?.toLowerCase() || "";

      return (
        name.includes(lowercaseSearch) || username.includes(lowercaseSearch)
      );
    });

    setFilteredMutualFollows(filtered);
  }, [mutualSearchTerm, mutualFollows]);

  // ฟังก์ชันเพิ่ม/ลบผู้ใช้จากรายชื่อที่เลือก
  const toggleUserSelection = (user: User) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u._id === user._id);
      if (isSelected) {
        return prev.filter((u) => u._id !== user._id);
      } else {
        return [...prev, user];
      }
    });
  };

  // ฟังก์ชันสร้างกลุ่มแชท
  const handleCreateGroupChat = async () => {
    if (!groupName.trim()) {
      toast.error("กรุณาระบุชื่อกลุ่ม");
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error("กรุณาเลือกสมาชิกอย่างน้อย 1 คน");
      return;
    }

    setIsCreatingGroup(true);

    try {
      // 1. อัปเดตข้อมูลผู้ใช้ใน localStorage
      if (currentUser) {
        localStorage.setItem(
          "user_data",
          JSON.stringify({
            _id: currentUser._id,
            username: currentUser.username,
          })
        );
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // 2. ตรวจสอบ WebSocket token
      await ensureWebSocketToken();

      toast.loading("กำลังสร้างกลุ่มแชท...");

      // 3. สร้างกลุ่มแชท (ปรับปรุง interface ให้ตรงกับที่แก้ไขในบริการ)
      const room = await chatService.createGroupChat({
        name: groupName,
        participantIds: selectedUsers.map((user) => user._id),
        avatarUrl: undefined,
      });

      toast.dismiss();
      toast.success("สร้างกลุ่มแชทสำเร็จ");

      // นำทางไปยังห้องแชทใหม่
      router.push(`/chat/${room._id}`);
      if (onComplete) onComplete();
    } catch (error) {
      toast.dismiss();
      console.error("ไม่สามารถสร้างกลุ่มแชทได้:", error);
      toast.error("ไม่สามารถสร้างกลุ่มแชทได้", {
        description:
          error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
      });
    } finally {
      setIsCreatingGroup(false);
    }
  };

  // ฟังก์ชันกรองรายชื่อตามคำค้นหา
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(followingUsers);
      return;
    }

    const lowercaseSearch = searchTerm.toLowerCase();
    const filtered = followingUsers.filter((user) => {
      const name = user.profile?.name?.toLowerCase() || "";
      const username = user.username?.toLowerCase() || "";
      return (
        name.includes(lowercaseSearch) || username.includes(lowercaseSearch)
      );
    });

    setFilteredUsers(filtered);
  }, [searchTerm, followingUsers]);

  // ฟังก์ชันสำหรับเริ่มแชทส่วนตัว
  const handleStartPrivateChat = async (user: User) => {
    if (startingChat) return;

    try {
      setStartingChat(true);

      // 1. อัปเดตข้อมูลผู้ใช้ใน localStorage
      if (currentUser) {
        localStorage.setItem(
          "user_data",
          JSON.stringify({
            _id: currentUser._id,
            username: currentUser.username,
          })
        );
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // 2. ตรวจสอบ WebSocket token
      await ensureWebSocketToken();

      // แสดง toast กำลังเปิดแชท
      toast.loading(
        `กำลังเปิดแชทกับ ${user.profile?.name || user.username}...`
      );

      // 3. สร้างหรือดึงห้องแชทส่วนตัว
      const room = await chatService.getPrivateChat(user._id);

      toast.dismiss();
      toast.success("เปิดแชทสำเร็จ", {
        description: `แชทกับ ${user.profile?.name || user.username}`,
      });

      // นำทางไปยังห้องแชท
      router.push(`/chat/${room._id}`);
      if (onComplete) onComplete();
    } catch (error) {
      toast.dismiss();
      console.error("ไม่สามารถเริ่มแชทส่วนตัวได้:", error);
      toast.error("ไม่สามารถเปิดแชทได้", {
        description:
          error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
      });
    } finally {
      setStartingChat(false);
    }
  };

  // ส่วนแสดงผลของแท็บ "สร้างกลุ่ม"
  const renderGroupTab = () => {
    if (loadingMutual) {
      return (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (mutualFollows.length === 0) {
      return (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-300 font-medium">
            คุณไม่มีผู้ที่ติดตามซึ่งกันและกัน
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            เริ่มติดตามและรอให้ผู้อื่นติดตามคุณกลับ
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div>
          <label
            htmlFor="group-name"
            className="block text-sm font-medium mb-1"
          >
            ชื่อกลุ่ม
          </label>
          <Input
            id="group-name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="ระบุชื่อกลุ่ม"
            className="mb-4"
          />
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="ค้นหารายชื่อที่ติดตามซึ่งกันและกัน"
            value={mutualSearchTerm}
            onChange={(e) => setMutualSearchTerm(e.target.value)}
            className="pl-9 pr-4"
          />
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            ผู้ที่ติดตามซึ่งกันและกัน ({filteredMutualFollows.length})
          </p>
          <p className="text-sm text-gray-500">
            เลือกแล้ว {selectedUsers.length} คน
          </p>
        </div>

        {filteredMutualFollows.length === 0 ? (
          <div className="text-center py-5 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Search className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600 dark:text-gray-300">
              ไม่พบผู้ใช้ที่ตรงกับ &quot;{mutualSearchTerm}&quot;
            </p>
          </div>
        ) : (
          <div className="space-y-1 max-h-[250px] overflow-y-auto">
            {filteredMutualFollows.map((user) => {
              const isSelected = selectedUsers.some((u) => u._id === user._id);
              return (
                <div
                  key={user._id}
                  className={`flex items-center p-3 rounded-lg cursor-pointer ${
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => toggleUserSelection(user)}
                >
                  <div className="flex items-center flex-1">
                    <div className="mr-3 relative">
                      <Avatar className="h-10 w-10">
                        {user.profile?.avatarUrl ? (
                          <div className="relative h-full w-full overflow-hidden rounded-full">
                            <Image
                              src={user.profile.avatarUrl}
                              alt={user.profile?.name || user.username}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <AvatarFallback>
                            {(
                              user.profile?.name?.[0] ||
                              user.username?.[0] ||
                              "?"
                            ).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {user.profile?.name || user.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{user.username}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedUsers.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">สมาชิกที่เลือก</p>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <div
                  key={user._id}
                  className="bg-blue-100 dark:bg-blue-900/30 text-sm py-1 px-2 rounded-full flex items-center"
                >
                  <span className="mr-1">
                    {user.profile?.name || user.username}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleUserSelection(user);
                    }}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleCreateGroupChat}
            disabled={
              isCreatingGroup || !groupName.trim() || selectedUsers.length === 0
            }
            className="gap-2"
          >
            {isCreatingGroup ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>กำลังสร้างกลุ่ม...</span>
              </>
            ) : (
              <>
                <Users className="h-4 w-4" />
                <span>สร้างกลุ่มแชท</span>
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  // ส่วน UI สำหรับแชทส่วนตัว
  const renderPrivateChat = () => {
    if (loadingFollowing) {
      return (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (followingUsers.length === 0) {
      return (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Send className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-300 font-medium">
            คุณไม่ได้ติดตามใครเลย
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            เริ่มติดตามผู้ใช้เพื่อส่งข้อความถึงพวกเขา
          </p>
          <Button
            variant="outline"
            className="mt-4 gap-2"
            onClick={() => router.push("/explore")}
          >
            <Users className="h-4 w-4" />
            <span>ค้นหาผู้ใช้</span>
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="ค้นหาผู้ที่คุณกำลังติดตาม"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4"
          />
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            ผู้ที่คุณกำลังติดตาม ({filteredUsers.length})
          </p>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="text-center py-5 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Search className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600 dark:text-gray-300">
              ไม่พบผู้ใช้ที่ตรงกับ &quot;{searchTerm}&quot;
            </p>
          </div>
        ) : (
          <div className="space-y-1 max-h-[350px] overflow-y-auto">
            {filteredUsers.map((user) => (
              <Button
                key={user._id}
                variant="ghost"
                className="w-full justify-start p-3 h-auto hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => handleStartPrivateChat(user)}
                disabled={startingChat}
              >
                <div className="flex items-center w-full gap-3">
                  <Avatar className="h-10 w-10">
                    {user.profile?.avatarUrl ? (
                      <div className="relative h-full w-full overflow-hidden rounded-full">
                        <Image
                          src={user.profile.avatarUrl}
                          alt={user.profile?.name || user.username}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <AvatarFallback>
                        {(
                          user.profile?.name?.[0] ||
                          user.username?.[0] ||
                          "?"
                        ).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>

                  <div className="text-left flex-1">
                    <p className="font-medium">
                      {user.profile?.name || user.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{user.username}
                    </p>
                  </div>

                  <MessageSquare className="h-4 w-4 text-gray-400" />
                </div>
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "private" | "group")}
      >
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="private" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            แชทส่วนตัว
          </TabsTrigger>
          <TabsTrigger value="group" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            สร้างกลุ่ม
          </TabsTrigger>
        </TabsList>

        <TabsContent value="private" className="space-y-4">
          {renderPrivateChat()}
        </TabsContent>

        <TabsContent value="group" className="space-y-4">
          {renderGroupTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
}

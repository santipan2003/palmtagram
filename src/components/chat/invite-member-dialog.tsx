import { useState, useEffect } from "react";
import Image from "next/image";
import { profileService } from "@/services/profile.service";
import { chatService } from "@/services/chat.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { User } from "@/interfaces/profile.interface";
import { Participant } from "@/interfaces/chat.interface";
import { Skeleton } from "@/components/ui/skeleton";

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  currentParticipants: Participant[];
  onMemberAdded?: () => void;
}

export default function InviteMemberDialog({
  open,
  onOpenChange,
  roomId,
  currentParticipants,
  onMemberAdded,
}: InviteMemberDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [mutualFollows, setMutualFollows] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  // ดึงรายชื่อผู้ที่ติดตามซึ่งกันและกัน
  useEffect(() => {
    const fetchMutualFollows = async () => {
      if (!open) return;

      try {
        setLoading(true);
        const users = await profileService.getMutualFollowsList();

        // กรองเฉพาะผู้ที่ยังไม่ได้อยู่ในกลุ่ม
        const currentParticipantIds = currentParticipants.map((p) => p._id);
        const eligibleUsers = users.filter(
          (user) => !currentParticipantIds.includes(user._id)
        );

        console.log(
          `พบผู้ใช้ที่ติดตามซึ่งกันและกัน ${eligibleUsers.length} คนที่ยังไม่ได้อยู่ในกลุ่ม`
        );

        setMutualFollows(eligibleUsers);
        setFilteredUsers(eligibleUsers);
      } catch (error) {
        console.error(
          "ไม่สามารถดึงรายชื่อผู้ที่ติดตามซึ่งกันและกันได้:",
          error
        );
        toast.error("ไม่สามารถโหลดรายชื่อผู้ใช้", {
          description: "กรุณาลองใหม่อีกครั้ง",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMutualFollows();
  }, [open, currentParticipants]);

  // กรองรายชื่อตามคำค้นหา
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(mutualFollows);
      return;
    }

    const lowercaseSearch = searchTerm.toLowerCase();
    const filtered = mutualFollows.filter((user) => {
      const fullName = user.profile?.name?.toLowerCase() || "";
      const username = user.username?.toLowerCase() || "";

      return (
        fullName.includes(lowercaseSearch) || username.includes(lowercaseSearch)
      );
    });

    setFilteredUsers(filtered);
  }, [searchTerm, mutualFollows]);

  // เชิญสมาชิกเข้ากลุ่ม
  const handleInviteUser = async (userId: string) => {
    if (inviting) return;

    setInviting(true);
    try {
      toast.loading(`กำลังเชิญผู้ใช้เข้าร่วมกลุ่ม...`);

      await chatService.addParticipantToGroup(roomId, userId);

      toast.dismiss();
      toast.success("เชิญผู้ใช้เข้าร่วมกลุ่มสำเร็จ");

      // อัปเดตรายชื่อผู้ที่สามารถเชิญได้
      setMutualFollows((prev) => prev.filter((user) => user._id !== userId));

      // แจ้ง parent component ว่ามีการเพิ่มสมาชิกใหม่
      if (onMemberAdded) onMemberAdded();
    } catch (error) {
      toast.dismiss();
      console.error("ไม่สามารถเชิญผู้ใช้เข้าร่วมกลุ่มได้:", error);
      toast.error("ไม่สามารถเชิญผู้ใช้เข้าร่วมกลุ่มได้", {
        description:
          error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
      });
    } finally {
      setInviting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>เชิญสมาชิกเข้าร่วมกลุ่ม</DialogTitle>
          <DialogDescription>
            เชิญผู้ที่ติดตามซึ่งกันและกันเข้าร่วมแชทกลุ่ม
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="ค้นหาชื่อผู้ใช้"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-9 w-16 rounded-md" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  {mutualFollows.length === 0 ? (
                    <>
                      <p className="text-gray-600 dark:text-gray-300">
                        ไม่มีผู้ใช้ที่สามารถเชิญได้
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        ทุกคนที่ติดตามซึ่งกันและกันอยู่ในกลุ่มนี้แล้ว
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-300">
                      ไม่พบผู้ใช้ที่ตรงกับ &ldquo;{searchTerm}&rdquo;
                    </p>
                  )}
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto space-y-1">
                  {filteredUsers.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex items-center gap-3">
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
                        <div>
                          <p className="font-medium">
                            {user.profile?.name || user.username}
                          </p>
                          <p className="text-xs text-gray-500">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleInviteUser(user._id)}
                        disabled={inviting}
                      >
                        {inviting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-1" />
                            เชิญ
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  Pencil,
  Search,
  ImagePlus,
  MoreVertical,
  UserMinus,
  LogOut,
  Image as ImageIcon,
  Check,
  X,
  BellOff,
  Bell,
  ExternalLink,
  UserCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ChatRoom, Message } from "@/interfaces/chat.interface";
import { UserProfile } from "@/interfaces/auth.interface";
import { Switch } from "@/components/ui/switch";
import { chatService } from "@/services/chat/chat.service";

interface GroupInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: ChatRoom;
  roomId: string;
  currentUser: UserProfile | null;
  onRoomUpdated: () => Promise<void>;
}

export default function GroupInfoDialog({
  open,
  onOpenChange,
  room,
  roomId,
  currentUser,
  onRoomUpdated,
}: GroupInfoDialogProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("members");
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(room.metadata?.name || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [messageSearchTerm, setMessageSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [searchingMessages, setSearchingMessages] = useState(false);
  const [sharedMedia, setSharedMedia] = useState<
    { url: string; type: string }[]
  >([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMuted, setIsMuted] = useState(false);

  // ฟังก์ชันสำหรับเปลี่ยนสถานะการแจ้งเตือน
  const handleToggleNotification = () => {
    setIsMuted(!isMuted);
    toast.success(
      isMuted
        ? "เปิดการแจ้งเตือนสำหรับกลุ่มนี้แล้ว"
        : "ปิดการแจ้งเตือนสำหรับกลุ่มนี้แล้ว"
    );

    // ในระบบจริง ควรมีการบันทึกการตั้งค่าไปยังเซิร์ฟเวอร์
    // เช่น await chatService.updateNotificationSettings(roomId, !isMuted);
  };

  // ฟังก์ชันสำหรับไปยังหน้าโปรไฟล์ของผู้ใช้
  const goToUserProfile = (username: string) => {
    onOpenChange(false); // ปิด dialog ก่อน
    router.push(`/${username}`);
  };

  // ฟิลเตอร์สมาชิกตามคำค้นหา
  const filteredParticipants = room.participants.filter((participant) => {
    if (!searchTerm) return true;

    const name = participant.profile?.name?.toLowerCase() || "";
    const username = participant.username?.toLowerCase() || "";
    return (
      name.includes(searchTerm.toLowerCase()) ||
      username.includes(searchTerm.toLowerCase())
    );
  });

  // โหลดรูปภาพที่แชร์ในกลุ่ม
  const loadSharedMedia = useCallback(async () => {
    if (activeTab !== "media") return;

    try {
      setLoadingMedia(true);
      // ในระบบจริงควรมี API ที่ดึงรูปภาพจากห้องแชท
      // แต่ในตัวอย่างนี้เราจะจำลองข้อมูล

      // simulateLoadingMedia
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // สร้างข้อมูลจำลองสำหรับรูปภาพที่แชร์
      const mockImages = Array(9)
        .fill(null)
        .map((_, i) => ({
          url: `https://source.unsplash.com/random/300x300?sig=${i}`,
          type: "image",
        }));

      setSharedMedia(mockImages);
    } catch (error) {
      console.error("ไม่สามารถโหลดรูปภาพที่แชร์ได้:", error);
      toast.error("ไม่สามารถโหลดรูปภาพที่แชร์ได้");
    } finally {
      setLoadingMedia(false);
    }
  }, [activeTab]);

  // โหลดข้อมูลเมื่อเปลี่ยน tab
  useEffect(() => {
    if (activeTab === "media") {
      loadSharedMedia();
    }
  }, [activeTab, loadSharedMedia]);

  // อัปเดตชื่อกลุ่ม
  const handleUpdateGroupName = async () => {
    if (!groupName.trim() || groupName === room.metadata?.name) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    try {
      // ในระบบจริง ควรเรียกใช้ chatService.updateGroupChat
      // แต่เนื่องจากไม่มีในตัวอย่างโค้ด เราจึงจำลองเป็นแอพที่สำเร็จ
      await new Promise((resolve) => setTimeout(resolve, 500));

      toast.success("อัปเดตชื่อกลุ่มสำเร็จ");
      onRoomUpdated();
      setIsEditing(false);
    } catch (error) {
      console.error("ไม่สามารถอัปเดตชื่อกลุ่มได้:", error);
      toast.error("ไม่สามารถอัปเดตชื่อกลุ่มได้");
    } finally {
      setLoading(false);
    }
  };

  // อัปโหลดรูปภาพกลุ่ม
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      // สร้าง FormData สำหรับอัปโหลดไฟล์
      const formData = new FormData();
      formData.append("image", file);

      // ในระบบจริง ควรเรียกใช้ API อัปโหลดรูปภาพ
      // แต่เนื่องจากไม่มีในตัวอย่างโค้ด เราจึงจำลองเป็นแอพที่สำเร็จ
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("อัปโหลดรูปภาพกลุ่มสำเร็จ");
      onRoomUpdated();
    } catch (error) {
      console.error("ไม่สามารถอัปโหลดรูปภาพได้:", error);
      toast.error("ไม่สามารถอัปโหลดรูปภาพได้");
    } finally {
      setUploadingImage(false);
    }
  };

  // ลบสมาชิกออกจากกลุ่ม
  const handleRemoveMember = async (participantId: string) => {
    if (participantId === currentUser?._id) {
      // ไม่ควรลบตัวเองด้วยฟังก์ชันนี้
      return;
    }

    try {
      toast.loading("กำลังนำสมาชิกออกจากกลุ่ม...");

      // เรียกใช้ removeParticipantFromGroup จาก chatService
      await chatService.removeParticipantFromGroup(roomId, participantId);

      toast.dismiss();
      toast.success("นำสมาชิกออกจากกลุ่มสำเร็จ");
      onRoomUpdated(); // รีเฟรชข้อมูลห้องแชท
    } catch (error) {
      toast.dismiss();
      console.error("ไม่สามารถนำสมาชิกออกจากกลุ่มได้:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "ไม่สามารถนำสมาชิกออกจากกลุ่มได้"
      );
    }
  };

  // ออกจากกลุ่ม
  const handleLeaveGroup = async () => {
    if (!currentUser) return;

    // ยืนยันก่อนออกจากกลุ่ม
    if (!confirm("คุณต้องการออกจากกลุ่มนี้ใช่หรือไม่?")) {
      return;
    }

    try {
      toast.loading("กำลังออกจากกลุ่ม...");

      // เรียกใช้ leaveGroup จาก chatService
      await chatService.leaveGroup(roomId);

      toast.dismiss();
      toast.success("ออกจากกลุ่มสำเร็จ");
      router.push("/chat"); // นำผู้ใช้กลับไปยังหน้ารายการแชท
    } catch (error) {
      toast.dismiss();
      console.error("ไม่สามารถออกจากกลุ่มได้:", error);
      toast.error(
        error instanceof Error ? error.message : "ไม่สามารถออกจากกลุ่มได้"
      );
    }
  };

  // ค้นหาข้อความในห้องแชท
  const handleSearchMessages = async () => {
    if (!messageSearchTerm.trim()) return;

    try {
      setSearchingMessages(true);
      // ในระบบจริง ควรเรียกใช้ API ค้นหาข้อความ
      await new Promise((resolve) => setTimeout(resolve, 800));

      // สร้างข้อมูลจำลองสำหรับผลการค้นหา
      const mockResults = Array(3)
        .fill(null)
        .map((_, i) => ({
          _id: `mock-message-${i}`,
          content: `ข้อความที่มีคำว่า "${messageSearchTerm}" อยู่ในเนื้อหา (${
            i + 1
          })`,
          createdAt: new Date(Date.now() - i * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - i * 86400000).toISOString(), // เพิ่ม updatedAt
          senderId: {
            _id:
              i % 2 === 0 ? currentUser?._id || "" : room.participants[0]._id,
            username:
              i % 2 === 0
                ? currentUser?.username || ""
                : room.participants[0].username,
            profile: {
              name:
                i % 2 === 0
                  ? currentUser?.profile?.name || ""
                  : room.participants[0].profile?.name,
              avatarUrl:
                i % 2 === 0
                  ? currentUser?.profile?.avatarUrl || ""
                  : room.participants[0].profile?.avatarUrl,
            },
          },
          roomId: roomId,
          type: "text", // เพิ่ม type ตาม interface Message
        })) as Message[]; // เพิ่ม type assertion

      setSearchResults(mockResults);
    } catch (error) {
      console.error("ไม่สามารถค้นหาข้อความได้:", error);
      toast.error("ไม่สามารถค้นหาข้อความได้");
    } finally {
      setSearchingMessages(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-center">รายละเอียดกลุ่ม</DialogTitle>
        </DialogHeader>

        {/* ส่วนบนแสดงข้อมูลกลุ่ม */}
        <div className="flex flex-col items-center pb-4 relative">
          {/* รูปกลุ่ม */}
          <div className="relative group">
            <Avatar className="w-24 h-24 mb-3">
              {room.metadata?.avatarUrl ? (
                <div className="relative h-full w-full overflow-hidden rounded-full">
                  <Image
                    src={room.metadata.avatarUrl}
                    alt={room.metadata?.name || "กลุ่ม"}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-2xl">
                  <Users className="h-10 w-10" />
                </AvatarFallback>
              )}
            </Avatar>

            {/* ปุ่มเปลี่ยนรูปกลุ่ม */}
            <div
              className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-8 w-8 text-white" />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
                disabled={uploadingImage}
              />
            </div>

            {uploadingImage && (
              <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center">
                <svg
                  className="animate-spin h-8 w-8 text-white"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* ชื่อกลุ่ม */}
          <div className="mb-2 flex items-center">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="max-w-[200px]"
                  placeholder="ชื่อกลุ่ม"
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleUpdateGroupName}
                  disabled={loading}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setGroupName(room.metadata?.name || "");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <h3 className="font-semibold text-lg">
                  {room.metadata?.name || "กลุ่มไม่มีชื่อ"}
                </h3>
                <Button
                  size="icon"
                  variant="ghost"
                  className="ml-2"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          <Badge variant="outline" className="mb-3">
            {room.participants.length} สมาชิก
          </Badge>

          {/* เพิ่มการตั้งค่าแจ้งเตือน */}
          <div className="flex items-center justify-center space-x-2 w-full mb-2">
            <div className="flex items-center space-x-2">
              {isMuted ? (
                <BellOff className="h-4 w-4 text-gray-500" />
              ) : (
                <Bell className="h-4 w-4 text-blue-500" />
              )}
              <span className="text-sm font-medium">การแจ้งเตือน</span>
            </div>

            <Switch
              checked={!isMuted}
              onCheckedChange={() => handleToggleNotification()}
            />
          </div>
        </div>

        <Separator />

        {/* Tabs สำหรับสลับระหว่างหน้าต่างๆ */}
        <Tabs
          defaultValue="members"
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>สมาชิก</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              <span>รูปภาพ</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span>ค้นหา</span>
            </TabsTrigger>
          </TabsList>

          {/* สมาชิก */}
          <TabsContent value="members" className="flex-1 overflow-y-auto">
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ค้นหาสมาชิก"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="space-y-1">
              {filteredParticipants.map((participant) => (
                <div
                  key={participant._id}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    participant._id === currentUser?._id
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {/* ชื่อและรูปผู้ใช้ - แก้ไขให้คลิกไปยังโปรไฟล์ได้ */}
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => goToUserProfile(participant.username)}
                  >
                    <Avatar className="h-10 w-10">
                      {participant.profile?.avatarUrl ? (
                        <div className="relative h-full w-full overflow-hidden rounded-full">
                          <Image
                            src={participant.profile.avatarUrl}
                            alt={
                              participant.profile?.name || participant.username
                            }
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <AvatarFallback>
                          {(
                            participant.profile?.name?.[0] ||
                            participant.username?.[0] ||
                            "?"
                          ).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <div className="flex items-center">
                        <p className="font-medium">
                          {participant.profile?.name || participant.username}
                          {participant._id === currentUser?._id && (
                            <span className="text-gray-500 text-xs ml-1">
                              (คุณ)
                            </span>
                          )}
                        </p>
                        <ExternalLink className="h-3 w-3 ml-1 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-500">
                        @{participant.username}
                      </p>
                    </div>
                  </div>

                  {/* ตัวเลือกสำหรับผู้ใช้อื่น */}
                  {participant._id !== currentUser?._id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {/* เพิ่มลิงก์ไปยังโปรไฟล์ */}
                        <DropdownMenuItem
                          onClick={() => goToUserProfile(participant.username)}
                          className="cursor-pointer"
                        >
                          <UserCircle className="h-4 w-4 mr-2" />
                          ดูโปรไฟล์
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => handleRemoveMember(participant._id)}
                          className="text-red-500 cursor-pointer"
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          นำออกจากกลุ่ม
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  {/* สำหรับผู้ใช้ปัจจุบัน ให้แสดงปุ่มดูโปรไฟล์ */}
                  {participant._id === currentUser?._id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => goToUserProfile(participant.username)}
                    >
                      <UserCircle className="h-3.5 w-3.5 mr-1" />
                      โปรไฟล์
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* ปุ่มเชิญสมาชิกและออกจากกลุ่ม */}
            <div className="mt-4 space-y-2">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  // หน่วงเวลาเล็กน้อยเพื่อให้ dialog ปัจจุบันปิดก่อน
                  setTimeout(() => {
                    const inviteButton = document.querySelector(
                      '[data-invite-button="true"]'
                    );
                    if (inviteButton) {
                      (inviteButton as HTMLButtonElement).click();
                    }
                  }, 100);
                }}
              >
                <Users className="h-4 w-4 mr-2" />
                เชิญสมาชิกเพิ่ม
              </Button>

              <Button
                className="w-full"
                variant="destructive"
                onClick={handleLeaveGroup}
              >
                <LogOut className="h-4 w-4 mr-2" />
                ออกจากกลุ่ม
              </Button>
            </div>
          </TabsContent>

          {/* รูปภาพ */}
          <TabsContent value="media" className="flex-1 overflow-y-auto p-2">
            {loadingMedia ? (
              <div className="grid grid-cols-3 gap-1">
                {Array(9)
                  .fill(null)
                  .map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse"
                    />
                  ))}
              </div>
            ) : sharedMedia.length > 0 ? (
              <div className="grid grid-cols-3 gap-1">
                {sharedMedia.map((media, i) => (
                  <div
                    key={i}
                    className="aspect-square relative rounded-md overflow-hidden cursor-pointer"
                  >
                    <Image
                      src={media.url}
                      alt={`Shared media ${i}`}
                      fill
                      sizes="(max-width: 768px) 33vw, 150px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <ImageIcon className="h-16 w-16 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 dark:text-gray-300 font-medium">
                  ไม่พบรูปภาพในการสนทนา
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  รูปภาพที่แชร์ในกลุ่มจะแสดงที่นี่
                </p>
              </div>
            )}
          </TabsContent>

          {/* ค้นหา */}
          <TabsContent value="search" className="flex-1 overflow-y-auto">
            <div className="mb-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="ค้นหาข้อความในการสนทนา"
                    value={messageSearchTerm}
                    onChange={(e) => setMessageSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button
                  onClick={handleSearchMessages}
                  disabled={!messageSearchTerm.trim() || searchingMessages}
                >
                  {searchingMessages ? (
                    <svg
                      className="animate-spin h-4 w-4 mr-2"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  ค้นหา
                </Button>
              </div>
            </div>

            {/* ผลการค้นหา */}
            <div className="space-y-3">
              {searchingMessages ? (
                <div className="flex justify-center py-8">
                  <div className="text-center">
                    <svg
                      className="animate-spin h-8 w-8 mx-auto text-blue-500 mb-2"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <p>กำลังค้นหา...</p>
                  </div>
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  <p className="text-sm text-gray-500">
                    พบ {searchResults.length} ผลการค้นหา
                  </p>
                  {searchResults.map((message, index) => (
                    <div
                      key={`search-${message._id}-${index}`}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      onClick={() => {
                        onOpenChange(false);
                        // ในระบบจริง ควรเลื่อนไปที่ข้อความที่ค้นหาเจอ
                        toast.success("เลื่อนไปยังข้อความที่ค้นหา");
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-6 w-6">
                          {message.senderId?.profile?.avatarUrl ? (
                            <div className="relative h-full w-full overflow-hidden rounded-full">
                              <Image
                                src={message.senderId.profile.avatarUrl}
                                alt={
                                  message.senderId.profile?.name ||
                                  message.senderId.username ||
                                  "ไม่ระบุชื่อ"
                                }
                                fill
                                sizes="24px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <AvatarFallback className="text-xs">
                              {(
                                message.senderId?.profile?.name?.[0] ||
                                message.senderId?.username?.[0] ||
                                "?"
                              ).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span className="text-sm font-medium">
                          {message.senderId?.profile?.name ||
                            message.senderId?.username ||
                            "ไม่ระบุผู้ส่ง"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  ))}
                </>
              ) : messageSearchTerm ? (
                <div className="text-center py-10">
                  <Search className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 dark:text-gray-300">
                    ไม่พบข้อความที่ตรงกับ &quot;{messageSearchTerm}&quot;
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    ลองใช้คำค้นหาอื่น
                  </p>
                </div>
              ) : (
                <div className="text-center py-10">
                  <Search className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 dark:text-gray-300">
                    ค้นหาข้อความในการสนทนา
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    พิมพ์คำค้นหาเพื่อค้นหาข้อความในประวัติการสนทนา
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

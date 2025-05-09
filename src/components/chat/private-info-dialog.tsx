"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  UserCircle,
  Search,
  Image as ImageIcon,
  Bell,
  BellOff,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ChatRoom, Message, Participant } from "@/interfaces/chat.interface";
import { UserProfile } from "@/interfaces/auth.interface";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import Link from "next/link";

interface PrivateInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: ChatRoom;
  roomId: string;
  recipient: Participant;
  currentUser: UserProfile | null;
  isRecipientOnline: boolean;
  lastActive?: Date;
}

export default function PrivateInfoDialog({
  open,
  onOpenChange,
  roomId,
  recipient,
  currentUser,
  isRecipientOnline,
  lastActive,
}: PrivateInfoDialogProps) {
  const [activeTab, setActiveTab] = useState<string>("details");
  const [messageSearchTerm, setMessageSearchTerm] = useState("");
  const [searchingMessages, setSearchingMessages] = useState(false);
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [sharedMedia, setSharedMedia] = useState<
    { url: string; type: string }[]
  >([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // โหลดรูปภาพที่แชร์ในห้องแชท
  const loadSharedMedia = useCallback(async () => {
    if (activeTab !== "media") return;

    try {
      setLoadingMedia(true);
      // จำลองการโหลดข้อมูล - ในระบบจริงควรเรียก API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // สร้างข้อมูลจำลองสำหรับรูปภาพที่แชร์
      const mockImages = Array(6)
        .fill(null)
        .map((_, i) => ({
          url: `https://source.unsplash.com/random/300x300?people&sig=${i}`,
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

  // ค้นหาข้อความในห้องแชท
  const handleSearchMessages = async () => {
    if (!messageSearchTerm.trim()) return;

    try {
      setSearchingMessages(true);
      // จำลองการค้นหา - ในระบบจริงควรเรียก API
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
            _id: i % 2 === 0 ? currentUser?._id || "" : recipient._id,
            username:
              i % 2 === 0 ? currentUser?.username || "" : recipient.username,
            profile: {
              name:
                i % 2 === 0
                  ? currentUser?.profile?.name || ""
                  : recipient.profile?.name,
              avatarUrl:
                i % 2 === 0
                  ? currentUser?.profile?.avatarUrl || ""
                  : recipient.profile?.avatarUrl,
            },
          },
          roomId: roomId,
          type: "text", // เพิ่ม type ที่จำเป็น
        })) as Message[];

      setSearchResults(mockResults);
    } catch (error) {
      console.error("ไม่สามารถค้นหาข้อความได้:", error);
      toast.error("ไม่สามารถค้นหาข้อความได้");
    } finally {
      setSearchingMessages(false);
    }
  };

  // จัดการการปิดแจ้งเตือน
  const handleToggleMute = () => {
    setIsMuted((prev) => !prev);
    toast.success(isMuted ? "เปิดการแจ้งเตือนแล้ว" : "ปิดการแจ้งเตือนแล้ว");
  };

  // จัดการการบล็อกผู้ใช้
  const handleToggleBlock = () => {
    if (isBlocked) {
      // ยืนยันก่อนยกเลิกการบล็อก
      if (confirm("ต้องการยกเลิกการบล็อกผู้ใช้นี้หรือไม่?")) {
        setIsBlocked(false);
        toast.success("ยกเลิกการบล็อกผู้ใช้แล้ว");
      }
    } else {
      // ยืนยันก่อนบล็อก
      if (
        confirm(
          "ต้องการบล็อกผู้ใช้นี้หรือไม่? คุณจะไม่ได้รับข้อความจากผู้ใช้นี้อีก"
        )
      ) {
        setIsBlocked(true);
        toast.success("บล็อกผู้ใช้แล้ว");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-center">รายละเอียดการสนทนา</DialogTitle>
        </DialogHeader>

        {/* ส่วนบนแสดงข้อมูลผู้ใช้ */}
        <div className="flex flex-col items-center pb-4 relative">
          {/* รูปโปรไฟล์ผู้ใช้ */}
          <div className="relative">
            <Avatar className="w-24 h-24 mb-3 border-2 border-white shadow">
              {recipient.profile?.avatarUrl ? (
                <div className="relative h-full w-full overflow-hidden rounded-full">
                  <Image
                    src={recipient.profile.avatarUrl}
                    alt={recipient.profile?.name || recipient.username}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-pink-500 to-blue-500 text-white text-2xl">
                  {(
                    recipient.profile?.name?.[0] ||
                    recipient.username?.[0] ||
                    "?"
                  ).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>

            {/* แสดงสถานะออนไลน์ */}
            {isRecipientOnline && (
              <span className="absolute bottom-3 right-0 block h-5 w-5 rounded-full bg-green-500 border-2 border-white"></span>
            )}
          </div>

          {/* ชื่อและสถานะผู้ใช้ */}
          <h3 className="font-semibold text-lg">
            {recipient.profile?.name || recipient.username}
          </h3>
          <div className="text-sm text-gray-500 mb-2">
            @{recipient.username}
          </div>

          <div className="text-sm text-gray-600 mb-3">
            {isRecipientOnline ? (
              <span className="text-green-500">ออนไลน์</span>
            ) : (
              <span>
                ใช้งานล่าสุด{" "}
                {lastActive
                  ? formatDistanceToNow(new Date(lastActive), {
                      locale: th,
                      addSuffix: true,
                    })
                  : "ไม่ทราบ"}
              </span>
            )}
          </div>

          {/* ปุ่มไปยังโปรไฟล์ */}
          <Link href={`/profile/${recipient.username}`} passHref>
            <Button
              variant="outline"
              className="mb-3"
              onClick={() => onOpenChange(false)}
            >
              <UserCircle className="h-4 w-4 mr-2" />
              ดูโปรไฟล์
            </Button>
          </Link>
        </div>

        <Separator />

        {/* Tabs สำหรับสลับระหว่างหน้าต่างๆ */}
        <Tabs
          defaultValue="details"
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              <span>รายละเอียด</span>
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

          {/* รายละเอียด */}
          <TabsContent value="details" className="flex-1 overflow-y-auto">
            <div className="space-y-4 p-2">
              {/* รายละเอียดผู้ใช้ */}
              {recipient.profile?.bio && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">เกี่ยวกับ</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {recipient.profile.bio}
                  </p>
                </div>
              )}

              {/* การตั้งค่าการสนทนา */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="text-sm font-medium mb-3">การตั้งค่าการสนทนา</h4>

                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-between"
                    onClick={handleToggleMute}
                  >
                    <div className="flex items-center">
                      {isMuted ? (
                        <BellOff className="h-4 w-4 mr-2" />
                      ) : (
                        <Bell className="h-4 w-4 mr-2" />
                      )}
                      <span>การแจ้งเตือน</span>
                    </div>
                    <Badge variant={isMuted ? "outline" : "default"}>
                      {isMuted ? "ปิด" : "เปิด"}
                    </Badge>
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-between text-red-500"
                    onClick={handleToggleBlock}
                  >
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      <span>
                        {isBlocked ? "เลิกบล็อกผู้ใช้" : "บล็อกผู้ใช้"}
                      </span>
                    </div>
                    <Badge
                      variant={isBlocked ? "destructive" : "outline"}
                      className={isBlocked ? "" : "text-red-500"}
                    >
                      {isBlocked ? "บล็อกแล้ว" : "ไม่ได้บล็อก"}
                    </Badge>
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* รูปภาพ */}
          <TabsContent value="media" className="flex-1 overflow-y-auto p-2">
            {loadingMedia ? (
              <div className="grid grid-cols-3 gap-1">
                {Array(6)
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
                    onClick={() => toast.info("เปิดรูปภาพ")}
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
                  รูปภาพที่แชร์ในการสนทนาจะแสดงที่นี่
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
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => {
                        onOpenChange(false);
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
                                  message.senderId?.profile?.name ||
                                  message.senderId?.username ||
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
                            "ไม่ระบุชื่อ"}
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

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { chatService } from "@/services/chat/chat.service";
import { useAuth } from "@/lib/auth-context";
import { useChat } from "@/hooks/useChat";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, MessageSquare, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  ChatRoom,
  Participant,
  RoomParticipantsChangedEvent,
} from "@/interfaces/chat.interface";
import CreateChat from "./create-chat";

interface UnreadCountData {
  roomId: string;
  count: number;
}

// ฟังก์ชันสำหรับการแสดงข้อความตามประเภท
function getMessagePreview(content: string, type?: string): string {
  // ถ้าไม่มีเนื้อหาหรือเป็นข้อความว่าง
  if (!content || content.trim() === "") {
    return "ไม่มีข้อความ";
  }

  // จัดการกับข้อความตามประเภท
  switch (type) {
    case "image":
      return "📷 รูปภาพ";
    case "file":
      return "📎 ไฟล์";
    case "sticker":
      return "🏷️ สติกเกอร์";
    case "audio":
      return "🎵 เสียง";
    case "video":
      return "🎬 วิดีโอ";
    default:
      // ตัดข้อความที่ยาวเกินไป
      return content.length > 50 ? `${content.substring(0, 47)}...` : content;
  }
}

export default function ChatRoomList() {
  const router = useRouter();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateChat, setShowCreateChat] = useState(false);
  const { user: currentUser } = useAuth();
  const {
    onlineUsers,
    onRoomLastMessageUpdated,
    getUnreadCountForAllRooms, // เปลี่ยนจาก getAllUnreadCounts
    unreadCounts,
    onRoomParticipantsChanged,
    onUserRoomsChanged,
  } = useChat();

  // เพิ่ม useEffect เพื่อจัดการกับการเปลี่ยนแปลงสมาชิกในห้อง
  useEffect(() => {
    // ลงทะเบียนรับการเปลี่ยนแปลงสมาชิก
    const unsubscribe = onRoomParticipantsChanged((data) => {
      console.log("ได้รับการเปลี่ยนแปลงสมาชิก:", data);

      // อัพเดต room state โดยตรงโดยไม่ต้องเรียก API
      setRooms((prevRooms) => {
        return prevRooms.map((room) => {
          if (room._id === data.roomId) {
            return {
              ...room,
              participants: data.participants,
              // สร้างข้อความ lastMessage แบบ system message เพื่อแสดงการเปลี่ยนแปลง
              lastMessage: {
                _id: `system-${Date.now()}`,
                roomId: data.roomId,
                content: createSystemMessageContent(data),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                type: "system",
                senderId: null,
                readBy: [],
              },
            };
          }
          return room;
        });
      });

      // แสดง toast notification
      if (data.action && data.targetUser) {
        const name = data.targetUser.profile?.name || data.targetUser.username;
        if (data.action === "add") {
          toast.info(`${name} ได้เข้าร่วมห้องแชท`);
        } else if (data.action === "remove") {
          toast.info(`${name} ถูกนำออกจากห้องแชท`);
        } else if (data.action === "leave") {
          toast.info(`${name} ได้ออกจากห้องแชท`);
        }
      }
    });

    return () => unsubscribe();
  }, [onRoomParticipantsChanged]);

  // เพิ่มฟังก์ชันสำหรับสร้างข้อความระบบตามประเภทของการเปลี่ยนแปลง
  const createSystemMessageContent = (
    data: RoomParticipantsChangedEvent
  ): string => {
    if (!data.targetUser) return "มีการเปลี่ยนแปลงสมาชิกในห้องแชท";

    const name = data.targetUser.profile?.name || data.targetUser.username;

    switch (data.action) {
      case "add":
        return `${name} ได้เข้าร่วมห้องแชท`;
      case "remove":
        return `${name} ถูกนำออกจากห้องแชท`;
      case "leave":
        return `${name} ได้ออกจากห้องแชท`;
      default:
        return "มีการเปลี่ยนแปลงสมาชิกในห้องแชท";
    }
  };

  useEffect(() => {
    const handleFocus = () => {
      // เมื่อหน้าต่างได้รับ focus และอยู่ที่หน้า chat list
      if (
        typeof window !== "undefined" &&
        window.location.pathname === "/chat"
      ) {
        console.log(
          "หน้าต่างได้รับ focus - กำลังรีเฟรชข้อมูลจำนวนข้อความที่ยังไม่ได้อ่าน"
        );

        // ใช้ API เพื่อดึงข้อมูลที่แน่นอน แทนการใช้ WebSocket
        chatService
          .getUnreadCountsForAllRooms()
          .then((data: Array<{ roomId: string; count: number }>) => {
            // อัพเดทห้องด้วยข้อมูล unread count
            setRooms((prevRooms) =>
              prevRooms.map((room) => {
                const unreadItem = data.find(
                  (item) => item.roomId === room._id
                );
                return unreadItem
                  ? { ...room, unreadCount: unreadItem.count }
                  : room;
              })
            );
          })
          .catch((error) => {
            console.error(
              "ไม่สามารถดึงข้อมูลจำนวนข้อความที่ยังไม่ได้อ่าน:",
              error
            );
          });
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleFocus);
      // เรียกครั้งแรกเมื่อโหลดหน้า
      if (document.hasFocus()) {
        handleFocus();
      }
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", handleFocus);
      }
    };
  }, []);

  // เรียกใช้เมื่อ component โหลดหรือต้องการรีเฟรช
  useEffect(() => {
    // อัพเดทจำนวนข้อความที่ยังไม่ได้อ่าน
    getUnreadCountForAllRooms()
      .then((data) => {
        // ใช้ type assertion (as) เพื่อบอก TypeScript ว่าข้อมูลที่ได้รับมีโครงสร้างตาม UnreadCountData[]
        const unreadData = data as UnreadCountData[];

        // อัพเดท unreadCount ในแต่ละห้อง
        setRooms((prevRooms) =>
          prevRooms.map((room) => {
            const unreadItem = unreadData.find(
              (item) => item.roomId === room._id
            );
            return unreadItem
              ? { ...room, unreadCount: unreadItem.count }
              : room;
          })
        );
      })
      .catch((error) => {
        console.error("ไม่สามารถดึงจำนวนข้อความที่ยังไม่ได้อ่าน:", error);
      });
  }, [getUnreadCountForAllRooms]);

  // เพิ่ม useEffect เพื่อใช้ข้อมูล unreadCounts อัพเดท rooms
  useEffect(() => {
    if (unreadCounts && unreadCounts.length > 0) {
      setRooms((prevRooms) =>
        prevRooms.map((room) => {
          // หาข้อมูลจำนวนข้อความที่ยังไม่ได้อ่านจาก unreadCounts
          const unreadItem = unreadCounts.find(
            (item) => item.roomId === room._id
          );

          if (unreadItem) {
            return { ...room, unreadCount: unreadItem.count };
          }
          return room;
        })
      );
    }
  }, [unreadCounts]);

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      console.log("กำลังดึงข้อมูลห้องแชทใหม่ทั้งหมด...");
      const data = await chatService.getRoomsAndLastMessage();
      console.log("ดึงข้อมูลห้องแชทสำเร็จ:", data.length, "ห้อง");
      setRooms(data);

      // ดึงข้อมูล unread counts ด้วย
      const unreadData = await chatService.getUnreadCountsForAllRooms();
      setRooms((prevRooms) =>
        prevRooms.map((room) => {
          const unreadItem = unreadData.find(
            (item) => item.roomId === room._id
          );
          return unreadItem ? { ...room, unreadCount: unreadItem.count } : room;
        })
      );
    } catch (error) {
      console.error("ไม่สามารถดึงข้อมูลห้องแชทได้:", error);
      toast.error("ไม่สามารถดึงข้อมูลห้องแชท", {
        description: "กรุณาลองใหม่อีกครั้ง",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    const unsubscribe = onUserRoomsChanged((data) => {
      console.log("ได้รับการเปลี่ยนแปลงรายการห้องแชท:", data);

      // แสดง toast notification แบบละเอียดมากขึ้น
      if (data.action === "add") {
        toast.success(
          `คุณถูกเพิ่มเข้าห้องแชท "${data.roomName || "ไม่มีชื่อ"}"`,
          {
            description: data.byName ? `โดย ${data.byName}` : undefined,
          }
        );
      } else if (data.action === "remove") {
        toast.info(`คุณถูกนำออกจากห้องแชท`);
      }

      // เรียกใช้ fetchRooms เพื่อดึงข้อมูลห้องแชทใหม่ทั้งหมด
      fetchRooms();
    });

    return () => unsubscribe();
  }, [onUserRoomsChanged, fetchRooms]);

  useEffect(() => {
    if (!onRoomLastMessageUpdated) {
      console.warn("onRoomLastMessageUpdated ไม่ถูกพบใน useChat");
      return;
    }

    const unsubscribe = onRoomLastMessageUpdated((roomId, lastMessage) => {
      // อัพเดทเฉพาะ lastMessage โดยไม่ต้องเปลี่ยน unreadCount
      // เพราะ unreadCount จะถูกอัพเดทโดย useChat.ts และส่งมาผ่าน unreadCounts prop
      setRooms((prevRooms) =>
        prevRooms.map((room) => {
          if (room._id === roomId) {
            return {
              ...room,
              lastMessage,
              // ไม่อัพเดท unreadCount ที่นี่
            };
          }
          return room;
        })
      );
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [onRoomLastMessageUpdated]);

  // จัดการคลิกที่ห้องแชท - ทำเครื่องหมายว่าอ่านแล้วและนำทางไป
  const handleRoomClick = useCallback(
    (room: ChatRoom) => {
      // เช็คว่า room._id มีค่าหรือไม่
      if (!room || !room._id) {
        console.error("ไม่พบ ID ของห้องแชท");
        return;
      }

      // เราไม่ mark as read ที่นี่แล้ว จะไปทำใน chat-page เมื่อผู้ใช้เห็นข้อความจริงๆ
      // แต่ยัง update UI optimistically
      if (room.unreadCount && room.unreadCount > 0) {
        setRooms((prevRooms) =>
          prevRooms.map((r) =>
            r._id === room._id ? { ...r, unreadCount: 0 } : r
          )
        );
      }

      // นำทางไปยังห้องแชท
      router.push(`/chat/${room._id}`);
    },
    [router]
  );

  // กรองห้องจากคำค้นหา
  const filteredRooms =
    searchTerm.trim() === ""
      ? rooms
      : rooms.filter((room) => {
          // ค้นหาในชื่อห้อง
          if (
            room.metadata?.name
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase())
          ) {
            return true;
          }

          // ค้นหาในรายชื่อผู้เข้าร่วม
          return room.participants.some(
            (p: Participant) =>
              p.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              p.profile?.name?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        });

  if (loading)
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-blue-500" />
        <span>กำลังโหลดรายการห้องแชท...</span>
      </div>
    );

  return (
    <div className="space-y-4">
      {/* ส่วนค้นหาและปุ่มสร้างแชท */}
      <div className="flex gap-2 sticky top-0 bg-white dark:bg-gray-900 pt-2 pb-3 z-10">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500" />
          <Input
            placeholder="ค้นหาข้อความ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 rounded-full bg-gray-100 dark:bg-gray-800 border-none focus-visible:ring-blue-500"
          />
        </div>
        <Button
          onClick={() => setShowCreateChat(!showCreateChat)}
          className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          สร้างแชทใหม่
        </Button>
      </div>

      {/* ส่วนสร้างแชทใหม่ */}
      {showCreateChat && (
        <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-md">
          <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">
            สร้างการสนทนาใหม่
          </h3>
          <CreateChat onComplete={() => setShowCreateChat(false)} />
        </div>
      )}

      {/* รายการห้องแชท */}
      {filteredRooms.length === 0 ? (
        <div className="text-center py-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
          <MessageSquare className="h-12 w-12 mx-auto text-blue-500 opacity-50 mb-3" />
          <h3 className="font-medium text-lg">ไม่พบห้องแชท</h3>
          <p className="text-muted-foreground mt-1">
            {searchTerm
              ? "ลองใช้คำค้นหาอื่น"
              : "เริ่มการสนทนาใหม่โดยคลิกที่ปุ่มสร้างแชท"}
          </p>
        </div>
      ) : (
        <div className="space-y-1 overflow-hidden">
          {filteredRooms.map((room) => {
            // ดึงข้อมูลผู้รับในกรณีที่เป็นแชทส่วนตัว
            const participants = room.participants.filter(
              (p: Participant) => p._id !== currentUser?._id
            );
            const isGroup = room.type === "group";
            const lastUpdated = new Date(room.updatedAt);
            const timeAgo = formatDistanceToNow(lastUpdated, {
              addSuffix: true,
              locale: th,
            });

            // ตรวจสอบสถานะออนไลน์
            const isOnline =
              !isGroup &&
              participants[0] &&
              onlineUsers?.has(participants[0]._id);

            // คำนวณสถานะข้อความที่ยังไม่ได้อ่าน
            const unreadCount = room.unreadCount ?? 0;
            const hasUnreadMessages = unreadCount > 0;

            // ตรวจสอบว่าข้อความสุดท้ายเป็นของเราหรือไม่
            const isLastMessageFromMe =
              room.lastMessage?.senderId?._id === currentUser?._id;

            // ตรวจสอบว่าควรไฮไลต์ข้อความหรือไม่
            const shouldHighlight = hasUnreadMessages && !isLastMessageFromMe;

            return (
              <div
                key={room._id}
                onClick={() => handleRoomClick(room)}
                className={`flex items-center p-3 cursor-pointer ${
                  shouldHighlight
                    ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500" // เพิ่มแถบสีซ้าย
                    : "bg-white dark:bg-gray-800"
                } rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors gap-3 shadow-sm border border-gray-100 dark:border-gray-700`}
              >
                {/* Avatar */}
                <div className="relative">
                  {isGroup ? (
                    <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
                      {room.metadata?.avatarUrl ? (
                        <div className="relative h-full w-full overflow-hidden rounded-full">
                          <Image
                            src={room.metadata.avatarUrl}
                            alt={room.metadata?.name || "กลุ่ม"}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                          <Users className="h-6 w-6" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                  ) : participants[0] ? (
                    <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
                      {participants[0].profile?.avatarUrl ? (
                        <div className="relative h-full w-full overflow-hidden rounded-full">
                          <Image
                            src={participants[0].profile.avatarUrl}
                            alt={
                              participants[0].profile?.name ||
                              participants[0].username
                            }
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-lg">
                          {participants[0].profile?.name?.charAt(0) ||
                            participants[0].username?.charAt(0) ||
                            "?"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  ) : (
                    <Avatar className="h-14 w-14">
                      <AvatarFallback>?</AvatarFallback>
                    </Avatar>
                  )}

                  {/* แสดงสถานะออนไลน์หรือมีข้อความที่ยังไม่ได้อ่าน */}
                  {!isGroup && isOnline ? (
                    <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-white"></span>
                  ) : shouldHighlight ? (
                    <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full bg-blue-500 border-2 border-white animate-pulse"></span>
                  ) : null}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3
                      className={`font-semibold truncate text-gray-900 dark:text-gray-200 flex items-center ${
                        shouldHighlight ? "font-bold" : ""
                      }`}
                    >
                      {isGroup
                        ? room.metadata?.name || "กลุ่ม"
                        : participants[0]?.profile?.name ||
                          participants[0]?.username ||
                          "ห้องแชท"}

                      {/* เพิ่มจุดสีน้ำเงินแสดงสถานะยังไม่ได้อ่าน */}
                      {shouldHighlight && (
                        <span className="inline-block ml-1.5 w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0"></span>
                      )}
                    </h3>
                    <span
                      className={`text-xs whitespace-nowrap ml-2 ${
                        shouldHighlight
                          ? "text-blue-600 dark:text-blue-400 font-semibold"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {timeAgo}
                    </span>
                  </div>

                  {/* ส่วนแสดงข้อความล่าสุดในรูปแบบ Instagram */}
                  <div className="flex items-center">
                    <div className="flex-1 min-w-0 flex items-center">
                      <p
                        className={`text-sm truncate max-w-[85%] ${
                          shouldHighlight
                            ? "text-gray-900 dark:text-gray-200 font-semibold" // ใช้ font-semibold แทน font-medium
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {room.lastMessage ? (
                          <>
                            {/* แสดงชื่อผู้ส่งสุดท้ายในรูปแบบ Instagram */}
                            {isLastMessageFromMe ? (
                              <>
                                <span
                                  className={`font-normal ${
                                    shouldHighlight
                                      ? "text-gray-700 dark:text-gray-300"
                                      : "text-gray-600 dark:text-gray-400"
                                  }`}
                                >
                                  คุณ:
                                </span>{" "}
                                <span
                                  className={
                                    shouldHighlight
                                      ? ""
                                      : "text-gray-500 dark:text-gray-400"
                                  }
                                >
                                  {getMessagePreview(
                                    room.lastMessage.content,
                                    room.lastMessage.type
                                  )}
                                </span>
                              </>
                            ) : (
                              <>
                                <span
                                  className={`font-normal ${
                                    shouldHighlight
                                      ? "text-gray-800 dark:text-gray-300"
                                      : "text-gray-600 dark:text-gray-400"
                                  }`}
                                >
                                  {room.lastMessage?.senderId?.profile?.name?.split(
                                    " "
                                  )[0] || room.lastMessage?.senderId?.username}
                                  :
                                </span>{" "}
                                <span
                                  className={
                                    shouldHighlight ? "font-semibold" : ""
                                  }
                                >
                                  {getMessagePreview(
                                    room.lastMessage.content,
                                    room.lastMessage.type
                                  )}
                                </span>
                              </>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 italic">
                            ยังไม่มีข้อความ
                          </span>
                        )}
                      </p>
                    </div>

                    {/* สถานะออนไลน์และตัวบ่งชี้ข้อความที่ยังไม่ได้อ่าน */}
                    <div className="flex flex-shrink-0 items-center">
                      {!isGroup && isOnline && !shouldHighlight && (
                        <span className="ml-1 text-xs text-green-500 whitespace-nowrap">
                          • ออนไลน์
                        </span>
                      )}

                      {unreadCount > 0 && (
                        <Badge
                          variant="default"
                          className={`ml-2 px-1.5 min-w-5 h-5 flex items-center justify-center rounded-full ${
                            shouldHighlight
                              ? "bg-blue-500 hover:bg-blue-600 shadow-sm shadow-blue-200 dark:shadow-blue-900/30"
                              : "bg-gray-500/80 hover:bg-gray-600"
                          }`}
                        >
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

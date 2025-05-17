"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useChat } from "@/hooks/useChat";
import { chatService } from "@/services/chat.service";
import { toast } from "sonner";
import {
  Send,
  ArrowLeft,
  MoreVertical,
  Loader2,
  Phone,
  Video,
  Info,
  Users,
  UserPlus,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChatRoom, Message, Participant } from "@/interfaces/chat.interface";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import InviteMemberDialog from "./invite-member-dialog";
import GroupInfoDialog from "./group-info-dialog";
import PrivateInfoDialog from "./private-info-dialog";

export default function ChatPage({ roomId }: { roomId: string }) {
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messageText, setMessageText] = useState("");
  const [editingMessage, setEditingMessage] = useState<{
    id: string;
    content: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { user: currentUser } = useAuth();

  // เพิ่ม refs สำหรับใช้ใน Intersection Observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showGroupInfoDialog, setShowGroupInfoDialog] = useState(false);
  const [showPrivateInfoDialog, setShowPrivateInfoDialog] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);

  const {
    messages,
    isLoading,
    error,
    isConnected,
    typingUsers,
    sendMessage,
    updateMessage,
    deleteMessage,
    loadMoreMessages,
    sendTypingStatus,
    markAsRead,
    onlineUsers,
    onRoomParticipantsChanged,
    onUserRoomsChanged,
  } = useChat(roomId);

  console.log("messages", messages);

  // ซิงค์ข้อความจาก useChat กับ local state
  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  // เพิ่ม useEffect เพื่อจัดการกับการเปลี่ยนแปลงสมาชิกในห้อง
  useEffect(() => {
    // ลงทะเบียนรับการเปลี่ยนแปลงสมาชิก
    const unsubscribe = onRoomParticipantsChanged((data) => {
      console.log("ได้รับการเปลี่ยนแปลงสมาชิก:", data);

      // อัพเดต room state โดยตรงโดยไม่ต้องเรียก API
      setRoom((prevRoom) => {
        if (!prevRoom) return prevRoom;

        return {
          ...prevRoom,
          participants: data.participants,
        };
      });

      // สร้างข้อความแสดงการเปลี่ยนแปลงในห้องแชท (คล้าย system message)
      let systemMessage = "";
      if (data.targetUser) {
        const name = data.targetUser.profile?.name || data.targetUser.username;
        if (data.action === "add") {
          systemMessage = `${name} ได้เข้าร่วมห้องแชท`;
        } else if (data.action === "remove") {
          systemMessage = `${name} ถูกนำออกจากห้องแชท`;
        } else if (data.action === "leave") {
          systemMessage = `${name} ได้ออกจากห้องแชท`;
        }

        // เพิ่มข้อความแสดงจำนวนสมาชิกปัจจุบัน
        systemMessage += ` (สมาชิกปัจจุบัน: ${data.participantsCount} คน)`;
      }

      // ถ้ามี systemMessage ให้เพิ่มในรายการข้อความ
      if (systemMessage) {
        const newSystemMessage: Message = {
          _id: `system-${Date.now()}`,
          content: systemMessage,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          roomId: roomId,
          type: "system",
          senderId: null,
          readBy: [],
        };

        // ใช้ setLocalMessages แทน setMessages
        setLocalMessages((prev) => [...prev, newSystemMessage]);
      }
    });

    return () => unsubscribe();
  }, [onRoomParticipantsChanged, roomId]);

  // เพิ่มฟังก์ชันสำหรับรีโหลดข้อมูลห้องแชทหลังจากเชิญสมาชิกเสร็จ
  const refreshRoomData = useCallback(async () => {
    if (!roomId) return;

    try {
      const room = await chatService.getRoom(roomId);
      setRoom(room);
    } catch (error) {
      console.error("ไม่สามารถรีโหลดข้อมูลห้องแชท:", error);
    }
  }, [roomId]);

  // เพิ่ม useEffect เพื่อรับฟังการเปลี่ยนแปลงรายการห้องแชทของตนเอง
  useEffect(() => {
    // ลงทะเบียนรับการเปลี่ยนแปลงการเป็นสมาชิกห้องแชทของตนเอง
    const unsubscribe = onUserRoomsChanged((data) => {
      console.log("ได้รับการเปลี่ยนแปลงสมาชิกภาพห้องแชท:", data);

      // ถ้าข้อมูลเกี่ยวข้องกับห้องปัจจุบัน
      if (data.roomId === roomId) {
        // กรณีถูกลบออกจากห้องที่กำลังดูอยู่
        if (data.action === "remove" || data.action === "leave") {
          // แสดง toast เตือนผู้ใช้
          toast.error(`คุณไม่ได้เป็นสมาชิกของห้องแชทนี้อีกต่อไป`, {
            description:
              data.action === "remove"
                ? "คุณถูกนำออกจากห้องแชทนี้"
                : "คุณได้ออกจากห้องแชทนี้แล้ว",
            duration: 5000,
          });

          // นำทางกลับไปหน้ารายการห้องแชท
          setTimeout(() => router.push("/chat"), 2000);
        }
        // กรณีถูกเพิ่มเข้าห้อง - อาจไม่จำเป็นต้องจัดการในหน้านี้
        // เนื่องจากผู้ใช้ไม่น่าจะเปิดห้องที่ตนเองยังไม่ได้เป็นสมาชิกอยู่แล้ว
        else if (data.action === "add") {
          // รีโหลดข้อมูลห้อง เผื่อมีการเปลี่ยนแปลงอื่นๆ
          refreshRoomData();
        }
      }
    });

    return () => unsubscribe();
  }, [onUserRoomsChanged, roomId, router, refreshRoomData]);

  // เพิ่ม useEffect สำหรับทำเครื่องหมายว่าอ่านแล้วเมื่อเข้าห้องแชท
  useEffect(() => {
    // ทำเครื่องหมายว่าอ่านแล้วเมื่อเข้าห้องแชท
    if (roomId && isConnected && currentUser && localMessages.length > 0) {
      // หา messageIds ที่ยังไม่ได้อ่าน
      const unreadMessageIds = localMessages
        .filter(
          (msg) =>
            msg.senderId?._id !== currentUser._id &&
            !msg.readBy?.includes(currentUser._id)
        )
        .map((msg) => msg._id);

      if (unreadMessageIds.length > 0) {
        markAsRead(unreadMessageIds);
        console.log(
          `ทำเครื่องหมายว่าอ่านแล้ว ${unreadMessageIds.length} ข้อความในห้อง ${roomId}`
        );
      }
    }
  }, [roomId, isConnected, currentUser, localMessages, markAsRead]);

  // ดึงข้อมูลห้องแชท
  useEffect(() => {
    async function fetchRoom() {
      try {
        // ตรวจสอบว่าผู้ใช้เป็นสมาชิกห้องแชทนี้หรือไม่
        const { isMember, room } = await chatService.verifyRoomMembership(
          roomId
        );

        if (!isMember) {
          toast.error("ไม่สามารถเข้าถึงห้องแชทนี้", {
            description: "คุณไม่ได้เป็นสมาชิกของห้องแชทนี้",
            action: {
              label: "กลับ",
              onClick: () => router.push("/chat"),
            },
          });
          setTimeout(() => router.push("/chat"), 3000);
          return;
        }

        setRoom(room);
      } catch (err) {
        console.error("ไม่สามารถโหลดข้อมูลห้องแชทได้", err);
        toast.error("ไม่สามารถโหลดข้อมูลห้องแชท", {
          description: "กรุณาลองใหม่อีกครั้ง",
        });
      }
    }

    if (currentUser) {
      fetchRoom();
    }
  }, [roomId, currentUser, router]);

  // เพิ่ม useEffect เพื่อติดตามการ focus และ blur ของหน้าต่าง
  useEffect(() => {
    const handleFocus = () => {
      // เมื่อหน้าต่างได้รับ focus ให้ตรวจสอบและ mark ข้อความที่ยังไม่ได้อ่าน
      if (messages.length > 0 && currentUser && isConnected) {
        const unreadMessageIds = messages
          .filter(
            (msg) =>
              msg.senderId?._id !== currentUser._id &&
              !msg.readBy?.includes(currentUser._id)
          )
          .map((msg) => msg._id);

        if (unreadMessageIds.length > 0) {
          markAsRead(unreadMessageIds);
          console.log(
            `ทำเครื่องหมายว่าอ่านแล้ว ${unreadMessageIds.length} ข้อความเมื่อหน้าต่างได้รับ focus`
          );
        }
      }
    };

    // เพิ่ม event listeners
    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleFocus);
      // เมื่อเริ่มต้น ถ้าหน้าต่างมี focus อยู่แล้ว ให้ทำเครื่องหมายอ่านเลย
      if (document.hasFocus()) {
        handleFocus();
      }
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", handleFocus);
      }
    };
  }, [messages, currentUser, isConnected, markAsRead]);

  // แก้ไขการทำงานของ IntersectionObserver เพื่อมาร์คข้อความที่มองเห็น
  useEffect(() => {
    if (localMessages.length > 0 && isConnected && currentUser) {
      // กรองเฉพาะข้อความที่ยังไม่ได้อ่านและไม่ใช่ข้อความของตัวเอง
      const unreadMessages = localMessages.filter(
        (msg) =>
          msg.type !== "system" && // เพิ่มเงื่อนไขเพื่อข้ามข้อความระบบ
          msg.senderId?._id !== currentUser._id &&
          !msg.readBy?.includes(currentUser._id)
      );

      if (unreadMessages.length > 0 && document.hasFocus()) {
        // สร้าง IntersectionObserver เพื่อตรวจสอบว่าข้อความปรากฏบนหน้าจอ
        observerRef.current = new IntersectionObserver(
          (entries) => {
            // ตรวจสอบว่าผู้ใช้กำลังมองหน้าเว็บอยู่หรือไม่
            if (!document.hasFocus()) return;

            // กรองเฉพาะข้อความที่มองเห็นและยังไม่ได้ทำเครื่องหมาย
            const visibleMessageIds = entries
              .filter(
                (entry) =>
                  entry.isIntersecting &&
                  !entry.target.hasAttribute("data-read")
              )
              .map((entry) => {
                // ทำเครื่องหมายว่าได้ตรวจสอบข้อความนี้แล้ว
                entry.target.setAttribute("data-read", "true");
                return entry.target.getAttribute("data-message-id");
              })
              .filter((id): id is string => id !== null);

            // ทำเครื่องหมายว่าอ่านแล้วเฉพาะข้อความที่มองเห็น
            if (visibleMessageIds.length > 0) {
              console.log("กำลังมาร์คข้อความว่าอ่านแล้ว:", visibleMessageIds);
              markAsRead(visibleMessageIds);
            }
          },
          { threshold: 0.5 } // ต้องเห็นข้อความอย่างน้อย 50%
        );

        // รอให้ DOM render ก่อนจะเริ่มสังเกต
        setTimeout(() => {
          unreadMessages.forEach((msg) => {
            const messageElement = document.getElementById(`msg-${msg._id}`);
            if (messageElement && observerRef.current) {
              observerRef.current.observe(messageElement);
            }
          });
        }, 500);
      }
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [localMessages, isConnected, currentUser, markAsRead]);

  // เลื่อนไปยังข้อความล่าสุด
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  // จัดการการพิมพ์และส่งสถานะการพิมพ์
  const handleTyping = useCallback(() => {
    if (!isConnected) return;

    sendTypingStatus(true);

    // ยกเลิกการตั้งเวลาเดิม (ถ้ามี)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // ตั้งเวลาใหม่ หลังจาก 2 วินาทีที่ไม่มีการพิมพ์
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 2000);
  }, [isConnected, sendTypingStatus]);

  // ส่งข้อความหรือแก้ไขข้อความ
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText.trim()) return;

    try {
      if (editingMessage) {
        await updateMessage(editingMessage.id, messageText);
        setEditingMessage(null);
      } else {
        await sendMessage(messageText);
      }

      setMessageText("");
      // ยกเลิกสถานะการพิมพ์
      sendTypingStatus(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } catch (err) {
      console.error("ไม่สามารถส่งข้อความได้", err);
    }
  };

  // โหลดข้อความเพิ่มเติม (เก่า)
  const handleLoadMoreMessages = async () => {
    if (localMessages.length > 0) {
      setLoadingMore(true);
      await loadMoreMessages(localMessages[0].createdAt);
      setLoadingMore(false);
    }
  };

  // แก้ไขข้อความ
  const startEditing = (message: Message) => {
    setEditingMessage({
      id: message._id,
      content: message.content,
    });
    setMessageText(message.content);
    messageInputRef.current?.focus();
  };

  // ยกเลิกการแก้ไข
  const cancelEditing = () => {
    setEditingMessage(null);
    setMessageText("");
  };

  // ลบข้อความ
  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      toast.success("ลบข้อความแล้ว");
    } catch (err) {
      console.error("ไม่สามารถลบข้อความได้", err);
    }
  };

  if (!room)
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">กำลังโหลดข้อมูลห้องแชท...</span>
      </div>
    );

  // ดึงข้อมูลผู้รับในกรณีที่เป็นแชทส่วนตัว
  const recipients = room.participants.filter(
    (p: Participant) => p._id !== currentUser?._id
  );
  const isPrivateChat = room.type === "private";
  const recipient =
    isPrivateChat && recipients.length > 0 ? recipients[0] : null;

  // หาข้อความสุดท้ายที่ส่งโดยผู้ใช้ปัจจุบัน
  const lastMessageFromUser =
    localMessages.length > 0
      ? localMessages.findLast((msg) => msg?.senderId?._id === currentUser?._id)
      : undefined;

  // ตรวจสอบสถานะออนไลน์ของผู้รับ
  const isRecipientOnline = recipient && onlineUsers.has(recipient._id);

  return (
    <div className="flex flex-col h-full bg-background dark:bg-gray-900">
      {/* ส่วนหัวห้องแชท - ปรับแต่งให้เหมือน Instagram */}
      <div className="p-3 border-b flex items-center justify-between bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex items-center flex-1">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 md:hidden rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => router.push("/chat")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {recipient ? (
            <div className="flex items-center flex-1">
              <div className="relative">
                <Avatar className="h-12 w-12 mr-3 border-2 border-white shadow">
                  {recipient.profile?.avatarUrl ? (
                    <div className="relative h-full w-full overflow-hidden rounded-full">
                      <Image
                        src={recipient.profile.avatarUrl}
                        alt={recipient.profile.name || recipient.username}
                        fill
                        sizes="48px"
                        className="object-cover"
                        priority
                      />
                    </div>
                  ) : (
                    <AvatarFallback className="text-lg bg-gradient-to-br from-pink-500 to-blue-500 text-white">
                      {recipient.profile?.name?.charAt(0) ||
                        recipient.username?.charAt(0) ||
                        "?"}
                    </AvatarFallback>
                  )}
                  {/* แสดงสถานะออนไลน์ */}
                  {isRecipientOnline && (
                    <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                  )}
                </Avatar>
              </div>
              <div>
                <h2 className="font-semibold">
                  {/* แสดงชื่อผู้ใช้จาก profile แทน "Private Chat" */}
                  {recipient.profile?.name || recipient.username}
                </h2>
                <div className="text-xs text-muted-foreground">
                  {isRecipientOnline ? (
                    typingUsers[recipient._id] ? (
                      <span className="text-blue-500 font-medium animate-pulse">
                        กำลังพิมพ์...
                      </span>
                    ) : (
                      <span className="text-green-500">ออนไลน์</span>
                    )
                  ) : (
                    <span className="text-gray-400">ออฟไลน์</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center flex-1">
              <div className="relative">
                <Avatar className="h-12 w-12 mr-3 border-2 border-white shadow">
                  {room.metadata?.avatarUrl ? (
                    <div className="relative h-full w-full overflow-hidden rounded-full">
                      <Image
                        src={room.metadata.avatarUrl}
                        alt={room.metadata?.name || "กลุ่ม"}
                        fill
                        sizes="48px"
                        className="object-cover"
                        priority
                      />
                    </div>
                  ) : (
                    <AvatarFallback className="text-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                      <Users className="h-6 w-6" />
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
              <div>
                <h2 className="font-semibold">
                  {room.metadata?.name ||
                    room.participants
                      .filter((p: Participant) => p._id !== currentUser?._id)
                      .slice(0, 3)
                      .map((p: Participant) => p.profile?.name || p.username)
                      .join(", ") +
                      (room.participants.length > 4
                        ? ` และอื่นๆ อีก ${room.participants.length - 4} คน`
                        : "")}
                </h2>
                <div className="text-xs text-muted-foreground">
                  {room.participants.length} คนในห้องแชท
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ปุ่ม action เพิ่มเติมเหมือน social media */}
        <div className="flex items-center gap-2">
          {isPrivateChat ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Phone className="h-5 w-5 text-blue-500" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Video className="h-5 w-5 text-blue-500" />
              </Button>
              {/* เพิ่มปุ่ม Info สำหรับแชทส่วนตัว */}
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setShowPrivateInfoDialog(true)}
              >
                <Info className="h-5 w-5 text-blue-500" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setShowInviteDialog(true)}
                data-invite-button="true"
              >
                <UserPlus className="h-5 w-5 text-blue-500" />
              </Button>
              {/* ปุ่ม Info สำหรับแชทกลุ่ม */}
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setShowGroupInfoDialog(true)}
              >
                <Info className="h-5 w-5 text-blue-500" />
              </Button>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <MoreVertical className="h-5 w-5 text-blue-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            >
              <DropdownMenuItem onClick={() => router.push("/chat")}>
                กลับไปหน้ารายการแชท
              </DropdownMenuItem>
              {!isPrivateChat && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowInviteDialog(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    เชิญสมาชิกเพิ่ม
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-500">
                    ออกจากกลุ่ม
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* แสดงสถานะการเชื่อมต่อ */}
      {error && (
        <div className="px-4 py-2 text-xs border-b bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300">
          <span className="font-medium">เกิดข้อผิดพลาด:</span> {error}
        </div>
      )}

      {/* รายการข้อความ - ปรับแต่งให้เหมือน Social Media */}
      <div className="flex-1 p-3 overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
        {isLoading && !messages.length && (
          <div className="flex justify-center my-4">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-2">กำลังโหลดข้อความ...</span>
          </div>
        )}

        {localMessages.length > 0 && (
          <button
            className={`text-blue-500 mb-4 flex items-center mx-auto px-4 py-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all ${
              loadingMore ? "opacity-50" : ""
            }`}
            onClick={handleLoadMoreMessages}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                กำลังโหลด...
              </>
            ) : (
              "โหลดข้อความเก่า"
            )}
          </button>
        )}

        <div className="space-y-3">
          {localMessages.map((message: Message, index: number) => {
            // ตรวจสอบประเภทข้อความ ถ้าเป็น system ให้แสดงรูปแบบพิเศษ
            if (message.type === "system") {
              return (
                <div
                  key={`system-${message._id}-${index}`}
                  className="flex justify-center my-3"
                >
                  <div className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700/50">
                    {message.content}
                  </div>
                </div>
              );
            }
            const isSentByMe = message.senderId?._id === currentUser?._id;
            const messageDate = new Date(message.createdAt);

            // ตรวจสอบวันที่
            const showDateSeparator =
              index === 0 ||
              new Date(message.createdAt).toDateString() !==
                new Date(localMessages[index - 1].createdAt).toDateString();

            // ตรวจสอบช่วงเวลาที่ห่างกัน (30 นาที)
            const TIME_GAP_THRESHOLD = 30 * 60 * 1000; // 30 นาทีในหน่วย ms
            const showTimeGapSeparator =
              !showDateSeparator &&
              index > 0 &&
              messageDate.getTime() -
                new Date(localMessages[index - 1].createdAt).getTime() >
                TIME_GAP_THRESHOLD;

            // เช็คว่าเป็นข้อความสุดท้ายของผู้ใช้ปัจจุบันหรือไม่
            const isLastUserMessage = message._id === lastMessageFromUser?._id;

            return (
              <div key={`${message._id}-${index}`} className="flex flex-col">
                {/* แสดงการแบ่งวันที่ */}
                {showDateSeparator && (
                  <div className="flex justify-center my-4">
                    <div className="px-3 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-xs">
                      {new Date(message.createdAt).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                )}

                {/* แสดงการแบ่งช่วงเวลาเมื่อมีการเว้นช่วง */}
                {showTimeGapSeparator && (
                  <div className="flex justify-center my-3">
                    <div className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400">
                      {messageDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                )}

                <div
                  className={`flex ${
                    isSentByMe ? "justify-end" : "justify-start"
                  } group items-end`}
                >
                  {/* Avatar สำหรับข้อความจากคนอื่น */}
                  {!isSentByMe && (
                    <Avatar className="h-8 w-8 mr-2 self-end mb-1">
                      {message.senderId?.profile?.avatarUrl ? (
                        <div className="relative h-full w-full overflow-hidden rounded-full">
                          <Image
                            src={message.senderId.profile.avatarUrl}
                            alt={
                              message.senderId?.profile?.name ||
                              message.senderId?.username
                            }
                            fill
                            sizes="32px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                          {(
                            message.senderId?.profile?.name?.[0] ||
                            message.senderId?.username?.[0] ||
                            "?"
                          ).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  )}

                  {/* เพิ่มปุ่ม setting แบบ Instagram สำหรับข้อความของเรา */}
                  {isSentByMe && (
                    <div className="opacity-0 group-hover:opacity-100 mr-2 transition-opacity flex items-center self-end mb-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-700 p-1"
                          >
                            <MoreVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                        >
                          <DropdownMenuItem
                            onClick={() => startEditing(message)}
                            className="cursor-pointer"
                          >
                            แก้ไข
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteMessage(message._id)}
                            className="cursor-pointer text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                          >
                            ลบ
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}

                  <div
                    id={`msg-${message._id}`}
                    data-message-id={message._id}
                    className={`px-4 py-2  rounded-full max-w-[85%]
                      ${
                        isSentByMe
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                          : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700"
                      }
                     ${
                       index > 0 &&
                       localMessages[index - 1].senderId?._id ===
                         message.senderId?._id &&
                       !showDateSeparator
                         ? isSentByMe
                           ? "rounded-tr-md"
                           : "rounded-tl-md"
                         : ""
                     }
                    `}
                  >
                    {!isSentByMe && (
                      <div className="font-semibold text-xs mb-1 text-gray-700 dark:text-gray-300">
                        {message.senderId?.profile?.name ||
                          message.senderId?.username}
                      </div>
                    )}
                    <p className="break-words">{message.content}</p>
                  </div>

                  {/* เพิ่มปุ่ม setting แบบ Instagram สำหรับข้อความจากคนอื่น */}
                  {!isSentByMe && (
                    <div className="opacity-0 group-hover:opacity-100 ml-2 transition-opacity flex items-center self-end mb-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-700 p-1"
                          >
                            <MoreVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                        >
                          <DropdownMenuItem className="cursor-pointer">
                            รายงาน
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            คัดลอก
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>

                {/* แสดงสถานะอ่านแล้ว - แยกระหว่างแชทส่วนตัวและกลุ่ม */}
                {isSentByMe && isLastUserMessage && (
                  <>
                    {/* กรณี Private Chat - แสดง "อ่านแล้วเมื่อ" */}
                    {isPrivateChat &&
                      recipient &&
                      message.readBy?.includes(recipient._id) && (
                        <div className="flex justify-end text-[10px] text-gray-500 mt-1 pr-2 mr-2">
                          <span>
                            อ่านแล้วเมื่อ{" "}
                            {formatDistanceToNow(new Date(message.updatedAt), {
                              locale: th,
                              addSuffix: false,
                            })}
                          </span>
                        </div>
                      )}

                    {/* กรณี Group Chat - แสดงรายชื่อผู้อ่าน */}
                    {!isPrivateChat &&
                      message.readBy &&
                      message.readBy.length > 0 && (
                        <>
                          {(() => {
                            // กรองผู้อ่านที่มีชื่อแสดงได้ (ไม่รวมตัวเอง)
                            const readersWithNames = room.participants.filter(
                              (p) =>
                                message.readBy?.includes(p._id) &&
                                p._id !== currentUser?._id
                            );

                            // ถ้าไม่มีรายชื่อที่แสดงได้ ให้แสดงแบบรอข้อมูล
                            if (readersWithNames.length === 0) {
                              return message.readBy.length > 1 ? (
                                <div className="flex justify-end text-[10px] text-gray-500 mt-1 pr-2 mr-2">
                                  <span>
                                    อ่านแล้ว {message.readBy.length} คน
                                  </span>
                                </div>
                              ) : null;
                            }

                            // จำนวนผู้อ่านที่แสดงชื่อได้
                            const readersToShow = readersWithNames.slice(0, 3);

                            // จำนวนผู้อ่านทั้งหมดที่ไม่ใช่ตัวเอง
                            const totalReadersExceptMe = message.readBy.filter(
                              (id) => id !== currentUser?._id
                            ).length;

                            // จำนวนผู้อ่านที่เหลือหลังจากแสดง 3 คนแรก
                            const remainingReaders =
                              totalReadersExceptMe - readersToShow.length;

                            return (
                              <div className="flex justify-end text-[10px] text-gray-500 mt-1 pr-2 mr-2">
                                <span>
                                  อ่านโดย{" "}
                                  {readersToShow
                                    .map((p) => p.profile?.name || p.username)
                                    .join(", ")}
                                  {remainingReaders > 0
                                    ? ` และอีก ${remainingReaders} คน`
                                    : ""}
                                </span>
                              </div>
                            );
                          })()}
                        </>
                      )}
                  </>
                )}
              </div>
            );
          })}

          {/* แสดงสถานะการพิมพ์ - ปรับแต่งให้เหมือน Social Media */}
          {Object.keys(typingUsers).length > 0 && (
            <div className="flex items-center text-sm text-muted-foreground">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 max-w-[75%]">
                {/* Avatar ของผู้ที่กำลังพิมพ์ */}
                {Object.entries(typingUsers).map(
                  ([userId, userInfo], index) => (
                    <Avatar
                      key={`typing-${userId}-${index}`}
                      className="h-6 w-6"
                    >
                      {userInfo.avatarUrl ? (
                        <div className="relative h-full w-full overflow-hidden rounded-full">
                          <Image
                            src={userInfo.avatarUrl}
                            alt={userInfo.name || userInfo.username}
                            fill
                            sizes="24px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
                          {(
                            userInfo.name?.[0] ||
                            userInfo.username?.[0] ||
                            "?"
                          ).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  )
                )}

                {/* ข้อความผู้ที่กำลังพิมพ์ */}
                <span className="text-gray-600 dark:text-gray-300">
                  {Object.values(typingUsers)
                    .map((user) => user.name)
                    .join(", ")}{" "}
                  <span className="inline-flex">
                    <span className="animate-bounce delay-0">.</span>
                    <span className="animate-bounce delay-150">.</span>
                    <span className="animate-bounce delay-300">.</span>
                  </span>
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ฟอร์มส่งข้อความ - ปรับแต่งให้เหมือน Social Media */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t flex items-center gap-2 bg-white dark:bg-gray-800"
      >
        {editingMessage && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={cancelEditing}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        <div className="flex-1 relative">
          <input
            ref={messageInputRef}
            type="text"
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
              handleTyping();
            }}
            placeholder={editingMessage ? "แก้ไขข้อความ..." : "พิมพ์ข้อความ..."}
            className="w-full p-3 rounded-full bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 border-none"
            disabled={!isConnected}
          />
          {editingMessage && (
            <div className="absolute -top-6 left-0 text-xs text-blue-500 dark:text-blue-400 font-medium">
              กำลังแก้ไขข้อความ
            </div>
          )}
        </div>

        <Button
          type="submit"
          size="icon"
          className="rounded-full h-10 w-10 flex items-center justify-center bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
          disabled={!isConnected || !messageText.trim()}
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>

      {/* เพิ่ม Dialog สำหรับเชิญสมาชิก */}
      {room && room.type === "group" && (
        <InviteMemberDialog
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          roomId={roomId}
          currentParticipants={room.participants}
          onMemberAdded={refreshRoomData}
        />
      )}

      {/* เพิ่ม Dialog แสดงข้อมูลกลุ่ม */}
      {room && room.type === "group" && (
        <GroupInfoDialog
          open={showGroupInfoDialog}
          onOpenChange={setShowGroupInfoDialog}
          room={room}
          roomId={roomId}
          currentUser={currentUser}
          onRoomUpdated={refreshRoomData}
        />
      )}

      {/* เพิ่ม Dialog สำหรับแชทส่วนตัว */}
      {room && room.type === "private" && recipient && (
        <PrivateInfoDialog
          open={showPrivateInfoDialog}
          onOpenChange={setShowPrivateInfoDialog}
          room={room}
          roomId={roomId}
          recipient={recipient}
          currentUser={currentUser}
          isRecipientOnline={isRecipientOnline || false} // แก้ไขปัญหา Type 'boolean | null' is not assignable to type 'boolean'
          lastActive={
            recipient.lastActive ? new Date(recipient.lastActive) : undefined
          }
        />
      )}
    </div>
  );
}

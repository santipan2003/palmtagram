"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { chatService } from "@/services/chat/chat.service";
import { profileService } from "@/services/profile/profile.service";
import { notificationService } from "@/services/notification/notification.service";
import { useAuth } from "@/lib/auth-context";
import {
  Message,
  Participant,
  TypingUsersMap,
  JoinRoomRequest,
  ChatResponse,
  UserTypingEvent,
  MessageCreateRequest,
  MessageUpdateRequest,
  FindRoomMessagesRequest,
  MarkAsReadRequest,
  LeaveRoomRequest,
  UserRoomEvent,
  MessagesReadEvent,
  RoomParticipantsChangedEvent,
  ChatRoom,
  UnreadCountsResponse,
  UnreadCountResponse,
} from "@/interfaces/chat.interface";
import { Notification } from "@/interfaces/notification.interface";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000/messages";

export function useChat(roomId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUsersMap>({});
  const socketRef = useRef<Socket | null>(null);
  const router = useRouter();
  const [userProfileData, setUserProfileData] = useState<Participant | null>(
    null
  );
  const { user: currentUser } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const roomLastMessageListeners = useRef<
    Array<(roomId: string, message: Message) => void>
  >([]);

  const [unreadCounts, setUnreadCounts] = useState<
    Array<{ roomId: string; count: number }>
  >([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const processedMessageIds = useRef<Set<string>>(new Set());
  const processedRoomUpdateIds = useRef(new Map<string, number>());
  const lastTypingEvents = useRef(
    new Map<string, { isTyping: boolean; timestamp: number }>()
  );

  // เพิ่ม state สำหรับการแจ้งเตือน
  const [notifications, setNotifications] = useState<Array<Notification>>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // สร้าง Socket connection
  useEffect(() => {
    if (typeof window === "undefined") return; // ไม่ทำงานบนฝั่ง server

    // เพิ่มการตรวจสอบว่ามีข้อมูลผู้ใช้หรือไม่
    const userData = localStorage.getItem("user_data");
    if (!userData) {
      console.log("ไม่มีข้อมูลผู้ใช้ใน localStorage - ไม่เชื่อมต่อ WebSocket");
      return; // ไม่เชื่อมต่อ WebSocket ถ้าไม่มีข้อมูลผู้ใช้
    }

    // ดึง token จาก localStorage
    const wsToken = localStorage.getItem("ws_auth_token");
    if (!wsToken) {
      console.error("ไม่พบ ws_auth_token ใน localStorage");
      setError("ไม่มี token สำหรับการเชื่อมต่อ WebSocket");
      return;
    }

    // ตรวจสอบว่ามีการระบุ roomId หรือไม่
    if (!roomId) {
      // กรณีไม่มี roomId - เชื่อมต่อเพื่อติดตามสถานะออนไลน์เท่านั้น
      console.log(
        "เริ่มการเชื่อมต่อ WebSocket เพื่อติดตามสถานะออนไลน์ (global)"
      );

      // สร้าง socket สำหรับติดตามสถานะออนไลน์
      const setupGlobalSocket = async () => {
        try {
          const socket = io(SOCKET_URL, {
            auth: { token: wsToken },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000,
            transports: ["websocket", "polling"],
          });

          // เมื่อเชื่อมต่อสำเร็จ
          socket.on("connect", async () => {
            console.log("✅ เชื่อมต่อ WebSocket สำเร็จ (global)");
            setIsConnected(true);
            setError(null);

            // ซิงค์ข้อมูลการแจ้งเตือน
            syncNotifications();

            // ร้องขอรายการผู้ใช้ออนไลน์
            socket.emit(
              "getOnlineUsers",
              (response: { success: boolean; data: string[] }) => {
                if (response.success) {
                  console.log(
                    "ได้รับรายการผู้ใช้ออนไลน์ (global):",
                    response.data.length,
                    "คน"
                  );
                  setOnlineUsers(new Set(response.data));
                }
              }
            );
          });

          // รับการอัพเดทข้อความล่าสุดของห้อง
          socket.on(
            "roomLastMessageUpdated",
            ({ roomId: updatedRoomId, lastMessage }) => {
              // สร้าง unique ID สำหรับการอัพเดทนี้
              const updateId = `${updatedRoomId}-${
                lastMessage?._id || Date.now()
              }`;
              const now = Date.now();

              // ตรวจสอบว่าเราเพิ่งได้รับการอัพเดทนี้เมื่อไม่นานมานี้หรือไม่ (ป้องกันการนับซ้ำ)
              const lastProcessed =
                processedRoomUpdateIds.current.get(updateId);
              if (lastProcessed && now - lastProcessed < 2000) {
                console.log(
                  `ได้รับการอัพเดทข้อความล่าสุดซ้ำ (ห้อง ${updatedRoomId})`
                );
                return;
              }

              // เพิ่มการอัพเดทนี้เข้าไปในรายการที่ประมวลผลแล้ว
              processedRoomUpdateIds.current.set(updateId, now);

              console.log(
                `ได้รับข้อมูลข้อความล่าสุดใหม่สำหรับห้อง ${updatedRoomId}`
              );

              // เช็คว่าเป็นข้อความจากเราเองหรือไม่
              const isMyMessage =
                lastMessage?.senderId?._id === currentUser?._id;

              // เช็คว่าผู้ใช้กำลังอยู่ในห้องแชทนี้หรือไม่ - แก้ให้แม่นยำขึ้น
              const isInThisRoom =
                typeof window !== "undefined" &&
                roomId === updatedRoomId && // เพิ่มการตรวจสอบว่า roomId ปัจจุบันตรงกับที่ได้รับหรือไม่
                document.hasFocus() && // เพิ่มการตรวจสอบว่าหน้าเว็บมี focus หรือไม่
                window.location.pathname === `/chat/${updatedRoomId}`;

              // เพิ่ม unreadCount ถ้าไม่ใช่ข้อความของเราและไม่ได้อยู่ในห้องนั้น
              if (!isMyMessage && !isInThisRoom) {
                // แทนที่จะอัพเดทเอง ให้เรียก API เพื่อดึงค่าที่ถูกต้องจากเซิร์ฟเวอร์
                chatService
                  .getUnreadCountForRoom(updatedRoomId)
                  .then((data) => {
                    setUnreadCounts((prev) => {
                      const newCounts = [...prev];
                      const roomIndex = newCounts.findIndex(
                        (item) => item.roomId === updatedRoomId
                      );

                      if (roomIndex >= 0) {
                        // อัพเดทค่าที่ได้จากเซิร์ฟเวอร์โดยตรง
                        const oldCount = newCounts[roomIndex].count;
                        newCounts[roomIndex] = {
                          ...newCounts[roomIndex],
                          count: data.count,
                        };

                        // อัพเดท totalUnread
                        setTotalUnread(
                          (prevTotal) => prevTotal - oldCount + data.count
                        );
                      } else {
                        // หากยังไม่มีข้อมูลห้องแชทนี้ในรายการ ให้เพิ่มใหม่
                        newCounts.push({
                          roomId: updatedRoomId,
                          count: data.count,
                        });
                        setTotalUnread((prevTotal) => prevTotal + data.count);
                      }

                      return newCounts;
                    });
                  })
                  .catch((error) => {
                    console.error(
                      `ไม่สามารถดึงจำนวนข้อความที่ยังไม่ได้อ่านในห้อง ${updatedRoomId}:`,
                      error
                    );
                  });
              }

              // เรียกทุก listener ที่ลงทะเบียนไว้
              roomLastMessageListeners.current.forEach((callback) =>
                callback(updatedRoomId, lastMessage)
              );
            }
          );

          // รับสถานะออนไลน์ผู้ใช้เมื่อเชื่อมต่อใหม่
          socket.on("onlineUsers", (userIds: string[]) => {
            console.log("ได้รับรายการผู้ใช้ออนไลน์:", userIds);
            setOnlineUsers(new Set(userIds));
          });

          // รับการเปลี่ยนแปลงสถานะผู้ใช้
          socket.on("userStatus", ({ userId, isOnline }) => {
            console.log(
              `สถานะผู้ใช้เปลี่ยนแปลง: ${userId} - ${
                isOnline ? "ออนไลน์" : "ออฟไลน์"
              }`
            );
            setOnlineUsers((prev) => {
              const newSet = new Set(prev);
              if (isOnline) {
                newSet.add(userId);
              } else {
                newSet.delete(userId);
              }
              return newSet;
            });
          });

          // ส่วนของการแจ้งเตือนต่างๆ
          // รับการแจ้งเตือนแบบเรียลไทม์
          socket.on("notification", (notification) => {
            console.log("ได้รับการแจ้งเตือน:", notification);

            // เพิ่มการแจ้งเตือนใหม่ในรายการ
            setNotifications((prev) => [notification, ...prev]);

            // เพิ่มจำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน
            setUnreadNotificationCount((prev) => prev + 1);

            // สร้าง CustomEvent เพื่อส่งการแจ้งเตือนไปให้ component อื่นๆ
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("user:notification-received", {
                  detail: notification,
                })
              );
            }

            // แสดง toast notification
            if (notification.type === "comment") {
              toast.info(notification.content, {
                description: notification.data?.comment
                  ? `"${notification.data.comment}"`
                  : "",
                action: {
                  label: "ดูโพสต์",
                  onClick: () => {
                    // รูปแบบใหม่ /{username}/posts/{postId}
                    const ownerUsername = notification.data?.postOwnerUsername;

                    router.push(
                      `/${ownerUsername}/post/${notification.targetId}`
                    );
                  },
                },
              });
            } else if (notification.type === "like") {
              toast.info(notification.content, {
                action: {
                  label: "ดูโพสต์",
                  onClick: () => {
                    // รูปแบบใหม่ /{username}/posts/{postId}
                    const ownerUsername = notification.data?.postOwnerUsername;

                    router.push(
                      `/${ownerUsername}/post/${notification.targetId}`
                    );
                  },
                },
              });
            } else if (notification.type === "follow") {
              toast.info(notification.content, {
                action: {
                  label: "ดูโปรไฟล์",
                  onClick: () => {
                    router.push(`/${notification.data?.username}`);
                  },
                },
              });
            } else {
              toast.info(notification.content);
            }
          });

          // รับการแจ้งเตือนเมื่อมีการลบการแจ้งเตือน
          socket.on(
            "notificationsDeleted",
            ({ notificationIds, timestamp }) => {
              console.log(
                "การแจ้งเตือนถูกลบ:",
                notificationIds,
                "เวลา:",
                timestamp
              );

              // นับจำนวนการแจ้งเตือนที่ยังไม่ได้อ่านที่จะถูกลบ
              const unreadDeletedCount = notifications.filter(
                (n) => notificationIds.includes(n._id) && !n.isRead
              ).length;

              // การแจ้งเตือนที่ถูกลบออกจาก state
              setNotifications((prev) =>
                prev.filter(
                  (notification) => !notificationIds.includes(notification._id)
                )
              );

              // ลดจำนวนการแจ้งเตือนที่ยังไม่ได้อ่านเฉพาะรายการที่ยังไม่ได้อ่าน
              if (unreadDeletedCount > 0) {
                setUnreadNotificationCount((prev) =>
                  Math.max(0, prev - unreadDeletedCount)
                );
              }

              // เพิ่มส่วนนี้ที่ทั้ง 2 ที่: ส่ง CustomEvent เพื่อแจ้งเตือนการลบ notification
              if (typeof window !== "undefined") {
                window.dispatchEvent(
                  new CustomEvent("user:notifications-deleted", {
                    detail: { notificationIds, timestamp },
                  })
                );
              }
            }
          );

          // จัดการเหตุการณ์ข้อผิดพลาดในการเชื่อมต่อ
          socket.on("connect_error", (err) => {
            console.error(
              "เกิดข้อผิดพลาดในการเชื่อมต่อ Socket (global):",
              err.message
            );
            setIsConnected(false);
          });

          // จัดการเมื่อถูกตัดการเชื่อมต่อ
          socket.on("disconnect", () => {
            setIsConnected(false);
            console.log("⚠️ Socket ถูกตัดการเชื่อมต่อ (global)");
          });

          // เก็บ socket ไว้ใน ref
          socketRef.current = socket;

          // เมื่อ component unmount
          return () => {
            console.log("🔄 กำลังทำความสะอาด socket connection (global)...");
            socket.disconnect();
          };
        } catch (err) {
          console.error(
            "❌ เกิดข้อผิดพลาดในการตั้งค่า WebSocket (global):",
            err
          );
          setError(`เกิดข้อผิดพลาดในการเชื่อมต่อ: ${err}`);
        }
      };

      setupGlobalSocket();
      return;
    }

    // กรณีมี roomId - เชื่อมต่อเพื่อใช้งานห้องแชท
    console.log(`กำลังเริ่มเชื่อมต่อ WebSocket สำหรับห้องแชท: ${roomId}`);

    // เริ่มต้นเตรียมการเชื่อมต่อ WebSocket
    async function setupAndConnect() {
      try {
        // 1. ตรวจสอบว่าผู้ใช้เป็นสมาชิกห้องแชทนี้หรือไม่ด้วย REST API
        console.log("กำลังตรวจสอบการเป็นสมาชิกห้องแชทผ่าน API...");
        const { isMember } = await chatService.verifyRoomMembership(
          String(roomId)
        );

        if (!isMember) {
          console.error("ไม่เป็นสมาชิกห้องแชทตามการตรวจสอบด้วย API");
          setError("คุณไม่ใช่สมาชิกของห้องแชทนี้");
          toast.error("ไม่สามารถเข้าร่วมห้องแชทได้", {
            description: "คุณไม่ใช่สมาชิกของห้องแชทนี้",
          });

          // กลับไปหน้ารายการแชท
          setTimeout(() => router.push("/chat"), 3000);
          return;
        }

        console.log("ยืนยันการเป็นสมาชิกห้องแชท - กำลังเชื่อมต่อ WebSocket");

        // 2. รอเล็กน้อยก่อนสร้าง Socket instance (เพื่อให้แน่ใจว่า backend พร้อม)
        await new Promise((resolve) => setTimeout(resolve, 500));

        const socket = io(SOCKET_URL, {
          auth: { token: wsToken },
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000,
          transports: ["websocket", "polling"],
        });

        // เพิ่ม event listeners สำหรับสถานะ online/offline
        socket.on("onlineUsers", (userIds: string[]) => {
          console.log("ได้รับรายการผู้ใช้ออนไลน์:", userIds);
          setOnlineUsers(new Set(userIds));
        });

        socket.on("userStatus", ({ userId, isOnline }) => {
          console.log(
            `สถานะผู้ใช้เปลี่ยนแปลง: ${userId} - ${
              isOnline ? "ออนไลน์" : "ออฟไลน์"
            }`
          );
          setOnlineUsers((prev) => {
            const newSet = new Set(prev);
            if (isOnline) {
              newSet.add(userId);
            } else {
              newSet.delete(userId);
            }
            return newSet;
          });
        });

        // 4. จัดการเหตุการณ์การเชื่อมต่อ
        socket.on("connect", () => {
          console.log("✅ เชื่อมต่อ WebSocket สำเร็จ");
          setIsConnected(true);
          setError(null);

          // ร้องขอรายการผู้ใช้ออนไลน์
          socket.emit(
            "getOnlineUsers",
            (response: { success: boolean; data: string[] }) => {
              if (response.success) {
                console.log(
                  "ได้รับรายการผู้ใช้ออนไลน์ (global):",
                  response.data.length,
                  "คน"
                );
                setOnlineUsers(new Set(response.data));
              }
            }
          );

          // 5. เข้าร่วมห้องแชทเมื่อเชื่อมต่อสำเร็จ (รอ 1 วินาที)
          setTimeout(() => joinRoomWithRetry(), 1000);
        });

        // 6. ระบบพยายามเข้าร่วมห้องหลายครั้งหากไม่สำเร็จ
        let joinAttempts = 0;
        const maxJoinAttempts = 5; // พยายามสูงสุด 5 ครั้ง

        function joinRoomWithRetry() {
          // เตรียมข้อมูลสำหรับการเข้าห้อง
          const userData = localStorage.getItem("user_data");
          const userObj = userData ? JSON.parse(userData) : null;
          const userId = userObj?._id;

          console.log(
            `🔄 พยายามเข้าร่วมห้องครั้งที่ ${
              joinAttempts + 1
            }/${maxJoinAttempts}`
          );
          console.log(`- Room ID: ${roomId}`);
          console.log(`- User ID: ${userId}`);

          // ใช้ String constructor เพื่อให้แน่ใจว่าเป็น string
          const roomIdStr = String(roomId).trim();

          // ส่งคำขอเข้าร่วมห้องแชท
          socket.emit(
            "joinRoom",
            {
              roomId: roomIdStr,
              userId: userId,
              timestamp: Date.now(), // เพิ่ม timestamp เพื่อป้องกัน cache
            } as JoinRoomRequest,
            (response: ChatResponse) => {
              // ตรวจสอบการตอบกลับ
              if (!response?.success) {
                console.error(
                  `❌ เข้าร่วมห้องไม่สำเร็จ: ${
                    response?.error || "Unknown error"
                  }`
                );

                // เพิ่มจำนวนความพยายาม
                joinAttempts++;

                // ถ้ายังไม่เกินจำนวนที่กำหนด ลองใหม่
                if (joinAttempts < maxJoinAttempts) {
                  const delay = Math.min(2000 * joinAttempts, 8000); // เพิ่มเวลารอตามจำนวนครั้ง แต่ไม่เกิน 8 วินาที
                  console.log(`⏱️ รอ ${delay / 1000} วินาทีแล้วลองใหม่...`);

                  setTimeout(joinRoomWithRetry, delay);
                  return;
                }

                // พยายามครบตามที่กำหนดแล้ว แสดงข้อความผิดพลาด
                setError("ไม่สามารถเข้าร่วมห้องแชทหลังจากพยายามหลายครั้ง");

                toast.error("ไม่สามารถเข้าร่วมห้องแชทได้", {
                  description: "กรุณาลองใหม่ในภายหลัง",
                  action: {
                    label: "กลับ",
                    onClick: () => router.push("/chat"),
                  },
                });

                // กลับไปหน้ารายการแชท
                setTimeout(() => router.push("/chat"), 5000);
              } else {
                // เข้าร่วมห้องสำเร็จ
                console.log(`✅ เข้าร่วมห้องแชท ${roomId} สำเร็จ`);
                // โหลดข้อความ
                loadMessages();
              }
            }
          );
        }

        // 7. จัดการเหตุการณ์อื่นๆ ของ Socket

        // จัดการเหตุการณ์ข้อผิดพลาดในการเชื่อมต่อ
        socket.on("connect_error", (err) => {
          console.error("เกิดข้อผิดพลาดในการเชื่อมต่อ Socket:", err.message);
          setIsConnected(false);

          if (
            err.message.includes("Unauthorized") ||
            err.message.includes("invalid")
          ) {
            setError("โทเคนหมดอายุหรือไม่ถูกต้อง กรุณาล็อกอินใหม่");
            toast.error("การเชื่อมต่อล้มเหลว", {
              description: "โทเคนหมดอายุ กรุณาล็อกอินใหม่",
            });
          }
        });

        // รับข้อความใหม่
        socket.on("messageCreated", (message: Message) => {
          // เพิ่มการบันทึกเวลาที่ได้รับข้อความ
          const messageKey = message._id;

          // ตรวจสอบว่าเราได้ประมวลผลข้อความนี้แล้วหรือไม่
          if (processedMessageIds.current.has(messageKey)) {
            console.warn("ได้รับข้อความซ้ำ (ตรวจจับโดย ref):", message._id);
            return;
          }

          // เพิ่มข้อความนี้ในรายการที่ประมวลผลแล้ว
          processedMessageIds.current.add(messageKey);

          console.log("ได้รับข้อความใหม่:", message);
          // ตรวจสอบว่าเป็นห้องที่เรากำลังดูอยู่หรือไม่
          const isCurrentRoom = roomId === message.roomId;
          const isMyMessage = message.senderId?._id === currentUser?._id;

          // เพิ่มการตรวจสอบว่าหน้าเว็บมี focus หรือไม่
          const windowHasFocus =
            typeof document !== "undefined" && document.hasFocus();

          if (isCurrentRoom) {
            setMessages((prev) => {
              // เช็คว่ามีข้อความนี้อยู่แล้วหรือไม่
              const isDuplicate = prev.some((msg) => msg._id === message._id);
              if (isDuplicate) {
                console.warn("ได้รับข้อความซ้ำ:", message._id);
                return prev;
              }

              // ถ้าเป็นข้อความใหม่ที่ไม่ซ้ำ ให้เพิ่มเข้าไปในรายการ
              return [...prev, message];
            });

            // ถ้าเป็นข้อความที่ได้รับในห้องที่กำลังดูอยู่ ให้ทำเครื่องหมายว่าอ่านแล้ว (ถ้าไม่ใช่ข้อความของเรา)
            if (!isMyMessage && windowHasFocus) {
              markAsRead([message._id]);
            }
          } else if (!isMyMessage) {
            // ถ้าไม่ใช่ห้องปัจจุบันและไม่ใช่ข้อความของเรา ควรตรวจสอบและอัปเดต unreadCounts
            chatService
              .getUnreadCountForRoom(message.roomId)
              .then((data) => {
                setUnreadCounts((prev) => {
                  const newCounts = [...prev];
                  const roomIndex = newCounts.findIndex(
                    (item) => item.roomId === message.roomId
                  );

                  if (roomIndex >= 0) {
                    newCounts[roomIndex] = {
                      ...newCounts[roomIndex],
                      count: data.count,
                    };
                  } else {
                    newCounts.push({
                      roomId: message.roomId,
                      count: data.count,
                    });
                  }

                  // อัพเดท totalUnread
                  const newTotal = newCounts.reduce(
                    (sum: number, item) => sum + item.count,
                    0
                  );
                  setTotalUnread(newTotal);

                  return newCounts;
                });
              })
              .catch((error) =>
                console.error(
                  "ไม่สามารถอัพเดทจำนวนข้อความที่ยังไม่ได้อ่าน:",
                  error
                )
              );
          }
        });

        // รับการแก้ไขข้อความ
        socket.on("messageUpdated", (updatedMessage: Message) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === updatedMessage._id ? updatedMessage : msg
            )
          );
        });

        // รับการลบข้อความ
        socket.on("messageDeleted", ({ id }: { id: string }) => {
          setMessages((prev) => prev.filter((msg) => msg._id !== id));
        });

        // รับสถานะการพิมพ์
        socket.on(
          "userTyping",
          async ({ userId, username, profile, isTyping }: UserTypingEvent) => {
            // ตรวจสอบการเรียกซ้ำในระยะเวลาอันสั้น
            const lastEvent = lastTypingEvents.current.get(userId);
            const now = Date.now();

            if (
              lastEvent &&
              lastEvent.isTyping === isTyping &&
              now - lastEvent.timestamp < 500
            ) {
              console.log(
                `ไม่ประมวลผล typing event ซ้ำจาก ${userId} (${
                  isTyping ? "กำลังพิมพ์" : "หยุดพิมพ์"
                })`
              );
              return;
            }

            // บันทึกสถานะล่าสุด
            lastTypingEvents.current.set(userId, { isTyping, timestamp: now });

            console.log("ได้รับ userTyping event:", {
              userId,
              username,
              profile,
              isTyping,
            });

            if (isTyping) {
              try {
                // กรณีที่ username ดูเหมือนจะเป็น ID (ไม่มีข้อมูลอื่นๆ)
                if (!profile && username === userId) {
                  // ดึงข้อมูลผู้ใช้จาก API
                  const userData = await profileService.getUserById(userId);

                  if (userData?.profile) {
                    profile = {
                      name: userData.profile.name || username,
                      avatarUrl: userData.profile.avatarUrl,
                    };
                    console.log("ดึงข้อมูลโปรไฟล์แล้ว:", profile);
                  }
                }

                // อัพเดทข้อมูลผู้ใช้ที่กำลังพิมพ์
                setTypingUsers((prev) => {
                  // ถ้ามีข้อมูลเดิมอยู่แล้ว แค่อัพเดท timestamp เพื่อป้องกันการซ้อนทับ
                  if (prev[userId]) {
                    return {
                      ...prev,
                      [userId]: {
                        ...prev[userId],
                        name: profile?.name || username,
                        avatarUrl: profile?.avatarUrl || undefined,
                        lastUpdated: Date.now(), // เพิ่ม timestamp เพื่อช่วยในการติดตาม
                      },
                    };
                  }

                  // ถ้ายังไม่มีข้อมูล ให้สร้างใหม่
                  return {
                    ...prev,
                    [userId]: {
                      username,
                      name: profile?.name || username,
                      avatarUrl: profile?.avatarUrl || undefined, // ใช้ undefined แทน null
                      lastUpdated: Date.now(),
                    },
                  };
                });
              } catch (error) {
                console.error("ไม่สามารถดึงข้อมูลผู้ใช้:", error);

                // ถึงแม้จะมีข้อผิดพลาด ก็ยังแสดงชื่อที่มี
                setTypingUsers((prev) => {
                  // ตรวจสอบว่ามีข้อมูลเดิมหรือไม่
                  const existingUser = prev[userId];

                  // ถ้ามีข้อมูลเดิม ให้คงไว้แต่อัพเดท timestamp
                  if (existingUser) {
                    return {
                      ...prev,
                      [userId]: {
                        ...existingUser,
                        lastUpdated: Date.now(),
                      },
                    };
                  }

                  // ถ้าไม่มี สร้างใหม่
                  return {
                    ...prev,
                    [userId]: {
                      username,
                      name: username,
                      avatarUrl: undefined, // ใช้ undefined แทน null
                      lastUpdated: Date.now(),
                    },
                  };
                });
              }
            } else {
              // ลบผู้ใช้ออกจากรายการผู้ที่กำลังพิมพ์
              setTypingUsers((prev) => {
                const newState = { ...prev };
                delete newState[userId];
                return newState;
              });
            }
          }
        );

        // รับแจ้งเตือนเมื่อมีผู้ใช้เข้า/ออกห้อง
        socket.on("userJoined", ({ username }: UserRoomEvent) => {
          toast.info(`${username || "ผู้ใช้"} เข้าร่วมห้องแชท`);
        });

        socket.on("userLeft", ({ username }: UserRoomEvent) => {
          toast.info(`${username || "ผู้ใช้"} ออกจากห้องแชท`);
        });

        // อัพเดทสถานะการอ่าน
        socket.on(
          "messagesRead",
          ({ userId, messageIds }: MessagesReadEvent) => {
            // อัพเดทสถานะการอ่านข้อความ
            setMessages((prev) =>
              prev.map((msg) =>
                messageIds.includes(msg._id)
                  ? {
                      ...msg,
                      readBy: Array.from(
                        new Set([...(msg.readBy || []), userId])
                      ),
                      readTimestamp: {
                        ...(msg.readTimestamp || {}),
                        [userId]: new Date().toISOString(),
                      },
                    }
                  : msg
              )
            );

            // เรียกดูจำนวนที่ยังไม่อ่าน โดยให้เรียกเฉพาะกรณีที่เรายังไม่ได้อ่านเอง
            if (userId !== currentUser?._id) {
              // ทำ API call เพื่อดึงข้อมูลล่าสุดแทนการใช้ socket event
              chatService
                .getUnreadCountsForAllRooms()
                .then((unreadData) => {
                  setUnreadCounts(unreadData);
                  setTotalUnread(
                    unreadData.reduce((sum, item) => sum + item.count, 0)
                  );
                })
                .catch((error) => {
                  console.error(
                    "ไม่สามารถดึงข้อมูลจำนวนข้อความที่ยังไม่ได้อ่าน:",
                    error
                  );
                });
            }
          }
        );

        // รับแจ้งเตือนเมื่อมีการเปลี่ยนแปลงสมาชิกในห้อง
        socket.on(
          "roomParticipantsChanged",
          (data: RoomParticipantsChangedEvent) => {
            console.log("การเปลี่ยนแปลงสมาชิกในห้อง:", data);

            // ถ้าเป็นห้องที่กำลังดูอยู่
            if (data.roomId === roomId) {
              // ส่ง event เพื่อให้ component อื่นๆ รับรู้
              if (typeof window !== "undefined") {
                window.dispatchEvent(
                  new CustomEvent("room:participants-changed", {
                    detail: data,
                  })
                );
              }

              // แสดง toast notification
              if (data.action === "add" && data.targetUser) {
                const name =
                  data.targetUser.profile?.name || data.targetUser.username;
                toast.info(`${name} ได้เข้าร่วมห้องแชท`);
              } else if (data.action === "remove" && data.targetUser) {
                const name =
                  data.targetUser.profile?.name || data.targetUser.username;
                toast.info(`${name} ถูกนำออกจากห้องแชท`);
              } else if (data.action === "leave" && data.targetUser) {
                const name =
                  data.targetUser.profile?.name || data.targetUser.username;
                toast.info(`${name} ได้ออกจากห้องแชท`);
              }
            }
          }
        );

        // รับฟังเมื่อรายการห้องแชทมีการเปลี่ยนแปลง (เช่น ถูกเพิ่มหรือลบออกจากห้อง)
        socket.on(
          "userRoomsChanged",
          (data: {
            action: "add" | "remove" | "leave"; // แก้ไข type ให้ตรงกับ backend
            roomId?: string;
            roomName?: string;
            by?: string;
            byName?: string;
            room?: ChatRoom;
          }) => {
            console.log("ได้รับการเปลี่ยนแปลงรายการห้องแชทของผู้ใช้:", data);

            // แสดง toast notification ตามประเภทการเปลี่ยนแปลง
            if (data.action === "add") {
              // ปรับปรุงข้อความให้สมบูรณ์มากขึ้น
              const roomName =
                data.roomName || data.room?.metadata?.name || "ห้องแชทใหม่";
              const byName = data.byName ? ` โดย ${data.byName}` : "";

              toast.info(`คุณได้ถูกเพิ่มเข้าห้องแชท "${roomName}"${byName}`, {
                duration: 5000,
                action: {
                  label: "ดูห้องแชท",
                  onClick: () => {
                    if (data.roomId) {
                      router.push(`/chat/${data.roomId}`);
                    }
                  },
                },
              });
            } else if (data.action === "remove") {
              // เพิ่มรายละเอียดห้องและผู้ดำเนินการ
              const roomName = data.roomName || "ห้องแชท";
              const byName = data.byName ? ` โดย ${data.byName}` : "";

              toast.info(`คุณถูกนำออกจาก${roomName}${byName}`, {
                duration: 5000,
              });
            } else if (data.action === "leave") {
              // เพิ่มการจัดการ action "leave"
              const roomName = data.roomName || "ห้องแชท";

              toast.info(`คุณได้ออกจาก${roomName}`, {
                duration: 5000,
              });
            }

            // เก็บข้อมูลเหตุการณ์นี้ไว้ใน ref เพื่อให้สามารถตรวจสอบได้ภายหลัง
            // เพิ่มความสามารถในการเช็คว่าเราได้รับการเปลี่ยนแปลงนี้แล้วหรือยัง
            const eventKey = `${data.action}-${data.roomId}-${Date.now()}`;
            lastRoomsChangedEvents.current.set(eventKey, {
              data,
              timestamp: Date.now(),
            });

            // จำกัดขนาดของ Map ไม่ให้เติบโตไม่จำกัด
            if (lastRoomsChangedEvents.current.size > 20) {
              // ลบรายการเก่าที่สุด
              const oldestKey = Array.from(
                lastRoomsChangedEvents.current.keys()
              )[0];
              lastRoomsChangedEvents.current.delete(oldestKey);
            }

            // ส่ง event เพื่อให้ component อื่นๆ รับรู้
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("user:rooms-changed", {
                  detail: data,
                })
              );
            }
          }
        );

        // สำหรับดึงจำนวนข้อความที่ยังไม่ได้อ่านในห้องเฉพาะ
        socket.emit(
          "getUnreadCount",
          { roomId: "roomId123" },
          (response: UnreadCountResponse) => {
            if (response.success) {
              console.log(
                `จำนวนข้อความที่ยังไม่ได้อ่าน: ${response.data.count}`
              );
            }
          }
        );

        // สำหรับดึงจำนวนข้อความที่ยังไม่ได้อ่านในทุกห้อง
        socket.emit("getAllUnreadCounts", (response: UnreadCountsResponse) => {
          if (response.success) {
            const unreadCounts = response.data;
            console.log(
              "จำนวนข้อความที่ยังไม่ได้อ่านในแต่ละห้อง:",
              unreadCounts
            );

            // ตัวอย่างการนำไปใช้แสดงใน UI
            const totalUnread = unreadCounts.reduce(
              (sum, item) => sum + item.count,
              0
            );
            console.log(`จำนวนข้อความที่ยังไม่ได้อ่านทั้งหมด: ${totalUnread}`);
          }
        });

        // ส่วนของการแจ้งเตือนต่างๆ
        // รับการแจ้งเตือนแบบเรียลไทม์
        socket.on("notification", (notification) => {
          console.log("ได้รับการแจ้งเตือน:", notification);

          // เพิ่มการแจ้งเตือนใหม่ในรายการ
          setNotifications((prev) => [notification, ...prev]);

          // เพิ่มจำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน
          setUnreadNotificationCount((prev) => prev + 1);

          // แสดง toast notification
          if (notification.type === "comment") {
            toast.info(notification.content, {
              description: notification.data?.comment
                ? `"${notification.data.comment}"`
                : "",
              action: {
                label: "ดูโพสต์",
                onClick: () => {
                  router.push(`/posts/${notification.targetId}`);
                },
              },
            });
          } else {
            toast.info(notification.content);
          }
        });

        // รับการแจ้งเตือนเมื่อมีการลบการแจ้งเตือน
        socket.on("notificationsDeleted", ({ notificationIds, timestamp }) => {
          console.log(
            "การแจ้งเตือนถูกลบ:",
            notificationIds,
            "เวลา:",
            timestamp
          );

          // นับจำนวนการแจ้งเตือนที่ยังไม่ได้อ่านที่จะถูกลบ
          const unreadDeletedCount = notifications.filter(
            (n) => notificationIds.includes(n._id) && !n.isRead
          ).length;

          // การแจ้งเตือนที่ถูกลบออกจาก state
          setNotifications((prev) =>
            prev.filter(
              (notification) => !notificationIds.includes(notification._id)
            )
          );

          // ลดจำนวนการแจ้งเตือนที่ยังไม่ได้อ่านเฉพาะรายการที่ยังไม่ได้อ่าน
          if (unreadDeletedCount > 0) {
            setUnreadNotificationCount((prev) =>
              Math.max(0, prev - unreadDeletedCount)
            );
          }

          // เพิ่มส่วนนี้ที่ทั้ง 2 ที่: ส่ง CustomEvent เพื่อแจ้งเตือนการลบ notification
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("user:notifications-deleted", {
                detail: { notificationIds, timestamp },
              })
            );
          }
        });

        // จัดการเมื่อถูกตัดการเชื่อมต่อ
        socket.on("disconnect", () => {
          setIsConnected(false);
          console.log("⚠️ Socket ถูกตัดการเชื่อมต่อ");
        });

        // 8. เก็บ socket ไว้ใน ref
        socketRef.current = socket;

        // 9. เมื่อ component unmount
        return () => {
          console.log("🔄 กำลังทำความสะอาด socket connection...");
          if (roomId) {
            socket.emit("leaveRoom", { roomId } as LeaveRoomRequest);
          }
          socket.disconnect();
        };
      } catch (err) {
        console.error("❌ เกิดข้อผิดพลาดในการตั้งค่า WebSocket:", err);
        setError(`เกิดข้อผิดพลาดในการเชื่อมต่อ: ${err}`);
        toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ", {
          description: "กรุณาลองใหม่อีกครั้ง",
        });
      }
    }

    // เริ่มการตั้งค่าและเชื่อมต่อ
    setupAndConnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, router]);

  // เพิ่มฟังก์ชันสำหรับตรวจสอบสถานะของผู้ใช้
  const checkUserStatus = useCallback((userIds: string[]) => {
    if (!socketRef.current) return Promise.resolve([]);

    return new Promise((resolve) => {
      socketRef.current!.emit(
        "checkUserStatus",
        { userIds },
        (response: { success: boolean; data: string[]; error?: string }) => {
          if (response.success) {
            resolve(response.data);
          } else {
            resolve([]);
          }
        }
      );
    });
  }, []);

  // ฟังก์ชันสำหรับลงทะเบียนรับการอัพเดทข้อความล่าสุด
  const onRoomLastMessageUpdated = useCallback(
    (callback: (roomId: string, lastMessage: Message) => void) => {
      // เพิ่ม callback เข้าไปในรายการ
      roomLastMessageListeners.current.push(callback);

      // คืนค่าฟังก์ชันสำหรับยกเลิกการลงทะเบียน
      return () => {
        roomLastMessageListeners.current =
          roomLastMessageListeners.current.filter((cb) => cb !== callback);
      };
    },
    []
  );

  // โหลดข้อความในห้องแชท
  const loadMessages = useCallback(
    async (limit = 50, before?: string) => {
      if (!socketRef.current || !roomId) return; // ตรวจสอบ roomId ว่าไม่เป็น undefined
      setIsLoading(true);

      socketRef.current.emit(
        "findRoomMessages",
        { roomId, limit, before } as FindRoomMessagesRequest,
        (response: ChatResponse<Message[]>) => {
          setIsLoading(false);
          if (response.success && response.data) {
            setMessages((prev) => {
              if (!before) {
                // ตรวจสอบและกรองข้อความที่ซ้ำกันออก
                const uniqueMessages = response.data!.filter(
                  (message, index, self) =>
                    self.findIndex((m) => m._id === message._id) === index
                );
                return [...uniqueMessages.reverse()];
              }

              // ถ้าเป็นการโหลดเพิ่ม ตรวจสอบและไม่เพิ่มข้อความที่ซ้ำ
              const existingIds = new Set(prev.map((msg) => msg._id));
              const newMessages = response.data!.filter(
                (msg) => !existingIds.has(msg._id)
              );

              return [...newMessages.reverse(), ...prev];
            });
          } else {
            setError(response.error || null);
            toast.error("ไม่สามารถโหลดข้อความได้", {
              description: response.error || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ",
            });
          }
        }
      );
    },
    [roomId]
  );

  // ส่งข้อความใหม่
  const sendMessage = useCallback(
    (content: string, type = "text") => {
      if (!socketRef.current || !roomId || !content.trim()) return;

      return new Promise<Message>((resolve, reject) => {
        socketRef.current!.emit(
          "createMessage",
          { roomId, content, type } as MessageCreateRequest,
          (response: ChatResponse<Message>) => {
            if (response.success) {
              resolve(response.data!);
            } else {
              setError(response.error || null);
              toast.error("ไม่สามารถส่งข้อความได้", {
                description: response.error || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ",
              });
              reject(response.error);
            }
          }
        );
      });
    },
    [roomId]
  );

  // แก้ไขข้อความ
  const updateMessage = useCallback(
    (messageId: string, content: string) => {
      if (!socketRef.current || !roomId) return;

      return new Promise<Message>((resolve, reject) => {
        socketRef.current!.emit(
          "updateMessage",
          { id: messageId, content } as MessageUpdateRequest,
          (response: ChatResponse<Message>) => {
            if (response.success) {
              resolve(response.data!);
            } else {
              setError(response.error || null);
              toast.error("ไม่สามารถแก้ไขข้อความได้", {
                description: response.error || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ",
              });
              reject(response.error);
            }
          }
        );
      });
    },
    [roomId]
  );

  // ลบข้อความ
  const deleteMessage = useCallback(
    (messageId: string) => {
      if (!socketRef.current || !roomId) return;

      return new Promise<void>((resolve, reject) => {
        socketRef.current!.emit(
          "removeMessage",
          messageId,
          (response: ChatResponse) => {
            if (response.success) {
              resolve();
            } else {
              setError(response.error || null);
              toast.error("ไม่สามารถลบข้อความได้", {
                description: response.error || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ",
              });
              reject(response.error);
            }
          }
        );
      });
    },
    [roomId]
  );

  // ดึงข้อมูลโปรไฟล์เมื่อ component ถูกโหลด
  useEffect(() => {
    async function fetchUserProfile() {
      if (!currentUser || !currentUser.username) return;

      try {
        const profileData = await profileService.getUserByUsername(
          currentUser.username
        );
        setUserProfileData(profileData);
      } catch (e) {
        console.error("ไม่สามารถดึงข้อมูลโปรไฟล์:", e);
      }
    }

    fetchUserProfile();
  }, [currentUser]);

  useEffect(() => {
    // เคลียร์ข้อมูลเก่าทุก 5 นาที
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const MAX_AGE = 5 * 60 * 1000; // 5 นาที

      // ลบรายการอัพเดทห้องแชทที่เก่าเกิน 5 นาที
      processedRoomUpdateIds.current.forEach((timestamp, id) => {
        if (now - timestamp > MAX_AGE) {
          processedRoomUpdateIds.current.delete(id);
        }
      });

      // ล้างข้อมูล typing events ที่เก่าเกินไป
      lastTypingEvents.current.forEach((data, userId) => {
        if (now - data.timestamp > MAX_AGE) {
          lastTypingEvents.current.delete(userId);
        }
      });

      // จำกัดขนาดของ processedMessageIds ไม่ให้เก็บเกิน 1000 รายการ
      if (processedMessageIds.current.size > 1000) {
        processedMessageIds.current = new Set(
          Array.from(processedMessageIds.current).slice(-500)
        );
      }
    }, 5 * 60 * 1000); // รันทุก 5 นาที

    return () => clearInterval(cleanupInterval);
  }, []);

  // ส่งสถานะการพิมพ์
  const sendTypingStatus = useCallback(
    (isTyping: boolean) => {
      if (!socketRef.current || !roomId) return;

      // สร้างข้อมูลโปรไฟล์จากข้อมูลที่มี
      const profile = {
        name: userProfileData?.profile?.name || currentUser?.username,
        avatarUrl: userProfileData?.profile?.avatarUrl || undefined, // ใช้ undefined แทน null
      };

      socketRef.current.emit("typing", { roomId, isTyping, profile });
    },
    [roomId, userProfileData, currentUser]
  );

  // ทำเครื่องหมายว่าอ่านข้อความแล้ว
  const markAsRead = useCallback(
    (messageIds: string[]) => {
      if (!socketRef.current || !roomId || !messageIds.length || !currentUser)
        return;

      console.log("กำลังมาร์คข้อความว่าอ่านแล้ว:", messageIds);

      // เช็คว่าหน้าเว็บมี focus อยู่หรือไม่
      const windowHasFocus =
        typeof document !== "undefined" && document.hasFocus();
      if (!windowHasFocus) {
        console.log("ไม่ทำเครื่องหมายว่าอ่านแล้วเนื่องจากหน้าเว็บไม่ได้ focus");
        return;
      }

      // ตรวจสอบว่าข้อความเหล่านี้เป็นของเราเองหรือไม่
      // ถ้าเป็นข้อความของเรา ไม่ต้อง mark (เราส่งเอง อ่านเองแล้ว)
      const messagesToMark = messages
        .filter(
          (msg) =>
            messageIds.includes(msg._id) &&
            msg.senderId?._id !== currentUser._id &&
            !msg.readBy?.includes(currentUser._id)
        )
        .map((msg) => msg._id);

      if (messagesToMark.length === 0) {
        console.log("ไม่มีข้อความที่ต้อง mark as read");
        return;
      }

      // ส่ง event markAsRead
      socketRef.current.emit("markAsRead", {
        roomId,
        messageIds: messagesToMark,
      } as MarkAsReadRequest);

      // อัพเดท UI แบบ optimistic
      setUnreadCounts((prev) => {
        const newCounts = [...prev];
        const roomIndex = newCounts.findIndex((item) => item.roomId === roomId);

        if (roomIndex >= 0 && newCounts[roomIndex].count > 0) {
          const oldCount = newCounts[roomIndex].count;
          newCounts[roomIndex] = {
            ...newCounts[roomIndex],
            count: 0,
          };

          // อัพเดท totalUnread
          setTotalUnread((prevTotal) => Math.max(0, prevTotal - oldCount));
        }

        return newCounts;
      });
    },
    [roomId, currentUser, messages]
  );

  // เพิ่มฟังก์ชันนี้ก่อน return statement (ประมาณบรรทัด 717) หลังจากฟังก์ชัน markAsRead
  // ทำเครื่องหมายว่าอ่านข้อความแล้ว
  const getUnreadCountForAllRooms = useCallback(() => {
    if (!socketRef.current) return Promise.resolve([]);

    return new Promise<Array<{ roomId: string; count: number }>>(
      (resolve, reject) => {
        socketRef.current!.emit(
          "getUnreadCountForAllRooms",
          (response: UnreadCountsResponse) => {
            if (response.success) {
              const unreadData = response.data;

              // เก็บค่าใน state ด้วย
              setUnreadCounts(unreadData);
              const total = unreadData.reduce(
                (sum, item) => sum + item.count,
                0
              );
              setTotalUnread(total);

              console.log(
                "จำนวนข้อความที่ยังไม่ได้อ่านในแต่ละห้อง:",
                unreadData
              );
              console.log(`จำนวนข้อความที่ยังไม่ได้อ่านทั้งหมด: ${total}`);

              resolve(unreadData);
            } else {
              console.warn(
                "ไม่สามารถดึงข้อมูลจำนวนข้อความที่ยังไม่ได้อ่าน:",
                response.error
              );
              reject(response.error);
            }
          }
        );
      }
    );
  }, []);

  const getUnreadCountForRoom = useCallback((roomId: string) => {
    if (!socketRef.current) return Promise.resolve(0);

    return new Promise<number>((resolve, reject) => {
      socketRef.current!.emit(
        "getUnreadCountForRoom",
        { roomId },
        (response: UnreadCountResponse) => {
          if (response.success) {
            const { count } = response.data;
            console.log(
              `จำนวนข้อความที่ยังไม่ได้อ่านในห้อง ${roomId}: ${count}`
            );
            resolve(count);
          } else {
            console.warn(
              `ไม่สามารถดึงข้อความที่ยังไม่ได้อ่านในห้อง ${roomId}:`,
              response.error
            );
            reject(response.error);
          }
        }
      );
    });
  }, []);

  // เพิ่มฟังก์ชันนี้ก่อน return statement
  const onRoomParticipantsChanged = useCallback(
    (callback: (data: RoomParticipantsChangedEvent) => void) => {
      if (typeof window === "undefined") return () => {};

      // สร้าง event handler
      const handleEvent = (e: CustomEvent<RoomParticipantsChangedEvent>) => {
        callback(e.detail);
      };

      // ลงทะเบียน event listener
      window.addEventListener(
        "room:participants-changed",
        handleEvent as EventListener
      );

      // คืนค่าฟังก์ชันสำหรับยกเลิกการลงทะเบียน
      return () => {
        window.removeEventListener(
          "room:participants-changed",
          handleEvent as EventListener
        );
      };
    },
    []
  );

  // เพิ่ม ref เพื่อเก็บเหตุการณ์ที่เกิดขึ้นล่าสุด
  const lastRoomsChangedEvents = useRef(new Map());

  // ปรับปรุง hook onUserRoomsChanged
  const onUserRoomsChanged = useCallback(
    (
      callback: (data: {
        action: "add" | "remove" | "leave"; // แก้ไข type ให้ตรงกับ backend
        roomId?: string;
        roomName?: string;
        by?: string;
        byName?: string;
        room?: ChatRoom;
      }) => void
    ) => {
      if (typeof window === "undefined") return () => {};

      // สร้าง handler สำหรับ custom event
      const handleCustomEvent = (e: CustomEvent) => {
        if (e.detail) {
          callback(e.detail);
        }
      };

      // สร้าง handler สำหรับ socket event
      const handleSocketEvent = (data: {
        action: "add" | "remove" | "leave";
        roomId?: string;
        roomName?: string;
        by?: string;
        byName?: string;
        room?: ChatRoom;
      }) => {
        console.log("Socket handler: ได้รับข้อมูลการเปลี่ยนแปลงห้องแชท:", data);
        callback(data);
      };

      // ลงทะเบียนทั้ง custom event และ socket event
      window.addEventListener(
        "user:rooms-changed",
        handleCustomEvent as EventListener
      );

      // เชื่อมต่อกับ socket โดยตรง (ถ้ามี)
      if (socketRef.current) {
        socketRef.current.on("userRoomsChanged", handleSocketEvent);
      }

      // คืนค่าฟังก์ชันสำหรับยกเลิกการลงทะเบียน
      return () => {
        window.removeEventListener(
          "user:rooms-changed",
          handleCustomEvent as EventListener
        );

        if (socketRef.current) {
          socketRef.current.off("userRoomsChanged", handleSocketEvent);
        }
      };
    },
    [socketRef] // เพิ่ม dependency
  );

  // ส่วนของการแจ้งเตือนต่างๆ
  // ส่วนของการแจ้งเตือนต่างๆ
  // ทำเครื่องหมายว่าอ่านการแจ้งเตือนแล้ว
  const markNotificationAsRead = useCallback(
    async (notificationId: string) => {
      if (!currentUser) return false;

      try {
        const success = await notificationService.markNotificationAsRead(
          notificationId
        );
        if (success) {
          // อัปเดตสถานะการแจ้งเตือนแบบ optimistic
          setNotifications((prev) =>
            prev.map((item) =>
              item._id === notificationId ? { ...item, isRead: true } : item
            )
          );

          // ลดจำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน
          setUnreadNotificationCount((prev) => Math.max(0, prev - 1));
        }

        return success;
      } catch (error) {
        console.error("ไม่สามารถทำเครื่องหมายว่าอ่านแล้ว:", error);
        return false;
      }
    },
    [currentUser]
  );

  // ดึงข้อมูลการแจ้งเตือนจาก API
  const fetchNotifications = useCallback(
    async (limit = 20, skip = 0, unreadOnly = false) => {
      if (!currentUser) return [];

      try {
        const data = await notificationService.fetchNotifications(
          limit,
          skip,
          unreadOnly
        );

        setNotifications((prev) => {
          // รวมข้อมูลและกำจัด duplicates
          const allNotifications = [...prev, ...data];
          const uniqueNotifications = allNotifications.filter(
            (notification, index, self) =>
              self.findIndex((n) => n._id === notification._id) === index
          );
          return uniqueNotifications;
        });

        // อัปเดตจำนวนที่ยังไม่ได้อ่าน
        const unreadCount = data.filter((item) => !item.isRead).length;
        setUnreadNotificationCount(unreadCount);

        return data;
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูลการแจ้งเตือน:", error);
        return [];
      }
    },
    [currentUser]
  );

  // ทำเครื่องหมายว่าอ่านการแจ้งเตือนทั้งหมดแล้ว
  const markAllNotificationsAsRead = useCallback(async () => {
    if (!currentUser) return false;

    try {
      const success = await notificationService.markAllNotificationsAsRead();

      if (success) {
        // อัปเดตสถานะทุกการแจ้งเตือนแบบ optimistic
        setNotifications((prev) =>
          prev.map((item) => ({ ...item, isRead: true }))
        );

        // รีเซ็ตจำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน
        setUnreadNotificationCount(0);
      }

      return success;
    } catch (error) {
      console.error("ไม่สามารถทำเครื่องหมายว่าอ่านทั้งหมดแล้ว:", error);
      return false;
    }
  }, [currentUser]);

  // ลบการแจ้งเตือน
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (!currentUser) return false;

      try {
        const success = await notificationService.deleteNotification(
          notificationId
        );

        if (success) {
          // ลบออกจาก state และอัพเดทจำนวนที่ยังไม่ได้อ่านถ้าจำเป็น
          setNotifications((prev) => {
            const deletedItem = prev.find(
              (item) => item._id === notificationId
            );
            if (deletedItem && !deletedItem.isRead) {
              setUnreadNotificationCount((count) => Math.max(0, count - 1));
            }
            return prev.filter((item) => item._id !== notificationId);
          });
        }

        return success;
      } catch (error) {
        console.error("ไม่สามารถลบการแจ้งเตือน:", error);
        return false;
      }
    },
    [currentUser]
  );

  // เพิ่มฟังก์ชันนี้เพื่อซิงค์ข้อมูลการแจ้งเตือนกับ server
  const syncNotifications = useCallback(async () => {
    if (!currentUser) return;

    try {
      // ดึงจำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน
      const { count } = await notificationService.getUnreadCount();
      setUnreadNotificationCount(count);

      // ดึงการแจ้งเตือนล่าสุด
      const latestNotifications = await notificationService.fetchNotifications(
        20,
        0,
        false
      );
      setNotifications(latestNotifications);

      console.log("ซิงค์ข้อมูลการแจ้งเตือนเรียบร้อย");
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการซิงค์ข้อมูลการแจ้งเตือน:", error);
    }
  }, [currentUser]);

  return {
    messages,
    isLoading,
    isConnected,
    error,
    typingUsers,
    sendMessage,
    updateMessage,
    deleteMessage,
    loadMoreMessages: (before?: string) => loadMessages(50, before),
    sendTypingStatus,
    markAsRead,
    onlineUsers,
    checkUserStatus,
    onRoomLastMessageUpdated, // เพิ่มตรงนี้
    getUnreadCountForAllRooms, // เปลี่ยนจาก getAllUnreadCounts
    getUnreadCountForRoom, // เพิ่มเข้ามาใหม่
    unreadCounts,
    totalUnread,
    onRoomParticipantsChanged,
    onUserRoomsChanged,
    // ส่วนของการแจ้งเตือน
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    fetchNotifications,
    markAllNotificationsAsRead,
    deleteNotification,
  };
}

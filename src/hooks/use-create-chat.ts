import { useState } from "react";
import { useRouter } from "next/navigation";
import { chatService } from "@/services/chat/chat.service";
import { toast } from "sonner";

export function useCreateChat() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // ฟังก์ชันสำหรับการสร้างหรือเปิดแชทส่วนตัว
  const createPrivateChat = async (userId: string, username?: string) => {
    setLoading(true);
    try {
      const room = await chatService.getPrivateChat(userId);
      console.log("Private chat created/found:", room);

      if (room && room._id) {
        // แสดงชื่อห้องแชทในข้อความแจ้งเตือน
        toast.success("เปิดแชทสำเร็จ", {
          description: `กำลังนำคุณไปยังห้องแชทกับ ${username || "ผู้ใช้"}`,
        });

        // นำทางไปยังห้องแชทพร้อม force refresh เพื่อให้แน่ใจว่าข้อมูลถูกโหลดใหม่
        router.push(`/chat/${room._id}`);
      } else {
        throw new Error("Invalid room data");
      }
    } catch (error) {
      console.error("Error creating private chat:", error);
      toast.error("ไม่สามารถสร้างแชทได้", {
        description: "กรุณาลองอีกครั้งในภายหลัง",
      });
    } finally {
      setLoading(false);
    }
  };

  // สร้างห้องแชทกลุ่ม
  const createGroupChat = async (name: string, participants: string[]) => {
    setLoading(true);

    try {
      const chatRoom = await chatService.createRoom({
        type: "group",
        participants,
        metadata: {
          name,
        },
      });

      // ใช้ dynamic route แทน query parameter
      router.push(`/chat/${chatRoom._id}`);

      toast.success(`สร้างกลุ่มแชท ${name} แล้ว`);
    } catch (error) {
      console.error("Error creating group chat:", error);
      toast.error("ไม่สามารถสร้างกลุ่มแชทได้");
    } finally {
      setLoading(false);
    }
  };

  return {
    createPrivateChat,
    createGroupChat,
    loading,
  };
}

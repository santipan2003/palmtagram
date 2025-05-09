// services/chat/chat.service.tsx
import axios from "axios";
import { ChatRoom, Participant } from "@/interfaces/chat.interface";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // สำคัญมาก! ช่วยให้ส่ง cookies ได้
});

export const chatService = {
  // ดึงรายการห้องแชททั้งหมด
  async getRooms(): Promise<ChatRoom[]> {
    const response = await api.get("/chat/rooms");
    return response.data;
  },

  // ดึงรายการห้องแชทของผู้ใช้พร้อมข้อความล่าสุด
  async getRoomsAndLastMessage(): Promise<ChatRoom[]> {
    const response = await api.get("/chat/rooms/with-last-messages");
    return response.data;
  },

  // ดึงข้อมูลห้องแชทเฉพาะ
  async getRoom(roomId: string): Promise<ChatRoom> {
    const response = await api.get(`/chat/rooms/${roomId}`);
    return response.data;
  },

  // สร้างห้องแชทใหม่
  async createRoom(roomData: {
    type: "private" | "group";
    participants: string[];
    metadata?: { name?: string; avatarUrl?: string };
  }): Promise<ChatRoom> {
    const response = await api.post("/chat/rooms", roomData);
    return response.data;
  },
  /**
   * สร้างห้องแชทแบบกลุ่มสำหรับผู้ใช้ที่มีการติดตามซึ่งกันและกัน
   */
  async createGroupChat(groupData: {
    name: string;
    participantIds: string[];
    avatarUrl?: string;
  }): Promise<ChatRoom> {
    try {
      console.log(
        "กำลังสร้างห้องแชทกลุ่มกับผู้ใช้ที่เลือก:",
        groupData.participantIds.length,
        "คน"
      );

      // แก้ไขโครงสร้าง payload ให้ตรงกับที่ API ต้องการ
      const payload = {
        name: groupData.name,
        participants: groupData.participantIds, // เปลี่ยนจาก participantIds เป็น participants
        avatarUrl: groupData.avatarUrl,
        // ตัด description ออกตามที่ต้องการ
      };

      const response = await api.post("/chat/rooms/group", payload);

      console.log(`สร้างห้องแชทกลุ่มสำเร็จ: ${response.data._id}`);

      // ดูข้อมูลเพิ่มเติม
      console.log("รายละเอียดห้องแชทกลุ่มที่สร้าง:", {
        id: response.data._id,
        name: response.data.metadata?.name,
        participants: response.data.participants.length,
      });

      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          throw new Error("คุณไม่มีสิทธิ์สร้างห้องแชทกลุ่มนี้");
        } else if (error.response?.data?.message) {
          // แสดงข้อความผิดพลาดที่ละเอียดมากขึ้น
          const errorMessage = Array.isArray(error.response.data.message)
            ? error.response.data.message.join(", ")
            : error.response.data.message;
          throw new Error(`ไม่สามารถสร้างห้องแชทกลุ่มได้: ${errorMessage}`);
        }
      }
      console.error("ไม่สามารถสร้างห้องแชทกลุ่มได้:", error);
      throw new Error("เกิดข้อผิดพลาดในการสร้างห้องแชทกลุ่ม");
    }
  },

  /**
   * เพิ่มผู้เข้าร่วมคนใหม่เข้าไปในห้องแชทกลุ่ม
   * @param roomId ID ของห้องแชทกลุ่ม
   * @param newParticipantId ID ของผู้ใช้ที่ต้องการเชิญเข้ากลุ่ม
   * @returns ข้อมูลห้องแชทที่อัปเดตแล้ว
   */
  async addParticipantToGroup(
    roomId: string,
    newParticipantId: string
  ): Promise<ChatRoom> {
    try {
      console.log(`กำลังเพิ่มผู้ใช้ ${newParticipantId} เข้าห้องแชท ${roomId}`);

      const response = await api.post(`/chat/rooms/${roomId}/participants`, {
        userId: newParticipantId,
      });

      console.log(`เพิ่มผู้เข้าร่วมใหม่เข้าห้องแชทสำเร็จ`);

      // ดูข้อมูลสมาชิกหลังอัปเดต
      console.log("รายชื่อสมาชิกหลังอัปเดต:", {
        roomId: response.data._id,
        roomName: response.data.metadata?.name,
        participantCount: response.data.participants.length,
      });

      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          throw new Error("คุณไม่มีสิทธิ์เพิ่มผู้เข้าร่วมในห้องแชทนี้");
        } else if (error.response?.status === 404) {
          throw new Error("ไม่พบห้องแชทหรือผู้ใช้ที่ต้องการเพิ่ม");
        } else if (error.response?.status === 400) {
          throw new Error("ผู้ใช้อาจอยู่ในห้องแชทนี้อยู่แล้ว");
        } else if (error.response?.data?.message) {
          // แสดงข้อความผิดพลาดที่ละเอียดมากขึ้น
          const errorMessage = Array.isArray(error.response.data.message)
            ? error.response.data.message.join(", ")
            : error.response.data.message;
          throw new Error(`ไม่สามารถเพิ่มผู้เข้าร่วมได้: ${errorMessage}`);
        }
      }
      console.error("ไม่สามารถเพิ่มผู้เข้าร่วมในห้องแชทได้:", error);
      throw new Error("เกิดข้อผิดพลาดในการเพิ่มผู้เข้าร่วม");
    }
  },

  /**
   * ลบสมาชิกออกจากกลุ่มแชท
   * @param roomId ID ของห้องแชทกลุ่ม
   * @param participantId ID ของผู้ใช้ที่ต้องการลบ
   * @returns ข้อมูลห้องแชทที่อัปเดตแล้ว
   */
  async removeParticipantFromGroup(
    roomId: string,
    participantId: string
  ): Promise<ChatRoom> {
    try {
      console.log(`กำลังลบผู้ใช้ ${participantId} ออกจากห้องแชท ${roomId}`);

      const response = await api.delete(
        `/chat/rooms/${roomId}/participants/${participantId}`
      );

      console.log("ลบผู้เข้าร่วมออกจากกลุ่มสำเร็จ");

      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          throw new Error("คุณไม่มีสิทธิ์ลบผู้เข้าร่วมในห้องแชทนี้");
        } else if (error.response?.data?.message) {
          const errorMessage = Array.isArray(error.response.data.message)
            ? error.response.data.message.join(", ")
            : error.response.data.message;
          throw new Error(`ไม่สามารถลบผู้เข้าร่วมได้: ${errorMessage}`);
        }
      }
      console.error("ไม่สามารถลบผู้เข้าร่วมออกจากกลุ่มได้:", error);
      throw new Error("เกิดข้อผิดพลาดในการลบผู้เข้าร่วม");
    }
  },

  /**
   * ออกจากกลุ่มแชท
   * @param roomId ID ของห้องแชทกลุ่ม
   * @returns void
   */
  async leaveGroup(roomId: string): Promise<void> {
    try {
      console.log(`กำลังออกจากห้องแชท ${roomId}`);

      // ใช้ค่า user จาก localStorage
      let currentUserId = null;
      if (typeof window !== "undefined") {
        const userData = localStorage.getItem("user_data");
        if (userData) {
          currentUserId = JSON.parse(userData)._id;
        }
      }

      if (!currentUserId) {
        throw new Error("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
      }

      await api.delete(`/chat/rooms/${roomId}/participants/${currentUserId}`);

      console.log("ออกจากกลุ่มสำเร็จ");
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        const errorMessage = Array.isArray(error.response.data.message)
          ? error.response.data.message.join(", ")
          : error.response.data.message;
        throw new Error(`ไม่สามารถออกจากกลุ่มได้: ${errorMessage}`);
      }
      console.error("ไม่สามารถออกจากกลุ่มได้:", error);
      throw new Error("เกิดข้อผิดพลาดในการออกจากกลุ่ม");
    }
  },

  async verifyRoomMembership(
    roomId: string
  ): Promise<{ isMember: boolean; room: ChatRoom | null }> {
    try {
      const room = await this.getRoom(roomId);

      // ใช้ค่า user จาก auth context แทนการอ่านจาก localStorage โดยตรง
      let currentUserId = null;
      // ทำ guard ป้องกัน client-side
      if (typeof window !== "undefined") {
        // ลองหลายวิธีเพื่อให้มั่นใจว่าได้ ID ที่ถูกต้อง
        const userData = localStorage.getItem("user_data");
        if (userData) {
          currentUserId = JSON.parse(userData)._id;
        }
      }

      // ถ้ายังไม่มี currentUserId ให้ return false ไปเลย
      if (!currentUserId) {
        console.error("ไม่สามารถระบุตัวตนผู้ใช้ได้");
        return { isMember: false, room };
      }

      // ตรวจสอบว่าผู้ใช้เป็นสมาชิกหรือไม่ - แก้ไขตรงนี้เพิ่ม type ให้ p
      const isMember = room.participants.some(
        (p: Participant) => p._id === currentUserId
      );

      // ล็อกข้อมูลสำหรับ debug
      console.log(
        `ตรวจสอบสมาชิก: ${currentUserId} เป็นสมาชิกของห้อง ${roomId}: ${isMember}`
      );
      console.log(
        "รายชื่อสมาชิก:",
        room.participants.map((p: Participant) => p._id)
      );

      return { isMember, room };
    } catch (error) {
      console.error("Error verifying room membership:", error);
      return { isMember: false, room: null };
    }
  },

  // สร้างหรือดึงห้องแชทส่วนตัว - เพิ่ม delay ก่อนส่งคืนผลลัพธ์
  async getPrivateChat(otherUserId: string): Promise<ChatRoom> {
    try {
      console.log(`กำลังดึงหรือสร้างห้องแชทส่วนตัวกับผู้ใช้ ${otherUserId}`);

      // ตรวจสอบว่าเรามี ID ของตัวเองหรือไม่
      const userData = localStorage.getItem("user_data");
      if (userData) {
        const currentUserId = JSON.parse(userData)._id;
        console.log(`ผู้ใช้ปัจจุบัน: ${currentUserId}`);
      }

      const response = await api.get(`/chat/private/${otherUserId}`);

      // เพิ่ม delay เล็กน้อยเพื่อให้ backend มีเวลาอัปเดตข้อมูล
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log(`สร้างหรือดึงห้องแชทสำเร็จ: ${response.data._id}`);

      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        throw new Error("คุณไม่มีสิทธิ์เข้าถึงห้องแชทนี้");
      }
      console.error("Failed to get private chat:", error);
      throw error;
    }
  },

  // ดึงจำนวนข้อความที่ยังไม่ได้อ่านในห้องเฉพาะ
  async getUnreadCountForRoom(
    roomId: string
  ): Promise<{ roomId: string; count: number }> {
    try {
      console.log(`กำลังดึงจำนวนข้อความที่ยังไม่ได้อ่านในห้อง ${roomId}`);
      const response = await api.get(`/chat/rooms/${roomId}/unread-count`);
      return response.data;
    } catch (error) {
      console.error("ไม่สามารถดึงจำนวนข้อความที่ยังไม่ได้อ่าน:", error);
      throw error;
    }
  },

  // ดึงจำนวนข้อความที่ยังไม่ได้อ่านในทุกห้องของผู้ใช้
  async getUnreadCountsForAllRooms(): Promise<
    Array<{ roomId: string; count: number }>
  > {
    try {
      console.log("กำลังดึงจำนวนข้อความที่ยังไม่ได้อ่านในทุกห้อง");
      const response = await api.get("/chat/rooms/unread-counts");
      return response.data;
    } catch (error) {
      console.error(
        "ไม่สามารถดึงจำนวนข้อความที่ยังไม่ได้อ่านในทุกห้อง:",
        error
      );
      throw error;
    }
  },
};

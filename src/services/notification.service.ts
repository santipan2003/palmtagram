import axios from "axios";
import { Notification } from "@/interfaces/notification.interface";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // สำคัญมาก! ช่วยให้ส่ง cookies ได้
});

export const notificationService = {
  // ดึงข้อมูลการแจ้งเตือนจาก API
  async fetchNotifications(
    limit: number = 20,
    skip: number = 0,
    unreadOnly: boolean = false
  ): Promise<Notification[]> {
    try {
      console.log(
        `กำลังดึงการแจ้งเตือน (limit=${limit}, skip=${skip}, unreadOnly=${unreadOnly})`
      );
      const response = await api.get(
        `/notifications?limit=${limit}&skip=${skip}&unreadOnly=${unreadOnly}`
      );
      return response.data;
    } catch (error) {
      console.error("ไม่สามารถดึงข้อมูลการแจ้งเตือนได้:", error);
      throw error;
    }
  },

  // ทำเครื่องหมายว่าอ่านการแจ้งเตือนแล้ว
  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      console.log(
        `กำลังทำเครื่องหมายว่าอ่านการแจ้งเตือน ${notificationId} แล้ว`
      );
      const response = await api.post(`/notifications/${notificationId}/read`);
      return response.data.success || true;
    } catch (error) {
      console.error("ไม่สามารถทำเครื่องหมายว่าอ่านแล้ว:", error);
      return false;
    }
  },

  // ทำเครื่องหมายว่าอ่านการแจ้งเตือนทั้งหมดแล้ว
  async markAllNotificationsAsRead(): Promise<boolean> {
    try {
      console.log(`กำลังทำเครื่องหมายว่าอ่านการแจ้งเตือนทั้งหมดแล้ว`);
      const response = await api.post(`/notifications/read-all`);
      return response.data.success || true;
    } catch (error) {
      console.error("ไม่สามารถทำเครื่องหมายว่าอ่านทั้งหมดแล้ว:", error);
      return false;
    }
  },

  // ลบการแจ้งเตือน
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      console.log(`กำลังลบการแจ้งเตือน ${notificationId}`);
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data.success || true;
    } catch (error) {
      console.error("ไม่สามารถลบการแจ้งเตือน:", error);
      return false;
    }
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    try {
      const response = await api.get("/notifications/count");
      return response.data;
    } catch (error) {
      console.error("ไม่สามารถดึงจำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน:", error);
      return { count: 0 };
    }
  },
};

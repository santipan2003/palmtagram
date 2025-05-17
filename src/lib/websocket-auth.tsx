import { getWebSocketToken } from "@/services/auth.service";

export async function ensureWebSocketToken() {
  try {
    // ตรวจสอบว่ามีข้อมูลผู้ใช้ปัจจุบันใน localStorage
    const userData = localStorage.getItem("user_data");

    // ตรวจสอบว่ามี token ใน localStorage หรือไม่
    let wsToken = localStorage.getItem("ws_auth_token");

    // รีเฟรช token ทุกครั้งที่เรียกฟังก์ชันนี้
    console.log("กำลังรีเฟรช WebSocket token...");
    wsToken = getWebSocketToken();

    if (wsToken) {
      localStorage.setItem("ws_auth_token", wsToken);
      console.log("บันทึก WebSocket token เรียบร้อย");

      // แสดงข้อมูลเพื่อตรวจสอบความถูกต้อง (แสดงเฉพาะบางส่วนของ token)
      if (wsToken.length > 20) {
        console.log(
          `Token: ${wsToken.substring(0, 10)}...${wsToken.substring(
            wsToken.length - 10
          )}`
        );
      }

      try {
        // ลองถอดรหัส JWT payload เพื่อตรวจสอบ user ID
        const tokenParts = wsToken.split(".");
        if (tokenParts.length > 1) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log(`Token เป็นของผู้ใช้ ID: ${payload.sub}`);

          // ตรวจสอบว่าตรงกับ user_data หรือไม่
          if (userData) {
            const userDataObj = JSON.parse(userData);
            if (userDataObj._id !== payload.sub) {
              console.warn(
                `ID ไม่ตรงกัน: localStorage=${userDataObj._id}, token=${payload.sub}`
              );
            } else {
              console.log("ID ใน token และ localStorage ตรงกัน");
            }
          }
        }
      } catch (e) {
        console.error("ไม่สามารถแยกข้อมูลจาก token ได้:", e);
      }

      // รอให้แน่ใจว่า token ถูกบันทึกก่อนส่งคืน
      await new Promise((resolve) => setTimeout(resolve, 300));
      return wsToken;
    }

    throw new Error("ไม่สามารถรับโทเคนสำหรับการแชทได้");
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการจัดการ WebSocket token:", error);
    throw error;
  }
}

// รวบรวม interface ทั้งหมดที่เกี่ยวข้องกับ chat
import { UserProfile } from "./auth.interface";

// โครงสร้างของห้องแชท
export interface ChatRoom {
  _id: string;
  name?: string;
  type: "private" | "group";
  participants: Participant[];
  metadata?: {
    name?: string;
    avatarUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
  lastMessage?: Message;
  unreadCount?: number;
}

// ข้อมูลผู้เข้าร่วมห้องแชท
export interface Participant {
  _id: string;
  username: string;
  profile?: {
    name?: string;
    avatarUrl?: string;
    _id?: string;
    bio?: string;
  };
  lastActive?: string; // เพิ่ม lastActive property
  isOnline?: boolean; // เพิ่ม isOnline property
}

// เพิ่ม interface สำหรับ PrivateInfoDialog
export interface GroupInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: ChatRoom;
  roomId: string;
  currentUser: UserProfile; // แก้ไขตรงนี้
  onRoomUpdated: () => Promise<void>;
}

// เพิ่มหรือแก้ไข interface PrivateInfoDialogProps
export interface PrivateInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: ChatRoom;
  roomId: string;
  recipient: Participant;
  currentUser: UserProfile; // แก้ไขตรงนี้
  isRecipientOnline?: boolean | null; // เพิ่ม ? และ null ที่นี่
  lastActive?: Date;
}
// เพิ่ม interface สำหรับ InviteMemberDialog
export interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  currentParticipants: Participant[];
  onMemberAdded: () => Promise<void>;
}

// โครงสร้างข้อความ
export interface Message {
  _id: string;
  content: string;
  type?: "text" | "image" | "file" | "system";
  senderId: Participant | null;
  roomId: string;
  createdAt: string;
  updatedAt: string;
  readBy?: string[];
  readTimestamp?: { [userId: string]: string }; // เพิ่ม property นี้
  isSending?: boolean;
  sendFailed?: boolean;
}

// รายละเอียดผู้ใช้ที่กำลังพิมพ์
export interface TypingUser {
  username: string;
  name: string;
  avatarUrl?: string | null;
}

// แผนที่ของผู้ใช้ที่กำลังพิมพ์ โดยใช้ user ID เป็น key
export type TypingUsersMap = Record<string, TypingUser>;

// รูปแบบคำขอเข้าร่วมห้องแชท
export interface JoinRoomRequest {
  roomId: string;
  userId?: string;
  timestamp?: number;
}

// รูปแบบการตอบกลับทั่วไปจากเซิร์ฟเวอร์
export interface ChatResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ข้อมูล event เมื่อผู้ใช้พิมพ์
export interface UserTypingEvent {
  userId: string;
  username: string;
  profile?: {
    name?: string;
    avatarUrl?: string;
  };
  isTyping: boolean;
  roomId: string;
}

// คำขอการสร้างข้อความ
export interface MessageCreateRequest {
  roomId: string;
  content: string;
  type?: "text" | "image" | "file";
}

// คำขอการอัพเดตข้อความ
export interface MessageUpdateRequest {
  id: string;
  content: string;
}

// ข้อมูลการลบข้อความ
export interface MessageDeleteResponse {
  id: string;
}

// คำขอการโหลดข้อความในห้อง
export interface FindRoomMessagesRequest {
  roomId: string;
  limit?: number;
  before?: string;
}

// คำขอการทำเครื่องหมายว่าอ่านแล้ว
export interface MarkAsReadRequest {
  roomId: string;
  messageIds: string[];
}

// ข้อมูลผู้ใช้เข้า/ออกห้องแชท
export interface UserRoomEvent {
  userId: string;
  username: string;
}

// ข้อมูลการอัพเดตสถานะการอ่าน
export interface MessagesReadEvent {
  userId: string;
  messageIds: string[];
  roomId: string; // เพิ่ม property นี้
}

export interface UnreadCountResponse {
  success: boolean;
  data: { count: number };
  error?: string;
}

export interface UnreadCountsResponse {
  success: boolean;
  data: Array<{ roomId: string; count: number }>;
  error?: string;
}

// คำขอออกจากห้องแชท
export interface LeaveRoomRequest {
  roomId: string;
}

export interface RoomParticipantsChangedEvent {
  roomId: string;
  action: "add" | "remove" | "leave";
  targetUser: Participant | null;
  participants: Participant[];
  participantsCount: number;
}

export type ActivityAction =
  | "add" // เพิ่มสมาชิก
  | "remove" // ลบสมาชิก
  | "leave" // ออกจากกลุ่ม
  | "create" // สร้างกลุ่ม
  | "update"; // อัพเดทข้อมูลกลุ่ม (ชื่อ, รูปภาพ)

export interface RoomActivity {
  _id: string;
  roomId?: string;
  timestamp: string; // วันเวลาที่เกิดกิจกรรม
  action: ActivityAction; // ประเภทของกิจกรรม
  performedBy: {
    _id: string;
    username: string;
    profile?: {
      name?: string;
      avatarUrl?: string;
    };
  } | null; // ผู้ที่ทำกิจกรรม (null เมื่อเป็นการกระทำจากระบบ)
  targetUser?: {
    _id: string;
    username: string;
    profile?: {
      name?: string;
      avatarUrl?: string;
    };
  } | null; // ผู้ที่ถูกกระทำ (เช่น ถูกเพิ่ม หรือถูกลบ)
  metadata?: Record<string, string | number | boolean | null | undefined>; // ข้อมูลเพิ่มเติมต่างๆ เช่น ชื่อเก่า/ใหม่ รูปภาพเก่า/ใหม่
}

// Interface สำหรับข้อมูลผู้ใช้ในกิจกรรมห้องแชท
export interface ActivityUser {
  _id: string;
  username?: string;
  profile?: {
    name?: string;
    avatarUrl?: string;
    _id?: string;
  };
}

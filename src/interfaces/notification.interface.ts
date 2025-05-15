// Define interfaces for notification data
// ตรงกับ NotificationPayload จาก backend
export interface NotificationPayload {
  sourceUserId?: string | { _id: string; username: string };
  postId?: string;
  commentId?: string;
  roomId?: string;
  replyId?: string;
}

export interface Notification {
  _id: string;
  userId: string;
  type: string; // 'like', 'comment', 'follow', 'chat', 'comment_reply'
  payload?: NotificationPayload;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;

  // Backend อาจส่งข้อมูลเพิ่มเติมที่ถูก populate แล้ว
  message?: string;
  title?: string;
  image?: string;
  link?: string;
  metadata?: Record<string, unknown>;
  entityId?: string;
  entityUrl?: string;

  // ข้อมูลผู้ใช้ที่ populate จาก sourceUserId
  sourceUser?: {
    _id: string;
    username: string;
    profile?: {
      name?: string;
      avatarUrl?: string;
    };
  };

  // ชื่ออื่นที่อาจใช้สำหรับ sourceUser
  from?: {
    _id: string;
    username: string;
    profile?: {
      name?: string;
      avatarUrl?: string;
    };
  };

  sender?: {
    _id: string;
    username: string;
    profile?: {
      name?: string;
      avatarUrl?: string;
    };
  };
}

export interface NotificationResponse {
  success: boolean;
  data?: Notification;
  error?: string;
}

export interface NotificationsResponse {
  success: boolean;
  data: Notification[];
  error?: string;
}

export interface UnreadCountResponse {
  success: boolean;
  data: { count: number };
  error?: string;
}

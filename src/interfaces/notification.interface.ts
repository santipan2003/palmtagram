// Define interfaces for notification data
// ตรงกับ NotificationPayload จาก backend
export interface NotificationPayload {
  sourceUserId?: string | { _id: string; username: string };
  postId?: string;
  commentId?: string;
  roomId?: string | null;
  replyId?: string | null;
  ownerUsername?: string;
}

// ข้อมูลโปรไฟล์ที่ใช้ร่วมกัน
export interface UserProfileInfo {
  _id: string;
  username: string;
  profile?: {
    name?: string;
    avatarUrl?: string;
    _id?: string;
  };
}

export interface NotificationData {
  // ข้อมูลโพสต์
  postId?: string;
  postOwnerId?: string;
  postOwnerUsername?: string;
  postOwnerProfile?: {
    name?: string;
    avatarUrl?: string;
    _id?: string;
  };
  postThumbnail?: string;
  isFollowBack?: boolean; // สำหรับการติดตาม
  followerProfile?: {
    avatarUrl?: string;
  };

  // เพิ่มฟิลด์ postPreview
  postPreview?: {
    type: "image" | "video" | "text";
    url: string;
  };

  // ข้อมูลคอมเมนต์
  commentId?: string;
  comment?: string;
  commentOwnerId?: string;
  commentOwnerUsername?: string;
  commentOwnerProfile?: {
    name?: string;
    avatarUrl?: string;
    _id?: string;
  };

  // ข้อมูลผู้ไลค์
  likerId?: string;
  likerUsername?: string;
  likerProfile?: {
    name?: string;
    avatarUrl?: string;
    _id?: string;
  };

  // ข้อมูลผู้แสดงคอมเมนต์
  commenterId?: string;
  commenterUsername?: string;
  commenterProfile?: {
    name?: string;
    avatarUrl?: string;
    _id?: string;
  };
}

export interface Notification {
  _id: string;
  userId: string;
  type: string; // 'like', 'comment', 'follow', 'chat', 'comment_reply'
  content?: string;
  targetId?: string;
  sourceId?: string;
  payload?: NotificationPayload;
  data?: NotificationData;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  __v?: number;

  // ข้อมูลที่ populate จาก triggeredBy
  triggeredBy?: UserProfileInfo;

  // ข้อมูลอื่นๆ ที่อาจมี
  message?: string;
  title?: string;
  image?: string;
  link?: string;
  metadata?: Record<string, unknown>;
  entityId?: string;
  entityUrl?: string;

  // ข้อมูลผู้ใช้ที่ populate จาก sourceUserId
  sourceUser?: UserProfileInfo;
  from?: UserProfileInfo;
  sender?: UserProfileInfo;
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

import axios from "axios";
import { User, ApiPost, Comment } from "@/interfaces/profile.interface";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// สร้าง axios instance พร้อมการตั้งค่าพื้นฐาน
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const profileService = {
  /**
   * ดึงข้อมูลผู้ใช้จาก username
   */
  getUserByUsername: async (username: string): Promise<User> => {
    try {
      const response = await apiClient.get(`/users/username/${username}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
  },

  /**
   * ดึงข้อมูลผู้ใช้จาก userid
   */

  getUserById: async (userId: string): Promise<User> => {
    try {
      const response = await apiClient.get(`/users/userId/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
  },

  /**
   * ดึงข้อมูลโพสต์ของผู้ใช้จาก userId
   */
  getUserPosts: async (userId: string): Promise<ApiPost[]> => {
    try {
      const response = await apiClient.get(`/posts/user/${userId}`);
      // เพิ่ม commentData array ตามโครงสร้างเดิม
      const postsWithCommentData = response.data.map((post: ApiPost) => ({
        ...post,
        commentData: [],
      }));

      return postsWithCommentData;
    } catch (error) {
      console.error("Error fetching user posts:", error);
      throw error;
    }
  },

  /**
   * ดึงข้อมูลคอมเมนต์ของโพสต์
   */
  getPostComments: async (postId: string): Promise<Comment[]> => {
    try {
      const response = await apiClient.get(`/comments/post/${postId}`);
      return response.data.comments || [];
    } catch (error) {
      console.error("Error fetching post comments:", error);
      throw error;
    }
  },

  /**
   * เพิ่มคอมเมนต์ใหม่ในโพสต์
   */
  createComment: async (postId: string, content: string): Promise<Comment> => {
    try {
      const response = await apiClient.post("/comments", {
        postId,
        content,
      });
      return response.data;
    } catch (error) {
      console.error("Error creating comment:", error);
      throw error;
    }
  },

  /**
   * ไลค์โพสต์
   */
  likePost: async (postId: string): Promise<void> => {
    try {
      await apiClient.post("/likes", {
        targetType: "post",
        targetId: postId,
      });
    } catch (error) {
      console.error("Error liking post:", error);
      throw error;
    }
  },

  /**
   * ยกเลิกไลค์โพสต์
   */
  unlikePost: async (postId: string): Promise<void> => {
    try {
      await apiClient.delete(`/likes/post/${postId}`);
    } catch (error) {
      console.error("Error unliking post:", error);
      throw error;
    }
  },

  /**
   * ตรวจสอบสถานะไลค์ของโพสต์
   */
  checkPostLikeStatus: async (postId: string): Promise<boolean> => {
    try {
      const response = await apiClient.get(`/likes/check/post/${postId}`);
      return response.data.liked;
    } catch (error) {
      console.error("Error checking post like status:", error);
      return false;
    }
  },

  /**
   * บันทึกโพสต์ (Bookmark)
   */
  savePost: async (postId: string): Promise<void> => {
    try {
      await apiClient.post("/bookmarks", {
        postId,
      });
    } catch (error) {
      console.error("Error saving post:", error);
      throw error;
    }
  },

  /**
   * ยกเลิกการบันทึกโพสต์
   */
  unsavePost: async (postId: string): Promise<void> => {
    try {
      await apiClient.delete(`/bookmarks/${postId}`);
    } catch (error) {
      console.error("Error removing bookmark:", error);
      throw error;
    }
  },

  /**
   * ตรวจสอบสถานะการบันทึกโพสต์
   */
  checkPostSaveStatus: async (postId: string): Promise<boolean> => {
    try {
      const response = await apiClient.get(`/bookmarks/check/${postId}`);
      return response.data.saved;
    } catch (error) {
      console.error("Error checking bookmark status:", error);
      return false;
    }
  },

  /**
   * ดึงรายการโพสต์ที่บันทึกไว้
   */
  getSavedPosts: async (): Promise<ApiPost[]> => {
    try {
      const response = await apiClient.get("/bookmarks");
      return response.data.posts || [];
    } catch (error) {
      console.error("Error fetching saved posts:", error);
      throw error;
    }
  },

  /**
   * เริ่มติดตามผู้ใช้
   */
  followUser: async (
    userId: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.post("/follows", { userId });
      return response.data;
    } catch (error) {
      console.error("Error following user:", error);
      throw error;
    }
  },

  /**
   * ยกเลิกการติดตามผู้ใช้
   */
  unfollowUser: async (
    userId: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.delete(`/follows/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error unfollowing user:", error);
      throw error;
    }
  },

  /**
   * ตรวจสอบว่ากำลังติดตามผู้ใช้หรือไม่
   */
  checkFollowStatus: async (userId: string): Promise<boolean> => {
    try {
      const response = await apiClient.get(`/follows/check/${userId}`);
      console.log(`Follow check response for ${userId}:`, response.data);

      // รองรับทั้งสองรูปแบบ
      return (
        response.data.following === true || response.data.isFollowing === true
      );
    } catch (error) {
      console.error("Error checking follow status:", error);
      return false;
    }
  },

  /**
   * ดึงรายชื่อผู้ติดตามของผู้ใช้
   */
  getFollowers: async (userId: string): Promise<User[]> => {
    try {
      const response = await apiClient.get(`/follows/followers/${userId}`);
      console.log(
        "Followers API response:",
        JSON.stringify(response.data, null, 2)
      );

      if (Array.isArray(response.data)) {
        // ระบุ type ชัดเจนและใช้ type guard เพื่อกรอง null
        const mappedFollowers: (User | null)[] = response.data.map((item) => {
          if (item.followerId && typeof item.followerId === "object") {
            return item.followerId as User;
          } else if (item.userId && typeof item.userId === "object") {
            return item.userId as User;
          } else {
            console.warn("Unexpected follow record structure:", item);
            return null;
          }
        });

        // ใช้ type predicate เพื่อให้ TypeScript เข้าใจว่าเราได้กรอง null ออกแล้ว
        return mappedFollowers.filter((user): user is User => user !== null);
      } else {
        return [];
      }
    } catch (error) {
      console.error("Error fetching followers:", error);
      return [];
    }
  },

  /**
   * ดึงรายชื่อผู้ที่กำลังติดตาม
   */
  getFollowing: async (userId: string): Promise<User[]> => {
    try {
      const response = await apiClient.get(`/follows/following/${userId}`);
      console.log(
        "Following API response:",
        JSON.stringify(response.data, null, 2)
      );

      if (Array.isArray(response.data)) {
        // ระบุ type ชัดเจนและใช้ type guard เพื่อกรอง null
        const mappedFollowing: (User | null)[] = response.data.map((item) => {
          if (item.userId && typeof item.userId === "object") {
            return item.userId as User;
          } else if (item.followerId && typeof item.followerId === "object") {
            return item.followerId as User;
          } else {
            console.warn("Unexpected following record structure:", item);
            return null;
          }
        });

        // ใช้ type predicate เพื่อให้ TypeScript เข้าใจว่าเราได้กรอง null ออกแล้ว
        return mappedFollowing.filter((user): user is User => user !== null);
      } else {
        return [];
      }
    } catch (error) {
      console.error("Error fetching following users:", error);
      return [];
    }
  },

  /**
   * ดึงรายชื่อผู้ใช้ที่มีการติดตามซึ่งกันและกัน (mutual follows)
   * สำหรับใช้ในการสร้างกลุ่มแชท
   */
  getMutualFollowsList: async (): Promise<User[]> => {
    try {
      const response = await apiClient.get("/follows/mutual");

      return response.data;
    } catch (error) {
      console.error("Error fetching mutual follows:", error);
      return [];
    }
  },

  /**
   * นับจำนวนผู้ติดตามของผู้ใช้
   */
  getFollowersCount: async (userId: string): Promise<number> => {
    try {
      const response = await apiClient.get(
        `/follows/followers/count/${userId}`
      );
      return response.data.count;
    } catch (error) {
      console.error("Error fetching followers count:", error);
      return 0;
    }
  },

  /**
   * นับจำนวนผู้ที่กำลังติดตาม
   */
  getFollowingCount: async (userId: string): Promise<number> => {
    try {
      const response = await apiClient.get(
        `/follows/following/count/${userId}`
      );
      return response.data.count;
    } catch (error) {
      console.error("Error fetching following count:", error);
      return 0;
    }
  },

  /**
   * ดึงรายชื่อผู้ใช้ยอดนิยมตามจำนวนผู้ติดตาม
   */
  getPopularUsers: async (): Promise<User[]> => {
    try {
      const response = await apiClient.get("/follows/popular");
      return response.data.users;
    } catch (error) {
      console.error("Error fetching popular users:", error);
      throw error;
    }
  },

  /**
   * อัพเดตข้อมูลโปรไฟล์
   */
  updateProfile: async (profileData: {
    name?: string;
    bio?: string;
    website?: string;
    avatarFile?: File;
  }): Promise<User> => {
    try {
      const formData = new FormData();

      // เพิ่มข้อมูลลงใน FormData
      if (profileData.name) formData.append("name", profileData.name);
      if (profileData.bio) formData.append("bio", profileData.bio);
      if (profileData.website) formData.append("website", profileData.website);
      if (profileData.avatarFile)
        formData.append("avatar", profileData.avatarFile);

      const response = await apiClient.patch("/users/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  },
};

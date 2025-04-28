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
   * ติดตามผู้ใช้
   */
  followUser: async (
    userId: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await apiClient.post(`/users/${userId}/follow`);
      return response.data;
    } catch (error) {
      console.error("Error following user:", error);
      throw error;
    }
  },

  /**
   * เลิกติดตามผู้ใช้
   */
  unfollowUser: async (
    userId: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await apiClient.delete(`/users/${userId}/follow`);
      return response.data;
    } catch (error) {
      console.error("Error unfollowing user:", error);
      throw error;
    }
  },

  /**
   * ดึงรายชื่อผู้ที่กำลังติดตาม
   */
  getFollowing: async (userId: string): Promise<User[]> => {
    try {
      const response = await apiClient.get(`/users/${userId}/following`);
      return response.data;
    } catch (error) {
      console.error("Error fetching following list:", error);
      throw error;
    }
  },

  /**
   * ดึงรายชื่อผู้ติดตาม
   */
  getFollowers: async (userId: string): Promise<User[]> => {
    try {
      const response = await apiClient.get(`/users/${userId}/followers`);
      return response.data;
    } catch (error) {
      console.error("Error fetching followers list:", error);
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

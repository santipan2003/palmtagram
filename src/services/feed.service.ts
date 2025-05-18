import axios from "axios";
import { User, ApiPost, Comment } from "@/interfaces/feed.interface";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// สร้าง axios instance เพื่อกำหนดค่า default ต่างๆ
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Service สำหรับ Feed
export const feedService = {
  getSuggestions: async (): Promise<User[]> => {
    // ส่งคืนข้อมูลจำลองโดยตรง ไม่ต้องเรียก API
    return [
      {
        _id: "suggestion1",
        username: "janesmith",
        profile: {
          name: "Jane Smith",
          avatarUrl: "/img/avatar1.png",
        },
      },
      {
        _id: "suggestion2",
        username: "markwilson",
        profile: {
          name: "Mark Wilson",
          avatarUrl: "/img/avatar2.png",
        },
      },
      {
        _id: "suggestion3",
        username: "lisajohnson",
        profile: {
          name: "Lisa Johnson",
          avatarUrl: "/img/avatar3.png",
        },
      },
      {
        _id: "suggestion4",
        username: "tomparker",
        profile: {
          name: "Tom Parker",
          avatarUrl: "/img/avatar4.png",
        },
      },
      {
        _id: "suggestion5",
        username: "amywong",
        profile: {
          name: "Amy Wong",
          avatarUrl: "/img/avatar5.png",
        },
      },
    ];
  },

  // ดึงข้อมูลผู้ใช้
  getUserData: async (userId: string): Promise<User> => {
    try {
      const response = await apiClient.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
  },

  // ดึงข้อมูลโพสต์ทั้งหมด
  getPosts: async (): Promise<ApiPost[]> => {
    try {
      const response = await apiClient.get("/posts/");
      return response.data.posts || [];
    } catch (error) {
      console.error("Error fetching posts:", error);
      throw error;
    }
  },

  // สร้างโพสต์ใหม่
  createPost: async (postData: FormData): Promise<ApiPost> => {
    try {
      const response = await apiClient.post("/posts", postData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error creating post:", error);
      throw error;
    }
  },

  // ตรวจสอบสถานะไลค์โพสต์
  checkPostLikeStatus: async (postId: string): Promise<boolean> => {
    try {
      const response = await apiClient.get(`/likes/check/post/${postId}`);
      return response.data.liked;
    } catch (error) {
      console.error("Error checking post like status:", error);
      return false;
    }
  },

  // ไลค์โพสต์
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

  // ยกเลิกไลค์โพสต์
  unlikePost: async (postId: string): Promise<void> => {
    try {
      await apiClient.delete(`/likes/post/${postId}`);
    } catch (error) {
      console.error("Error unliking post:", error);
      throw error;
    }
  },

  // ดึงคอมเมนต์ของโพสต์
  getPostComments: async (postId: string): Promise<Comment[]> => {
    try {
      const response = await apiClient.get(`/comments/post/${postId}`);
      return response.data.comments || [];
    } catch (error) {
      console.error("Error fetching post comments:", error);
      throw error;
    }
  },

  // ดึงการตอบกลับของคอมเมนต์
  getCommentReplies: async (commentId: string): Promise<Comment[]> => {
    try {
      const response = await apiClient.get(`/comments/${commentId}/replies`);
      return response.data.replies || [];
    } catch (error) {
      console.error("Error fetching comment replies:", error);
      throw error;
    }
  },

  // สร้างคอมเมนต์หรือตอบกลับ
  createComment: async (data: {
    postId: string;
    content: string;
    parentCommentId?: string;
  }): Promise<Comment> => {
    try {
      const response = await apiClient.post("/comments", data);
      return response.data;
    } catch (error) {
      console.error("Error creating comment:", error);
      throw error;
    }
  },

  // ตรวจสอบสถานะไลค์คอมเมนต์
  checkCommentLikeStatus: async (commentId: string): Promise<boolean> => {
    try {
      const response = await apiClient.get(`/likes/check/comment/${commentId}`);
      return response.data.liked;
    } catch (error) {
      console.error("Error checking comment like status:", error);
      return false;
    }
  },

  // ไลค์คอมเมนต์
  likeComment: async (commentId: string): Promise<void> => {
    try {
      await apiClient.post("/likes", {
        targetType: "comment",
        targetId: commentId,
      });
    } catch (error) {
      console.error("Error liking comment:", error);
      throw error;
    }
  },

  // ยกเลิกไลค์คอมเมนต์
  unlikeComment: async (commentId: string): Promise<void> => {
    try {
      await apiClient.delete(`/likes/comment/${commentId}`);
    } catch (error) {
      console.error("Error unliking comment:", error);
      throw error;
    }
  },
};

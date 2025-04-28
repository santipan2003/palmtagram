import axios from "axios";
import { ExtendedComment } from "@/interfaces/feed.interface";
import { MediaItem, MediaType } from "@/interfaces/post.interface";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// สร้าง axios instance เพื่อกำหนดค่า default ต่างๆ
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Service สำหรับจัดการ Post และ Comments
export const postService = {
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
  getPostComments: async (postId: string): Promise<ExtendedComment[]> => {
    try {
      const response = await apiClient.get(`/comments/post/${postId}`);
      return response.data.comments || [];
    } catch (error) {
      console.error("Error fetching post comments:", error);
      throw error;
    }
  },

  // ดึงการตอบกลับของคอมเมนต์
  getCommentReplies: async (commentId: string): Promise<ExtendedComment[]> => {
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
  }): Promise<ExtendedComment> => {
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

  // ตรวจสอบสถานะไลค์สำหรับหลายคอมเมนต์
  checkCommentsLikeStatus: async (
    comments: ExtendedComment[]
  ): Promise<ExtendedComment[]> => {
    if (comments.length === 0) return comments;

    try {
      // สร้างคำขอตรวจสอบสถานะไลค์สำหรับทุกคอมเมนต์
      const likePromises = comments.map((comment) =>
        apiClient
          .get(`/likes/check/comment/${comment._id}`)
          .then((response) => ({
            commentId: comment._id,
            liked: response.data.liked,
          }))
          .catch(() => ({ commentId: comment._id, liked: false }))
      );

      // รอผลลัพธ์ทั้งหมด
      const results = await Promise.all(likePromises);

      // สร้าง Map ของ commentId -> liked status
      const likeStatusMap = new Map(
        results.map((result) => [result.commentId, result.liked])
      );

      // อัพเดทสถานะไลค์ในคอมเมนต์
      return comments.map((comment) => ({
        ...comment,
        isLiked: likeStatusMap.get(comment._id) || false,
      }));
    } catch (error) {
      console.error("Error checking comments like status:", error);
      return comments;
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
  // สร้างโพสต์ใหม่
  createPost: async (
    postContent: string,
    mediaItems: MediaItem[]
  ): Promise<{
    _id: string;
    content: string;
    media: { url?: string; type: MediaType }[];
    author: { _id: string; username: string };
    createdAt: string;
    likes: number;
  }> => {
    try {
      // If there's no content but there are media items, set type as "text"
      const postData: {
        content: string;
        media: { url?: string; type: MediaType }[];
      } = {
        content: postContent,
        media: [],
      };

      // Handle media uploads and prepare media array
      if (mediaItems.length > 0) {
        // สำหรับระบบจริงควรอัพโหลดไฟล์ก่อนและรับ URL กลับมา
        // แต่ตอนนี้เราใช้ previewUrl เป็นการชั่วคราว
        postData.media = mediaItems.map((item) => ({
          type: item.type,
          url: item.previewUrl || "",
        }));
      } else if (postContent.trim()) {
        // If there's only text content with no media
        postData.media = [{ type: "text" }];
      }

      // ส่งข้อมูลไปยัง API
      const response = await apiClient.post("/posts", postData);
      return response.data;
    } catch (error) {
      console.error("Error creating post:", error);
      throw error;
    }
  },

  // อัพโหลดไฟล์ media (สำหรับอนาคต)
  uploadMedia: async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.post("/uploads", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data.url;
    } catch (error) {
      console.error("Error uploading media:", error);
      throw error;
    }
  },
};

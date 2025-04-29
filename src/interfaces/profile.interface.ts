export interface User {
  _id: string;
  username: string;
  email: string;
  profile: Profile;
  createdAt: string;
  updatedAt: string;
  
}

export interface Profile {
  name: string;
  avatarUrl: string;
  _id: string;
  bio: string;
  website: string;
  location: string;
}

export interface Media {
  url: string;
  type: string;
}

export interface ApiPost {
  _id: string;
  authorId: string;
  content: string;
  media: Media[];
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
  id?: number; // Optional, for compatibility
  commentData?: Array<{
    username: string;
    avatar: string;
    text: string;
    time: string;
  }>;
}

export interface Comment {
  _id: string;
  postId: string;
  authorId: {
    _id: string;
    username: string;
    profile?: {
      name: string;
      avatarUrl: string;
      _id: string;
    };
  };
  content: string;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  isLiked?: boolean;
  __v: number;
}

export interface ExtendedComment extends Comment {
  isLiked?: boolean;
  replyCount?: number;
  showReplies?: boolean;
  replies?: ExtendedComment[];
  isLoading?: boolean;
  parentCommentId?: string;
}

export interface ProfilePageProps {
  username: string;
}

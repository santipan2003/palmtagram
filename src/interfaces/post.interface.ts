// Media type definition

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
}

export type MediaType = "text" | "image" | "video";

export interface MediaItem {
  url?: string;
  type: MediaType;
  file?: File;
  previewUrl?: string;
}

export interface CreatePostCardProps {
  userData: User | null;
  onPostCreated: () => void;
}

export interface UserProfile {
  _id: string;
  email: string;
  username?: string;
  profile?: {
    name: string;
    avatarUrl: string;
  };
}

export interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: UserProfile | null) => void;
  logout: () => void;
}

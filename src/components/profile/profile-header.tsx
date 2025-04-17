import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

interface ProfileUser {
  name: string;
  username: string;
  avatar: string;
  bio: string;
  website: string;
  location: string;
  followers: number;
  following: number;
  posts: number;
}

export default function ProfileHeader({ user }: { user: ProfileUser }) {
  return (
    <div className="flex flex-col md:flex-row items-center md:items-center gap-24 mb-8">
      <div className="flex justify-center">
        <Avatar className="h-24 w-24 md:h-48 md:w-48">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
      </div>

      <div className="flex-1 text-center md:text-left">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <div className="flex justify-center md:justify-start gap-2">
            <Button>Follow</Button>
            <Button variant="outline">Message</Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex justify-center md:justify-start gap-6 mb-4">
          <div className="text-center">
            <p className="font-bold">{user.posts}</p>
            <p className="text-sm text-muted-foreground">Posts</p>
          </div>
          <div className="text-center">
            <p className="font-bold">{user.followers}</p>
            <p className="text-sm text-muted-foreground">Followers</p>
          </div>
          <div className="text-center">
            <p className="font-bold">{user.following}</p>
            <p className="text-sm text-muted-foreground">Following</p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="font-medium">@{user.username}</p>
          <p>{user.bio}</p>
          <p className="text-sm">{user.website}</p>
          <p className="text-sm text-muted-foreground">{user.location}</p>
        </div>
      </div>
    </div>
  );
}

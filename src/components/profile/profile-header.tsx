import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import Image from "next/image";
import { User } from "@/interfaces/profile.interface";

export default function ProfileHeader({ user }: { user: User }) {
  console.log("ProfileHeader user:", user);
  return (
    <div className="flex flex-col items-center mb-4 md:mb-8 mx-auto max-w-3xl w-full px-4">
      <div className="flex flex-row items-center gap-4 md:gap-24 w-full">
        {/* Avatar Profile */}
        <div>
          <Avatar className="h-20 w-20 md:h-48 md:w-48">
            {user?.profile?.avatarUrl ? (
              <div className="h-full w-full relative overflow-hidden rounded-full">
                <Image
                  src={user?.profile?.avatarUrl}
                  alt={user.profile.name}
                  fill
                  unoptimized={true}
                  className="object-cover"
                  sizes="(max-width: 768px) 80px, 192px"
                  referrerPolicy="no-referrer"
                  priority
                />
              </div>
            ) : (
              <AvatarFallback>
                {user?.profile?.name ? user.profile.name.charAt(0) : ""}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
        {/* User Info */}
        <div className="flex-1">
          <div className="flex flex-row items-center gap-2 md:gap-4 mb-2 mt-4 md:mt-0 md:mb-4 flex-wrap">
            <h1 className="text-base md:text-2xl font-bold">
              {user?.profile?.name}
            </h1>
            <div className="flex gap-1 md:gap-2">
              <Button size="sm" className="md:text-base md:py-2 md:px-4">
                Follow
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="md:text-base md:py-2 md:px-4"
              >
                Message
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 md:h-10 md:w-10"
              >
                <Settings className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>
          </div>

          <div className="flex gap-3 md:gap-6 mb-2 md:mb-4">
            <div className="text-center">
              <p className="text-sm md:text-base font-bold">123</p>
              <p className="text-xs md:text-sm text-muted-foreground">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-sm md:text-base font-bold">50.5k</p>
              <p className="text-xs md:text-sm text-muted-foreground">
                Followers
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm md:text-base font-bold">1</p>
              <p className="text-xs md:text-sm text-muted-foreground">
                Following
              </p>
            </div>
          </div>

          {/* User Bio - Hidden on Mobile */}
          <div className="hidden md:block space-y-1">
            <p className="text-base font-medium">@{user.username}</p>
            <p className="text-base">Bio</p>
            <p className="text-sm">Website</p>
            <p className="text-sm text-muted-foreground">Location</p>
          </div>
        </div>
      </div>

      {/* User Bio - Shown only on Mobile, as a new row */}
      <div className="block md:hidden mt-2 space-y-0.5 w-full self-start">
        <p className="text-sm font-medium">@{user.username}</p>
        <p className="text-sm">Bio</p>
        <p className="text-xs">Website</p>
        <p className="text-xs text-muted-foreground">Location</p>
      </div>
    </div>
  );
}

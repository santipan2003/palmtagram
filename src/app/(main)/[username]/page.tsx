"use client";

import { useParams } from "next/navigation";
import ProfilePage from "@/components/profile/profile-page";

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;

  return <ProfilePage username={username} />;
}

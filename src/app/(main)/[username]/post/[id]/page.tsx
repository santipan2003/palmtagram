"use client";

import { Suspense } from "react";
import ProfilePage from "@/components/profile/profile-page";
import Loading from "./loading";
import { useParams } from "next/navigation";

export default function PostDetailPage() {
  const params = useParams();
  const username = params.username as string;

  return (
    <Suspense fallback={<Loading />}>
      <ProfilePage username={username} />
    </Suspense>
  );
}

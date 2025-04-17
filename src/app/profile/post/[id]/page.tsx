import { Suspense } from "react";
import ProfilePage from "@/components/profile/profile-page";
import Loading from "./loading";

export default function PostDetailPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ProfilePage />
    </Suspense>
  );
}

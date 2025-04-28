import { Suspense } from "react";
import ProfilePage from "@/components/profile/profile-page";
import Loading from "./loading";

export default function PostDetailPage({params}: { params: { username: string, id: string } }) {
  console.log("PostDetailPage params:", params);
  return (
    <Suspense fallback={<Loading />}>
      <ProfilePage username={params.username} />
    </Suspense>
  );
}

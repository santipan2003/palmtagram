"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import Loading from "./loading";
import { postService } from "@/services/post.service";
import ProfilePage from "@/components/profile/profile-page";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const [username, setUsername] = useState<string | null>(null);

  // Fetch post data to get the username
  useEffect(() => {
    async function fetchPostAuthor() {
      try {
        const post = await postService.getPostById(postId);
        if (post && post.authorId && post.authorId.username) {
          setUsername(post.authorId.username);
        } else {
          // Handle error - can't find post author
          router.push("/"); // Redirect to home if post not found
        }
      } catch (error) {
        console.error("Error fetching post:", error);
        router.push("/"); // Redirect to home on error
      }
    }

    if (postId) {
      fetchPostAuthor();
    }
  }, [postId, router]);

  // Don't render until we have the username
  if (!username) {
    return <Loading />;
  }

  return (
    <Suspense fallback={<Loading />}>
      <ProfilePage username={username} postId={postId} />
    </Suspense>
  );
}

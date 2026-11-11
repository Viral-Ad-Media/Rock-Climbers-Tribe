import type { Metadata } from "next";
import { PostGrid } from "@/components/post-card";
import { getLatestPosts } from "@/lib/content";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "All climbing gear reviews and guides",
  description: "Every review and guide on Rock Climbers Tribe, newest first.",
  alternates: { canonical: "/blog/" },
};

export default async function BlogPage() {
  const posts = await getLatestPosts(500);
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold md:text-4xl">All reviews and guides</h1>
      <p className="mt-3 text-granite-500">{posts.length} articles, newest first.</p>
      <div className="mt-8">
        <PostGrid posts={posts} priorityCount={3} />
      </div>
    </div>
  );
}

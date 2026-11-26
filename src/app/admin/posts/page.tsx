import { PostsList } from "../_components/posts-list";

export const metadata = { title: "Posts" };

export default async function PostsPage({ searchParams }: PageProps<"/admin/posts">) {
  return <PostsList type="post" params={(await searchParams) as Record<string, string>} />;
}

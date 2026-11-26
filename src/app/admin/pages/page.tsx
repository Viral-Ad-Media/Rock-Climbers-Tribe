import { PostsList } from "../_components/posts-list";

export const metadata = { title: "Pages" };

export default async function PagesPage({ searchParams }: PageProps<"/admin/pages">) {
  return <PostsList type="page" params={(await searchParams) as Record<string, string>} />;
}

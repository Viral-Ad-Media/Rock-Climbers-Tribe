import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostGrid } from "@/components/post-card";
import { getPostsWithTag, getTagBySlug } from "@/lib/content";
import { getOptions } from "@/lib/options";
import { site } from "@/lib/site";

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps<"/tag/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [tag, options] = await Promise.all([getTagBySlug(slug), getOptions()]);
  if (!tag) return {};
  const posts = await getPostsWithTag(tag.id);
  const noindex =
    options.blog_public === "0" || options.seo_noindex_tags === "1" || (options.seo_noindex_empty_archives === "1" && posts.length === 0);
  return {
    title: `${tag.name} Archives`,
    description: tag.description ?? `Posts tagged ${tag.name} on ${options.blogname || site.name}.`,
    alternates: { canonical: `/tag/${tag.slug}/` },
    robots: noindex ? { index: false, follow: true } : undefined,
  };
}

export default async function TagPage({ params }: PageProps<"/tag/[slug]">) {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) notFound();
  const posts = await getPostsWithTag(tag.id);
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-moss-700">Tag</p>
      <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">{tag.name}</h1>
      {tag.description && <p className="mt-3 max-w-2xl text-granite-500">{tag.description}</p>}
      <div className="mt-8">
        {posts.length ? <PostGrid posts={posts} priorityCount={3} /> : <p className="text-granite-500">Nothing here yet.</p>}
      </div>
    </div>
  );
}

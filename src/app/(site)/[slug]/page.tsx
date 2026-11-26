import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Article } from "@/components/article";
import { PostGrid } from "@/components/post-card";
import {
  getAllPublishedSlugs,
  getCategories,
  getCategoryBySlug,
  getPostBySlug,
  getPostsInCategory,
} from "@/lib/content";
import { getOptions } from "@/lib/options";
import { postMetadata } from "@/lib/seo/meta";
import { site } from "@/lib/site";

export const revalidate = 3600;

export async function generateStaticParams() {
  const [posts, categories] = await Promise.all([getAllPublishedSlugs(), getCategories()]);
  return [...posts.map((p) => ({ slug: p.slug })), ...categories.map((c) => ({ slug: c.slug }))];
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [post, options] = await Promise.all([getPostBySlug(slug), getOptions()]);
  if (post) return postMetadata(post, options);
  const category = await getCategoryBySlug(slug);
  if (category) {
    return {
      title: category.slug === "spanish" ? "Guías de escalada en español" : `${category.name}: reviews and guides`,
      description: category.description ?? `${category.name} gear reviews and guides from ${site.name}.`,
      alternates: { canonical: `/${category.slug}/` },
      robots: options.blog_public === "0" ? { index: false } : undefined,
    };
  }
  return {};
}

export default async function SlugPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (post) return <Article post={post} />;
  const category = await getCategoryBySlug(slug);
  if (category) return <CategoryView category={category} />;
  notFound();
}

async function CategoryView({ category }: { category: NonNullable<Awaited<ReturnType<typeof getCategoryBySlug>>> }) {
  const posts = await getPostsInCategory(category.id);
  const es = category.slug === "spanish";
  return (
    <div className="mx-auto max-w-6xl px-4 py-12" lang={es ? "es" : "en"}>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-moss-700">{es ? "Categoría" : "Category"}</p>
      <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">{es ? "Guías en español" : category.name}</h1>
      {category.description && <p className="mt-3 max-w-2xl text-granite-500">{category.description}</p>}
      <div className="mt-8">
        {posts.length ? (
          <PostGrid posts={posts} priorityCount={3} />
        ) : (
          <p className="text-granite-500">Nothing here yet.</p>
        )}
      </div>
    </div>
  );
}

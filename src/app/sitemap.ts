import type { MetadataRoute } from "next";
import { getAllPublishedSlugs, getCategories, getTagsInUse } from "@/lib/content";
import { getOptions } from "@/lib/options";
import { site } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories, tags, options] = await Promise.all([getAllPublishedSlugs(), getCategories(), getTagsInUse(), getOptions()]);
  if (options.blog_public === "0") return [];
  const latest = posts.reduce((d, p) => (p.updatedAt > d ? p.updatedAt : d), new Date(0));
  return [
    { url: `${site.url}/`, lastModified: latest, priority: 1 },
    { url: `${site.url}/blog/`, lastModified: latest },
    ...categories.filter((c) => c.count > 0).map((c) => ({ url: `${site.url}/${c.slug}/`, lastModified: latest })),
    ...(options.seo_noindex_tags === "1" ? [] : tags.map((t) => ({ url: `${site.url}/tag/${t.slug}/`, lastModified: new Date(t.updatedAt) }))),
    ...posts.map((p) => ({ url: `${site.url}/${p.slug}/`, lastModified: p.updatedAt, priority: 0.8 })),
  ];
}

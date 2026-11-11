import type { MetadataRoute } from "next";
import { getAllPublishedSlugs, getCategories } from "@/lib/content";
import { site } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories] = await Promise.all([getAllPublishedSlugs(), getCategories()]);
  const latest = posts.reduce((d, p) => (p.updatedAt > d ? p.updatedAt : d), new Date(0));
  return [
    { url: `${site.url}/`, lastModified: latest, priority: 1 },
    { url: `${site.url}/blog/`, lastModified: latest },
    ...categories.filter((c) => c.count > 0).map((c) => ({ url: `${site.url}/${c.slug}/`, lastModified: latest })),
    ...posts.map((p) => ({ url: `${site.url}/${p.slug}/`, lastModified: p.updatedAt, priority: 0.8 })),
  ];
}

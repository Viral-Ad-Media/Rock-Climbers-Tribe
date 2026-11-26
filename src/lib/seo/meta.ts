import type { Metadata } from "next";
import type { FullPost } from "@/components/article";
import type { Options } from "@/lib/options";
import { site } from "@/lib/site";

/** Builds the <head> tags for a post the way Rank Math would: snippet title, canonical, robots, OG and Twitter cards. */
export function postMetadata(post: FullPost, options: Options): Metadata {
  const siteName = options.blogname || site.name;
  const sep = options.seo_separator || "|";
  const title = post.seoTitle?.trim() || `${post.title} ${sep} ${siteName}`;
  const description = post.seoDescription ?? post.excerpt ?? undefined;
  const url = `/${post.slug}/`;
  const image = post.coverImage || options.seo_default_og_image || undefined;
  const images = image ? [{ url: image, alt: post.coverImageAlt || post.title }] : undefined;
  const noindex = post.robotsNoindex || options.blog_public === "0";
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: post.canonicalUrl || url },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    openGraph: {
      type: "article",
      siteName,
      title,
      description,
      url,
      images,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      section: post.categories[0]?.name,
      tags: post.tags.map((t) => t.name),
      locale: post.lang === "es" ? "es_ES" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
      site: options.seo_twitter_username ? `@${options.seo_twitter_username.replace(/^@/, "")}` : undefined,
    },
  };
}

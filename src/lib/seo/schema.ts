import type { Options } from "../options";
import { site } from "../site";
import { decodeEntities, htmlToText, parseKeywords } from "./analyze";

type SchemaPost = {
  title: string;
  slug: string;
  type: string;
  seoTitle: string | null;
  seoDescription: string | null;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  coverImageAlt: string | null;
  author: string | null;
  lang: string;
  schemaType: string;
  focusKeyword: string | null;
  canonicalUrl: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
  categories: { slug: string; name: string }[];
  tags: { slug: string; name: string }[];
};

const abs = (path: string) => (/^https?:\/\//.test(path) ? path : `${site.url}${path.startsWith("/") ? "" : "/"}${path}`);

/** FAQ pairs from <details><summary>Question</summary>Answer</details> blocks */
export function extractFaqs(html: string) {
  return [...html.matchAll(/<details\b[^>]*>\s*<summary\b[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi)]
    .map((m) => ({ q: htmlToText(m[1]), a: htmlToText(m[2]) }))
    .filter((f) => f.q && f.a);
}

/** Rank Math-style JSON-LD @graph for a post or page */
export function buildPostSchema(post: SchemaPost, options: Options) {
  const url = post.canonicalUrl || `${site.url}/${post.slug}/`;
  const orgId = `${site.url}/#organization`;
  const websiteId = `${site.url}/#website`;
  const description = post.seoDescription ?? post.excerpt ?? undefined;
  const authorName = post.author ?? options.seo_org_name;
  const isPerson = !!post.author && post.author !== options.seo_org_name && post.author !== site.name;
  const authorId = isPerson ? `${site.url}/#/schema/person/${encodeURIComponent(authorName.toLowerCase().replace(/\s+/g, "-"))}` : orgId;
  const image = post.coverImage ? { "@type": "ImageObject", "@id": `${url}#primaryimage`, url: abs(post.coverImage), caption: post.coverImageAlt ?? undefined } : undefined;
  const primary = post.categories[0];
  const keywords = [...parseKeywords(post.focusKeyword), ...post.tags.map((t) => t.name)];
  const faqs = extractFaqs(post.content);

  const graph: Record<string, unknown>[] = [
    {
      "@type": "Organization",
      "@id": orgId,
      name: options.seo_org_name,
      url: site.url,
      ...(options.seo_org_logo ? { logo: { "@type": "ImageObject", url: abs(options.seo_org_logo) } } : {}),
      ...(options.seo_facebook_url ? { sameAs: [options.seo_facebook_url] } : {}),
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      url: site.url,
      name: options.blogname,
      publisher: { "@id": orgId },
      inLanguage: "en",
      potentialAction: { "@type": "SearchAction", target: `${site.url}/search/?q={search_term_string}`, "query-input": "required name=search_term_string" },
    },
    ...(image ? [image] : []),
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: post.lang === "es" ? "Inicio" : "Home", item: site.url },
        ...(primary ? [{ "@type": "ListItem", position: 2, name: primary.name, item: `${site.url}/${primary.slug}/` }] : []),
        { "@type": "ListItem", position: primary ? 3 : 2, name: decodeEntities(post.title) },
      ],
    },
    {
      "@type": "WebPage",
      "@id": url,
      url,
      name: post.seoTitle ?? post.title,
      description,
      isPartOf: { "@id": websiteId },
      breadcrumb: { "@id": `${url}#breadcrumb` },
      ...(image ? { primaryImageOfPage: { "@id": `${url}#primaryimage` } } : {}),
      datePublished: post.publishedAt?.toISOString(),
      dateModified: post.updatedAt.toISOString(),
      inLanguage: post.lang,
    },
  ];
  if (isPerson) graph.push({ "@type": "Person", "@id": authorId, name: authorName, worksFor: { "@id": orgId } });
  if (post.type === "post" && post.schemaType !== "none") {
    graph.push({
      "@type": post.schemaType || "BlogPosting",
      "@id": `${url}#article`,
      headline: post.seoTitle ?? post.title,
      description,
      keywords: keywords.length ? keywords.join(", ") : undefined,
      articleSection: post.categories.map((c) => c.name).join(", ") || undefined,
      ...(image ? { image: { "@id": `${url}#primaryimage` } } : {}),
      datePublished: post.publishedAt?.toISOString(),
      dateModified: post.updatedAt.toISOString(),
      author: { "@id": authorId, name: authorName },
      publisher: { "@id": orgId },
      mainEntityOfPage: { "@id": url },
      isPartOf: { "@id": url },
      inLanguage: post.lang,
      wordCount: htmlToText(post.content).split(/\s+/).filter(Boolean).length,
    });
  }
  if (faqs.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

export function jsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

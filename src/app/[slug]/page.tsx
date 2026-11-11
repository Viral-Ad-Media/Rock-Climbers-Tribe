import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostGrid } from "@/components/post-card";
import {
  getAllPublishedSlugs,
  getCategories,
  getCategoryBySlug,
  getPostBySlug,
  getPostsInCategory,
  getRelatedPosts,
} from "@/lib/content";
import { formatDate, site } from "@/lib/site";
import { withHeadingIds } from "@/lib/toc";

export const revalidate = 3600;

export async function generateStaticParams() {
  const [posts, categories] = await Promise.all([getAllPublishedSlugs(), getCategories()]);
  return [...posts.map((p) => ({ slug: p.slug })), ...categories.map((c) => ({ slug: c.slug }))];
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (post) {
    const title = post.seoTitle ?? post.title;
    const description = post.seoDescription ?? post.excerpt ?? undefined;
    return {
      title: { absolute: title.includes(site.name) ? title : `${title} | ${site.name}` },
      description,
      alternates: { canonical: `/${post.slug}/` },
      openGraph: {
        type: "article",
        title,
        description,
        url: `/${post.slug}/`,
        images: post.coverImage ? [post.coverImage] : undefined,
        publishedTime: post.publishedAt?.toISOString(),
        modifiedTime: post.updatedAt.toISOString(),
        locale: post.lang === "es" ? "es_ES" : "en_US",
      },
    };
  }
  const category = await getCategoryBySlug(slug);
  if (category) {
    return {
      title: category.slug === "spanish" ? "Guías de escalada en español" : `${category.name}: reviews and guides`,
      description: category.description ?? `${category.name} gear reviews and guides from ${site.name}.`,
      alternates: { canonical: `/${category.slug}/` },
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

type FullPost = NonNullable<Awaited<ReturnType<typeof getPostBySlug>>>;

async function Article({ post }: { post: FullPost }) {
  const related = await getRelatedPosts(post.id);
  const { html, toc } = withHeadingIds(post.content);
  const hasAffiliateLinks = /amzn\.to|amazon\.com/.test(post.content);
  const es = post.lang === "es";
  const primary = post.categories[0];

  return (
    <div lang={post.lang} className="mx-auto max-w-6xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="text-sm text-granite-500">
        <Link href="/" className="hover:text-moss-700">
          {es ? "Inicio" : "Home"}
        </Link>
        {primary && (
          <>
            <span className="mx-2">/</span>
            <Link href={`/${primary.slug}/`} className="hover:text-moss-700">
              {primary.slug === "spanish" ? "Español" : primary.name}
            </Link>
          </>
        )}
      </nav>

      <div className="mt-6 grid gap-12 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <article className="min-w-0">
          <header className="max-w-3xl">
            <h1 className="font-display text-3xl font-bold leading-tight md:text-[2.6rem]">{post.title}</h1>
            <p className="mt-4 text-sm text-granite-500">
              {es ? "Por" : "By"} <span className="font-medium text-granite-800">{post.author ?? site.name}</span>
              <span className="mx-2">·</span>
              {es ? "Actualizado el" : "Updated"} <time dateTime={post.updatedAt.toISOString()}>{formatDate(post.updatedAt, post.lang)}</time>
            </p>
            {hasAffiliateLinks && (
              <p className="mt-5 rounded-xl border border-granite-100 bg-granite-50 px-4 py-3 text-xs leading-relaxed text-granite-500">
                {es
                  ? "Este artículo contiene enlaces de afiliado. Si compras a través de ellos podemos ganar una pequeña comisión sin coste adicional para ti."
                  : "This article contains affiliate links. If you buy through them we may earn a small commission at no extra cost to you."}
              </p>
            )}
          </header>

          <div
            className="article prose prose-lg mt-8 max-w-3xl prose-headings:font-bold prose-a:font-medium"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </article>

        {toc.length > 2 && (
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-granite-100 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-granite-500">
                {es ? "En este artículo" : "In this article"}
              </p>
              <ol className="mt-3 max-h-[70vh] space-y-2 overflow-y-auto text-sm">
                {toc.map((h) => (
                  <li key={h.id}>
                    <a href={`#${h.id}`} className="text-granite-700 hover:text-moss-700">
                      {h.text}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        )}
      </div>

      {related.length > 0 && (
        <section className="mt-16 border-t border-granite-100 pt-10">
          <h2 className="font-display text-2xl font-bold">{es ? "Sigue leyendo" : "Keep reading"}</h2>
          <div className="mt-6">
            <PostGrid posts={related} />
          </div>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.seoDescription ?? post.excerpt,
            image: post.coverImage ? `${site.url}${post.coverImage}` : undefined,
            datePublished: post.publishedAt?.toISOString(),
            dateModified: post.updatedAt.toISOString(),
            inLanguage: post.lang,
            author: { "@type": post.author && post.author !== site.name ? "Person" : "Organization", name: post.author ?? site.name },
            publisher: { "@type": "Organization", name: site.name, url: site.url },
            mainEntityOfPage: `${site.url}/${post.slug}/`,
          }).replace(/</g, "\\u003c"),
        }}
      />
    </div>
  );
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

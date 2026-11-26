import Image from "next/image";
import Link from "next/link";
import { PostGrid } from "@/components/post-card";
import { getApprovedComments, getPostBySlug, getProductsBySlugs, getRelatedPosts } from "@/lib/content";
import { getOptions } from "@/lib/options";
import { buildPostSchema, jsonLd } from "@/lib/seo/schema";
import { extractProductSlugs, renderProductShortcodes } from "@/lib/products";
import { formatDate, site } from "@/lib/site";
import { withHeadingIds } from "@/lib/toc";
import { CommentForm } from "./comment-form";

export type FullPost = NonNullable<Awaited<ReturnType<typeof getPostBySlug>>>;

export async function Article({ post, preview = false }: { post: FullPost; preview?: boolean }) {
  const [related, comments, options, products] = await Promise.all([
    post.type === "post" ? getRelatedPosts(post.id) : [],
    getApprovedComments(post.id),
    getOptions(),
    getProductsBySlugs(extractProductSlugs(post.content)),
  ]);
  const { html: withIds, toc } = withHeadingIds(post.content);
  const html = renderProductShortcodes(withIds, products, {
    newTab: options.affiliate_new_tab === "1",
    buttonText: options.affiliate_button_text,
    lang: post.lang,
  });
  // Table of contents: the site-wide setting for this post type, then the post's own switch
  const tocAllowed = (post.type === "page" ? options.toc_enabled_pages : options.toc_enabled_posts) === "1";
  const showToc = tocAllowed && post.showToc && toc.length >= Math.max(1, Number(options.toc_min_headings) || 3);
  const hasAffiliateLinks = products.length > 0 || /amzn\.to|amazon\.com/.test(post.content);
  const es = post.lang === "es";
  const primary = post.categories[0];
  const showCover = post.coverImage && !post.content.includes(post.coverImage);
  const commentsOpen = post.commentStatus === "open";

  return (
    <div lang={post.lang} className="mx-auto max-w-6xl px-4 py-10">
      {preview && (
        <p className="mb-6 rounded-xl border border-ember/40 bg-ember/10 px-4 py-3 text-sm">
          Preview of a {post.status === "publish" ? "scheduled" : post.status} {post.type}. Only signed-in editors can see this page.
        </p>
      )}
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

      <div className={`mt-6 grid gap-12 ${showToc ? "lg:grid-cols-[minmax(0,1fr)_17rem]" : ""}`}>
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

          {showCover && (
            <figure className="relative mt-8 aspect-[16/9] max-w-3xl overflow-hidden rounded-2xl bg-granite-50">
              <Image src={post.coverImage!} alt={post.coverImageAlt ?? post.title} fill priority sizes="(min-width: 1024px) 48rem, 100vw" className="object-contain p-4" />
            </figure>
          )}

          <div
            className="article prose prose-lg mt-8 max-w-3xl prose-headings:font-bold prose-a:font-medium"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {post.tags.length > 0 && (
            <div className="mt-10 flex max-w-3xl flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-granite-700">{es ? "Etiquetas:" : "Tags:"}</span>
              {post.tags.map((t) => (
                <Link key={t.slug} href={`/tag/${t.slug}/`} className="rounded-full border border-granite-200 px-3 py-1 text-granite-700 hover:border-moss-500 hover:text-moss-700">
                  {t.name}
                </Link>
              ))}
            </div>
          )}

          {(commentsOpen || comments.length > 0) && (
            <section id="comments" className="mt-14 max-w-3xl border-t border-granite-100 pt-10">
              <h2 className="font-display text-2xl font-bold">
                {comments.length
                  ? `${comments.length} ${es ? (comments.length === 1 ? "comentario" : "comentarios") : comments.length === 1 ? "comment" : "comments"}`
                  : es ? "Comentarios" : "Comments"}
              </h2>
              {comments.length > 0 && (
                <ol className="mt-6 space-y-5">
                  {comments.map((c) => (
                    <li key={c.id} id={`comment-${c.id}`} className={`rounded-2xl border border-granite-100 bg-white p-5 ${c.parentId ? "ml-8" : ""}`}>
                      <p className="text-sm">
                        <span className="font-semibold">
                          {c.authorUrl ? (
                            <a href={c.authorUrl} rel="ugc nofollow noopener" target="_blank" className="hover:text-moss-700">{c.authorName}</a>
                          ) : (
                            c.authorName
                          )}
                        </span>
                        <span className="mx-2 text-granite-300">·</span>
                        <time className="text-granite-500" dateTime={c.createdAt.toISOString()}>{formatDate(c.createdAt, post.lang)}</time>
                      </p>
                      <p className="mt-2 whitespace-pre-line text-granite-800">{c.content}</p>
                    </li>
                  ))}
                </ol>
              )}
              {commentsOpen && !preview ? (
                <CommentForm postId={post.id} es={es} requireNameEmail={options.require_name_email === "1"} />
              ) : (
                !commentsOpen && <p className="mt-6 text-sm text-granite-500">{es ? "Los comentarios están cerrados." : "Comments are closed."}</p>
              )}
            </section>
          )}
        </article>

        {showToc && (
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-granite-100 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-granite-500">
                {es ? options.toc_title_es : options.toc_title}
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

      {!preview && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(buildPostSchema(post, options)) }} />
      )}
    </div>
  );
}

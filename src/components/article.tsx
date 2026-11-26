import Link from "next/link";
import { ReadingProgress, TocNav } from "@/components/article-chrome";
import { CoverArt, KindBadge, PostGrid } from "@/components/post-card";
import { ArrowRight, ClockIcon, Topo } from "@/components/topo";
import { categoryLabel, readingLabel } from "@/lib/blog";
import { getApprovedComments, getPostBySlug, getProductsBySlugs, getRelatedPosts } from "@/lib/content";
import { getOptions } from "@/lib/options";
import { buildPostSchema, jsonLd } from "@/lib/seo/schema";
import { extractProductSlugs, parseBoxDesign, renderProductShortcodes } from "@/lib/products";
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
    design: parseBoxDesign(options.affiliate_box_design),
  });
  // Table of contents: the site-wide setting for this post type, then the post's own switch
  const tocAllowed = (post.type === "page" ? options.toc_enabled_pages : options.toc_enabled_posts) === "1";
  const showToc = tocAllowed && post.showToc && toc.length >= Math.max(1, Number(options.toc_min_headings) || 3);
  const hasAffiliateLinks = products.length > 0 || /amzn\.to|amazon\.com/.test(post.content);
  const es = post.lang === "es";
  const primary = post.categories[0];
  const showCover = post.coverImage && !post.content.includes(post.coverImage);
  const commentsOpen = post.commentStatus === "open";

  const words = post.content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 230));
  // Older posts use their opening paragraph as the excerpt; don't print it twice.
  const plainStart = post.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);
  const showDek = !!post.excerpt && !plainStart.includes(post.excerpt.replace(/\s+/g, " ").trim().slice(0, 60));
  const initials = (post.author ?? site.name)
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div lang={post.lang}>
      {post.type === "post" && <ReadingProgress />}
      <header className="relative overflow-hidden bg-granite-900 text-white">
        <Topo className="absolute inset-0 h-full w-full text-moss-500/15" />
        <div
          aria-hidden="true"
          className="absolute inset-0 [background:radial-gradient(44rem_22rem_at_100%_0%,rgb(47_127_61/0.3),transparent),radial-gradient(30rem_18rem_at_0%_100%,rgb(217_98_43/0.15),transparent)]"
        />
        <div className={`relative mx-auto grid max-w-6xl gap-10 px-4 pt-8 ${showCover ? "pb-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center" : "pb-12"}`}>
          <div>
            {preview && (
              <p className="mb-6 rounded-xl border border-ember/40 bg-ember/15 px-4 py-3 text-sm">
                Preview of a {post.status === "publish" ? "scheduled" : post.status} {post.type}. Only signed-in editors can see this page.
              </p>
            )}
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-granite-300">
              <Link href="/" className="hover:text-white">
                {es ? "Inicio" : "Home"}
              </Link>
              <span aria-hidden="true">/</span>
              <Link href="/blog/" className="hover:text-white">
                {es ? "Blog" : "Logbook"}
              </Link>
              {primary && (
                <>
                  <span aria-hidden="true">/</span>
                  <Link href={`/${primary.slug}/`} className="hover:text-white">
                    {primary.slug === "spanish" ? "Español" : primary.name}
                  </Link>
                </>
              )}
            </nav>
            {post.type === "post" && (
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <KindBadge title={post.title} lang={post.lang} />
                {post.categories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/${c.slug}/`}
                    className="rounded-full border border-white/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-granite-200 hover:border-white hover:text-white"
                  >
                    {categoryLabel(c.slug, c.name)}
                  </Link>
                ))}
              </div>
            )}
            <h1 className="mt-4 font-display text-3xl font-bold leading-[1.1] md:text-5xl">{post.title}</h1>
            {showDek && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-granite-200">{post.excerpt}</p>}
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-granite-300">
              <span className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-moss-600 font-display text-xs font-bold text-white">{initials}</span>
                <span>
                  {es ? "Por" : "By"} <span className="font-semibold text-white">{post.author ?? site.name}</span>
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ClockIcon className="h-4 w-4" />
                {readingLabel(minutes, post.lang)}
              </span>
              <span>
                {es ? "Actualizado el" : "Updated"} <time dateTime={post.updatedAt.toISOString()}>{formatDate(post.updatedAt, post.lang)}</time>
              </span>
            </div>
          </div>
          {showCover && (
            <figure className="overflow-hidden rounded-3xl shadow-2xl shadow-black/40 ring-1 ring-white/10">
              <CoverArt
                src={post.coverImage!}
                alt={post.coverImageAlt ?? post.title}
                priority
                zoom={false}
                sizes="(min-width: 1024px) 34rem, 100vw"
                className="aspect-[16/10]"
              />
            </figure>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10">
      <div className={`grid gap-12 ${showToc ? "lg:grid-cols-[minmax(0,1fr)_18rem]" : ""}`}>
        <article id="article-body" className="min-w-0">
          {hasAffiliateLinks && (
            <p className="max-w-3xl rounded-xl border border-granite-100 bg-granite-50 px-4 py-3 text-xs leading-relaxed text-granite-500">
              {es
                ? "Este artículo contiene enlaces de afiliado. Si compras a través de ellos podemos ganar una pequeña comisión sin coste adicional para ti."
                : "This article contains affiliate links. If you buy through them we may earn a small commission at no extra cost to you."}
            </p>
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
            <div className="sticky top-24 space-y-4">
              <TocNav toc={toc} title={es ? options.toc_title_es : options.toc_title} />
              <Link
                href="/blog/"
                className="flex items-center justify-between rounded-2xl bg-granite-900 px-5 py-4 text-sm font-semibold text-white hover:bg-moss-700"
              >
                {es ? "Ver todas las guías" : "Browse the logbook"}
                <ArrowRight />
              </Link>
            </div>
          </aside>
        )}
      </div>

      {related.length > 0 && (
        <section className="mt-16 border-t border-granite-100 pt-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-ember">{es ? "Siguiente largo" : "Next pitch"}</p>
          <h2 className="mt-2 font-display text-3xl font-bold">{es ? "Sigue leyendo" : "Keep reading"}</h2>
          <div className="mt-6">
            <PostGrid posts={related} />
          </div>
        </section>
      )}

      {!preview && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(buildPostSchema(post, options)) }} />
      )}
      </div>
    </div>
  );
}

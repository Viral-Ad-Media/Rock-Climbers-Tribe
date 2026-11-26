import Image from "next/image";
import Link from "next/link";
import { kindLabel, postKind, readingLabel } from "@/lib/blog";
import type { PostCard as PostCardData } from "@/lib/content";
import { formatDate } from "@/lib/site";
import { ArrowRight, ClockIcon, Topo } from "./topo";

/**
 * Cover art that never crops: most covers are wide banners with text baked in,
 * so the image sits whole on a blurred, darkened copy of itself.
 */
export function CoverArt({
  src,
  alt = "",
  sizes,
  priority = false,
  className = "",
  zoom = true,
}: {
  src: string | null;
  alt?: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  zoom?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden bg-granite-900 ${className}`}>
      {src ? (
        <>
          <Image src={src} alt="" aria-hidden="true" fill sizes={sizes} className="scale-125 object-cover opacity-60 blur-2xl" />
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes={sizes}
            className={`object-contain p-3 drop-shadow-xl transition duration-500 ${zoom ? "group-hover:scale-[1.04]" : ""}`}
          />
        </>
      ) : (
        <Topo className="absolute inset-0 h-full w-full text-moss-500/40" />
      )}
    </div>
  );
}

export function KindBadge({ title, lang, className = "" }: { title: string; lang: string; className?: string }) {
  const kind = postKind(title);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
        kind === "review" ? "bg-ember text-white" : "bg-moss-600 text-white"
      } ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${kind === "review" ? "bg-amber-200" : "bg-moss-100"}`} />
      {kindLabel(kind, lang)}
    </span>
  );
}

function Meta({ post, light = false }: { post: PostCardData; light?: boolean }) {
  return (
    <p className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium ${light ? "text-granite-200" : "text-granite-500"}`}>
      <span className="inline-flex items-center gap-1">
        <ClockIcon />
        {readingLabel(post.readingMinutes ?? 5, post.lang)}
      </span>
      <span aria-hidden="true">·</span>
      <time dateTime={new Date(post.updatedAt).toISOString()}>{formatDate(post.updatedAt, post.lang)}</time>
    </p>
  );
}

export function PostCard({ post, priority = false }: { post: PostCardData; priority?: boolean }) {
  const es = post.lang === "es";
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-granite-100 bg-white shadow-sm shadow-granite-900/5 transition duration-300 hover:-translate-y-1 hover:border-granite-200 hover:shadow-xl hover:shadow-granite-900/10">
      <div className="relative">
        <CoverArt src={post.coverImage} sizes="(min-width: 1024px) 24rem, (min-width: 640px) 50vw, 100vw" priority={priority} className="aspect-[16/9]" />
        <div className="absolute left-3 top-3 flex gap-2">
          <KindBadge title={post.title} lang={post.lang} />
          {es && <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-granite-800">ES</span>}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <Meta post={post} />
        <h3 className="mt-2 font-display text-lg font-bold leading-snug text-granite-900">
          <Link href={`/${post.slug}/`} className="after:absolute after:inset-0 group-hover:text-moss-700">
            {post.title}
          </Link>
        </h3>
        {post.excerpt && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-granite-500">{post.excerpt}</p>}
        <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-moss-700">
          {es ? "Leer" : postKind(post.title) === "review" ? "See the picks" : "Read the guide"}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </span>
      </div>
    </article>
  );
}

/** The large lead story at the top of the blog. */
export function FeatureCard({ post, eyebrow }: { post: PostCardData; eyebrow: string }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] bg-granite-900 text-white shadow-2xl shadow-granite-900/30 ring-1 ring-white/10">
      <CoverArt src={post.coverImage} alt={post.title} sizes="(min-width: 1024px) 44rem, 100vw" priority className="aspect-[16/9] md:aspect-[16/8]" />
      <div className="relative flex flex-1 flex-col p-6 md:p-8">
        <Topo className="absolute inset-0 h-full w-full text-white/[0.05]" />
        <div className="relative flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-moss-100">{eyebrow}</span>
          <KindBadge title={post.title} lang={post.lang} />
        </div>
        <h2 className="relative mt-3 font-display text-2xl font-bold leading-tight md:text-[2rem]">
          <Link href={`/${post.slug}/`} className="after:absolute after:inset-0 group-hover:text-moss-100">
            {post.title}
          </Link>
        </h2>
        {post.excerpt && <p className="relative mt-3 line-clamp-3 max-w-2xl leading-relaxed text-granite-200">{post.excerpt}</p>}
        <div className="relative mt-auto flex flex-wrap items-center justify-between gap-4 pt-6">
          <Meta post={post} light />
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-granite-900 transition group-hover:bg-moss-100">
            Start reading <ArrowRight />
          </span>
        </div>
      </div>
    </article>
  );
}

/** Numbered, horizontal card for the "fresh on the wall" list. */
export function CompactCard({ post, index }: { post: PostCardData; index: number }) {
  return (
    <article className="group relative grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 rounded-2xl border border-granite-100 bg-white p-3 pr-4 transition hover:border-moss-500 hover:shadow-lg hover:shadow-granite-900/5">
      <CoverArt src={post.coverImage} sizes="9rem" className="aspect-[4/3] w-28 rounded-xl sm:w-36" zoom={false} />
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-xs font-bold text-granite-500">
          <span className="font-display text-base text-ember">{String(index).padStart(2, "0")}</span>
          <span className="uppercase tracking-wider">{kindLabel(postKind(post.title), post.lang)}</span>
        </p>
        <h3 className="mt-1 line-clamp-2 font-display text-[15px] font-bold leading-snug text-granite-900">
          <Link href={`/${post.slug}/`} className="after:absolute after:inset-0 group-hover:text-moss-700">
            {post.title}
          </Link>
        </h3>
        <div className="mt-1.5">
          <Meta post={post} />
        </div>
      </div>
    </article>
  );
}

export function PostGrid({ posts, priorityCount = 0 }: { posts: PostCardData[]; priorityCount?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((p, i) => (
        <PostCard key={p.id} post={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}

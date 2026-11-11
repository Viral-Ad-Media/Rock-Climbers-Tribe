import Image from "next/image";
import Link from "next/link";
import type { PostCard as PostCardData } from "@/lib/content";
import { formatDate } from "@/lib/site";

export function PostCard({ post, priority = false }: { post: PostCardData; priority?: boolean }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-granite-100 bg-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-granite-900/5">
      <Link href={`/${post.slug}/`} className="relative block aspect-[16/10] overflow-hidden bg-granite-50">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt=""
            fill
            priority={priority}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-contain p-4 transition duration-300 group-hover:scale-[1.03]"
          />
        ) : null}
        {post.lang === "es" && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-granite-800">
            Español
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-bold leading-snug text-granite-900">
          <Link href={`/${post.slug}/`} className="hover:text-moss-700">
            {post.title}
          </Link>
        </h3>
        {post.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-granite-500">{post.excerpt}</p>}
        <p className="mt-auto pt-4 text-xs font-medium text-granite-500">
          Updated {formatDate(post.updatedAt, post.lang)}
        </p>
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

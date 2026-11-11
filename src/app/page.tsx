import Link from "next/link";
import { PostCard, PostGrid } from "@/components/post-card";
import { SearchIcon } from "@/components/site-header";
import { getCategories, getLatestPosts } from "@/lib/content";
import { site } from "@/lib/site";

export const revalidate = 3600;

const CATEGORY_BLURBS: Record<string, string> = {
  "outdoor-climbers": "Ropes, helmets, slings and packs for crag days and multi-pitch.",
  "indoor-climbers-2": "Gym gear, bouldering warm-ups and home-wall equipment.",
  "climbing-gear": "How to choose the essentials when you are just starting out.",
  spanish: "Guías de equipo de escalada en español.",
};

export default async function HomePage() {
  const [english, spanish, categories] = await Promise.all([
    getLatestPosts(12, "en"),
    getLatestPosts(3, "es"),
    getCategories(),
  ]);
  const [featured, ...rest] = english;

  return (
    <>
      <section className="relative overflow-hidden bg-granite-900 text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-40 [background:radial-gradient(60rem_30rem_at_85%_-10%,var(--color-moss-700),transparent),radial-gradient(40rem_20rem_at_0%_110%,#4b4a43,transparent)]"
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1.1fr_1fr] md:py-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-moss-100">Climbing gear, tested and compared</p>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight md:text-5xl">
              Unbiased reviews for top climbing products
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-granite-200">
              Straight answers on shoes, harnesses, ropes, helmets and the rest of the rack, plus beginner guides that
              help you climb safer and spend smarter.
            </p>
            <form action="/search/" className="mt-8 flex max-w-md items-center gap-2 rounded-full bg-white p-1.5 pl-5 text-granite-900 shadow-xl">
              <SearchIcon />
              <label htmlFor="hero-q" className="sr-only">
                Search reviews
              </label>
              <input
                id="hero-q"
                name="q"
                placeholder="Search harnesses, ropes, shoes…"
                className="min-w-0 flex-1 bg-transparent py-2 outline-none placeholder:text-granite-500"
              />
              <button className="rounded-full bg-moss-600 px-5 py-2 text-sm font-semibold text-white hover:bg-moss-700">
                Search
              </button>
            </form>
          </div>
          {featured && (
            <div className="self-center">
              <p className="mb-3 text-sm font-semibold text-granite-300">Newest guide</p>
              <PostCard post={featured} priority />
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-16">
        <h2 className="font-display text-2xl font-bold">Browse by category</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories
            .filter((c) => c.count > 0)
            .map((c) => (
              <Link
                key={c.slug}
                href={`/${c.slug}/`}
                className="group rounded-2xl border border-granite-100 bg-white p-5 transition hover:border-moss-500"
              >
                <p className="font-display text-lg font-bold group-hover:text-moss-700">
                  {c.slug === "spanish" ? "En español" : c.name}
                </p>
                <p className="mt-1 text-sm text-granite-500">{CATEGORY_BLURBS[c.slug] ?? c.description}</p>
                <p className="mt-3 text-xs font-semibold text-moss-700">
                  {c.count} {c.count === 1 ? "article" : "articles"} →
                </p>
              </Link>
            ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-bold">Latest reviews and guides</h2>
          <Link href="/blog/" className="text-sm font-semibold text-moss-700 hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-6">
          <PostGrid posts={rest.slice(0, 9)} />
        </div>
      </section>

      {spanish.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-16" lang="es">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-bold">En español</h2>
            <Link href="/spanish/" className="text-sm font-semibold text-moss-700 hover:underline">
              Ver todo
            </Link>
          </div>
          <div className="mt-6">
            <PostGrid posts={spanish} />
          </div>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: site.name,
            url: site.url,
            potentialAction: {
              "@type": "SearchAction",
              target: `${site.url}/search/?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
    </>
  );
}

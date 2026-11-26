import type { Metadata } from "next";
import Link from "next/link";
import { BlogFilter, type FilterOption } from "@/components/blog-filter";
import { CompactCard, CoverArt, FeatureCard, PostCard } from "@/components/post-card";
import { SearchIcon } from "@/components/site-header";
import { ArrowRight, Topo } from "@/components/topo";
import { categoryLabel, postKind, readingLabel } from "@/lib/blog";
import { getCategories, getLatestPosts, getPostCategorySlugs } from "@/lib/content";
import { formatDate, site } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "All climbing gear reviews and guides",
  description: "Every review and guide on Rock Climbers Tribe, newest first.",
  alternates: { canonical: "/blog/" },
};

/** The beginner path: read in this order to go from zero to first climb. */
const START_HERE = [
  { slug: "rock-climbing-gear-for-beginners", step: "Know what you need" },
  { slug: "best-climbing-shoes-for-beginners", step: "Get the right shoes" },
  { slug: "best-climbing-harness-for-beginners", step: "Harness up" },
  { slug: "how-to-warmup-before-bouldering", step: "Warm up before you pull" },
];

const GRID_ID = "logbook-grid";

export default async function BlogPage() {
  const [posts, categoryMap, categories] = await Promise.all([getLatestPosts(500), getPostCategorySlugs(), getCategories()]);
  const english = posts.filter((p) => p.lang === "en");
  const [lead, ...freshPool] = english.length ? english : posts;
  const fresh = freshPool.slice(0, 4);
  const bySlug = new Map(posts.map((p) => [p.slug, p]));
  const route = START_HERE.flatMap((s) => {
    const p = bySlug.get(s.slug);
    return p ? [{ ...s, post: p }] : [];
  });

  const filtersFor = (id: number, title: string) => [postKind(title), ...(categoryMap[id] ?? [])].join(" ");
  const reviews = posts.filter((p) => postKind(p.title) === "review").length;
  const options: FilterOption[] = [
    { id: "all", label: "Everything", count: posts.length },
    { id: "review", label: "Gear reviews", count: reviews },
    { id: "guide", label: "Guides & skills", count: posts.length - reviews },
    ...categories
      .filter((c) => c.count > 0)
      .sort((a, b) => (a.slug === "spanish" ? 1 : b.slug === "spanish" ? -1 : b.count - a.count))
      .map((c) => ({ id: c.slug, label: categoryLabel(c.slug, c.name), count: c.count })),
  ];
  const totalMinutes = posts.reduce((n, p) => n + (p.readingMinutes ?? 0), 0);
  const lastUpdate = posts.reduce<Date | null>((d, p) => (!d || p.updatedAt > d ? p.updatedAt : d), null);

  return (
    <>
      {/* ---------- Hero: the lead story and what's fresh ---------- */}
      <section className="relative overflow-hidden bg-granite-900 text-white">
        <Topo className="absolute inset-0 h-full w-full text-moss-500/20" />
        <div
          aria-hidden="true"
          className="absolute inset-0 [background:radial-gradient(50rem_26rem_at_90%_0%,rgb(47_127_61/0.35),transparent),radial-gradient(40rem_24rem_at_0%_100%,rgb(217_98_43/0.18),transparent)]"
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-12 md:pt-16">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-moss-100">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-moss-500" />
                The Tribe logbook
              </p>
              <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] md:text-6xl">
                Climbing gear reviews <span className="text-moss-500">&amp;</span> guides
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-granite-200">
                Honest picks for shoes, harnesses, ropes and the rest of your rack, plus the skills to use them. No fluff, just beta.
              </p>
            </div>
            <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 text-center">
              {[
                [posts.length, "articles"],
                [reviews, "gear reviews"],
                [`${Math.round(totalMinutes / 60)}h`, "of reading"],
              ].map(([n, l]) => (
                <div key={l} className="bg-granite-900/80 px-5 py-3">
                  <dt className="sr-only">{l}</dt>
                  <dd className="font-display text-2xl font-bold">{n}</dd>
                  <dd className="text-[11px] uppercase tracking-wider text-granite-300">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {lead && (
            <div className="mt-10 grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <FeatureCard post={lead} eyebrow="Latest send" />
              </div>
              <div className="flex flex-col gap-3 lg:col-span-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-granite-300">Fresh on the wall</h2>
                  {lastUpdate && <p className="text-xs text-granite-300">Updated {formatDate(lastUpdate)}</p>}
                </div>
                {fresh.map((p, i) => (
                  <CompactCard key={p.id} post={p} index={i + 1} />
                ))}
                <a href={`#${GRID_ID}`} className="mt-1 inline-flex items-center gap-2 self-start text-sm font-semibold text-moss-100 hover:text-white">
                  Browse all {posts.length} articles <ArrowRight />
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ---------- Start here: the beginner route ---------- */}
      {route.length > 1 && (
        <section className="relative mx-auto max-w-6xl px-4 pt-16 md:pt-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-ember">New to climbing?</p>
              <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">Start here: your first route</h2>
              <p className="mt-2 max-w-xl text-granite-500">
                {route.length} pitches, read in order. By the top you will know exactly what to buy and how to use it.
              </p>
            </div>
            <p className="font-display text-sm font-bold text-granite-500">
              Total: {readingLabel(route.reduce((n, r) => n + (r.post.readingMinutes ?? 0), 0))}
            </p>
          </div>

          <ol className="relative mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* the rope */}
            <span
              aria-hidden="true"
              className="absolute left-5 top-5 hidden h-0.5 w-[calc(100%-2.5rem)] bg-[repeating-linear-gradient(90deg,var(--color-ember)_0_10px,transparent_10px_16px)] lg:block"
            />
            {route.map((r, i) => (
              <li key={r.slug} className="group relative">
                <div className="relative z-10 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-ember bg-chalk font-display text-sm font-bold text-ember transition group-hover:bg-ember group-hover:text-white">
                    {i + 1}
                  </span>
                  <span className="rounded-full bg-chalk pr-2 text-xs font-bold uppercase tracking-wider text-granite-500">Pitch {i + 1}</span>
                </div>
                <div className="relative mt-4 overflow-hidden rounded-2xl border border-granite-100 bg-white transition group-hover:-translate-y-1 group-hover:border-ember/50 group-hover:shadow-xl group-hover:shadow-granite-900/10">
                  <CoverArt src={r.post.coverImage} sizes="(min-width: 1024px) 18rem, 50vw" className="aspect-[16/9]" />
                  <div className="p-4">
                    <p className="font-display text-lg font-bold leading-snug text-granite-900">{r.step}</p>
                    <h3 className="mt-1 line-clamp-2 text-sm text-granite-500">
                      <Link href={`/${r.slug}/`} className="after:absolute after:inset-0 group-hover:text-moss-700">
                        {r.post.title}
                      </Link>
                    </h3>
                    <p className="mt-3 text-xs font-semibold text-granite-500">{readingLabel(r.post.readingMinutes ?? 5)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ---------- Every article, filterable ---------- */}
      <section className="mx-auto max-w-6xl px-4 pt-16 md:pt-20">
        <h2 className="font-display text-3xl font-bold md:text-4xl">The full logbook</h2>
        <p className="mt-2 text-granite-500">Every review and guide we have written, newest first. Pick a filter to narrow it down.</p>
        <div className="mt-6">
          <BlogFilter options={options} gridId={GRID_ID} />
        </div>
        <div id={GRID_ID} className="mt-8 grid scroll-mt-32 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p, i) => (
            <div key={p.id} data-filters={filtersFor(p.id, p.title)} className="flex [&>article]:flex-1">
              <PostCard post={p} priority={i < 3 && !lead} />
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Closing call to action ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-moss-700 px-6 py-10 text-white md:px-12 md:py-14">
          <Topo className="absolute inset-0 h-full w-full text-white/10" />
          <div className="relative grid items-center gap-8 md:grid-cols-[1.2fr_1fr]">
            <div>
              <h2 className="font-display text-3xl font-bold leading-tight">Looking for one piece of gear?</h2>
              <p className="mt-3 max-w-md text-moss-100">
                Search every review on {site.name}, from chalk bags to dynamic ropes.
              </p>
            </div>
            <form action="/search/" className="flex items-center gap-2 rounded-full bg-white p-1.5 pl-5 text-granite-900 shadow-xl">
              <SearchIcon />
              <label htmlFor="blog-q" className="sr-only">
                Search reviews
              </label>
              <input id="blog-q" name="q" placeholder="Try “helmet” or “rope”" className="min-w-0 flex-1 bg-transparent py-2 outline-none placeholder:text-granite-500" />
              <button className="rounded-full bg-granite-900 px-5 py-2 text-sm font-semibold text-white hover:bg-granite-800">Search</button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}

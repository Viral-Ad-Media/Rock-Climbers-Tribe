import Link from "next/link";
import type { PostCard } from "@/lib/content";
import { kindLabel, postKind, readingLabel } from "@/lib/blog";
import { CoverArt } from "./post-card";
import { SearchIcon } from "./site-header";
import { ArrowRight, Topo } from "./topo";

/** Quick picks by gear type, each pointing at its buying guide. */
const GEAR = [
  { label: "Shoes", slug: "best-climbing-shoes-2026", icon: "M3 15c3 0 5-1 7-4l2 1c1 2 4 3 9 3v3H3z M10 11l2-3" },
  { label: "Harnesses", slug: "climbing-harness-2026", icon: "M4 7h16 M6 7c0 5 2 9 6 9s6-4 6-9 M8 16l-2 4 M16 16l2 4" },
  { label: "Ropes", slug: "best-climbing-rope-2026", icon: "M12 4a8 8 0 1 0 8 8 M12 8a4 4 0 1 0 4 4 M20 12v8" },
  { label: "Helmets", slug: "best-climbing-helmet-2026", icon: "M4 15a8 8 0 0 1 16 0z M3 15h18 M9 7v4 M15 7v4" },
  { label: "Carabiners", slug: "climbing-carabiner-f2026", icon: "M9 3h6a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4z M5 9l4-2" },
  { label: "Chalk bags", slug: "5-best-climbing-chalkbag", icon: "M6 8h12l-1 12H7z M6 8c0-2 2-4 6-4s6 2 6 4 M9 4l-2-1" },
  { label: "Slings", slug: "best-climbing-slings-2026", icon: "M7 4c-3 4-3 12 0 16 M17 4c3 4 3 12 0 16 M7 4h10 M7 20h10" },
  { label: "Packs", slug: "best-climbing-backpack-2026", icon: "M7 7a5 5 0 0 1 10 0v13H7z M7 12h10 M10 3h4" },
];

export function HomeHero({ posts, total, available }: { posts: PostCard[]; total: number; available: Set<string> }) {
  const [lead, second, third] = posts;
  const gear = GEAR.filter((g) => available.has(g.slug));

  return (
    <section className="relative overflow-hidden border-b border-granite-100 bg-chalk">
      <Topo className="absolute -right-40 top-0 h-full w-[60rem] text-granite-200/70" />
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-12 px-4 pb-12 pt-12 md:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center">
        {/* Left: promise, search, trust */}
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-moss-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-moss-700">
            Independent climbing gear reviews
          </p>
          <h1 className="mt-5 font-display text-[2.6rem] font-bold leading-[1.04] tracking-tight text-granite-900 md:text-6xl">
            Climb smarter.
            <br />
            <span className="relative inline-block">
              Buy once.
              <svg aria-hidden="true" viewBox="0 0 300 16" preserveAspectRatio="none" className="absolute -bottom-2 left-0 h-3 w-full text-ember">
                <path d="M2 11 C 60 3, 120 3, 170 8 S 260 13, 298 5" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-granite-700">
            Unbiased reviews of shoes, harnesses, ropes and the rest of the rack, plus beginner guides that help you climb safer and spend
            less.
          </p>

          <form action="/search/" className="mt-8 flex max-w-lg items-center gap-2 rounded-2xl border border-granite-200 bg-white p-2 pl-4 shadow-lg shadow-granite-900/5 focus-within:border-moss-500">
            <SearchIcon />
            <label htmlFor="hero-q" className="sr-only">
              Search reviews
            </label>
            <input id="hero-q" name="q" placeholder="What are you shopping for?" className="min-w-0 flex-1 bg-transparent py-2 outline-none placeholder:text-granite-500" />
            <button className="rounded-xl bg-granite-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-moss-700">Search</button>
          </form>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-granite-700">
            {[`${total} in-depth reviews & guides`, "No sponsored rankings", "Updated for 2026"].map((t) => (
              <li key={t} className="inline-flex items-center gap-2">
                <svg viewBox="0 0 20 20" className="h-4 w-4 text-moss-600" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                  <path d="m4 10 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Right: editorial mosaic of the newest stories */}
        {lead && (
          <div className="relative">
            <article className="group relative overflow-hidden rounded-3xl bg-granite-900 shadow-2xl shadow-granite-900/20">
              <CoverArt src={lead.coverImage} sizes="(min-width: 1024px) 36rem, 100vw" priority className="aspect-[16/8]" />
              <div className="relative p-5 text-white md:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-moss-100">
                  New · {kindLabel(postKind(lead.title), lead.lang)} · {readingLabel(lead.readingMinutes ?? 5, lead.lang)}
                </p>
                <h2 className="mt-2 font-display text-xl font-bold leading-snug md:text-2xl">
                  <Link href={`/${lead.slug}/`} className="after:absolute after:inset-0 group-hover:text-moss-100">
                    {lead.title}
                  </Link>
                </h2>
              </div>
            </article>
            <span className="absolute -right-2 -top-4 hidden rotate-6 rounded-full bg-ember px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-lg sm:block">
              Editor’s pick
            </span>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[second, third].filter(Boolean).map((p) => (
                <article key={p.id} className="group relative flex items-center gap-3 rounded-2xl border border-granite-100 bg-white p-2.5 pr-4 shadow-sm transition hover:border-moss-500 hover:shadow-lg">
                  <CoverArt src={p.coverImage} sizes="7rem" zoom={false} className="aspect-square w-16 shrink-0 rounded-xl" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-ember">{kindLabel(postKind(p.title), p.lang)}</p>
                    <h3 className="mt-0.5 line-clamp-3 font-display text-sm font-bold leading-snug text-granite-900">
                      <Link href={`/${p.slug}/`} className="after:absolute after:inset-0 group-hover:text-moss-700">
                        {p.title}
                      </Link>
                    </h3>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Gear quick picks */}
      {gear.length > 0 && (
        <div className="relative mx-auto max-w-6xl px-4 pb-12">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-granite-500">Shop by gear</h2>
            <Link href="/blog/" className="inline-flex items-center gap-1 text-sm font-semibold text-moss-700 hover:underline">
              All reviews <ArrowRight />
            </Link>
          </div>
          <ul className="mt-4 grid grid-cols-4 gap-3 md:grid-cols-8">
            {gear.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/${g.slug}/`}
                  className="group flex h-full flex-col items-center gap-2 rounded-2xl border border-granite-100 bg-white px-2 py-4 text-center transition hover:-translate-y-0.5 hover:border-moss-500 hover:shadow-lg"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-granite-50 text-granite-800 transition group-hover:bg-moss-600 group-hover:text-white">
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d={g.icon} />
                    </svg>
                  </span>
                  <span className="text-xs font-semibold text-granite-800 sm:text-sm">{g.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

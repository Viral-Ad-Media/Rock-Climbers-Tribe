import Link from "next/link";
import { HomeHero } from "@/components/home-hero";
import { PostGrid } from "@/components/post-card";
import { getAllPublishedSlugs, getCategories, getLatestPosts } from "@/lib/content";
import { site } from "@/lib/site";

export const revalidate = 3600;

const CATEGORY_BLURBS: Record<string, string> = {
  "outdoor-climbers": "Ropes, helmets, slings and packs for crag days and multi-pitch.",
  "indoor-climbers-2": "Gym gear, bouldering warm-ups and home-wall equipment.",
  "climbing-gear": "How to choose the essentials when you are just starting out.",
  spanish: "Guías de equipo de escalada en español.",
};

export default async function HomePage() {
  const [english, spanish, categories, slugs] = await Promise.all([
    getLatestPosts(12, "en"),
    getLatestPosts(3, "es"),
    getCategories(),
    getAllPublishedSlugs(),
  ]);
  const rest = english.slice(3);

  return (
    <>
      <HomeHero posts={english.slice(0, 3)} total={slugs.length} available={new Set(slugs.map((x) => x.slug))} />

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

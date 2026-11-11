import type { Metadata } from "next";
import { PostGrid } from "@/components/post-card";
import { searchPosts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false },
};

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw ?? "").trim().slice(0, 100);
  const results = q ? await searchPosts(q) : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold">Search</h1>
      <form className="mt-6 flex max-w-xl gap-2">
        <label htmlFor="q" className="sr-only">
          Search reviews
        </label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="Try “harness”, “rope”, “beginner”…"
          className="min-w-0 flex-1 rounded-full border border-granite-200 bg-white px-5 py-3 outline-none focus:border-moss-500"
        />
        <button className="rounded-full bg-moss-600 px-6 font-semibold text-white hover:bg-moss-700">Search</button>
      </form>
      {q && (
        <p className="mt-6 text-granite-500">
          {results.length} {results.length === 1 ? "result" : "results"} for “{q}”
        </p>
      )}
      <div className="mt-6">
        <PostGrid posts={results} />
      </div>
    </div>
  );
}

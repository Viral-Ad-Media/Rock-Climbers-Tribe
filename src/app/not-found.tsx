import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-display text-6xl font-bold text-moss-600">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold">That route doesn’t go anywhere</h1>
      <p className="mt-3 text-granite-500">The page may have moved. Try searching, or head back to the latest reviews.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/search/" className="rounded-full border border-granite-200 px-5 py-2.5 font-semibold hover:bg-granite-100">
          Search
        </Link>
        <Link href="/" className="rounded-full bg-moss-600 px-5 py-2.5 font-semibold text-white hover:bg-moss-700">
          Home
        </Link>
      </div>
    </div>
  );
}

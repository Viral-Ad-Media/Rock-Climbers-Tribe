import { desc } from "drizzle-orm";
import Link from "next/link";
import { db, schema } from "@/db";
import { formatDate } from "@/lib/site";

export default async function AdminHome() {
  const posts = await db
    .select({
      id: schema.post.id,
      title: schema.post.title,
      slug: schema.post.slug,
      status: schema.post.status,
      lang: schema.post.lang,
      updatedAt: schema.post.updatedAt,
    })
    .from(schema.post)
    .orderBy(desc(schema.post.updatedAt));

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Posts ({posts.length})</h1>
        <Link href="/admin/posts/new/" className="rounded-full bg-moss-600 px-4 py-2 text-sm font-semibold text-white hover:bg-moss-700">
          New post
        </Link>
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-granite-100 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-granite-50 text-xs uppercase tracking-wider text-granite-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-granite-100">
            {posts.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <Link href={`/admin/posts/${p.id}/`} className="font-medium hover:text-moss-700">
                    {p.title}
                  </Link>
                  <span className="block text-xs text-granite-500">/{p.slug}/{p.lang === "es" ? " · ES" : ""}</span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      p.status === "publish" ? "bg-moss-50 text-moss-700" : "bg-granite-100 text-granite-700"
                    }`}
                  >
                    {p.status === "publish" ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-granite-500">{formatDate(p.updatedAt)}</td>
                <td className="px-4 py-3 text-right">
                  {p.status === "publish" && (
                    <Link href={`/${p.slug}/`} className="text-moss-700 hover:underline">
                      View
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

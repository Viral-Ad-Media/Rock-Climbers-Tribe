import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { PostForm } from "../../post-form";

export default async function EditPost({ params, searchParams }: PageProps<"/admin/posts/[id]">) {
  const { id } = await params;
  const { saved } = await searchParams;
  const [post] = await db.select().from(schema.post).where(eq(schema.post.id, Number(id))).limit(1);
  if (!post) notFound();
  const [categories, links] = await Promise.all([
    db.select({ id: schema.category.id, name: schema.category.name }).from(schema.category).orderBy(schema.category.name),
    db.select().from(schema.postCategory).where(eq(schema.postCategory.postId, post.id)),
  ]);
  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link href="/admin/" className="text-sm text-granite-500 hover:text-moss-700">
          ← All posts
        </Link>
        {post.status === "publish" && (
          <Link href={`/${post.slug}/`} className="text-sm font-semibold text-moss-700 hover:underline">
            View live
          </Link>
        )}
      </div>
      <PostForm post={post} categories={categories} selected={links.map((l) => l.categoryId)} justCreated={saved === "1"} />
    </>
  );
}

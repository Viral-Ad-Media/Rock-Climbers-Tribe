import Link from "next/link";
import { db, schema } from "@/db";
import { PostForm } from "../../post-form";

export default async function NewPost() {
  const categories = await db
    .select({ id: schema.category.id, name: schema.category.name })
    .from(schema.category)
    .orderBy(schema.category.name);
  return (
    <>
      <Link href="/admin/" className="mb-6 inline-block text-sm text-granite-500 hover:text-moss-700">
        ← All posts
      </Link>
      <PostForm
        post={{ title: "", slug: "", status: "draft", lang: "en", excerpt: null, content: "", coverImage: null, author: null, seoTitle: null, seoDescription: null }}
        categories={categories}
        selected={[]}
      />
    </>
  );
}

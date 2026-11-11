"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import { requireAdmin } from "@/lib/session";

export type SaveState = { error?: string; saved?: boolean };

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export async function savePost(_prev: SaveState, form: FormData): Promise<SaveState> {
  await requireAdmin();

  const id = Number(form.get("id")) || null;
  const title = String(form.get("title") ?? "").trim();
  const slug = slugify(String(form.get("slug") ?? "") || title);
  if (!title) return { error: "A title is required." };
  if (!slug) return { error: "A URL slug is required." };

  const status = form.get("status") === "publish" ? "publish" : "draft";
  const text = (key: string) => String(form.get(key) ?? "").trim() || null;
  const values = {
    title,
    slug,
    status,
    lang: form.get("lang") === "es" ? "es" : "en",
    excerpt: text("excerpt"),
    content: sanitizeArticleHtml(String(form.get("content") ?? "")),
    coverImage: text("coverImage"),
    author: text("author"),
    seoTitle: text("seoTitle"),
    seoDescription: text("seoDescription"),
    updatedAt: new Date(),
  };

  const [clash] = await db.select({ id: schema.post.id }).from(schema.post).where(eq(schema.post.slug, slug)).limit(1);
  if (clash && clash.id !== id) return { error: `Another post already uses the URL /${slug}/.` };

  let postId = id;
  if (id) {
    const [existing] = await db.select().from(schema.post).where(eq(schema.post.id, id)).limit(1);
    if (!existing) return { error: "That post no longer exists." };
    await db
      .update(schema.post)
      .set({ ...values, publishedAt: existing.publishedAt ?? (status === "publish" ? new Date() : null) })
      .where(eq(schema.post.id, id));
    // Keep the old URL working if the slug changed
    if (existing.slug !== slug) {
      await db
        .insert(schema.redirect)
        .values({ source: existing.slug, destination: slug })
        .onConflictDoUpdate({ target: schema.redirect.source, set: { destination: slug } });
    }
  } else {
    const [row] = await db
      .insert(schema.post)
      .values({ ...values, publishedAt: status === "publish" ? new Date() : null })
      .returning({ id: schema.post.id });
    postId = row.id;
  }

  const categoryIds = form.getAll("categories").map(Number).filter(Boolean);
  await db.delete(schema.postCategory).where(eq(schema.postCategory.postId, postId!));
  if (categoryIds.length) {
    await db.insert(schema.postCategory).values(categoryIds.map((categoryId) => ({ postId: postId!, categoryId })));
  }

  revalidatePath("/", "layout");
  if (!id) redirect(`/admin/posts/${postId}/?saved=1`);
  return { saved: true };
}

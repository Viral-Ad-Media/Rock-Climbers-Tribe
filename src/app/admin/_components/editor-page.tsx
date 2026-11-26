import { eq, ne } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { getOptions } from "@/lib/options";
import { fold, parseKeywords } from "@/lib/seo/analyze";
import { site } from "@/lib/site";
import { requireStaff } from "@/lib/session";
import { PostEditor, type EditorPost } from "./post-editor";

export async function EditorPage({ type, id, message }: { type: "post" | "page"; id?: number; message?: string }) {
  const session = await requireStaff();
  const options = await getOptions();
  const [row] = id ? await db.select().from(schema.post).where(eq(schema.post.id, id)).limit(1) : [];
  if (id && (!row || row.type !== type || row.status === "trash")) notFound();

  const [categories, cats, tags, keywords] = await Promise.all([
    db.select({ id: schema.category.id, name: schema.category.name }).from(schema.category).orderBy(schema.category.name),
    row ? db.select({ id: schema.postCategory.categoryId }).from(schema.postCategory).where(eq(schema.postCategory.postId, row.id)) : [],
    row
      ? db.select({ name: schema.tag.name }).from(schema.postTag).innerJoin(schema.tag, eq(schema.tag.id, schema.postTag.tagId)).where(eq(schema.postTag.postId, row.id))
      : [],
    db.select({ id: schema.post.id, kw: schema.post.focusKeyword }).from(schema.post).where(ne(schema.post.status, "trash")),
  ]);

  const initial: EditorPost = {
    id: row?.id,
    type,
    title: row?.title ?? "",
    slug: row?.slug ?? "",
    status: row?.status ?? "draft",
    lang: row?.lang ?? "en",
    excerpt: row?.excerpt ?? "",
    content: row?.content ?? "",
    coverImage: row?.coverImage ?? "",
    coverImageAlt: row?.coverImageAlt ?? "",
    author: row?.author ?? session.user.name,
    seoTitle: row?.seoTitle ?? "",
    seoDescription: row?.seoDescription ?? "",
    focusKeyword: row?.focusKeyword ?? "",
    canonicalUrl: row?.canonicalUrl ?? "",
    robotsNoindex: row?.robotsNoindex ?? false,
    schemaType: row?.schemaType ?? options.seo_default_schema,
    commentStatus: row?.commentStatus ?? options.default_comment_status,
    publishedAt: row?.publishedAt?.toISOString() ?? null,
    updatedAt: row?.updatedAt?.toISOString() ?? null,
  };

  return (
    <div className="wp-wrap">
      <PostEditor
        initial={initial}
        categories={categories}
        selectedCategories={cats.map((c) => c.id)}
        initialTags={tags.map((t) => t.name)}
        otherKeywords={keywords.filter((k) => k.id !== row?.id).map((k) => fold(parseKeywords(k.kw)[0] ?? "")).filter(Boolean)}
        siteName={options.blogname}
        siteUrl={site.url}
        message={message}
      />
    </div>
  );
}

import "server-only";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";

const { post, category, postCategory, redirect } = schema;

const published = eq(post.status, "publish");

const cardFields = {
  id: post.id,
  slug: post.slug,
  title: post.title,
  excerpt: post.excerpt,
  coverImage: post.coverImage,
  publishedAt: post.publishedAt,
  updatedAt: post.updatedAt,
  lang: post.lang,
};

export type PostCard = {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
  lang: string;
};

export async function getLatestPosts(limit = 12, lang?: string): Promise<PostCard[]> {
  return db
    .select(cardFields)
    .from(post)
    .where(lang ? and(published, eq(post.lang, lang)) : published)
    .orderBy(desc(post.publishedAt))
    .limit(limit);
}

export async function getAllPublishedSlugs() {
  return db.select({ slug: post.slug, updatedAt: post.updatedAt }).from(post).where(published);
}

export async function getPostBySlug(slug: string) {
  const [row] = await db
    .select()
    .from(post)
    .where(and(eq(post.slug, slug), published))
    .limit(1);
  if (!row) return null;
  const categories = await db
    .select({ slug: category.slug, name: category.name })
    .from(postCategory)
    .innerJoin(category, eq(postCategory.categoryId, category.id))
    .where(eq(postCategory.postId, row.id));
  return { ...row, categories };
}

export async function getRelatedPosts(postId: number, limit = 3): Promise<PostCard[]> {
  return db
    .select(cardFields)
    .from(post)
    .where(
      and(
        published,
        sql`${post.id} <> ${postId}`,
        sql`${post.id} in (
          select pc2.post_id from post_category pc1
          join post_category pc2 on pc1.category_id = pc2.category_id
          where pc1.post_id = ${postId})`,
      ),
    )
    .orderBy(desc(post.updatedAt))
    .limit(limit);
}

export async function getCategories() {
  return db
    .select({
      id: category.id,
      slug: category.slug,
      name: category.name,
      description: category.description,
      count: sql<number>`count(${post.id})::int`,
    })
    .from(category)
    .leftJoin(postCategory, eq(postCategory.categoryId, category.id))
    .leftJoin(post, and(eq(post.id, postCategory.postId), published))
    .groupBy(category.id)
    .orderBy(category.name);
}

export async function getCategoryBySlug(slug: string) {
  const [row] = await db.select().from(category).where(eq(category.slug, slug)).limit(1);
  return row ?? null;
}

export async function getPostsInCategory(categoryId: number): Promise<PostCard[]> {
  return db
    .select(cardFields)
    .from(post)
    .innerJoin(postCategory, eq(postCategory.postId, post.id))
    .where(and(published, eq(postCategory.categoryId, categoryId)))
    .orderBy(desc(post.updatedAt));
}

export async function searchPosts(q: string): Promise<PostCard[]> {
  const term = `%${q.replace(/[%_]/g, "")}%`;
  return db
    .select(cardFields)
    .from(post)
    .where(and(published, or(ilike(post.title, term), ilike(post.excerpt, term), ilike(post.content, term))))
    .orderBy(desc(post.updatedAt))
    .limit(30);
}

export async function getRedirects() {
  return db.select().from(redirect);
}

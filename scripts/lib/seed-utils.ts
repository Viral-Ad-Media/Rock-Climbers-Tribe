import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import type { db as Db, schema as Schema } from "../../src/db";
import { slugify } from "../../src/lib/seo/analyze";
import { computeSeoScore } from "../../src/lib/seo/score";

export type SeedPost = {
  slug: string;
  categories: string[];
  tags?: string[];
  publishedAt: string | null;
  updatedAt: string;
  focusKeyword?: string | null;
  [key: string]: unknown;
};

export type SeedData = {
  categories: (typeof Schema.category.$inferInsert)[];
  posts: SeedPost[];
  redirects: (typeof Schema.redirect.$inferInsert)[];
};

export function loadSeed(): SeedData {
  return JSON.parse(readFileSync("seed/content.json", "utf8"));
}

/** Inserts or updates one seed post (matched by WordPress id, then slug) with its categories and tags. */
export async function upsertSeedPost(db: typeof Db, schema: typeof Schema, p: SeedPost, all: SeedPost[]) {
  const { categories, tags = [], publishedAt, updatedAt, ...rest } = p;
  const others = all.filter((o) => o !== p).map((o) => (o.focusKeyword ?? "").split(",")[0].trim().toLowerCase());
  const values = {
    ...(rest as Omit<typeof schema.post.$inferInsert, "publishedAt" | "updatedAt">),
    publishedAt: publishedAt ? new Date(publishedAt) : null,
    updatedAt: new Date(updatedAt),
  };
  values.seoScore = computeSeoScore(values as Parameters<typeof computeSeoScore>[0], others);

  const wpId = values.wpId ?? null;
  const [existing] = wpId
    ? await db.select({ id: schema.post.id }).from(schema.post).where(eq(schema.post.wpId, wpId)).limit(1)
    : await db.select({ id: schema.post.id }).from(schema.post).where(eq(schema.post.slug, p.slug)).limit(1);

  let id: number;
  if (existing) {
    await db.update(schema.post).set(values).where(eq(schema.post.id, existing.id));
    id = existing.id;
  } else {
    const [row] = await db.insert(schema.post).values(values).returning({ id: schema.post.id });
    id = row.id;
  }

  const cats = await db.select().from(schema.category);
  const catIds = categories.map((s) => cats.find((c) => c.slug === s)?.id).filter((x): x is number => !!x);
  await db.delete(schema.postCategory).where(eq(schema.postCategory.postId, id));
  if (catIds.length) await db.insert(schema.postCategory).values(catIds.map((categoryId) => ({ postId: id, categoryId })));

  await db.delete(schema.postTag).where(eq(schema.postTag.postId, id));
  for (const name of tags) {
    const slug = slugify(name);
    const [t] = await db
      .insert(schema.tag)
      .values({ slug, name })
      .onConflictDoUpdate({ target: schema.tag.slug, set: { name } })
      .returning({ id: schema.tag.id });
    await db.insert(schema.postTag).values({ postId: id, tagId: t.id }).onConflictDoNothing();
  }
  return id;
}

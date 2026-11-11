/**
 * Loads seed/content.json into the database.
 * By default it only runs when the post table is empty, so it is safe to run on every
 * deploy without overwriting edits made in the admin. Pass --force to update anyway.
 *
 *   npm run db:seed [-- --force]
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { readFileSync } from "node:fs";
import { count, inArray } from "drizzle-orm";

type SeedPost = {
  slug: string;
  categories: string[];
  publishedAt: string | null;
  updatedAt: string;
  [key: string]: unknown;
};

async function main() {
  const { db, schema } = await import("../src/db");
  const force = process.argv.includes("--force");
  const [{ n }] = await db.select({ n: count() }).from(schema.post);
  if (n > 0 && !force) {
    console.log(`Seed skipped: the database already has ${n} posts (use --force to update).`);
    return;
  }

  const data = JSON.parse(readFileSync("seed/content.json", "utf8")) as {
    categories: (typeof schema.category.$inferInsert)[];
    posts: SeedPost[];
    redirects: (typeof schema.redirect.$inferInsert)[];
  };

  for (const c of data.categories) {
    await db.insert(schema.category).values(c).onConflictDoUpdate({ target: schema.category.slug, set: c });
  }
  const cats = await db.select().from(schema.category);
  const catId = new Map(cats.map((c) => [c.slug, c.id]));

  for (const { categories, publishedAt, updatedAt, ...rest } of data.posts) {
    const values = {
      ...(rest as Omit<typeof schema.post.$inferInsert, "publishedAt" | "updatedAt">),
      publishedAt: publishedAt ? new Date(publishedAt) : null,
      updatedAt: new Date(updatedAt),
    };
    const [row] = await db
      .insert(schema.post)
      .values(values)
      .onConflictDoUpdate({ target: schema.post.slug, set: values })
      .returning({ id: schema.post.id });
    await db.delete(schema.postCategory).where(inArray(schema.postCategory.postId, [row.id]));
    const ids = categories.map((s) => catId.get(s)).filter((x): x is number => !!x);
    if (ids.length) {
      await db.insert(schema.postCategory).values(ids.map((categoryId) => ({ postId: row.id, categoryId })));
    }
  }

  for (const r of data.redirects) {
    await db
      .insert(schema.redirect)
      .values(r)
      .onConflictDoUpdate({ target: schema.redirect.source, set: { destination: r.destination } });
  }
  console.log(`Seeded ${data.posts.length} posts, ${data.categories.length} categories, ${data.redirects.length} redirects.`);
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });

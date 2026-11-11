/**
 * Writes the site's public content (posts, categories, redirects) to seed/content.json,
 * so a fresh database can be filled without the original WordPress export.
 *
 *   npm run seed:export
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { writeFileSync } from "node:fs";
import { asc, eq } from "drizzle-orm";

async function main() {
  const { db, schema } = await import("../src/db");
  const categories = await db.select().from(schema.category).orderBy(asc(schema.category.id));
  const posts = await db.select().from(schema.post).orderBy(asc(schema.post.id));
  const links = await db
    .select({ post: schema.post.slug, category: schema.category.slug })
    .from(schema.postCategory)
    .innerJoin(schema.post, eq(schema.post.id, schema.postCategory.postId))
    .innerJoin(schema.category, eq(schema.category.id, schema.postCategory.categoryId));
  const redirects = await db.select().from(schema.redirect).orderBy(asc(schema.redirect.source));

  const data = {
    categories: categories.map(({ id: _id, ...c }) => c),
    posts: posts.map(({ id: _id, ...p }) => ({
      ...p,
      categories: links.filter((l) => l.post === p.slug).map((l) => l.category),
    })),
    redirects,
  };
  writeFileSync("seed/content.json", JSON.stringify(data, null, 1) + "\n");
  console.log(`Wrote ${posts.length} posts, ${categories.length} categories, ${redirects.length} redirects.`);
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });

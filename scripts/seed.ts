/**
 * Loads seed/content.json into the database.
 * By default it only runs when the post table is empty, so it is safe to run on every
 * deploy without overwriting edits made in the admin. Pass --force to update anyway.
 * (To push later content fixes to a live database, use `npm run seo:sync`.)
 *
 *   npm run db:seed [-- --force]
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { count } from "drizzle-orm";
import { loadSeed, upsertSeedPost } from "./lib/seed-utils";

async function main() {
  const { db, schema } = await import("../src/db");
  const force = process.argv.includes("--force");
  const [{ n }] = await db.select({ n: count() }).from(schema.post);
  if (n > 0 && !force) {
    console.log(`Seed skipped: the database already has ${n} posts (use --force to update).`);
    return;
  }

  const data = loadSeed();
  for (const c of data.categories) {
    await db.insert(schema.category).values(c).onConflictDoUpdate({ target: schema.category.slug, set: c });
  }
  for (const p of data.posts) await upsertSeedPost(db, schema, p, data.posts);
  for (const r of data.redirects) {
    await db
      .insert(schema.redirect)
      .values(r)
      .onConflictDoUpdate({ target: schema.redirect.source, set: { destination: r.destination } });
  }
  console.log(`Seeded ${data.posts.length} posts, ${data.categories.length} categories, ${data.redirects.length} redirects.`);
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });

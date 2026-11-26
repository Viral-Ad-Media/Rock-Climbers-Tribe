/**
 * Pushes content fixes from seed/content.json (for example the SEO pass) to a live database.
 *
 * A post is only updated when its seed copy is newer than the database row, so anything
 * edited in the admin after the fix was made is never overwritten. Safe to run on every deploy.
 *
 *   npm run seo:sync [-- --dry-run]
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { eq, or } from "drizzle-orm";
import { loadSeed, upsertSeedPost } from "./lib/seed-utils";

async function main() {
  const { db, schema } = await import("../src/db");
  const dry = process.argv.includes("--dry-run");
  const data = loadSeed();
  let updated = 0;

  for (const p of data.posts) {
    const wpId = (p.wpId as number | null) ?? null;
    const [row] = await db
      .select({ id: schema.post.id, slug: schema.post.slug, updatedAt: schema.post.updatedAt })
      .from(schema.post)
      .where(wpId ? or(eq(schema.post.wpId, wpId), eq(schema.post.slug, p.slug)) : eq(schema.post.slug, p.slug))
      .limit(1);
    if (!row) continue; // never re-create posts deleted in the admin
    if (row.updatedAt >= new Date(p.updatedAt)) continue;
    console.log(`${dry ? "Would update" : "Updating"} /${row.slug}/${row.slug !== p.slug ? ` -> /${p.slug}/` : ""}`);
    if (!dry) await upsertSeedPost(db, schema, p, data.posts);
    updated++;
  }

  if (!dry) {
    for (const r of data.redirects) {
      await db
        .insert(schema.redirect)
        .values(r)
        .onConflictDoUpdate({ target: schema.redirect.source, set: { destination: r.destination } });
    }
  }
  console.log(`SEO sync: ${updated} post(s) ${dry ? "need" : ""} updating.`);
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });

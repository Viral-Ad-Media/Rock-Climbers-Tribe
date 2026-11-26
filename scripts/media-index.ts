/**
 * Registers the imported WordPress images in public/wp-content/uploads with the Media Library.
 * Resized copies (-300x200 etc.) are skipped. Safe to run on every deploy.
 *
 *   npm run media:index
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = "public/wp-content/uploads";
const MIME: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp", svg: "image/svg+xml" };

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

async function main() {
  const { db, schema } = await import("../src/db");
  const files = walk(ROOT).filter((f) => {
    const ext = f.split(".").pop()!.toLowerCase();
    return MIME[ext] && !/-\d+x\d+\.[a-z]+$/i.test(f) && !/-scaled\.[a-z]+$/i.test(f);
  });
  let added = 0;
  for (const f of files) {
    const filename = f.split("/").pop()!;
    const ext = filename.split(".").pop()!.toLowerCase();
    const [y, m] = relative(ROOT, f).split("/");
    const created = /^\d{4}$/.test(y) && /^\d{2}$/.test(m) ? new Date(`${y}-${m}-01T00:00:00Z`) : new Date();
    const res = await db
      .insert(schema.media)
      .values({
        url: `/${relative("public", f)}`,
        filename,
        mimeType: MIME[ext],
        size: statSync(f).size,
        title: filename.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " "),
        createdAt: created,
      })
      .onConflictDoNothing()
      .returning({ id: schema.media.id });
    added += res.length;
  }
  console.log(`Media index: ${added} new file(s), ${files.length} total.`);
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });

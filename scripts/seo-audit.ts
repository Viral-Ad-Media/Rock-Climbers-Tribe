/**
 * Scores every post with the Rank Math-style analyzer and prints a report.
 *
 *   npm run seo:audit            # scores seed/content.json
 *   npm run seo:audit -- --db    # scores the posts in the database
 *   npm run seo:audit -- --md report.md   # also writes a Markdown report
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { readFileSync, writeFileSync } from "node:fs";
import { analyzeSeo, fold, parseKeywords, type SeoInput } from "../src/lib/seo/analyze";

type Row = SeoInput & { status: string; type: string };

async function load(): Promise<Row[]> {
  if (process.argv.includes("--db")) {
    const { db, schema } = await import("../src/db");
    return (await db.select().from(schema.post)) as unknown as Row[];
  }
  return JSON.parse(readFileSync("seed/content.json", "utf8")).posts;
}

async function main() {
  const posts = (await load()).filter((p) => p.status !== "trash");
  const kwOwners = new Map<string, number>();
  for (const p of posts) for (const k of parseKeywords(p.focusKeyword).slice(0, 1)) kwOwners.set(fold(k), (kwOwners.get(fold(k)) ?? 0) + 1);

  const results = posts.map((p) => {
    const primary = fold(parseKeywords(p.focusKeyword)[0] ?? "");
    const others = (kwOwners.get(primary) ?? 0) > 1 ? [primary] : [];
    const r = analyzeSeo({ ...p, siteName: "Rock Climbers Tribe", otherKeywords: others });
    return { p, r };
  });
  results.sort((a, b) => a.r.score - b.r.score);

  const lines: string[] = [];
  for (const { p, r } of results) {
    const failing = r.checks.filter((c) => c.status !== "pass");
    console.log(`${String(r.score).padStart(3)}  ${p.status.padEnd(7)} ${p.slug}  [${p.focusKeyword ?? "-"}]  ${r.stats.words}w ${r.stats.density}%`);
    for (const c of failing) console.log(`       ${c.status === "warn" ? "~" : "✗"} ${c.label}: ${c.message}`);
    lines.push(`| ${r.score} | ${p.status} | \`/${p.slug}/\` | ${p.focusKeyword ?? ""} | ${r.stats.words} | ${failing.map((c) => c.label).join("; ") || "all checks pass"} |`);
  }
  const avg = Math.round(results.reduce((s, x) => s + x.r.score, 0) / (results.length || 1));
  console.log(`\nAverage score: ${avg} across ${results.length} posts`);

  const mdIdx = process.argv.indexOf("--md");
  if (mdIdx > -1) {
    const md = [
      "| Score | Status | URL | Focus keyword | Words | Not fully passing |",
      "|---:|---|---|---|---:|---|",
      ...lines,
      "",
      `Average score: **${avg}** across ${results.length} posts.`,
    ].join("\n");
    writeFileSync(process.argv[mdIdx + 1], md);
  }
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });

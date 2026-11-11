/**
 * Imports posts, categories, featured images and SEO fields from a WordPress
 * SQL export (phpMyAdmin or mysqldump) into the Neon database.
 *
 *   npm run import:wp -- path/to/export.sql
 *
 * Safe to run more than once: rows are matched on their WordPress IDs and updated.
 * Elementor pages are rebuilt from `_elementor_data`; block-editor posts use post_content.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { sql as dsql } from "drizzle-orm";
import { sanitizeArticleHtml } from "../src/lib/sanitize";
import { cleanPostContent } from "./wp/classic";
import { elementorToHtml } from "./wp/elementor";
import { detectPrefix, readTables, type Row } from "./wp/sql-dump";

const file = process.argv[2];
if (!file) {
  console.error("Usage: npm run import:wp -- path/to/export.sql");
  process.exit(1);
}

const SITE_NAME = "Rock Climbers Tribe";
const DEFAULT_AUTHOR = "Rock Climbers Tribe";
/** Categories whose posts are written in Spanish */
const SPANISH_CATEGORIES = new Set(["spanish"]);

const stripTags = (s: string) =>
  s.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const decodeEntities = (s: string) =>
  s
    .replace(/&#8217;|&#039;|&rsquo;/g, "’")
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&#8212;|&mdash;/g, "—")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"');
const gmt = (d: string | null) =>
  d && !d.startsWith("0000") ? new Date(d.replace(" ", "T") + "Z") : null;
const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * The comparison tables hot-linked star ratings and "View on Amazon" buttons from another
 * site (greenjuicetribe.com). Replace them with text so the tables don't depend on it.
 */
function replaceExternalAssets(html: string) {
  const stars = (n: number) => "★".repeat(Math.floor(n)) + (n % 1 ? "½" : "");
  return html
    .replace(/<img[^>]+src="[^"]*\/(\d)(?:-(\d))?-star\.svg"[^>]*>/g, (_m, a: string, b?: string) => {
      const rating = Number(a) + (b ? Number(b) / 10 : 0);
      return `<span title="${rating} out of 5">${stars(rating)}</span>`;
    })
    .replace(/<a([^>]*)>\s*<img[^>]+View-on-Amazon\.png"[^>]*>\s*<\/a>/g, '<a class="btn"$1>View on Amazon</a>')
    .replace(/<img[^>]+View-on-Amazon\.png"[^>]*>/g, "View on Amazon")
    .replace(/<img[^>]+elementor\/assets\/images\/placeholder\.png"[^>]*>/g, "");
}

async function main() {
  const { db, schema } = await import("../src/db");
  const dump = readFileSync(file, "utf8");
  const prefix = detectPrefix(dump);
  const t = (name: string) => `${prefix}${name}`;
  const data = readTables(dump, [
    t("posts"),
    t("postmeta"),
    t("terms"),
    t("term_taxonomy"),
    t("term_relationships"),
  ]);
  console.log(`Table prefix "${prefix}"; ${data[t("posts")].length} rows in posts`);

  const posts = new Map(data[t("posts")].map((p) => [p.ID!, p]));
  const meta = new Map<string, Map<string, string[]>>();
  for (const m of data[t("postmeta")]) {
    const byPost = meta.get(m.post_id!) ?? new Map<string, string[]>();
    byPost.set(m.meta_key!, [...(byPost.get(m.meta_key!) ?? []), m.meta_value ?? ""]);
    meta.set(m.post_id!, byPost);
  }
  const getMeta = (id: string, key: string) => meta.get(id)?.get(key)?.at(-1);

  /* ---------- TablePress tables (rendered inline where [table id=N /] appears) ---------- */
  const optionsRows = readTables(dump, [t("options")])[t("options")];
  const tablesOption = optionsRows.find((o) => o.option_name === "tablepress_tables")?.option_value;
  const tableMap: Record<string, number> = tablesOption ? JSON.parse(tablesOption).table_post ?? {} : {};
  const renderTable = (id: string) => {
    const post = posts.get(String(tableMap[id]));
    if (!post?.post_content) return "";
    let rows: string[][];
    try {
      rows = JSON.parse(post.post_content);
    } catch {
      return "";
    }
    if (!rows.length) return "";
    const [head, ...body] = rows;
    const cell = (tag: "th" | "td") => (c: string) => `<${tag}>${c}</${tag}>`;
    return (
      `<div class="table-wrap"><table>` +
      `<thead><tr>${head.map(cell("th")).join("")}</tr></thead>` +
      `<tbody>${body.map((r) => `<tr>${r.map(cell("td")).join("")}</tr>`).join("")}</tbody>` +
      `</table></div>`
    );
  };

  /* ---------- Categories ---------- */
  const terms = new Map(data[t("terms")].map((x) => [x.term_id!, x]));
  const taxonomy = new Map(data[t("term_taxonomy")].map((x) => [x.term_taxonomy_id!, x]));
  const postTerms = new Map<string, Row[]>();
  for (const r of data[t("term_relationships")]) {
    const tt = taxonomy.get(r.term_taxonomy_id!);
    if (tt?.taxonomy !== "category") continue;
    postTerms.set(r.object_id!, [...(postTerms.get(r.object_id!) ?? []), tt]);
  }

  /* ---------- Posts ---------- */
  const wpPosts = data[t("posts")].filter(
    (p) => p.post_type === "post" && ["publish", "draft"].includes(p.post_status ?? ""),
  );
  const usedCategoryTermIds = new Set<string>();
  for (const p of wpPosts) for (const tt of postTerms.get(p.ID!) ?? []) usedCategoryTermIds.add(tt.term_id!);

  const categoryIdByTerm = new Map<string, number>();
  for (const termId of usedCategoryTermIds) {
    const term = terms.get(termId)!;
    if (term.slug === "uncategorized") continue;
    const desc = [...taxonomy.values()].find((x) => x.term_id === termId)?.description || null;
    const values = {
      wpId: Number(termId),
      slug: term.slug!,
      name: decodeEntities(term.name!.replace(/^[`'"\s]+/, "")),
      description: desc,
    };
    const [row] = await db
      .insert(schema.category)
      .values(values)
      .onConflictDoUpdate({ target: schema.category.wpId, set: values })
      .returning({ id: schema.category.id });
    categoryIdByTerm.set(termId, row.id);
  }
  console.log(`Categories: ${categoryIdByTerm.size}`);

  const redirects = new Map<string, string>();
  const missingImages = new Set<string>();
  const imageExists = (url: string) =>
    existsSync(path.join("public", decodeURI(url.replace(/^https?:\/\/[^/]+/, ""))));

  let imported = 0;
  for (const p of wpPosts) {
    const id = p.ID!;
    const title = decodeEntities(p.post_title ?? "").replace(/\s{2,}/g, " ").trim();
    const slug = p.post_name || slugify(title) || `post-${id}`;
    let author = DEFAULT_AUTHOR;

    const setAuthor = (a: string) => (author = a);
    const classic = () =>
      cleanPostContent(p.post_content ?? "", { title, table: renderTable, onAuthor: setAuthor });
    const textLength = (h: string) => stripTags(h).length;

    // Elementor posts keep their layout in _elementor_data. Some were later rewritten
    // straight into post_content, so use whichever version holds noticeably more text.
    const elementor = getMeta(id, "_elementor_data");
    let html = classic();
    if (elementor && elementor !== "[]") {
      const fromElementor = elementorToHtml(elementor, { table: renderTable, onAuthor: setAuthor });
      if (textLength(html) <= textLength(fromElementor) * 1.15) html = fromElementor;
    }
    const content = sanitizeArticleHtml(replaceExternalAssets(html));

    const thumbId = getMeta(id, "_thumbnail_id");
    const attached = thumbId ? getMeta(thumbId, "_wp_attached_file") : undefined;
    let coverImage = attached ? `/wp-content/uploads/${attached}` : null;
    if (coverImage && !imageExists(coverImage)) {
      missingImages.add(coverImage);
      coverImage = null;
    }
    if (!coverImage) {
      // Fall back to the first image in the article
      const first = /<img[^>]+src="([^"]+)"/.exec(content)?.[1];
      if (first && first.startsWith("/")) coverImage = first;
    }

    const cats = (postTerms.get(id) ?? []).map((tt) => tt.term_id!);
    const catSlugs = cats.map((c) => terms.get(c)?.slug ?? "");
    const lang = catSlugs.some((s) => SPANISH_CATEGORIES.has(s)) ? "es" : "en";

    const excerptSource = stripTags(p.post_excerpt || content);
    const excerpt = excerptSource.length > 200 ? excerptSource.slice(0, 197).replace(/\s+\S*$/, "") + "…" : excerptSource;

    const fill = (s?: string) =>
      s
        ?.replace(/%title%/g, title)
        .replace(/%sitename%/g, SITE_NAME)
        .replace(/%sep%/g, "|")
        .replace(/%[a-z_]+%/g, "")
        .replace(/\s{2,}/g, " ")
        .trim() || null;

    const values = {
      wpId: Number(id),
      slug,
      type: "post",
      title,
      excerpt: decodeEntities(excerpt),
      content,
      coverImage,
      author,
      status: p.post_status === "publish" ? "publish" : "draft",
      lang,
      seoTitle: fill(getMeta(id, "rank_math_title")),
      seoDescription: fill(getMeta(id, "rank_math_description")),
      publishedAt: gmt(p.post_date_gmt) ?? gmt(p.post_date),
      updatedAt: gmt(p.post_modified_gmt) ?? new Date(),
    };
    const [row] = await db
      .insert(schema.post)
      .values(values)
      .onConflictDoUpdate({ target: schema.post.wpId, set: values })
      .returning({ id: schema.post.id });

    await db.delete(schema.postCategory).where(dsql`${schema.postCategory.postId} = ${row.id}`);
    const catIds = cats.map((c) => categoryIdByTerm.get(c)).filter((x): x is number => !!x);
    if (catIds.length) {
      await db
        .insert(schema.postCategory)
        .values(catIds.map((categoryId) => ({ postId: row.id, categoryId })))
        .onConflictDoNothing();
    }

    for (const old of meta.get(id)?.get("_wp_old_slug") ?? []) {
      if (old && old !== slug) redirects.set(old, slug);
    }
    imported++;
    console.log(`  ${values.status === "publish" ? "✓" : "·"} ${slug} (${content.length} chars)`);
  }

  for (const [source, destination] of redirects) {
    await db
      .insert(schema.redirect)
      .values({ source, destination })
      .onConflictDoUpdate({ target: schema.redirect.source, set: { destination } });
  }

  console.log(`\nImported ${imported} posts, ${redirects.size} old-slug redirects.`);
  if (missingImages.size) console.log(`Missing featured images:\n  ${[...missingImages].join("\n  ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

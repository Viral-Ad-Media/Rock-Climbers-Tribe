/**
 * One-off SEO pass over the imported posts (seed/content.json), driven by seed/seo-plan.json.
 *
 * For every post it:
 *  - sets the Rank Math fields (focus keyword, SEO title, meta description, image alt, tags)
 *  - fills empty image alt text from the image file name
 *  - unwraps Google Translate proxy links and points internal links at their final URL
 *  - splits paragraphs longer than 120 words
 *  - applies the per-post edits in the plan (intro sentence, headings, reference link, typo fixes)
 *  - bumps updatedAt so `npm run seo:sync` pushes the change to a live database
 *
 * Posts whose focus keyword already matches the plan are skipped, so it is safe to re-run.
 *
 *   npx tsx scripts/seo-optimize.ts [--force]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { countWords, htmlToText } from "../src/lib/seo/analyze";

type Plan = {
  slug: string;
  newSlug?: string;
  title?: string;
  focusKeyword: string;
  seoTitle: string;
  seoDescription: string;
  coverImageAlt: string;
  tags?: string[];
  intro?: string;
  /** Appended to the end of the first paragraph */
  introSentence?: string;
  headings?: { from: string; to: string }[];
  fixes?: { find: string; replace: string }[];
  /** Paragraph inserted before the conclusion (or at the end) */
  reference?: string;
  outro?: string;
};

type SeedPost = Record<string, unknown> & { slug: string; content: string; updatedAt: string; focusKeyword?: string };

const AUDIT_DATE = "2026-11-26T12:00:00.000Z";
const force = process.argv.includes("--force");
const data = JSON.parse(readFileSync("seed/content.json", "utf8")) as {
  posts: SeedPost[];
  redirects: { source: string; destination: string }[];
  categories: unknown[];
};
const plans = JSON.parse(readFileSync("seed/seo-plan.json", "utf8")) as Plan[];
const redirectMap = new Map(data.redirects.map((r) => [r.source, r.destination]));

function humanizeFilename(src: string) {
  const file = decodeURIComponent(src.split("/").pop() ?? "")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/-\d+x\d+$/, "")
    .replace(/-e\d{9,}$/, "")
    .replace(/[-_.]+/g, " ")
    .replace(/\b(\d+)$/, "")
    .replace(/\s+/g, " ")
    .trim();
  return /^(asset|image|img|dsc)\s*\d*$/i.test(file) ? "" : file;
}

function fillAlts(html: string) {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const alt = tag.match(/\balt="([^"]*)"/i)?.[1];
    if (alt && alt.trim()) return tag;
    const src = tag.match(/\bsrc="([^"]+)"/i)?.[1] ?? "";
    const text = humanizeFilename(src).replace(/"/g, "");
    if (!text) return tag;
    return alt === undefined ? tag.replace(/<img\b/i, `<img alt="${text}"`) : tag.replace(/\balt="[^"]*"/i, `alt="${text}"`);
  });
}

function fixLinks(html: string) {
  return html
    // Links copied through Google Translate's proxy (and someone else's affiliate IDs): keep the text only
    .replace(/<a\b[^>]*href="https?:\/\/(?:translate\.google\.com|[^"/]+\.translate\.goog)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi, "$1")
    // Old slugs that now redirect: link straight to the final URL
    .replace(/href="\/([^"/#?]+)\/"/g, (m, slug: string) => {
      let dest = slug;
      for (let i = 0; i < 5 && redirectMap.has(dest); i++) dest = redirectMap.get(dest)!;
      return dest === slug ? m : `href="/${dest}/"`;
    });
}

function splitLongParagraphs(html: string) {
  return html.replace(/<p(\b[^>]*)>([\s\S]*?)<\/p>/gi, (m, attrs: string, inner: string) => {
    if (countWords(htmlToText(inner)) <= 120 || /<(div|table|ul|ol)\b/i.test(inner)) return m;
    // Split at the sentence end closest to the middle, outside of tags
    const ends = [...inner.matchAll(/[.!?](?:<\/(?:strong|em|a)>)?\s+(?=[A-Z¿¡ÁÉÍÓÚÑ<])/g)].map((x) => x.index! + x[0].length);
    const safe = ends.filter((i) => (inner.slice(0, i).match(/<a\b/g) ?? []).length === (inner.slice(0, i).match(/<\/a>/g) ?? []).length);
    if (!safe.length) return m;
    const mid = inner.length / 2;
    const cut = safe.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a));
    return `<p${attrs}>${inner.slice(0, cut).trim()}</p>\n<p>${inner.slice(cut).trim()}</p>`;
  });
}

function insertBeforeConclusion(html: string, block: string) {
  const re = /<h2\b[^>]*>\s*(?:<[^>]+>\s*)*(Conclusion|Final Thoughts|Final takeaway|Conclusión|Wrapping Up)/i;
  const m = html.match(re);
  return m ? html.slice(0, m.index) + block + "\n" + html.slice(m.index) : `${html}\n${block}`;
}

let changed = 0;
for (const plan of plans) {
  const post = data.posts.find((p) => p.slug === plan.slug || p.slug === plan.newSlug);
  if (!post) {
    console.warn(`No post with slug ${plan.slug}`);
    continue;
  }
  if (!force && post.focusKeyword === plan.focusKeyword) continue;

  let html = post.content;
  for (const f of plan.fixes ?? []) {
    if (!html.includes(f.find)) console.warn(`[${plan.slug}] fix not found: ${f.find.slice(0, 60)}`);
    html = html.split(f.find).join(f.replace);
  }
  for (const h of plan.headings ?? []) {
    const re = new RegExp(`(<h([2-6])\\b[^>]*>)\\s*${h.from}\\s*(</h\\2>)`, "i");
    if (!re.test(html)) console.warn(`[${plan.slug}] heading not found: ${h.from}`);
    html = html.replace(re, `$1${h.to}$3`);
  }
  html = fixLinks(fillAlts(html));
  html = splitLongParagraphs(html);
  if (plan.introSentence) html = html.replace(/<\/p>/i, ` ${plan.introSentence}</p>`);
  if (plan.intro) html = `${plan.intro}\n${html}`;
  if (plan.reference) html = insertBeforeConclusion(html, plan.reference);
  if (plan.outro) html = `${html}\n${plan.outro}`;

  if (plan.newSlug && plan.newSlug !== post.slug) {
    data.redirects = data.redirects.map((r) => (r.destination === post.slug ? { ...r, destination: plan.newSlug! } : r));
    data.redirects.push({ source: post.slug, destination: plan.newSlug });
    post.slug = plan.newSlug;
  }
  Object.assign(post, {
    ...(plan.title ? { title: plan.title } : {}),
    content: html,
    focusKeyword: plan.focusKeyword,
    seoTitle: plan.seoTitle,
    seoDescription: plan.seoDescription,
    coverImageAlt: plan.coverImageAlt,
    tags: plan.tags ?? [],
    updatedAt: AUDIT_DATE,
  });
  changed++;
}

writeFileSync("seed/content.json", `${JSON.stringify(data, null, 1)}\n`);
console.log(`Optimised ${changed} posts.`);

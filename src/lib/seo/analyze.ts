/**
 * Rank Math-style on-page SEO analysis.
 *
 * Pure functions with no server or browser dependencies, so the same code scores a post
 * live in the editor, on save, and in the audit script (`npm run seo:audit`).
 *
 * The checks follow Rank Math's content analysis (Basic SEO, Additional, Title Readability,
 * Content Readability). Each test has a weight and the weights add up to 100.
 * Scores: 81-100 good (green), 51-80 needs work (orange), 0-50 poor (red).
 */

export type SeoInput = {
  title: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  slug: string;
  /** Comma separated, first is the primary keyword */
  focusKeyword?: string | null;
  content: string;
  excerpt?: string | null;
  coverImage?: string | null;
  coverImageAlt?: string | null;
  lang?: string;
  siteName?: string;
  /** Focus keywords already used by other posts, lower-cased */
  otherKeywords?: string[];
};

export type SeoCheckStatus = "pass" | "warn" | "fail";

export type SeoCheck = {
  id: string;
  group: "basic" | "additional" | "title" | "readability";
  label: string;
  status: SeoCheckStatus;
  message: string;
  weight: number;
  earned: number;
};

export type SeoResult = {
  score: number;
  checks: SeoCheck[];
  stats: {
    words: number;
    keywordCount: number;
    density: number;
    internalLinks: number;
    externalLinks: number;
    externalDofollow: number;
    images: number;
    longestParagraph: number;
    titleLength: number;
    descriptionLength: number;
  };
  /** The title and description as search engines will see them */
  snippet: { title: string; description: string; url: string };
};

export const SEO_GROUPS: Record<SeoCheck["group"], string> = {
  basic: "Basic SEO",
  additional: "Additional",
  title: "Title Readability",
  readability: "Content Readability",
};

export function scoreBand(score: number): "good" | "ok" | "bad" {
  return score > 80 ? "good" : score > 50 ? "ok" : "bad";
}

/* ------------------------------------------------------------------ */
/* Text helpers                                                        */
/* ------------------------------------------------------------------ */

const ENTITIES: Record<string, string> = {
  nbsp: " ", amp: "&", quot: '"', apos: "'", lt: "<", gt: ">",
  rsquo: "'", lsquo: "'", rdquo: '"', ldquo: '"', ndash: "-", mdash: "-", hellip: "...",
};

export function decodeEntities(s: string) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

export function htmlToText(html: string) {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<\/(p|div|h[1-6]|li|td|th|tr|figcaption|summary|details|blockquote)>/gi, " \n")
      .replace(/<br\s*\/?>/gi, " \n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/ /g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

/** Lower-case and strip accents so "Escalada" matches "escalada" and "guía" matches "guia". */
export function fold(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[’‘]/g, "'");
}

export function countWords(text: string) {
  return (text.match(/[\p{L}\p{N}]+(?:['-][\p{L}\p{N}]+)*/gu) ?? []).length;
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Whole-phrase, case- and accent-insensitive match count */
export function countPhrase(text: string, phrase: string) {
  const p = fold(phrase).trim();
  if (!p) return 0;
  const pattern = p.split(/\s+/).map(escapeRe).join("[\\s-]+");
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])${pattern}(?=$|[^\\p{L}\\p{N}])`, "gu");
  return (fold(text).match(re) ?? []).length;
}

export function hasPhrase(text: string, phrase: string) {
  return countPhrase(text, phrase) > 0;
}

export function slugify(s: string) {
  return fold(s)
    .replace(/&/g, " and ")
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseKeywords(focusKeyword?: string | null) {
  return (focusKeyword ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

export function truncate(s: string, max: number) {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

/* ------------------------------------------------------------------ */
/* Word lists for title readability (English and Spanish)              */
/* ------------------------------------------------------------------ */

const POWER_WORDS = [
  // English
  "best", "ultimate", "essential", "proven", "complete", "expert", "top", "easy", "simple", "secret",
  "guide", "honest", "tested", "safe", "safest", "powerful", "perfect", "definitive", "must-have",
  "affordable", "cheap", "free", "new", "quick", "fast", "smart", "actually", "instantly", "surprising",
  "mistakes", "avoid", "warning", "insider", "reviewed", "rated", "trusted", "comfortable", "durable",
  // Spanish
  "mejor", "mejores", "guia", "completa", "completo", "definitiva", "esencial", "esenciales", "facil",
  "probados", "probado", "seguro", "seguros", "imprescindible", "comparativa", "top", "expertos",
];

const SENTIMENT_WORDS = [
  // positive
  "best", "top", "amazing", "great", "perfect", "love", "easy", "safe", "safest", "comfortable", "durable",
  "proven", "honest", "trusted", "ultimate", "winning", "favorite", "favourite", "reliable", "actually",
  // negative
  "avoid", "mistakes", "worst", "warning", "never", "stop", "danger", "dangerous", "fail", "wasting", "signs",
  // Spanish
  "mejor", "mejores", "facil", "seguro", "seguros", "evitar", "errores", "peligro", "fiable", "comodo",
];

const words = (s: string) => fold(s).match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) ?? [];

/* ------------------------------------------------------------------ */
/* Analysis                                                            */
/* ------------------------------------------------------------------ */

type Ctx = ReturnType<typeof prepare>;

function prepare(input: SeoInput) {
  const html = input.content ?? "";
  const text = htmlToText(html);
  const wordCount = countWords(text);
  const keywords = parseKeywords(input.focusKeyword);
  const primary = keywords[0] ?? "";
  const siteName = input.siteName ?? "";
  const seoTitle = (input.seoTitle?.trim() || `${input.title}${siteName ? ` | ${siteName}` : ""}`).trim();
  const descriptionSource = input.seoDescription?.trim() || input.excerpt?.trim() || text.slice(0, 300);
  const description = truncate(decodeEntities(descriptionSource).replace(/\s+/g, " "), 160);

  const headings = [...html.matchAll(/<h([2-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => htmlToText(m[2]));
  const paragraphs = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => countWords(htmlToText(m[1])));
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const alts = imgs.map((t) => decodeEntities(t.match(/\balt\s*=\s*"([^"]*)"/i)?.[1] ?? t.match(/\balt\s*=\s*'([^']*)'/i)?.[1] ?? ""));
  if (input.coverImage && input.coverImageAlt) alts.push(input.coverImageAlt);
  const videos = (html.match(/<(iframe|video)\b/gi) ?? []).length;

  const links = [...html.matchAll(/<a\b([^>]*)>/gi)].map((m) => {
    const attrs = m[1];
    const href = attrs.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1] ?? "";
    const rel = (attrs.match(/\brel\s*=\s*["']([^"']*)["']/i)?.[1] ?? "").toLowerCase();
    return { href, rel };
  });
  const isExternal = (href: string) => /^https?:\/\//i.test(href) && !/rockclimberstribe\.com/i.test(href);
  const internal = links.filter((l) => l.href && !isExternal(l.href) && !l.href.startsWith("#") && !l.href.startsWith("mailto:"));
  const external = links.filter((l) => isExternal(l.href));
  const dofollow = external.filter((l) => !/nofollow|sponsored|ugc/.test(l.rel));

  // Rank Math reads the first 10% of the content (by characters)
  const opening = text.slice(0, Math.max(200, Math.ceil(text.length * 0.1)));

  return {
    input, html, text, wordCount, keywords, primary, seoTitle, description,
    headings, paragraphs, imgs, alts, videos, internal, external, dofollow, opening,
  };
}

function check(
  id: string,
  group: SeoCheck["group"],
  label: string,
  weight: number,
  status: SeoCheckStatus,
  message: string,
  partial = 0.5,
): SeoCheck {
  const earned = status === "pass" ? weight : status === "warn" ? Math.round(weight * partial * 10) / 10 : 0;
  return { id, group, label, weight, status, message, earned };
}

function runChecks(c: Ctx): SeoCheck[] {
  const kw = c.primary;
  const none = !kw;
  const noKw = "Set a focus keyword first.";
  const out: SeoCheck[] = [];
  const keywordCount = kw ? countPhrase(c.text, kw) : 0;
  const density = c.wordCount ? (keywordCount / c.wordCount) * 100 : 0;

  /* ---------- Basic SEO ---------- */
  out.push(
    none
      ? check("kw-title", "basic", "Focus keyword in the SEO title", 8, "fail", noKw)
      : hasPhrase(c.seoTitle, kw)
        ? check("kw-title", "basic", "Focus keyword in the SEO title", 8, "pass", "The focus keyword is in the SEO title.")
        : check("kw-title", "basic", "Focus keyword in the SEO title", 8, "fail", "Add the focus keyword to the SEO title."),
  );
  out.push(
    none
      ? check("kw-desc", "basic", "Focus keyword in the meta description", 6, "fail", noKw)
      : hasPhrase(c.description, kw)
        ? check("kw-desc", "basic", "Focus keyword in the meta description", 6, "pass", "The focus keyword is in the meta description.")
        : check("kw-desc", "basic", "Focus keyword in the meta description", 6, "fail", "Use the focus keyword in the meta description."),
  );
  {
    const slug = c.input.slug ?? "";
    const kwSlug = slugify(kw);
    const allWords = kwSlug.split("-").filter((w) => w.length > 2);
    const status: SeoCheckStatus = none
      ? "fail"
      : slug.includes(kwSlug)
        ? "pass"
        : allWords.length && allWords.every((w) => slug.includes(w))
          ? "warn"
          : "fail";
    out.push(
      check("kw-url", "basic", "Focus keyword in the URL", 6, status,
        none ? noKw
          : status === "pass" ? "The focus keyword is in the URL."
            : status === "warn" ? "The URL has the keyword's words, but not as one phrase."
              : "Put the focus keyword in the URL slug."),
    );
  }
  out.push(
    none
      ? check("kw-intro", "basic", "Focus keyword at the beginning of the content", 6, "fail", noKw)
      : hasPhrase(c.opening, kw)
        ? check("kw-intro", "basic", "Focus keyword at the beginning of the content", 6, "pass", "The focus keyword appears in the first 10% of the content.")
        : check("kw-intro", "basic", "Focus keyword at the beginning of the content", 6, "fail", "Use the focus keyword in the opening paragraph (first 10%)."),
  );
  out.push(
    none
      ? check("kw-content", "basic", "Focus keyword in the content", 6, "fail", noKw)
      : keywordCount > 0
        ? check("kw-content", "basic", "Focus keyword in the content", 6, "pass", `The focus keyword appears ${keywordCount} times.`)
        : check("kw-content", "basic", "Focus keyword in the content", 6, "fail", "The focus keyword is not in the content."),
  );
  {
    const w = c.wordCount;
    const ratio = w >= 2500 ? 1 : w >= 2000 ? 0.8 : w >= 1500 ? 0.6 : w >= 1000 ? 0.4 : w >= 600 ? 0.2 : 0;
    const status: SeoCheckStatus = ratio === 1 ? "pass" : ratio > 0 ? "warn" : "fail";
    out.push(
      check("length", "basic", "Content length", 8, status,
        `The content is ${w.toLocaleString("en-US")} words long${ratio === 1 ? "." : ". Aim for 2,500+ words for in-depth guides."}`, ratio),
    );
  }

  /* ---------- Additional ---------- */
  {
    const inHeading = kw && c.headings.some((h) => hasPhrase(h, kw));
    const partial = kw && !inHeading && c.headings.some((h) => {
      const ws = slugify(kw).split("-").filter((x) => x.length > 2);
      return ws.length > 0 && ws.every((x) => fold(h).includes(x));
    });
    out.push(
      check("kw-subheading", "additional", "Focus keyword in subheadings", 6,
        none ? "fail" : inHeading ? "pass" : partial ? "warn" : "fail",
        none ? noKw : inHeading ? "The focus keyword is in an H2-H6 subheading." : "Add the focus keyword to at least one subheading (H2 or H3)."),
    );
  }
  {
    const ok = kw && c.alts.some((a) => hasPhrase(a, kw));
    const missing = c.imgs.length ? c.alts.slice(0, c.imgs.length).filter((a) => !a.trim()).length : 0;
    out.push(
      check("kw-alt", "additional", "Focus keyword in image alt text", 5,
        none ? "fail" : ok ? (missing ? "warn" : "pass") : "fail",
        none ? noKw
          : ok ? (missing ? `The keyword is in an image alt, but ${missing} image(s) have no alt text.` : "An image alt text contains the focus keyword.")
            : c.imgs.length || c.input.coverImage ? "Add the focus keyword to an image's alt text." : "Add an image with the focus keyword in its alt text.",
        0.8),
    );
  }
  {
    const d = Math.round(density * 100) / 100;
    const status: SeoCheckStatus = none ? "fail" : d >= 1 && d <= 2.5 ? "pass" : d >= 0.5 && d < 1 ? "warn" : d > 2.5 ? "fail" : "fail";
    out.push(
      check("kw-density", "additional", "Keyword density", 8, status,
        none ? noKw
          : d > 2.5 ? `Keyword density is ${d}%, which looks like keyword stuffing. Keep it under 2.5%.`
            : `Keyword density is ${d}% (${keywordCount} times).${status === "pass" ? "" : " Aim for 1-2.5%."}`,
        0.6),
    );
  }
  {
    const len = (c.input.slug ?? "").length + 1;
    out.push(
      check("url-length", "additional", "URL length", 3, len <= 75 ? "pass" : "fail",
        len <= 75 ? `The URL slug is ${len} characters.` : `The URL slug is ${len} characters. Keep it under 75.`),
    );
  }
  out.push(
    c.external.length
      ? check("links-external", "additional", "Links to external resources", 4, "pass", `${c.external.length} outbound link(s).`)
      : check("links-external", "additional", "Links to external resources", 4, "fail", "Link out to at least one useful external resource."),
  );
  out.push(
    c.dofollow.length
      ? check("links-dofollow", "additional", "DoFollow external link", 3, "pass", `${c.dofollow.length} followed outbound link(s) to reference sources.`)
      : check("links-dofollow", "additional", "DoFollow external link", 3, "fail",
        c.external.length ? "All outbound links are nofollow/sponsored. Add a followed link to an authoritative source." : "Add a followed link to an authoritative source."),
  );
  out.push(
    c.internal.length
      ? check("links-internal", "additional", "Internal links", 5, "pass", `${c.internal.length} internal link(s).`)
      : check("links-internal", "additional", "Internal links", 5, "fail", "Link to at least one other post or page on this site."),
  );
  {
    const used = !none && (c.input.otherKeywords ?? []).includes(fold(kw));
    out.push(
      check("kw-unique", "additional", "Focus keyword not used before", 3, none ? "fail" : used ? "fail" : "pass",
        none ? noKw : used ? "Another post already targets this focus keyword." : "You haven't used this focus keyword before."),
    );
  }

  /* ---------- Title readability ---------- */
  {
    const t = fold(c.seoTitle);
    const idx = kw ? t.indexOf(fold(kw)) : -1;
    const ok = idx >= 0 && idx <= t.length / 2;
    out.push(
      check("title-start", "title", "Focus keyword near the start of the SEO title", 3, none ? "fail" : ok ? "pass" : "fail",
        none ? noKw : ok ? "The focus keyword is in the first half of the SEO title." : "Move the focus keyword closer to the start of the SEO title."),
    );
  }
  {
    const ws = words(c.seoTitle);
    out.push(
      check("title-sentiment", "title", "Sentiment in the title", 2, ws.some((w) => SENTIMENT_WORDS.includes(w)) ? "pass" : "fail",
        ws.some((w) => SENTIMENT_WORDS.includes(w)) ? "The title carries a positive or negative sentiment." : "Add a word with sentiment (e.g. best, safe, avoid) to the title."),
    );
    out.push(
      check("title-power", "title", "Power word in the title", 2, ws.some((w) => POWER_WORDS.includes(w)) ? "pass" : "fail",
        ws.some((w) => POWER_WORDS.includes(w)) ? "The title contains a power word." : "Add a power word (e.g. best, ultimate, proven) to the title."),
    );
    out.push(
      check("title-number", "title", "Number in the title", 2, /\d/.test(c.seoTitle) ? "pass" : "fail",
        /\d/.test(c.seoTitle) ? "The title contains a number." : "Titles with a number (e.g. 7 Best…, 2026) tend to get more clicks."),
    );
  }
  {
    const l = c.seoTitle.length;
    const dl = c.description.length;
    out.push(
      check("title-length", "title", "SEO title length", 3, l >= 30 && l <= 60 ? "pass" : l > 0 && l <= 70 ? "warn" : "fail",
        `The SEO title is ${l} characters. ${l > 60 ? "Google cuts titles after ~60." : l < 30 ? "It's short; use 30-60." : "Good length."}`),
    );
    const hasCustom = !!c.input.seoDescription?.trim();
    out.push(
      check("desc-length", "title", "Meta description length", 3,
        hasCustom && dl >= 120 && dl <= 160 ? "pass" : hasCustom && dl >= 80 ? "warn" : "fail",
        !hasCustom ? "Write a custom meta description (120-160 characters)." : `The meta description is ${dl} characters${dl >= 120 && dl <= 160 ? "." : ". Aim for 120-160."}`),
    );
  }

  /* ---------- Content readability ---------- */
  out.push(
    c.headings.length >= 3
      ? check("toc", "readability", "Table of contents", 2, "pass", "Enough subheadings for the automatic table of contents.")
      : check("toc", "readability", "Table of contents", 2, "fail", "Use at least 3 subheadings so the post gets a table of contents."),
  );
  {
    const longest = c.paragraphs.length ? Math.max(...c.paragraphs) : 0;
    out.push(
      check("short-paragraphs", "readability", "Short paragraphs", 3, longest <= 120 ? "pass" : "fail",
        longest <= 120 ? "Paragraphs are short and easy to read." : `The longest paragraph is ${longest} words. Keep paragraphs under 120 words.`),
    );
  }
  {
    const media = c.imgs.length + c.videos + (c.input.coverImage ? 1 : 0);
    out.push(
      check("media", "readability", "Images and video", 3, media >= 1 ? "pass" : "fail",
        media >= 1 ? `The post has ${media} image(s) or video(s).` : "Add images or a video to the content."),
    );
  }

  return out;
}

export function analyzeSeo(input: SeoInput): SeoResult {
  const c = prepare(input);
  const checks = runChecks(c);
  const total = checks.reduce((s, x) => s + x.weight, 0);
  const earned = checks.reduce((s, x) => s + x.earned, 0);
  const keywordCount = c.primary ? countPhrase(c.text, c.primary) : 0;
  return {
    score: Math.round((earned / total) * 100),
    checks,
    stats: {
      words: c.wordCount,
      keywordCount,
      density: c.wordCount ? Math.round((keywordCount / c.wordCount) * 10000) / 100 : 0,
      internalLinks: c.internal.length,
      externalLinks: c.external.length,
      externalDofollow: c.dofollow.length,
      images: c.imgs.length,
      longestParagraph: c.paragraphs.length ? Math.max(...c.paragraphs) : 0,
      titleLength: c.seoTitle.length,
      descriptionLength: c.description.length,
    },
    snippet: { title: c.seoTitle, description: c.description, url: `/${input.slug}/` },
  };
}

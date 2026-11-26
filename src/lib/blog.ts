/** Presentation helpers for the blog, safe to use in server and client components. */

export type PostKind = "review" | "guide";

/** Roundups and "best of" lists are reviews; everything else is a how-to guide. */
export function postKind(title: string): PostKind {
  return /\b(best|top|mejores|vs\.?)\b|reviewed/i.test(title) ? "review" : "guide";
}

export function kindLabel(kind: PostKind, lang = "en") {
  if (lang === "es") return kind === "review" ? "Reseña" : "Guía";
  return kind === "review" ? "Gear review" : "Guide";
}

export const CATEGORY_LABELS: Record<string, string> = {
  "outdoor-climbers": "Outdoor",
  "indoor-climbers-2": "Indoor",
  "climbing-gear": "Gear guides",
  spanish: "Español",
};

export function categoryLabel(slug: string, fallback?: string) {
  return CATEGORY_LABELS[slug] ?? fallback ?? slug;
}

export function readingLabel(minutes: number, lang = "en") {
  return lang === "es" ? `${minutes} min de lectura` : `${minutes} min read`;
}

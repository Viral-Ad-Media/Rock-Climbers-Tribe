import { analyzeSeo, fold, parseKeywords, type SeoInput } from "./analyze";
import { site } from "../site";

/** Scores a post for storage (list tables, dashboard). `others` = primary keywords of the other posts. */
export function computeSeoScore(post: SeoInput, others: string[]) {
  const primary = fold(parseKeywords(post.focusKeyword)[0] ?? "");
  return analyzeSeo({ ...post, siteName: site.name, otherKeywords: others.filter((k) => k && k === primary) }).score;
}

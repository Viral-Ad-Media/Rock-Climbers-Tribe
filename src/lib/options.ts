import "server-only";
import { inArray } from "drizzle-orm";
import { cache } from "react";
import { db, schema } from "@/db";
import { site } from "./site";

/** Site settings with their defaults (like wp_options). */
export const OPTION_DEFAULTS = {
  blogname: site.name,
  blogdescription: site.tagline,
  site_description: site.description,
  blog_public: "1",
  default_comment_status: "open",
  comment_moderation: "1",
  require_name_email: "1",
  comment_registration: "0",
  seo_separator: "|",
  seo_home_title: "",
  seo_home_description: "",
  seo_default_og_image: "",
  seo_org_name: site.name,
  seo_org_logo: "/wp-content/uploads/2023/02/Rock-CLimbers-01.png",
  seo_default_schema: "BlogPosting",
  seo_noindex_empty_archives: "1",
  seo_noindex_tags: "0",
  seo_twitter_username: "",
  seo_facebook_url: "",
  toc_enabled_posts: "1",
  toc_enabled_pages: "0",
  toc_min_headings: "3",
  toc_title: "Table of Contents",
  toc_title_es: "En este artículo",
  affiliate_new_tab: "1",
  affiliate_button_text: "Check Price",
} as const;

export type OptionKey = keyof typeof OPTION_DEFAULTS;
export type Options = Record<OptionKey, string>;

export const getOptions = cache(async (): Promise<Options> => {
  const out: Options = { ...OPTION_DEFAULTS };
  try {
    const rows = await db.select().from(schema.option);
    for (const r of rows) if (r.key in out) out[r.key as OptionKey] = r.value;
  } catch {
    // The option table may not exist yet during the first build; fall back to defaults
  }
  return out;
});

export async function setOptions(values: Partial<Options>) {
  const entries = Object.entries(values).filter(([k]) => k in OPTION_DEFAULTS) as [OptionKey, string][];
  if (!entries.length) return;
  for (const [key, value] of entries) {
    await db.insert(schema.option).values({ key, value }).onConflictDoUpdate({ target: schema.option.key, set: { value } });
  }
}

export async function deleteOptions(keys: OptionKey[]) {
  if (keys.length) await db.delete(schema.option).where(inArray(schema.option.key, keys));
}

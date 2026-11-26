import type { Product } from "@/db/schema";

/**
 * Affiliate product boxes. Posts reference products with WordPress-style shortcodes:
 *   [product id="slug"]                 one product box
 *   [products ids="slug-a,slug-b"]      a comparison table
 * The visitor is sent through /go/{slug}/ so clicks are counted and the real URL can change in one place.
 */

const SHORTCODE = /(?:<p>\s*)?\[(product|products)\s+(?:id|ids)\s*=\s*(?:"|&quot;|“|”)([^"\]&“”]+)(?:"|&quot;|“|”)\s*\](?:\s*<\/p>)?/gi;

export function extractProductSlugs(html: string): string[] {
  const out = new Set<string>();
  for (const m of html.matchAll(SHORTCODE)) for (const s of m[2].split(",")) if (s.trim()) out.add(s.trim());
  return [...out];
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const lines = (s: string | null) => (s ?? "").split("\n").map((l) => l.trim()).filter(Boolean);

/** How a product box looks. Saved site-wide in Settings > Affiliate Links, and optionally per product. */
export type BoxDesign = {
  /** side: image beside the text; stacked: image on top; compact: small image, short row */
  layout: "side" | "stacked" | "compact";
  imagePosition: "left" | "right";
  imageSize: "small" | "medium" | "large";
  /** Clicking the image goes to the product link */
  imageLink: boolean;
  accent: string;
  badgeColor: string;
  background: string;
  buttonStyle: "pill" | "rounded" | "square";
  buttonFullWidth: boolean;
  border: "subtle" | "accent" | "none";
  shadow: boolean;
  showRating: boolean;
  showDescription: boolean;
  showProsCons: boolean;
  showPrice: boolean;
  showMerchant: boolean;
};

export const DEFAULT_BOX_DESIGN: BoxDesign = {
  layout: "side",
  imagePosition: "left",
  imageSize: "medium",
  imageLink: true,
  accent: "#d9622b",
  badgeColor: "#d9622b",
  background: "#ffffff",
  buttonStyle: "pill",
  buttonFullWidth: false,
  border: "subtle",
  shadow: true,
  showRating: true,
  showDescription: true,
  showProsCons: true,
  showPrice: true,
  showMerchant: true,
};

const HEX = /^#[0-9a-f]{6}$/i;
const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);
const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);
const color = (v: unknown, fallback: string) => (typeof v === "string" && HEX.test(v) ? v.toLowerCase() : fallback);

/** Reads a saved design (JSON text or object) and fills anything missing or invalid from `base` */
export function parseBoxDesign(raw: unknown, base: BoxDesign = DEFAULT_BOX_DESIGN): BoxDesign {
  let d: Record<string, unknown> = {};
  if (typeof raw === "string" && raw.trim()) {
    try {
      d = JSON.parse(raw);
    } catch {
      d = {};
    }
  } else if (raw && typeof raw === "object") d = raw as Record<string, unknown>;
  return {
    layout: pick(d.layout, ["side", "stacked", "compact"] as const, base.layout),
    imagePosition: pick(d.imagePosition, ["left", "right"] as const, base.imagePosition),
    imageSize: pick(d.imageSize, ["small", "medium", "large"] as const, base.imageSize),
    imageLink: bool(d.imageLink, base.imageLink),
    accent: color(d.accent, base.accent),
    badgeColor: color(d.badgeColor, base.badgeColor),
    background: color(d.background, base.background),
    buttonStyle: pick(d.buttonStyle, ["pill", "rounded", "square"] as const, base.buttonStyle),
    buttonFullWidth: bool(d.buttonFullWidth, base.buttonFullWidth),
    border: pick(d.border, ["subtle", "accent", "none"] as const, base.border),
    shadow: bool(d.shadow, base.shadow),
    showRating: bool(d.showRating, base.showRating),
    showDescription: bool(d.showDescription, base.showDescription),
    showProsCons: bool(d.showProsCons, base.showProsCons),
    showPrice: bool(d.showPrice, base.showPrice),
    showMerchant: bool(d.showMerchant, base.showMerchant),
  };
}

const IMAGE_PX = { small: 120, medium: 180, large: 240 } as const;

function designAttrs(d: BoxDesign) {
  const cls = [
    `pbox--${d.layout}`,
    d.layout !== "stacked" && d.imagePosition === "right" ? "pbox--img-right" : "",
    `pbox--btn-${d.buttonStyle}`,
    d.buttonFullWidth ? "pbox--btn-full" : "",
    `pbox--border-${d.border}`,
    d.shadow ? "pbox--shadow" : "",
  ].filter(Boolean);
  const size = d.layout === "compact" ? Math.round(IMAGE_PX[d.imageSize] * 0.6) : IMAGE_PX[d.imageSize];
  const style = `--pbox-accent:${d.accent};--pbox-badge:${d.badgeColor};--pbox-bg:${d.background};--pbox-img:${size}px`;
  return { cls: cls.join(" "), style };
}

export type ProductRenderOptions = { newTab: boolean; buttonText: string; lang?: string; design?: BoxDesign };

function linkAttrs(p: Pick<Product, "slug">, o: ProductRenderOptions) {
  return `href="/go/${esc(p.slug)}/" rel="sponsored nofollow noopener"${o.newTab ? ' target="_blank"' : ""}`;
}

function stars(rating: string | null) {
  const r = Math.max(0, Math.min(5, Number(rating)));
  if (!rating || Number.isNaN(r)) return "";
  return `<span class="pbox-stars" aria-label="Rated ${r} out of 5"><span class="pbox-stars-bg" aria-hidden="true">★★★★★<span class="pbox-stars-fg" style="width:${(r / 5) * 100}%">★★★★★</span></span><span>${r.toFixed(1)}</span></span>`;
}

export function productBoxHtml(p: Product, o: ProductRenderOptions) {
  const es = o.lang === "es";
  const d = parseBoxDesign(p.design, o.design ?? DEFAULT_BOX_DESIGN);
  const { cls, style } = designAttrs(d);
  const pros = d.showProsCons ? lines(p.pros) : [];
  const cons = d.showProsCons ? lines(p.cons) : [];
  const button = esc(p.buttonText || o.buttonText);
  const img = p.image ? `<img src="${esc(p.image)}" alt="${esc(p.imageAlt || p.name)}" loading="lazy">` : "";
  return `<div class="pbox not-prose ${cls}" style="${style}">${p.badge ? `<span class="pbox-badge">${esc(p.badge)}</span>` : ""}<div class="pbox-main">${
    img ? (d.imageLink ? `<a ${linkAttrs(p, o)} class="pbox-img" aria-label="${esc(p.name)}">${img}</a>` : `<div class="pbox-img">${img}</div>`) : ""
  }<div class="pbox-body"><p class="pbox-name"><a ${linkAttrs(p, o)}>${esc(p.name)}</a></p>${d.showRating ? stars(p.rating) : ""}${
    d.showDescription && p.description ? `<p class="pbox-desc">${esc(p.description)}</p>` : ""
  }${
    pros.length || cons.length
      ? `<div class="pbox-pc">${pros.length ? `<div><p class="pbox-pc-h">Pros</p><ul class="pbox-pros">${pros.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}${
          cons.length ? `<div><p class="pbox-pc-h">${es ? "Contras" : "Cons"}</p><ul class="pbox-cons">${cons.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""
        }</div>`
      : ""
  }<div class="pbox-cta">${d.showPrice && p.price ? `<span class="pbox-price">${esc(p.price)}</span>` : ""}<a ${linkAttrs(p, o)} class="pbox-btn">${button}${
    d.showMerchant && p.merchant ? ` <span>${es ? "en" : "at"} ${esc(p.merchant)}</span>` : ""
  }</a></div></div></div></div>`;
}

export function productTableHtml(items: Product[], o: ProductRenderOptions) {
  const es = o.lang === "es";
  const rows = items
    .map(
      (p) =>
        `<tr><td class="pt-prod"><div class="pt-prod-in">${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.imageAlt || p.name)}" loading="lazy">` : ""}<div>${
          p.badge ? `<span class="pbox-badge">${esc(p.badge)}</span>` : ""
        }<a ${linkAttrs(p, o)}>${esc(p.name)}</a></div></div></td><td class="pt-rating">${stars(p.rating) || "—"}</td><td class="pt-price">${p.price ? esc(p.price) : "—"}</td><td class="pt-cta"><a ${linkAttrs(p, o)} class="pbox-btn">${esc(
          p.buttonText || o.buttonText,
        )}</a></td></tr>`,
    )
    .join("");
  const { cls, style } = designAttrs(o.design ?? DEFAULT_BOX_DESIGN);
  return `<div class="ptable not-prose ${cls}" style="${style}"><table><thead><tr><th>${es ? "Producto" : "Product"}</th><th>${es ? "Valoración" : "Rating"}</th><th>${es ? "Precio" : "Price"}</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

/** Replaces product shortcodes with boxes. Unknown slugs are dropped so a deleted product never shows raw shortcode text. */
export function renderProductShortcodes(html: string, products: Product[], o: ProductRenderOptions) {
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  return html.replace(SHORTCODE, (_m, kind: string, ids: string) => {
    const items = ids.split(",").map((s) => bySlug.get(s.trim())).filter((p): p is Product => !!p);
    if (!items.length) return "";
    return kind.toLowerCase() === "products" ? productTableHtml(items, o) : productBoxHtml(items[0], o);
  });
}

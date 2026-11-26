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

export type ProductRenderOptions = { newTab: boolean; buttonText: string; lang?: string };

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
  const pros = lines(p.pros);
  const cons = lines(p.cons);
  const button = esc(p.buttonText || o.buttonText);
  return `<div class="pbox not-prose">${p.badge ? `<span class="pbox-badge">${esc(p.badge)}</span>` : ""}<div class="pbox-main">${
    p.image ? `<a ${linkAttrs(p, o)} class="pbox-img"><img src="${esc(p.image)}" alt="${esc(p.imageAlt || p.name)}" loading="lazy"></a>` : ""
  }<div class="pbox-body"><p class="pbox-name"><a ${linkAttrs(p, o)}>${esc(p.name)}</a></p>${stars(p.rating)}${
    p.description ? `<p class="pbox-desc">${esc(p.description)}</p>` : ""
  }${
    pros.length || cons.length
      ? `<div class="pbox-pc">${pros.length ? `<div><p class="pbox-pc-h">${es ? "Pros" : "Pros"}</p><ul class="pbox-pros">${pros.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}${
          cons.length ? `<div><p class="pbox-pc-h">${es ? "Contras" : "Cons"}</p><ul class="pbox-cons">${cons.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""
        }</div>`
      : ""
  }<div class="pbox-cta">${p.price ? `<span class="pbox-price">${esc(p.price)}</span>` : ""}<a ${linkAttrs(p, o)} class="pbox-btn">${button}${
    p.merchant ? ` <span>${es ? "en" : "at"} ${esc(p.merchant)}</span>` : ""
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
  return `<div class="ptable not-prose"><table><thead><tr><th>${es ? "Producto" : "Product"}</th><th>${es ? "Valoración" : "Rating"}</th><th>${es ? "Precio" : "Price"}</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
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

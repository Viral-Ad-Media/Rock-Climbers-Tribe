/**
 * Converts Elementor's `_elementor_data` JSON into plain semantic HTML.
 * Only the widgets the old site actually used are handled; anything else is skipped.
 */

type Settings = Record<string, unknown>;
type El = {
  elType: string;
  widgetType?: string;
  isInner?: boolean;
  settings?: Settings | unknown[];
  elements?: El[];
};

export type RenderContext = {
  /** Renders a TablePress table by its TablePress id */
  table: (id: string) => string;
  /** Collects the "by …" author name found in the byline shortcode */
  onAuthor?: (name: string) => void;
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const settingsOf = (e: El): Settings =>
  e.settings && !Array.isArray(e.settings) ? (e.settings as Settings) : {};

const linkOf = (s: Settings, key = "link"): string | undefined => {
  const l = s[key] as { url?: string } | undefined;
  const url = l?.url?.trim();
  return url ? url : undefined;
};

const stripTags = (s: string) => s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

const slugify = (s: string) =>
  stripTags(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

/** Placeholder text copied from a tent-review template that never got filled in */
const TEMPLATE_JUNK = /^Brand:\s*Eureka!/i;
const SHORTCODE_ONLY = /^\s*\[[^\]]+\]\s*$/;

function renderShortcodes(text: string, ctx: RenderContext): string {
  return text.replace(/\[table id=["']?(\d+)["']?\s*\/?\]/g, (_m, id: string) => ctx.table(id)).replace(/\[[a-z][\w-]*[^\]]*\]/gi, "");
}

function widget(e: El, ctx: RenderContext, state: { seenTitle: boolean }): string {
  const s = settingsOf(e);
  switch (e.widgetType) {
    case "heading": {
      const title = String(s.title ?? "").trim();
      if (!title || TEMPLATE_JUNK.test(stripTags(title))) return "";
      if (SHORTCODE_ONLY.test(title)) return "";
      const size = String(s.header_size ?? "h2");
      // The first big heading duplicates the post title, which the page renders itself
      if (!state.seenTitle && (size === "span" || size === "h1")) {
        state.seenTitle = true;
        return "";
      }
      state.seenTitle = true;
      const href = linkOf(s);
      const plain = stripTags(title);
      // Whole intro paragraphs were set as linked H2s on the old site; render them as text
      if (plain.length > 140) return `<p class="lead">${title}</p>`;
      if (/^h[2-6]$/.test(size)) {
        const level = size === "h1" ? "h2" : size;
        const inner = href && !/^https?:\/\/(www\.)?rockclimberstribe\.com\/?$/.test(href)
          ? `<a href="${esc(href)}">${title}</a>`
          : title;
        return `<${level} id="${slugify(title)}">${inner}</${level}>`;
      }
      if (/^\$\s?\d/.test(plain)) {
        return `<p class="price">${href ? `<a href="${esc(href)}">${title}</a>` : title}</p>`;
      }
      if (/^(pros|cons|ventajas|desventajas)$/i.test(plain)) return `<p class="label"><strong>${title}</strong></p>`;
      return `<p><strong>${href ? `<a href="${esc(href)}">${title}</a>` : title}</strong></p>`;
    }
    case "text-editor": {
      const html = String(s.editor ?? "");
      const plain = stripTags(html);
      if (!plain && !/<img/i.test(html)) return "";
      if (/^(sale|oferta)$/i.test(plain) || /^bestseller no\.\s*\d+$/i.test(plain)) return "";
      return renderShortcodes(html, ctx);
    }
    case "image": {
      const img = s.image as { url?: string; alt?: string } | undefined;
      if (!img?.url) return "";
      const href = s.link_to === "custom" ? linkOf(s) : undefined;
      const alt = esc(img.alt || stripTags(String(s.caption ?? "")) || "");
      const tag = `<img src="${esc(img.url)}" alt="${alt}" />`;
      return `<figure>${href ? `<a href="${esc(href)}">${tag}</a>` : tag}</figure>`;
    }
    case "button": {
      const href = linkOf(s);
      const text = String(s.text ?? "").trim();
      if (!href || !text) return "";
      return `<p class="cta"><a class="btn" href="${esc(href)}">${esc(text)}</a></p>`;
    }
    case "icon-list": {
      const items = (s.icon_list as { text?: string; link?: { url?: string } }[] | undefined) ?? [];
      const li = items
        .map((it) => {
          const text = String(it.text ?? "").trim();
          if (!text) return "";
          const url = it.link?.url?.trim();
          return `<li>${url ? `<a href="${esc(url)}">${text}</a>` : text}</li>`;
        })
        .join("");
      return li ? `<ul>${li}</ul>` : "";
    }
    case "shortcode": {
      const code = String(s.shortcode ?? "");
      const by = /by\s+([^|\[]+?)\s*\|/i.exec(code);
      if (by && ctx.onAuthor) ctx.onAuthor(by[1].trim());
      if (/wpdts|ivory-search/.test(code)) return "";
      return renderShortcodes(code, ctx);
    }
    case "accordion":
    case "toggle": {
      const tabs = (s.tabs as { tab_title?: string; tab_content?: string }[] | undefined) ?? [];
      return tabs
        .filter((t) => t.tab_title?.trim())
        .map((t) => `<details><summary>${t.tab_title}</summary>${renderShortcodes(t.tab_content ?? "", ctx)}</details>`)
        .join("");
    }
    case "video": {
      const yt = String(s.youtube_url ?? "");
      const id = /(?:v=|youtu\.be\/|embed\/)([\w-]{11})/.exec(yt)?.[1];
      return id
        ? `<figure class="video"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="Video" allowfullscreen loading="lazy"></iframe></figure>`
        : "";
    }
    default:
      // Social share buttons, search forms, etc. are rebuilt by the new site or dropped
      return "";
  }
}

function render(elements: El[], ctx: RenderContext, state: { seenTitle: boolean }): string {
  return elements
    .map((e) => {
      if (e.elType === "widget") return widget(e, ctx, state);
      const children = e.elements ?? [];
      if (e.elType === "section" || e.elType === "container") {
        const cols = children.filter((c) => c.elType === "column");
        if (!e.isInner && cols.length > 1) {
          // Top-level layout: keep the main column, drop the narrow sidebar column
          // (it only repeated the product picks already in the article)
          const sizes = cols.map((c) => Number(settingsOf(c)._column_size ?? 100 / cols.length));
          const main = cols[sizes.indexOf(Math.max(...sizes))];
          if (Math.max(...sizes) >= 60) return render(main.elements ?? [], ctx, state);
        }
        if (cols.length > 1) {
          const inner = cols
            .map((c) => render(c.elements ?? [], ctx, state))
            .filter((h) => h.trim())
            .map((h) => `<div class="wp-col">${h}</div>`);
          if (inner.length > 1) return `<div class="wp-cols">${inner.join("")}</div>`;
          return inner.join("");
        }
        return render(children, ctx, state);
      }
      return render(children, ctx, state);
    })
    .join("\n");
}

export function elementorToHtml(json: string, ctx: RenderContext): string {
  const data = JSON.parse(json) as El[];
  return render(data, ctx, { seenTitle: false });
}

import sanitizeHtml from "sanitize-html";

const SITE_HOSTS = ["rockclimberstribe.com", "www.rockclimberstribe.com"];
const AFFILIATE_HOSTS = ["amzn.to", "amazon.com", "www.amazon.com"];

function hostOf(href: string) {
  try {
    return new URL(href).hostname;
  } catch {
    return null;
  }
}

/** Turns absolute links to the old site into relative ones so they keep working on any domain. */
export function relativiseSiteUrls(html: string) {
  return html.replace(
    /https?:\/\/(?:www\.)?rockclimberstribe\.com(\/[^"'\s<>]*)?/g,
    (_m, path: string | undefined) => path || "/",
  );
}

/**
 * Cleans article HTML for safe rendering. Used both when importing from WordPress
 * and when an admin saves a post, so only this allow-list ever reaches the page.
 */
export function sanitizeArticleHtml(dirty: string): string {
  return sanitizeHtml(relativiseSiteUrls(dirty), {
    allowedTags: [
      "h2", "h3", "h4", "h5", "h6", "p", "br", "hr",
      "a", "strong", "b", "em", "i", "u", "s", "sup", "sub", "mark", "code", "pre",
      "ul", "ol", "li", "blockquote",
      "figure", "figcaption", "img",
      "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
      "details", "summary", "div", "iframe",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel", "id", "class"],
      img: ["src", "alt", "width", "height", "loading"],
      iframe: ["src", "title", "allow", "allowfullscreen", "loading"],
      th: ["colspan", "rowspan", "scope"],
      td: ["colspan", "rowspan"],
      h2: ["id"], h3: ["id"], h4: ["id"], h5: ["id"], h6: ["id"],
      div: ["class"],
      p: ["class"],
      ul: ["class"],
      figure: ["class"],
    },
    allowedClasses: {
      div: ["wp-cols", "wp-col", "product-card", "table-wrap"],
      p: ["lead", "cta", "price", "label"],
      a: ["btn"],
      ul: ["pros", "cons", "plain"],
      figure: ["video"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedIframeHostnames: ["www.youtube-nocookie.com", "www.youtube.com", "player.vimeo.com"],
    transformTags: {
      b: "strong",
      i: "em",
      a: (tagName, attribs) => {
        const host = attribs.href ? hostOf(attribs.href) : null;
        if (host && !SITE_HOSTS.includes(host)) {
          const affiliate = AFFILIATE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
          return {
            tagName,
            attribs: {
              ...attribs,
              target: "_blank",
              rel: affiliate ? "sponsored nofollow noopener" : "noopener",
            },
          };
        }
        return { tagName, attribs: { ...attribs, target: "", rel: "" } };
      },
      img: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, loading: "lazy" },
      }),
    },
    nonTextTags: ["style", "script", "textarea", "option", "noscript"],
  })
    .replace(/\s(target|rel)=""/g, "")
    // Drop empty paragraphs and inline wrappers left behind by page-builder markup
    .replace(/<(p|strong|em)>(?:\s|&nbsp;|<br \/>)*<\/\1>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

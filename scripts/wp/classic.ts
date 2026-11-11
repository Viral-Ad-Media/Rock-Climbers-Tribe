/**
 * Cleans WordPress post_content (block editor or classic editor) into HTML.
 */

const BLOCK =
  "table|thead|tfoot|caption|col|colgroup|tbody|tr|td|th|div|dl|dd|dt|ul|ol|li|pre|form|map|area|blockquote|address|math|style|p|h[1-6]|hr|fieldset|legend|section|article|aside|hgroup|header|footer|nav|figure|figcaption|details|menu|summary";

/** A small port of WordPress's wpautop(): wraps loose text blocks in <p> tags. */
export function wpautop(text: string): string {
  if (!text.trim()) return "";
  let pee = text.replace(/\r\n|\r/g, "\n");
  pee = pee.replace(new RegExp(`(<(?:${BLOCK})[\\s/>])`, "gi"), "\n\n$1");
  pee = pee.replace(new RegExp(`(</(?:${BLOCK})>)`, "gi"), "$1\n\n");
  pee = pee.replace(/\n\s*\n+/g, "\n\n");
  return pee
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) =>
      new RegExp(`^</?(?:${BLOCK})[\\s/>]`, "i").test(chunk)
        ? chunk
        : `<p>${chunk.replace(/\n/g, "<br />\n")}</p>`,
    )
    .join("\n");
}

export function cleanPostContent(
  raw: string,
  opts: { title: string; table: (id: string) => string; onAuthor?: (name: string) => void },
): string {
  let html = raw.replace(/<!--\s*\/?wp:[\s\S]*?-->/g, "");

  // Byline left over from the Elementor fallback text: "by Name | Last updated on [wpdts…]"
  html = html.replace(/^\s*by\s+([^|\n<]+?)\s*\|\s*Last updated on[^\n]*$/im, (_m, name: string) => {
    opts.onAuthor?.(name.trim());
    return "";
  });
  // Empty social-share buttons from the old theme
  html = html.replace(/<ul>\s*(?:<li data-social[\s\S]*?<\/li>\s*)+<\/ul>/g, "");
  // The title repeated as a plain line at the top
  const title = opts.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  html = html.replace(new RegExp(`^\\s*${title}\\s*$`, "im"), "");

  html = html
    .replace(/\[table id=["']?(\d+)["']?\s*\/?\]/g, (_m, id: string) => opts.table(id))
    .replace(/\[[a-z][\w-]*[^\]]*\]/gi, "");

  return wpautop(html);
}

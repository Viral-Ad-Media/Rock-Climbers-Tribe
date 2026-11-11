export type TocItem = { id: string; text: string };

const decode = (s: string) =>
  s
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&rsquo;|&#8217;/g, "’")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "section";

/** Makes sure every <h2> has a unique id and returns the list for a table of contents. */
export function withHeadingIds(html: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const used = new Set<string>();
  const out = html.replace(/<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/g, (_m, attrs: string | undefined, inner: string) => {
    const text = decode(inner);
    let id = /\sid="([^"]+)"/.exec(attrs ?? "")?.[1] ?? slugify(text);
    let n = 2;
    const base = id;
    while (used.has(id)) id = `${base}-${n++}`;
    used.add(id);
    if (text) toc.push({ id, text });
    const rest = (attrs ?? "").replace(/\sid="[^"]*"/, "");
    return `<h2 id="${id}"${rest}>${inner}</h2>`;
  });
  return { html: out, toc };
}

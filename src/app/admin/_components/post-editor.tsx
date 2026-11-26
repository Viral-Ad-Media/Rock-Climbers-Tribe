"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { analyzeSeo, countWords, htmlToText } from "@/lib/seo/analyze";
import { withHeadingIds } from "@/lib/toc";
import { addCategoryInline, postRowAction, savePost, type SaveState } from "../actions";
import type { MediaItem } from "../media/actions";
import { Icons } from "./icons";
import { MediaModal } from "./media-modal";
import { ProductModal } from "./product-modal";
import { SeoBox, type SeoFields } from "./seo-box";

export type EditorPost = {
  id?: number;
  type: "post" | "page";
  title: string;
  slug: string;
  status: string;
  lang: string;
  excerpt: string;
  content: string;
  coverImage: string;
  coverImageAlt: string;
  author: string;
  seoTitle: string;
  seoDescription: string;
  focusKeyword: string;
  canonicalUrl: string;
  robotsNoindex: boolean;
  schemaType: string;
  commentStatus: string;
  showToc: boolean;
  publishedAt: string | null;
  updatedAt: string | null;
};

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

/* ------------------------------------------------------------------ */
/* Classic editor: Visual / Text tabs                                  */
/* ------------------------------------------------------------------ */

function ClassicEditor({
  value,
  onChange,
  onAddMedia,
  onAddProduct,
}: {
  value: string;
  onChange: (v: string) => void;
  onAddMedia: (insert: (html: string) => void) => void;
  onAddProduct: (insert: (html: string) => void) => void;
}) {
  const [mode, setMode] = useState<"visual" | "text">("visual");
  const visual = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLTextAreaElement>(null);
  const savedRange = useRef<Range | null>(null);

  // Only push HTML into the contentEditable when switching to it, so the caret doesn't jump while typing
  useEffect(() => {
    if (mode === "visual" && visual.current && visual.current.innerHTML !== value) visual.current.innerHTML = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const exec = (cmd: string, arg?: string) => {
    visual.current?.focus();
    document.execCommand(cmd, false, arg);
    if (visual.current) onChange(visual.current.innerHTML);
  };
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && visual.current?.contains(sel.anchorNode)) savedRange.current = sel.getRangeAt(0).cloneRange();
  };
  /** Inserts block HTML (like a product shortcode paragraph) after the paragraph holding the caret, never inside it */
  const insertBlock = (html: string) => {
    const root = visual.current;
    if (mode !== "visual" || !root) return insertHtml(`\n${html}\n`);
    const range = savedRange.current;
    // Caret between blocks (container is the editor itself): insert after the block before it
    let node: Node | null = range ? (range.startContainer === root ? root.childNodes[range.startOffset - 1] ?? null : range.startContainer) : null;
    while (node && node.parentNode !== root) node = node.parentNode;
    const tpl = document.createElement("template");
    tpl.innerHTML = html;
    const last = tpl.content.lastChild;
    if (node && node.parentNode === root) root.insertBefore(tpl.content, node.nextSibling);
    else root.appendChild(tpl.content);
    if (last) {
      const r = document.createRange();
      r.setStartAfter(last);
      r.collapse(true);
      savedRange.current = r;
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(r.cloneRange());
    }
    onChange(root.innerHTML);
  };
  const insertHtml = (html: string) => {
    if (mode === "visual" && visual.current) {
      visual.current.focus();
      const sel = window.getSelection();
      if (savedRange.current && sel) {
        sel.removeAllRanges();
        sel.addRange(savedRange.current);
      }
      document.execCommand("insertHTML", false, html);
      onChange(visual.current.innerHTML);
    } else if (text.current) {
      const t = text.current;
      const next = t.value.slice(0, t.selectionStart) + html + t.value.slice(t.selectionEnd);
      onChange(next);
    }
  };
  const wrapText = (open: string, close: string) => {
    const t = text.current;
    if (!t) return;
    const { selectionStart: a, selectionEnd: b, value: v } = t;
    onChange(v.slice(0, a) + open + v.slice(a, b) + close + v.slice(b));
    requestAnimationFrame(() => {
      t.focus();
      t.setSelectionRange(a + open.length, b + open.length);
    });
  };
  const words = useMemo(() => countWords(htmlToText(value)), [value]);

  return (
    <div>
      <div className="wp-editor-tools">
        <span>
        <button type="button" className="wp-btn" style={{ marginBottom: 4 }} onClick={() => { saveSelection(); onAddMedia(insertHtml); }}>
          {Icons.media} Add Media
        </button>
        <button type="button" className="wp-btn" style={{ marginBottom: 4, marginLeft: 6 }} onClick={() => { saveSelection(); onAddProduct(insertBlock); }}>
          {Icons.products} Add Product
        </button>
        </span>
        <div className="wp-editor-tabs">
          <button type="button" className={mode === "visual" ? "active" : ""} onClick={() => setMode("visual")}>Visual</button>
          <button type="button" className={mode === "text" ? "active" : ""} onClick={() => setMode("text")}>Text</button>
        </div>
      </div>
      <div className="wp-editor-wrap" style={{ marginTop: 0 }}>
        {mode === "visual" ? (
          <div className="wp-editor-toolbar" onMouseDown={(e) => e.target instanceof HTMLButtonElement && e.preventDefault()}>
            <select aria-label="Paragraph format" defaultValue="" onChange={(e) => { exec("formatBlock", e.target.value); e.target.value = ""; }}>
              <option value="" disabled>Paragraph</option>
              <option value="p">Paragraph</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="h4">Heading 4</option>
              <option value="blockquote">Quote</option>
              <option value="pre">Preformatted</option>
            </select>
            <button type="button" title="Bold" onClick={() => exec("bold")}><strong>B</strong></button>
            <button type="button" title="Italic" onClick={() => exec("italic")}><em>I</em></button>
            <button type="button" title="Bulleted list" onClick={() => exec("insertUnorderedList")}>• ≡</button>
            <button type="button" title="Numbered list" onClick={() => exec("insertOrderedList")}>1. ≡</button>
            <button type="button" title="Insert link" onClick={() => { const url = prompt("Link URL (use /slug/ for internal links)"); if (url) exec("createLink", url); }}>🔗</button>
            <button type="button" title="Remove link" onClick={() => exec("unlink")}>⛓︎̸</button>
            <button type="button" title="Horizontal line" onClick={() => exec("insertHorizontalRule")}>―</button>
            <button type="button" title="Undo" onClick={() => exec("undo")}>↶</button>
            <button type="button" title="Redo" onClick={() => exec("redo")}>↷</button>
          </div>
        ) : (
          <div className="wp-editor-toolbar">
            {[
              ["b", "<strong>", "</strong>"],
              ["i", "<em>", "</em>"],
              ["link", '<a href="">', "</a>"],
              ["h2", "<h2>", "</h2>"],
              ["h3", "<h3>", "</h3>"],
              ["b-quote", "<blockquote>", "</blockquote>"],
              ["ul", "<ul>\n", "\n</ul>"],
              ["ol", "<ol>\n", "\n</ol>"],
              ["li", "<li>", "</li>"],
              ["p", "<p>", "</p>"],
            ].map(([label, open, close]) => (
              <button key={label} type="button" onClick={() => wrapText(open, close)} style={{ border: "1px solid #c3c4c7", background: "#f6f7f7" }}>
                {label}
              </button>
            ))}
          </div>
        )}
        {mode === "visual" ? (
          <div
            ref={visual}
            className="wp-editor-area article prose max-w-none"
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label="Post content"
            onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
            onBlur={saveSelection}
            onKeyUp={saveSelection}
            onMouseUp={saveSelection}
          />
        ) : (
          <textarea ref={text} className="wp-editor-area text" value={value} onChange={(e) => onChange(e.target.value)} aria-label="Post content (HTML)" />
        )}
        <div className="post-status-info">
          <span>Word count: {words.toLocaleString("en-US")}</span>
          <span>Scripts and unknown tags are removed when you save.</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The edit screen                                                     */
/* ------------------------------------------------------------------ */

export function PostEditor({
  initial,
  categories: initialCategories,
  selectedCategories,
  initialTags,
  otherKeywords,
  siteName,
  siteUrl,
  message,
  toc: tocSettings,
}: {
  initial: EditorPost;
  categories: { id: number; name: string }[];
  selectedCategories: number[];
  initialTags: string[];
  otherKeywords: string[];
  siteName: string;
  siteUrl: string;
  message?: string;
  toc: { enabled: boolean; minHeadings: number };
}) {
  const router = useRouter();
  const [state, formAction, saving] = useActionState<SaveState, FormData>(savePost, message ? { saved: true, message } : {});
  const [, startTrash] = useTransition();
  const isPost = initial.type === "post";
  const noun = isPost ? "Post" : "Page";

  const [title, setTitle] = useState(initial.title);
  const [content, setContent] = useState(initial.content);
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [seo, setSeoState] = useState<SeoFields>({
    seoTitle: initial.seoTitle,
    seoDescription: initial.seoDescription,
    slug: initial.slug,
    focusKeyword: initial.focusKeyword,
    canonicalUrl: initial.canonicalUrl,
    robotsNoindex: initial.robotsNoindex,
    schemaType: initial.schemaType,
  });
  const setSeo = (patch: Partial<SeoFields>) => setSeoState((s) => ({ ...s, ...patch }));
  const [cover, setCover] = useState({ url: initial.coverImage, alt: initial.coverImageAlt });
  const [categories, setCategories] = useState(initialCategories);
  const [checked, setChecked] = useState<number[]>(selectedCategories);
  const [newCat, setNewCat] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagDraft, setTagDraft] = useState("");
  const [status, setStatus] = useState(initial.status === "private" ? "publish" : initial.status);
  const [visibility, setVisibility] = useState(initial.status === "private" ? "private" : "public");
  const [date, setDate] = useState(toLocalInput(initial.publishedAt));
  const [lang, setLang] = useState(initial.lang);
  const [author, setAuthor] = useState(initial.author);
  const [comments, setComments] = useState(initial.commentStatus === "open");
  const [showToc, setShowToc] = useState(initial.showToc);
  const [editing, setEditing] = useState<"" | "status" | "visibility" | "date">("");
  const [modal, setModal] = useState<null | { kind: "insert"; insert: (html: string) => void } | { kind: "featured" }>(null);
  const [productInsert, setProductInsert] = useState<null | ((html: string) => void)>(null);
  const [dirty, setDirty] = useState(false);
  const first = useRef(true);

  const published = initial.status === "publish" || initial.status === "private";
  const futureDate = date && new Date(date) > new Date();

  // Live Rank Math-style analysis (deferred so typing stays smooth)
  const deferredContent = useDeferredValue(content);
  const tocHeadings = useMemo(() => withHeadingIds(deferredContent).toc, [deferredContent]);
  const result = useMemo(
    () =>
      analyzeSeo({
        title,
        content: deferredContent,
        excerpt,
        coverImage: cover.url,
        coverImageAlt: cover.alt,
        lang,
        siteName,
        ...seo,
        otherKeywords,
      }),
    [title, deferredContent, excerpt, cover, lang, siteName, seo, otherKeywords],
  );

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setDirty(true);
  }, [title, content, excerpt, seo, cover, checked, tags, status, visibility, date, lang, author, comments, showToc]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state.saved) setDirty(false);
  }, [state.savedAt, state.saved]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  // Slug follows the title for brand-new posts until it's edited by hand
  const slugTouched = useRef(!!initial.slug);

  const addTags = (raw: string) => {
    const next = raw.split(",").map((t) => t.trim()).filter(Boolean);
    setTags((cur) => [...cur, ...next.filter((n) => !cur.some((c) => c.toLowerCase() === n.toLowerCase()))]);
    setTagDraft("");
  };

  const submit = (intent: string) => (e: React.MouseEvent<HTMLButtonElement>) => {
    const form = e.currentTarget.form!;
    (form.elements.namedItem("intent") as HTMLInputElement).value = intent;
  };

  const primaryLabel = published ? "Update" : futureDate ? "Schedule" : status === "pending" ? "Submit for Review" : "Publish";
  const statusLabel = initial.status === "private" ? "Privately Published" : published ? "Published" : status === "pending" ? "Pending Review" : "Draft";

  return (
    <form
      action={(fd) => {
        fd.set("date", date ? new Date(date).toISOString() : "");
        formAction(fd);
      }}
    >
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="type" value={initial.type} />
      <input type="hidden" name="intent" defaultValue="" />
      <input type="hidden" name="content" value={content} />
      <input type="hidden" name="excerpt" value={excerpt} />
      <input type="hidden" name="slug" value={seo.slug} />
      <input type="hidden" name="seoTitle" value={seo.seoTitle} />
      <input type="hidden" name="seoDescription" value={seo.seoDescription} />
      <input type="hidden" name="focusKeyword" value={seo.focusKeyword} />
      <input type="hidden" name="canonicalUrl" value={seo.canonicalUrl} />
      <input type="hidden" name="robotsNoindex" value={seo.robotsNoindex ? "1" : "0"} />
      <input type="hidden" name="schemaType" value={seo.schemaType} />
      <input type="hidden" name="coverImage" value={cover.url} />
      <input type="hidden" name="coverImageAlt" value={cover.alt} />
      <input type="hidden" name="tags" value={tags.join(", ")} />
      <input type="hidden" name="visibility" value={visibility} />
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="author" value={author} />
      <input type="hidden" name="commentStatus" value={comments ? "open" : "closed"} />
      <input type="hidden" name="showToc" value={showToc ? "1" : "0"} />
      {checked.map((c) => (
        <input key={c} type="hidden" name="categories" value={c} />
      ))}

      <div className="wp-heading">
        <h1>{initial.id ? `Edit ${noun}` : `Add New ${noun}`}</h1>
        {initial.id && (
          <Link href={isPost ? "/admin/posts/new/" : "/admin/pages/new/"} className="page-title-action">
            Add New {noun}
          </Link>
        )}
      </div>

      {state.error && (
        <div className="wp-notice error" role="alert"><p>{state.error}</p></div>
      )}
      {state.saved && state.message && !dirty && (
        <div className="wp-notice" role="status">
          <p>
            {state.message}{" "}
            {published || status === "publish" ? <Link href={`/${seo.slug}/`} target="_blank">View {noun.toLowerCase()}</Link> : null}
          </p>
        </div>
      )}

      <div className="editor-layout">
        <div style={{ minWidth: 0 }}>
          <div className="titlediv">
            <label className="sr-only" htmlFor="title">Add title</label>
            <input
              id="title"
              type="text"
              name="title"
              value={title}
              placeholder="Add title"
              autoComplete="off"
              onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugTouched.current) setSeo({ slug: e.target.value.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") });
              }}
            />
            <div className="edit-slug-box">
              <strong>Permalink:</strong>
              <span>
                {siteUrl}/
                <input
                  type="text"
                  value={seo.slug}
                  aria-label="URL slug"
                  onChange={(e) => {
                    slugTouched.current = true;
                    setSeo({ slug: e.target.value });
                  }}
                  style={{ minHeight: 24, fontSize: 13, width: `${Math.max(12, seo.slug.length + 2)}ch`, maxWidth: "100%" }}
                />
                /
              </span>
              {initial.id && published && (
                <Link className="wp-btn wp-btn-small" href={`/${initial.slug}/`} target="_blank">View {noun}</Link>
              )}
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <ClassicEditor
              value={content}
              onChange={setContent}
              onAddMedia={(insert) => setModal({ kind: "insert", insert })}
              onAddProduct={(insert) => setProductInsert(() => insert)}
            />
          </div>

          <div style={{ marginTop: 20 }}>
            <SeoBox fields={seo} setFields={setSeo} result={result} siteUrl={siteUrl} coverImage={cover.url} title={title} />
          </div>

          {isPost && (
            <div className="postbox">
              <div className="postbox-header"><h2>Excerpt</h2></div>
              <div className="inside">
                <label className="sr-only" htmlFor="excerpt">Excerpt</label>
                <textarea id="excerpt" rows={3} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} style={{ width: "100%" }} />
                <p style={{ color: "#646970", margin: "6px 0 0" }}>Excerpts are optional hand-crafted summaries shown on blog listings. The meta description falls back to it.</p>
              </div>
            </div>
          )}

          <div className="postbox">
            <div className="postbox-header"><h2>Discussion</h2></div>
            <div className="inside">
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="checkbox" checked={comments} onChange={(e) => setComments(e.target.checked)} /> Allow comments
              </label>
            </div>
          </div>

          <div className="postbox">
            <div className="postbox-header"><h2>Author</h2></div>
            <div className="inside">
              <label className="sr-only" htmlFor="author">Author</label>
              <input id="author" type="text" value={author} onChange={(e) => setAuthor(e.target.value)} className="regular-text" />
            </div>
          </div>
        </div>

        {/* ---------- Sidebar ---------- */}
        <div>
          <div className="postbox" id="submitdiv">
            <div className="postbox-header"><h2>Publish</h2></div>
            <div style={{ padding: "10px 10px 0", display: "flex", justifyContent: "space-between", gap: 6 }}>
              {!published ? (
                <button className="wp-btn" name="_save" onClick={submit(status === "pending" ? "pending" : "draft")} disabled={saving}>
                  {status === "pending" ? "Save as Pending" : "Save Draft"}
                </button>
              ) : <span />}
              {initial.id ? (
                <Link className="wp-btn" href={published && !futureDate ? `/${initial.slug}/` : `/preview/${initial.id}/`} target="_blank">
                  {published ? "Preview Changes" : "Preview"}
                </Link>
              ) : (
                <span className="wp-btn" aria-disabled="true" style={{ opacity: 0.6 }} title="Save first to preview">Preview</span>
              )}
            </div>
            <div style={{ padding: "6px 0" }}>
              <div className="misc-pub-section">
                {Icons.pin} Status: <strong>{statusLabel}</strong>
                {!published && (
                  <button type="button" className="edit-link" onClick={() => setEditing(editing === "status" ? "" : "status")}>Edit</button>
                )}
                {editing === "status" && (
                  <div style={{ width: "100%", display: "flex", gap: 6 }}>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
                      <option value="draft">Draft</option>
                      <option value="pending">Pending Review</option>
                    </select>
                    <button type="button" className="wp-btn wp-btn-small" onClick={() => setEditing("")}>OK</button>
                  </div>
                )}
              </div>
              <div className="misc-pub-section">
                {Icons.eye} Visibility: <strong>{visibility === "private" ? "Private" : "Public"}</strong>
                <button type="button" className="edit-link" onClick={() => setEditing(editing === "visibility" ? "" : "visibility")}>Edit</button>
                {editing === "visibility" && (
                  <div style={{ width: "100%" }}>
                    <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input type="radio" checked={visibility === "public"} onChange={() => setVisibility("public")} /> Public
                    </label>
                    <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input type="radio" checked={visibility === "private"} onChange={() => setVisibility("private")} /> Private
                    </label>
                    <button type="button" className="wp-btn wp-btn-small" onClick={() => setEditing("")}>OK</button>
                  </div>
                )}
              </div>
              <div className="misc-pub-section">
                {Icons.calendar}
                <span>
                  {futureDate ? "Schedule for: " : published ? "Published on: " : date ? "Publish on: " : "Publish "}
                  <strong>{date ? fmt(new Date(date).toISOString()) : "immediately"}</strong>
                </span>
                <button type="button" className="edit-link" onClick={() => setEditing(editing === "date" ? "" : "date")}>Edit</button>
                {editing === "date" && (
                  <div style={{ width: "100%", display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Publish date" />
                    <button type="button" className="wp-btn wp-btn-small" onClick={() => setEditing("")}>OK</button>
                    {!published && date && <button type="button" className="edit-link" onClick={() => setDate("")}>Publish immediately</button>}
                  </div>
                )}
              </div>
              <div className="misc-pub-section">
                {Icons.seo} SEO:{" "}
                <span className={`seo-score ${seo.focusKeyword ? (result.score > 80 ? "good" : result.score > 50 ? "ok" : "bad") : "none"}`}>
                  {seo.focusKeyword ? `${result.score} / 100` : "N/A"}
                </span>
                <a href="#rank-math-metabox" className="edit-link">Details</a>
              </div>
              <div className="misc-pub-section">
                Language:
                <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language" style={{ minHeight: 26, fontSize: 13 }}>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>
              {initial.updatedAt && (
                <div className="misc-pub-section" style={{ color: "#646970" }}>Last edited {fmt(initial.updatedAt)}</div>
              )}
            </div>
            <div className="major-publishing-actions">
              {initial.id ? (
                <button
                  type="button"
                  className="wp-link-delete"
                  onClick={() =>
                    startTrash(async () => {
                      await postRowAction(initial.id!, "trash");
                      router.push(`${isPost ? "/admin/posts/" : "/admin/pages/"}?message=${encodeURIComponent("1 item moved to the Trash.")}`);
                    })
                  }
                >
                  Move to Trash
                </button>
              ) : <span />}
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {saving && <span className="spinner" aria-label="Saving">⏳</span>}
                <button className="wp-btn wp-btn-primary wp-btn-large" onClick={submit(status === "pending" && !published ? "pending" : "publish")} disabled={saving}>
                  {primaryLabel}
                </button>
              </span>
            </div>
          </div>

          {isPost && (
            <div className="postbox">
              <div className="postbox-header"><h2>Categories</h2></div>
              <div className="inside">
                <div className="cat-checklist" style={{ height: "auto", maxHeight: 200 }}>
                  {categories.map((c) => (
                    <label key={c.id}>
                      <input
                        type="checkbox"
                        checked={checked.includes(c.id)}
                        onChange={(e) => setChecked((cur) => (e.target.checked ? [...cur, c.id] : cur.filter((x) => x !== c.id)))}
                      />
                      {c.name}
                    </label>
                  ))}
                </div>
                {newCat === null ? (
                  <button type="button" className="edit-link" style={{ marginTop: 8, background: "none", border: 0, color: "#2271b1", textDecoration: "underline", cursor: "pointer" }} onClick={() => setNewCat("")}>
                    + Add New Category
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    <input type="text" value={newCat} onChange={(e) => setNewCat(e.target.value)} aria-label="New category name" style={{ flex: 1 }} />
                    <button
                      type="button"
                      className="wp-btn"
                      onClick={async () => {
                        if (!newCat.trim()) return;
                        const c = await addCategoryInline(newCat);
                        if (c) {
                          setCategories((cur) => (cur.some((x) => x.id === c.id) ? cur : [...cur, c]));
                          setChecked((cur) => [...cur, c.id]);
                        }
                        setNewCat(null);
                      }}
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {isPost && (
            <div className="postbox">
              <div className="postbox-header"><h2>Tags</h2></div>
              <div className="inside">
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    type="text"
                    value={tagDraft}
                    onChange={(e) => setTagDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTags(tagDraft);
                      }
                    }}
                    aria-label="Add new tag"
                    style={{ flex: 1, minWidth: 0 }}
                  />
                  <button type="button" className="wp-btn" onClick={() => addTags(tagDraft)}>Add</button>
                </div>
                <p style={{ color: "#646970", margin: "4px 0 8px", fontSize: 12 }}>Separate tags with commas</p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {tags.map((t) => (
                    <li key={t} style={{ display: "flex", alignItems: "center", gap: 4, margin: "2px 0" }}>
                      <button type="button" aria-label={`Remove term: ${t}`} onClick={() => setTags((cur) => cur.filter((x) => x !== t))} style={{ color: "#d63638", width: 18 }}>
                        ⊗
                      </button>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="postbox">
            <div className="postbox-header"><h2>Table of Contents</h2></div>
            <div className="inside">
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="checkbox" checked={showToc} onChange={(e) => setShowToc(e.target.checked)} /> Show table of contents
              </label>
              {!tocSettings.enabled ? (
                <p className="toc-count">
                  Turned off for all {isPost ? "posts" : "pages"} in <Link href="/admin/settings/toc/">Settings → Table of Contents</Link>.
                </p>
              ) : tocHeadings.length < tocSettings.minHeadings ? (
                <p className="toc-count">
                  {tocHeadings.length} heading{tocHeadings.length === 1 ? "" : "s"} found. It appears once the {noun.toLowerCase()} has {tocSettings.minHeadings} or more H2 headings.
                </p>
              ) : showToc ? (
                <>
                  <p className="toc-count">{tocHeadings.length} headings will be listed:</p>
                  <ol style={{ margin: "6px 0 0 18px", padding: 0, fontSize: 12, maxHeight: 160, overflowY: "auto" }}>
                    {tocHeadings.map((h) => <li key={h.id}>{h.text}</li>)}
                  </ol>
                </>
              ) : (
                <p className="toc-count">Hidden on this {noun.toLowerCase()}.</p>
              )}
            </div>
          </div>

          <div className="postbox">
            <div className="postbox-header"><h2>Featured image</h2></div>
            <div className="inside">
              {cover.url ? (
                <>
                  <button type="button" onClick={() => setModal({ kind: "featured" })} style={{ display: "block", padding: 0, border: 0, width: "100%" }} title="Change featured image">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cover.url} alt={cover.alt} style={{ width: "100%", height: "auto" }} />
                  </button>
                  <label style={{ display: "block", marginTop: 8 }}>
                    <span style={{ color: "#646970" }}>Alt text</span>
                    <input type="text" value={cover.alt} onChange={(e) => setCover({ ...cover, alt: e.target.value })} style={{ width: "100%" }} />
                  </label>
                  <p style={{ fontSize: 12, color: "#646970", margin: "4px 0" }}>Click the image to edit or update</p>
                  <button type="button" className="wp-link-delete" onClick={() => setCover({ url: "", alt: "" })}>Remove featured image</button>
                </>
              ) : (
                <button type="button" className="edit-link" style={{ background: "none", border: 0, color: "#2271b1", textDecoration: "underline", cursor: "pointer" }} onClick={() => setModal({ kind: "featured" })}>
                  Set featured image
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {productInsert && (
        <ProductModal
          onClose={() => setProductInsert(null)}
          onInsert={(html) => {
            productInsert(html);
            setProductInsert(null);
          }}
        />
      )}
      {modal && (
        <MediaModal
          title={modal.kind === "featured" ? "Featured image" : "Add media"}
          button={modal.kind === "featured" ? "Set featured image" : "Insert into post"}
          onClose={() => setModal(null)}
          onSelect={(item: MediaItem) => {
            if (modal.kind === "featured") setCover({ url: item.url, alt: item.alt ?? "" });
            else {
              const alt = (item.alt ?? "").replace(/"/g, "&quot;");
              const img = `<img src="${item.url}" alt="${alt}"${item.width ? ` width="${item.width}" height="${item.height}"` : ""} />`;
              modal.insert(item.caption ? `<figure>${img}<figcaption>${item.caption}</figcaption></figure>` : `<p>${img}</p>`);
            }
            setModal(null);
          }}
        />
      )}
    </form>
  );
}

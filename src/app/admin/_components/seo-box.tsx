"use client";

import { useState } from "react";
import { fold, parseKeywords, scoreBand, SEO_GROUPS, type SeoCheck, type SeoResult } from "@/lib/seo/analyze";

export type SeoFields = {
  seoTitle: string;
  seoDescription: string;
  slug: string;
  focusKeyword: string;
  canonicalUrl: string;
  robotsNoindex: boolean;
  schemaType: string;
};

function Counter({ value, max, min }: { value: number; max: number; min: number }) {
  const color = value === 0 ? "#a7aaad" : value > max ? "#ee5353" : value < min ? "#ff9f43" : "#10ac84";
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#646970", marginTop: 2 }}>
        <span />
        <span style={{ color }}>
          {value} / {max} ({Math.round((value / max) * 100)}%)
        </span>
      </div>
      <div className="length-bar">
        <span style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }} />
      </div>
    </>
  );
}

function highlight(text: string, keyword: string) {
  if (!keyword) return text;
  const k = fold(keyword);
  const f = fold(text);
  const parts: React.ReactNode[] = [];
  let i = 0;
  let idx = f.indexOf(k);
  while (idx !== -1) {
    parts.push(text.slice(i, idx), <mark key={idx}>{text.slice(idx, idx + k.length)}</mark>);
    i = idx + k.length;
    idx = f.indexOf(k, i);
  }
  parts.push(text.slice(i));
  return parts;
}

function KeywordInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [draft, setDraft] = useState("");
  const list = parseKeywords(value);
  const add = (k: string) => {
    const kw = k.trim().replace(/,+$/, "");
    if (!kw || list.length >= 5 || list.some((x) => fold(x) === fold(kw))) return;
    onChange([...list, kw].join(", "));
  };
  return (
    <div
      style={{ display: "flex", flexWrap: "wrap", gap: 4, border: "1px solid #8c8f94", borderRadius: 4, padding: 4, background: "#fff", alignItems: "center" }}
    >
      {list.map((k, i) => (
        <span key={k} className={`kw-chip ${i === 0 ? "primary" : ""}`} title={i === 0 ? "Primary focus keyword" : "Secondary keyword"}>
          {k}
          <button type="button" aria-label={`Remove ${k}`} onClick={() => onChange(list.filter((x) => x !== k).join(", "))} style={{ color: "#646970" }}>
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        placeholder={list.length ? "Add another keyword" : "Example: climbing shoes"}
        onChange={(e) => {
          const v = e.target.value;
          if (v.includes(",")) {
            v.split(",").slice(0, -1).forEach(add);
            setDraft(v.split(",").pop() ?? "");
          } else setDraft(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(draft);
            setDraft("");
          } else if (e.key === "Backspace" && !draft && list.length) {
            onChange(list.slice(0, -1).join(", "));
          }
        }}
        onBlur={() => {
          if (draft.trim()) {
            add(draft);
            setDraft("");
          }
        }}
        style={{ border: 0, boxShadow: "none", flex: 1, minWidth: 140 }}
        aria-label="Focus keyword"
      />
    </div>
  );
}

function CheckGroup({ group, checks }: { group: SeoCheck["group"]; checks: SeoCheck[] }) {
  const errors = checks.filter((c) => c.status !== "pass").length;
  const [open, setOpen] = useState(group === "basic" || errors > 0);
  return (
    <div className="seo-group">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>{SEO_GROUPS[group]}</span>
        <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className={`errors-badge ${errors ? "" : "ok"}`}>{errors ? `${errors} Error${errors > 1 ? "s" : ""}` : "All Good"}</span>
          <span style={{ transform: open ? "rotate(180deg)" : undefined, display: "inline-block" }}>▾</span>
        </span>
      </button>
      {open && (
        <ul>
          {checks.map((c) => (
            <li key={c.id}>
              <span className={`dot ${c.status}`} aria-label={c.status}>
                {c.status === "pass" ? "✓" : c.status === "warn" ? "!" : "✕"}
              </span>
              <span>{c.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SeoBox({
  fields,
  setFields,
  result,
  siteUrl,
  coverImage,
  title,
}: {
  fields: SeoFields;
  setFields: (patch: Partial<SeoFields>) => void;
  result: SeoResult;
  siteUrl: string;
  coverImage: string;
  title: string;
}) {
  const [tab, setTab] = useState<"general" | "advanced" | "schema" | "social">("general");
  const [editSnippet, setEditSnippet] = useState(false);
  const primary = parseKeywords(fields.focusKeyword)[0] ?? "";
  const host = siteUrl.replace(/^https?:\/\//, "");
  const band = primary ? scoreBand(result.score) : "none";

  return (
    <div className="postbox" id="rank-math-metabox">
      <div className="postbox-header">
        <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          Rank Math SEO
          <span className={`seo-score ${band}`}>{primary ? `${result.score} / 100` : "N/A"}</span>
        </h2>
      </div>
      <div className="inside">
        <div className="seo-tabs" role="tablist">
          {(["general", "advanced", "schema", "social"] as const).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
              {t === "general" ? "General" : t === "advanced" ? "Advanced" : t === "schema" ? "Schema" : "Social"}
            </button>
          ))}
        </div>

        {tab === "general" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <strong>Preview</strong>
              <button type="button" className="wp-btn wp-btn-small" onClick={() => setEditSnippet((e) => !e)}>
                {editSnippet ? "Close Editor" : "Edit Snippet"}
              </button>
            </div>
            <div className="serp">
              <div className="serp-url">
                {host} <span>› {fields.slug || "post-slug"}</span>
              </div>
              <div className="serp-title">{highlight(result.snippet.title.length > 60 ? `${result.snippet.title.slice(0, 59)}…` : result.snippet.title, primary)}</div>
              <div className="serp-desc">{highlight(result.snippet.description, primary)}</div>
            </div>

            {editSnippet && (
              <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
                <label>
                  <strong>Title</strong>
                  <input
                    type="text"
                    value={fields.seoTitle}
                    placeholder={`${title} | Site name`}
                    onChange={(e) => setFields({ seoTitle: e.target.value })}
                    style={{ width: "100%", marginTop: 4 }}
                  />
                  <Counter value={result.stats.titleLength} max={60} min={30} />
                  <span style={{ fontSize: 12, color: "#646970" }}>Leave empty to use the post title followed by the site name.</span>
                </label>
                <label>
                  <strong>Permalink</strong>
                  <input type="text" value={fields.slug} onChange={(e) => setFields({ slug: e.target.value })} style={{ width: "100%", marginTop: 4 }} />
                  <Counter value={fields.slug.length + 1} max={75} min={3} />
                </label>
                <label>
                  <strong>Description</strong>
                  <textarea
                    rows={3}
                    value={fields.seoDescription}
                    placeholder="Write a summary of 120-160 characters that includes the focus keyword."
                    onChange={(e) => setFields({ seoDescription: e.target.value })}
                    style={{ width: "100%", marginTop: 4 }}
                  />
                  <Counter value={fields.seoDescription.length} max={160} min={120} />
                </label>
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <strong style={{ display: "block", marginBottom: 4 }}>Focus Keyword</strong>
              <KeywordInput value={fields.focusKeyword} onChange={(v) => setFields({ focusKeyword: v })} />
              <p style={{ fontSize: 12, color: "#646970", margin: "4px 0 0" }}>
                Press Enter after each keyword. The first one is scored; add up to 4 secondary keywords.
              </p>
            </div>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 12, fontSize: 12, color: "#646970" }}>
              <span>Words: <strong>{result.stats.words.toLocaleString("en-US")}</strong></span>
              <span>Keyword density: <strong>{result.stats.density}%</strong> ({result.stats.keywordCount})</span>
              <span>Links: <strong>{result.stats.internalLinks}</strong> internal, <strong>{result.stats.externalLinks}</strong> external</span>
            </div>

            {(["basic", "additional", "title", "readability"] as const).map((g) => (
              <CheckGroup key={g} group={g} checks={result.checks.filter((c) => c.group === g)} />
            ))}
          </div>
        )}

        {tab === "advanced" && (
          <div style={{ display: "grid", gap: 16 }}>
            <fieldset>
              <legend style={{ fontWeight: 600, marginBottom: 6 }}>Robots Meta</legend>
              <label style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                <input type="radio" checked={!fields.robotsNoindex} onChange={() => setFields({ robotsNoindex: false })} /> Index (show in search results)
              </label>
              <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input type="radio" checked={fields.robotsNoindex} onChange={() => setFields({ robotsNoindex: true })} /> No Index (hide from search results)
              </label>
            </fieldset>
            <label>
              <strong>Canonical URL</strong>
              <input
                type="url"
                value={fields.canonicalUrl}
                placeholder={`${siteUrl}/${fields.slug}/`}
                onChange={(e) => setFields({ canonicalUrl: e.target.value })}
                style={{ width: "100%", marginTop: 4 }}
              />
              <span style={{ fontSize: 12, color: "#646970" }}>Only set this if the same content lives at another URL.</span>
            </label>
          </div>
        )}

        {tab === "schema" && (
          <div>
            <label>
              <strong>Article Type</strong>
              <select value={fields.schemaType} onChange={(e) => setFields({ schemaType: e.target.value })} style={{ display: "block", marginTop: 4 }}>
                <option value="BlogPosting">Blog Post</option>
                <option value="Article">Article</option>
                <option value="NewsArticle">News Article</option>
                <option value="none">None</option>
              </select>
            </label>
            <p style={{ color: "#646970", marginTop: 8 }}>
              Every post also gets WebSite, Organization, WebPage, BreadcrumbList and author markup. Posts with a FAQ section
              (questions in collapsible blocks) automatically get FAQPage schema.
            </p>
          </div>
        )}

        {tab === "social" && (
          <div>
            <p style={{ color: "#646970", marginTop: 0 }}>This is how the post looks when shared on Facebook, LinkedIn or X. It uses the SEO title, description and featured image.</p>
            <div style={{ border: "1px solid #dadde1", maxWidth: 500, fontFamily: "Helvetica, Arial, sans-serif" }}>
              {coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverImage} alt="" style={{ width: "100%", aspectRatio: "1.91", objectFit: "cover", display: "block", background: "#f0f2f5" }} />
              ) : (
                <div style={{ aspectRatio: "1.91", background: "#f0f2f5", display: "flex", alignItems: "center", justifyContent: "center", color: "#8a8d91" }}>Set a featured image</div>
              )}
              <div style={{ background: "#f2f3f5", padding: "10px 12px" }}>
                <div style={{ fontSize: 12, color: "#606770", textTransform: "uppercase" }}>{host}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#1d2129", margin: "3px 0" }}>{result.snippet.title}</div>
                <div style={{ fontSize: 14, color: "#606770", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{result.snippet.description}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

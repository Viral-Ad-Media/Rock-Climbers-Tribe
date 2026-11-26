import { asc, ne } from "drizzle-orm";
import Link from "next/link";
import { db, schema } from "@/db";
import { getOptions } from "@/lib/options";
import { analyzeSeo, fold, parseKeywords, scoreBand } from "@/lib/seo/analyze";
import { PageHeading, ScoreBadge } from "../_components/ui";

export const metadata = { title: "SEO Analysis" };

export default async function SeoAnalysis({ searchParams }: PageProps<"/admin/seo">) {
  const { show } = await searchParams;
  const options = await getOptions();
  const posts = await db.select().from(schema.post).where(ne(schema.post.status, "trash")).orderBy(asc(schema.post.title));
  const primary = posts.map((p) => fold(parseKeywords(p.focusKeyword)[0] ?? ""));
  const results = posts
    .map((p, i) => ({
      p,
      r: analyzeSeo({ ...p, siteName: options.blogname, otherKeywords: primary.filter((k, j) => j !== i && k && k === primary[i]) }),
    }))
    .sort((a, b) => (a.p.focusKeyword ? a.r.score : -1) - (b.p.focusKeyword ? b.r.score : -1));
  const published = results.filter((x) => x.p.status === "publish");
  const avg = published.length ? Math.round(published.reduce((a, x) => a + (x.p.focusKeyword ? x.r.score : 0), 0) / published.length) : 0;
  const shown = show === "all" ? results : results.filter((x) => x.p.status === "publish");

  return (
    <div className="wp-wrap">
      <PageHeading title="SEO Analysis" />
      <p style={{ maxWidth: 760, color: "#50575e" }}>
        Every post is checked against the same Rank Math-style tests as the editor: focus keyword placement, content length, keyword
        density, links, image alt text, title readability and paragraph length. Scores above 80 are green. Open a post to see and fix
        each failing test live.
      </p>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", margin: "16px 0" }}>
        <div className="postbox" style={{ padding: 16, margin: 0 }}>
          <div style={{ fontSize: 12, color: "#646970" }}>Average score (published)</div>
          <div style={{ fontSize: 32, fontWeight: 600 }}>{avg}<span style={{ fontSize: 16, color: "#646970" }}> / 100</span></div>
        </div>
        {(["good", "ok", "bad"] as const).map((b) => (
          <div key={b} className="postbox" style={{ padding: 16, margin: 0 }}>
            <div style={{ fontSize: 12, color: "#646970" }}>{b === "good" ? "Good (81-100)" : b === "ok" ? "Needs work (51-80)" : "Poor (0-50)"}</div>
            <div style={{ fontSize: 32, fontWeight: 600 }}>{published.filter((x) => (x.p.focusKeyword ? scoreBand(x.r.score) : "bad") === b).length}</div>
          </div>
        ))}
      </div>
      <p>
        <Link href="/admin/seo/" style={{ fontWeight: show !== "all" ? 600 : 400 }}>Published</Link> |{" "}
        <Link href="/admin/seo/?show=all" style={{ fontWeight: show === "all" ? 600 : 400 }}>All (including drafts)</Link>
      </p>
      <table className="wp-list-table">
        <thead>
          <tr>
            <th style={{ width: "30%" }}>Title</th>
            <th style={{ width: "10%" }}>Score</th>
            <th style={{ width: "16%" }} className="hide-mobile">Focus keyword</th>
            <th>Tests to fix</th>
          </tr>
        </thead>
        <tbody>
          {shown.map(({ p, r }) => {
            const failing = r.checks.filter((c) => c.status !== "pass");
            return (
              <tr key={p.id}>
                <td>
                  <Link className="row-title" href={`/admin/${p.type === "page" ? "pages" : "posts"}/${p.id}/#rank-math-metabox`}>{p.title}</Link>
                  {p.status !== "publish" && <span className="post-state"> — {p.status === "draft" ? "Draft" : p.status}</span>}
                  <div style={{ color: "#646970", fontSize: 12 }}>/{p.slug}/ · {r.stats.words.toLocaleString("en-US")} words</div>
                </td>
                <td><ScoreBadge score={r.score} keyword={p.focusKeyword} /></td>
                <td className="hide-mobile">{parseKeywords(p.focusKeyword)[0] ?? <em style={{ color: "#d63638" }}>Not set</em>}</td>
                <td>
                  {failing.length ? (
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {failing.map((c) => (
                        <li key={c.id} style={{ color: c.status === "warn" ? "#996800" : "#b32d2e" }}>
                          <strong>{c.label}:</strong> <span style={{ color: "#50575e" }}>{c.message}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span style={{ color: "#00a32a" }}>✓ All tests pass</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

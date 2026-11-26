import { and, count, desc, eq, isNotNull, ne, sql } from "drizzle-orm";
import Link from "next/link";
import { db, schema } from "@/db";
import { scoreBand } from "@/lib/seo/analyze";
import { requireStaff } from "@/lib/session";
import { QuickDraft } from "./_components/quick-draft";
import { Notice, Postbox, ScoreBadge, wpDate } from "./_components/ui";

export default async function Dashboard({ searchParams }: PageProps<"/admin">) {
  const session = await requireStaff();
  const { error } = await searchParams;
  const { post, comment } = schema;

  const [byType, comments, recent, recentComments, drafts, seoRows] = await Promise.all([
    db.select({ type: post.type, status: post.status, n: count() }).from(post).groupBy(post.type, post.status),
    db.select({ status: comment.status, n: count() }).from(comment).groupBy(comment.status),
    db
      .select({ id: post.id, title: post.title, slug: post.slug, publishedAt: post.publishedAt })
      .from(post)
      .where(and(eq(post.status, "publish"), eq(post.type, "post")))
      .orderBy(desc(post.publishedAt))
      .limit(5),
    db
      .select({ id: comment.id, author: comment.authorName, content: comment.content, status: comment.status, postId: comment.postId, title: post.title })
      .from(comment)
      .innerJoin(post, eq(post.id, comment.postId))
      .where(ne(comment.status, "trash"))
      .orderBy(desc(comment.createdAt))
      .limit(5),
    db
      .select({ id: post.id, title: post.title, updatedAt: post.updatedAt })
      .from(post)
      .where(eq(post.status, "draft"))
      .orderBy(desc(post.updatedAt))
      .limit(3),
    db
      .select({ id: post.id, title: post.title, score: post.seoScore, kw: post.focusKeyword, type: post.type })
      .from(post)
      .where(and(eq(post.status, "publish"), isNotNull(post.seoScore)))
      .orderBy(sql`coalesce(${post.seoScore}, 0)`),
  ]);

  const n = (type: string, status?: string) => byType.filter((r) => r.type === type && (status ? r.status === status : r.status !== "trash")).reduce((a, r) => a + r.n, 0);
  const c = (status: string) => comments.find((r) => r.status === status)?.n ?? 0;
  const scored = seoRows.filter((r) => r.kw);
  const avgScore = scored.length ? Math.round(scored.reduce((a, r) => a + (r.score ?? 0), 0) / scored.length) : 0;
  const bands = { good: 0, ok: 0, bad: 0 };
  for (const r of seoRows) bands[r.kw ? scoreBand(r.score ?? 0) : "bad"]++;
  const noKeyword = seoRows.filter((r) => !r.kw).length;

  return (
    <div className="wp-wrap">
      <div className="wp-heading">
        <h1>Dashboard</h1>
      </div>
      {error === "forbidden" && <Notice type="error">Sorry, you are not allowed to access that page.</Notice>}

      <div className="welcome-panel">
        <h2 style={{ fontSize: 28, fontWeight: 400, margin: 0 }}>Welcome back, {session.user.name.split(" ")[0]}!</h2>
        <p style={{ fontSize: 15, opacity: 0.85, marginTop: 8 }}>Here are some quick links to get you going.</p>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 16 }}>
          <Link href="/admin/posts/new/">Write a new blog post →</Link>
          <Link href="/admin/seo/">Review SEO scores →</Link>
          <Link href="/admin/comments/?comment_status=moderated">Moderate comments →</Link>
          <Link href="/" target="_blank">View your site →</Link>
        </div>
      </div>

      <div className="dashboard-widgets">
        <Postbox title="At a Glance">
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <li>📝 <Link href="/admin/posts/">{n("post")} Posts</Link></li>
            <li>📄 <Link href="/admin/pages/">{n("page")} Pages</Link></li>
            <li>💬 <Link href="/admin/comments/">{c("approved") + c("pending")} Comments</Link></li>
            <li>⏳ <Link href="/admin/comments/?comment_status=moderated">{c("pending")} in moderation</Link></li>
            <li>✏️ <Link href="/admin/posts/?post_status=draft">{n("post", "draft")} Drafts</Link></li>
            <li>🗑️ <Link href="/admin/posts/?post_status=trash">{n("post", "trash")} in Trash</Link></li>
          </ul>
        </Postbox>

        <Postbox title="Rank Math Overview">
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                background: `conic-gradient(${avgScore > 80 ? "#10ac84" : avgScore > 50 ? "#ff9f43" : "#ee5353"} ${avgScore * 3.6}deg, #e5e5e5 0)`,
              }}
            >
              <div style={{ width: 78, height: 78, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                <strong style={{ fontSize: 22 }}>{avgScore}</strong>
                <span style={{ fontSize: 10, color: "#646970" }}>avg score</span>
              </div>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, lineHeight: 2 }}>
              <li><span className="seo-score good">{bands.good}</span> Good (81-100)</li>
              <li><span className="seo-score ok">{bands.ok}</span> Needs work (51-80)</li>
              <li><span className="seo-score bad">{bands.bad}</span> Poor{noKeyword ? ` (${noKeyword} without a focus keyword)` : ""}</li>
            </ul>
          </div>
          {seoRows.length > 0 && (
            <>
              <h3 style={{ fontSize: 13, margin: "16px 0 6px" }}>Lowest scoring published content</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {seoRows.slice(0, 5).map((r) => (
                  <li key={r.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "3px 0" }}>
                    <Link href={`/admin/${r.type === "page" ? "pages" : "posts"}/${r.id}/#rank-math-metabox`}>{r.title}</Link>
                    <ScoreBadge score={r.score} keyword={r.kw} />
                  </li>
                ))}
              </ul>
            </>
          )}
          <p style={{ marginBottom: 0 }}><Link href="/admin/seo/">Open SEO Analysis →</Link></p>
        </Postbox>

        <Postbox title="Activity">
          <h3 style={{ fontSize: 13, margin: "0 0 6px" }}>Recently Published</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {recent.map((p) => (
              <li key={p.id} style={{ display: "grid", gridTemplateColumns: "9.5em 1fr", gap: 8, padding: "3px 0" }}>
                <span style={{ color: "#646970" }}>{p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}</span>
                <Link href={`/admin/posts/${p.id}/`}>{p.title}</Link>
              </li>
            ))}
          </ul>
          <h3 style={{ fontSize: 13, margin: "16px 0 6px" }}>Recent Comments</h3>
          {recentComments.length ? (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {recentComments.map((cm) => (
                <li key={cm.id} style={{ padding: "6px 0", borderTop: "1px solid #f0f0f1", background: cm.status === "pending" ? "#fcf9e8" : undefined }}>
                  From <strong>{cm.author}</strong> on <Link href={`/admin/posts/${cm.postId}/`}>{cm.title}</Link>
                  {cm.status === "pending" && <em style={{ color: "#996800" }}> [Pending]</em>}
                  <div style={{ color: "#50575e" }}>{cm.content.slice(0, 120)}{cm.content.length > 120 ? "…" : ""}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "#646970" }}>No comments yet.</p>
          )}
        </Postbox>

        <Postbox title="Quick Draft">
          <QuickDraft />
          {drafts.length > 0 && (
            <>
              <h3 style={{ fontSize: 13, margin: "16px 0 6px" }}>Your Recent Drafts</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {drafts.map((d) => (
                  <li key={d.id} style={{ padding: "3px 0" }}>
                    <Link href={`/admin/posts/${d.id}/`}>{d.title}</Link> <span style={{ color: "#646970" }}>{wpDate(d.updatedAt)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Postbox>
      </div>
    </div>
  );
}

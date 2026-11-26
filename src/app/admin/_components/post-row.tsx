"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { postRowAction, quickEditPost, type SaveState } from "../actions";
import { ScoreBadge, wpDate } from "./ui";

export type ListRow = {
  id: number;
  type: string;
  title: string;
  slug: string;
  status: string;
  author: string | null;
  lang: string;
  publishedAt: Date | null;
  updatedAt: Date;
  seoScore: number | null;
  focusKeyword: string | null;
  commentStatus: string;
  categories: { id: number; name: string }[];
  tags: { name: string; slug: string }[];
  approved: number;
  pending: number;
};

const STATE_LABEL: Record<string, string> = { draft: "Draft", pending: "Pending", private: "Private", future: "Scheduled" };

function toLocalInput(d: Date | null) {
  if (!d) return "";
  const date = new Date(d);
  const off = date.getTimezoneOffset();
  return new Date(date.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function PostRow({ row, allCategories }: { row: ListRow; allCategories: { id: number; name: string }[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [state, action, saving] = useActionState<SaveState, FormData>(quickEditPost, {});
  const base = row.type === "page" ? "/admin/pages/" : "/admin/posts/";
  const isPost = row.type === "post";
  const scheduled = row.status === "publish" && row.publishedAt && new Date(row.publishedAt) > new Date();
  const state_ = scheduled ? "future" : row.status;

  useEffect(() => {
    if (state.saved) {
      // Close quick edit once the server confirms the save
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditing(false);
      router.refresh();
    }
  }, [state.savedAt, state.saved, router]);

  const run = (act: string) => start(async () => {
    await postRowAction(row.id, act);
    router.refresh();
  });

  if (editing) {
    return (
      <tr className="quick-edit-row">
        <td colSpan={isPost ? 8 : 6}>
          <form
            action={(fd) => {
              const local = String(fd.get("dateLocal") ?? "");
              fd.set("date", local ? new Date(local).toISOString() : "");
              action(fd);
            }}
          >
            <input type="hidden" name="id" value={row.id} />
            <div style={{ display: "grid", gap: 20, gridTemplateColumns: isPost ? "minmax(0,1.2fr) minmax(0,1fr) minmax(0,1fr)" : "minmax(0,1.2fr) minmax(0,1fr)" }}>
              <fieldset>
                <legend>Quick Edit</legend>
                <label><span>Title</span><input type="text" name="title" defaultValue={row.title} style={{ flex: 1 }} /></label>
                <label><span>Slug</span><input type="text" name="slug" defaultValue={row.slug} style={{ flex: 1 }} /></label>
                <label><span>Date</span><input type="datetime-local" name="dateLocal" defaultValue={toLocalInput(row.publishedAt)} /></label>
              </fieldset>
              {isPost && (
                <fieldset>
                  <legend>Categories</legend>
                  <div className="cat-checklist">
                    {allCategories.map((c) => (
                      <label key={c.id}>
                        <input type="checkbox" name="categories" value={c.id} defaultChecked={row.categories.some((x) => x.id === c.id)} />
                        {c.name}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
              <fieldset>
                {isPost && (
                  <>
                    <legend>Tags</legend>
                    <textarea name="tags" rows={3} defaultValue={row.tags.map((t) => t.name).join(", ")} style={{ width: "100%" }} />
                  </>
                )}
                <label style={{ marginTop: 8 }}>
                  <span>Status</span>
                  <select name="status" defaultValue={row.status}>
                    <option value="publish">Published</option>
                    <option value="private">Private</option>
                    <option value="pending">Pending Review</option>
                    <option value="draft">Draft</option>
                  </select>
                </label>
                <label>
                  <input type="checkbox" name="commentStatus" value="open" defaultChecked={row.commentStatus === "open"} /> Allow Comments
                </label>
              </fieldset>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
              <button className="wp-btn wp-btn-primary" disabled={saving}>{saving ? "Updating…" : "Update"}</button>
              <button type="button" className="wp-btn" onClick={() => setEditing(false)}>Cancel</button>
              {state.error && <span style={{ color: "#d63638" }}>{state.error}</span>}
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr style={{ opacity: pending ? 0.5 : 1 }}>
      <th scope="row" className="check-column">
        <input type="checkbox" name="ids" value={row.id} form="bulk-form" aria-label={`Select ${row.title}`} />
      </th>
      <td>
        <strong>
          {row.status === "trash" ? (
            <span className="row-title" style={{ color: "#50575e" }}>{row.title}</span>
          ) : (
            <Link className="row-title" href={`${base}${row.id}/`}>{row.title}</Link>
          )}
          {STATE_LABEL[state_] && <span className="post-state"> — {STATE_LABEL[state_]}</span>}
          {row.lang === "es" && <span className="post-state"> — ES</span>}
        </strong>
        <div className="row-actions">
          {row.status === "trash" ? (
            <>
              <span><button onClick={() => run("untrash")}>Restore</button></span>
              <span className="delete"><button onClick={() => confirm("Delete this permanently?") && run("delete")}>Delete Permanently</button></span>
            </>
          ) : (
            <>
              <span><Link href={`${base}${row.id}/`}>Edit</Link></span>
              <span><button onClick={() => setEditing(true)}>Quick Edit</button></span>
              <span className="trash"><button onClick={() => run("trash")}>Trash</button></span>
              <span>
                {row.status === "publish" && !scheduled ? (
                  <Link href={`/${row.slug}/`} target="_blank">View</Link>
                ) : (
                  <Link href={`/preview/${row.id}/`} target="_blank">Preview</Link>
                )}
              </span>
            </>
          )}
        </div>
      </td>
      <td className="hide-mobile">{row.author ?? "—"}</td>
      {isPost && (
        <td className="hide-mobile">
          {row.categories.length
            ? row.categories.map((c, i) => (
                <span key={c.id}>
                  {i > 0 && ", "}
                  <Link href={`/admin/posts/?cat=${c.id}`}>{c.name}</Link>
                </span>
              ))
            : "Uncategorized"}
        </td>
      )}
      {isPost && (
        <td className="hide-mobile">
          {row.tags.length
            ? row.tags.map((t, i) => (
                <span key={t.slug}>
                  {i > 0 && ", "}
                  <Link href={`/admin/posts/?tag=${t.slug}`}>{t.name}</Link>
                </span>
              ))
            : "—"}
        </td>
      )}
      <td className="column-comments hide-mobile">
        <Link className={`comment-bubble ${row.pending ? "has-pending" : ""}`} href={`/admin/comments/?p=${row.id}`} title={`${row.approved} approved, ${row.pending} pending`}>
          {row.approved + row.pending}
        </Link>
      </td>
      <td className="hide-mobile">
        {row.status === "publish" ? (scheduled ? "Scheduled" : "Published") : "Last Modified"}
        <br />
        {wpDate(row.status === "publish" ? row.publishedAt : row.updatedAt)}
      </td>
      <td>
        <ScoreBadge score={row.seoScore} keyword={row.focusKeyword} />
        <div className="seo-kw" style={{ fontSize: 12, marginTop: 4 }}>
          <span style={{ color: "#646970" }}>Keyword:</span> {row.focusKeyword?.split(",")[0] || <em>Not set</em>}
        </div>
      </td>
    </tr>
  );
}

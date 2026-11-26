"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { commentRowAction, editComment, replyToComment } from "../comments/actions";
import { wpDate } from "./ui";

type Row = {
  id: number;
  authorName: string;
  authorEmail: string | null;
  authorUrl: string | null;
  ip: string | null;
  content: string;
  status: string;
  createdAt: Date;
  parentId: number | null;
  postId: number;
  postTitle: string;
  postSlug: string;
  postType: string;
};

export function CommentRow({ row }: { row: Row }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<"" | "reply" | "edit">("");
  const [text, setText] = useState("");
  const [edit, setEdit] = useState({ authorName: row.authorName, authorEmail: row.authorEmail ?? "", authorUrl: row.authorUrl ?? "", content: row.content });
  const run = (fn: () => Promise<unknown>) => start(async () => {
    await fn();
    setMode("");
    router.refresh();
  });
  const act = (a: string) => run(() => commentRowAction(row.id, a));

  return (
    <>
      <tr className={row.status === "pending" ? "unapproved" : ""} style={{ opacity: pending ? 0.5 : 1 }}>
        <th className="check-column">
          <input type="checkbox" name="ids" value={row.id} form="comments-bulk" aria-label={`Select comment by ${row.authorName}`} />
        </th>
        <td>
          <strong>{row.authorName}</strong>
          {row.authorUrl && <div><a href={row.authorUrl} rel="nofollow noreferrer" target="_blank">{row.authorUrl.replace(/^https?:\/\//, "").slice(0, 30)}</a></div>}
          {row.authorEmail && <div><a href={`mailto:${row.authorEmail}`}>{row.authorEmail}</a></div>}
          {row.ip && <div style={{ color: "#646970" }}>{row.ip}</div>}
        </td>
        <td>
          {row.parentId && <div style={{ color: "#646970", marginBottom: 4 }}>In reply to comment #{row.parentId}</div>}
          <div style={{ whiteSpace: "pre-wrap", color: "#1d2327" }}>{row.content}</div>
          <div className="row-actions">
            {row.status === "trash" ? (
              <>
                <span><button onClick={() => act("untrash")}>Restore</button></span>
                <span className="delete"><button onClick={() => act("delete")}>Delete Permanently</button></span>
              </>
            ) : row.status === "spam" ? (
              <>
                <span><button onClick={() => act("unspam")}>Not Spam</button></span>
                <span className="delete"><button onClick={() => act("delete")}>Delete Permanently</button></span>
              </>
            ) : (
              <>
                {row.status === "pending" ? (
                  <span><button onClick={() => act("approve")} style={{ color: "#007017" }}>Approve</button></span>
                ) : (
                  <span><button onClick={() => act("unapprove")} style={{ color: "#996800" }}>Unapprove</button></span>
                )}
                <span><button onClick={() => setMode(mode === "reply" ? "" : "reply")}>Reply</button></span>
                <span><button onClick={() => setMode(mode === "edit" ? "" : "edit")}>Quick Edit</button></span>
                <span className="spam"><button onClick={() => act("spam")}>Spam</button></span>
                <span className="trash"><button onClick={() => act("trash")}>Trash</button></span>
              </>
            )}
          </div>
        </td>
        <td className="hide-mobile">
          <Link href={`/admin/${row.postType === "page" ? "pages" : "posts"}/${row.postId}/`} style={{ fontWeight: 600 }}>{row.postTitle}</Link>
          <div><Link href={`/${row.postSlug}/#comments`} target="_blank">View Post</Link></div>
        </td>
        <td className="hide-mobile">{wpDate(row.createdAt)}</td>
      </tr>
      {mode && (
        <tr className="quick-edit-row">
          <td colSpan={5}>
            {mode === "reply" ? (
              <div style={{ display: "grid", gap: 8 }}>
                <strong>Reply to Comment</strong>
                <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} style={{ width: "100%" }} aria-label="Reply" />
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" className="wp-btn wp-btn-primary" onClick={() => run(() => replyToComment(row.id, text))}>
                    {row.status === "pending" ? "Approve and Reply" : "Reply"}
                  </button>
                  <button type="button" className="wp-btn" onClick={() => setMode("")}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                <strong>Edit Comment</strong>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input type="text" value={edit.authorName} onChange={(e) => setEdit({ ...edit, authorName: e.target.value })} aria-label="Name" placeholder="Name" />
                  <input type="email" value={edit.authorEmail} onChange={(e) => setEdit({ ...edit, authorEmail: e.target.value })} aria-label="Email" placeholder="Email" />
                  <input type="url" value={edit.authorUrl} onChange={(e) => setEdit({ ...edit, authorUrl: e.target.value })} aria-label="URL" placeholder="URL" />
                </div>
                <textarea rows={4} value={edit.content} onChange={(e) => setEdit({ ...edit, content: e.target.value })} style={{ width: "100%" }} aria-label="Comment" />
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" className="wp-btn wp-btn-primary" onClick={() => run(() => editComment(row.id, edit))}>Update Comment</button>
                  <button type="button" className="wp-btn" onClick={() => setMode("")}>Cancel</button>
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

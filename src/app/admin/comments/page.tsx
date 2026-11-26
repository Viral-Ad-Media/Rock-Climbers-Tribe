import { and, count, desc, eq, ilike, ne, or, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import { CommentRow } from "../_components/comment-row";
import { Notice, PageHeading, Pagination, qs, SubSubSub } from "../_components/ui";
import { bulkCommentAction } from "./actions";

export const metadata = { title: "Comments" };
const PER_PAGE = 20;
const STATUS: Record<string, string> = { moderated: "pending", approved: "approved", spam: "spam", trash: "trash" };

export default async function Comments({ searchParams }: PageProps<"/admin/comments">) {
  const params = (await searchParams) as Record<string, string | undefined>;
  const status = params.comment_status ?? "all";
  const page = Math.max(1, Number(params.paged) || 1);
  const s = params.s?.trim();
  const { comment, post } = schema;

  const where: SQL[] = [];
  if (STATUS[status]) where.push(eq(comment.status, STATUS[status]));
  else where.push(or(eq(comment.status, "approved"), eq(comment.status, "pending"))!);
  if (params.p) where.push(eq(comment.postId, Number(params.p)));
  if (s) where.push(or(ilike(comment.content, `%${s}%`), ilike(comment.authorName, `%${s}%`), ilike(comment.authorEmail, `%${s}%`))!);

  const [rows, [{ total }], counts] = await Promise.all([
    db
      .select({
        id: comment.id, authorName: comment.authorName, authorEmail: comment.authorEmail, authorUrl: comment.authorUrl, ip: comment.ip,
        content: comment.content, status: comment.status, createdAt: comment.createdAt, parentId: comment.parentId,
        postId: post.id, postTitle: post.title, postSlug: post.slug, postType: post.type,
      })
      .from(comment)
      .innerJoin(post, eq(post.id, comment.postId))
      .where(and(...where))
      .orderBy(desc(comment.createdAt))
      .limit(PER_PAGE)
      .offset((page - 1) * PER_PAGE),
    db.select({ total: count() }).from(comment).where(and(...where)),
    db.select({ status: comment.status, n: count() }).from(comment).where(params.p ? eq(comment.postId, Number(params.p)) : ne(comment.id, 0)).groupBy(comment.status),
  ]);
  const n = (st: string) => counts.find((c) => c.status === st)?.n ?? 0;
  const keep = { comment_status: status === "all" ? undefined : status, s, p: params.p };
  const back = `/admin/comments/${qs(keep, { paged: page > 1 ? page : undefined })}`;
  const actionsFor =
    status === "trash"
      ? [["untrash", "Restore"], ["delete", "Delete permanently"]]
      : status === "spam"
        ? [["unspam", "Not spam"], ["delete", "Delete permanently"]]
        : [["unapprove", "Unapprove"], ["approve", "Approve"], ["spam", "Mark as spam"], ["trash", "Move to Trash"]];

  const bulk = (name: string) => (
    <div className="actions">
      <select name={name} form="comments-bulk" defaultValue="" aria-label="Bulk actions">
        <option value="">Bulk actions</option>
        {actionsFor.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
      <button className="wp-btn" form="comments-bulk">Apply</button>
    </div>
  );

  return (
    <div className="wp-wrap">
      <PageHeading title={params.p && rows[0] ? `Comments on “${rows[0].postTitle}”` : "Comments"} />
      {params.message && <Notice>{params.message}</Notice>}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
        <SubSubSub
          items={[
            { label: "All", href: `/admin/comments/${qs({ p: params.p }, {})}`, count: n("approved") + n("pending"), current: status === "all" },
            { label: "Pending", href: `/admin/comments/${qs({ p: params.p }, { comment_status: "moderated" })}`, count: n("pending"), current: status === "moderated" },
            { label: "Approved", href: `/admin/comments/${qs({ p: params.p }, { comment_status: "approved" })}`, count: n("approved"), current: status === "approved" },
            { label: "Spam", href: `/admin/comments/${qs({ p: params.p }, { comment_status: "spam" })}`, count: n("spam"), current: status === "spam" },
            { label: "Trash", href: `/admin/comments/${qs({ p: params.p }, { comment_status: "trash" })}`, count: n("trash"), current: status === "trash" },
          ]}
        />
        <form className="search-box" method="get" action="/admin/comments/">
          {status !== "all" && <input type="hidden" name="comment_status" value={status} />}
          <input type="search" name="s" defaultValue={s} aria-label="Search comments" />
          <button className="wp-btn">Search Comments</button>
        </form>
      </div>
      <form id="comments-bulk" action={bulkCommentAction}>
        <input type="hidden" name="back" value={back} />
      </form>
      <div className="tablenav">
        {bulk("action")}
        <Pagination total={total} page={page} perPage={PER_PAGE} hrefFor={(p) => `/admin/comments/${qs(keep, { paged: p })}`} />
      </div>
      <table className="wp-list-table">
        <thead>
          <tr>
            <td className="check-column" />
            <th style={{ width: "20%" }}>Author</th>
            <th>Comment</th>
            <th className="hide-mobile" style={{ width: "18%" }}>In response to</th>
            <th className="hide-mobile" style={{ width: "13%" }}>Submitted on</th>
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((r) => <CommentRow key={r.id} row={r} />)
          ) : (
            <tr className="no-items"><td colSpan={5}>No comments found.</td></tr>
          )}
        </tbody>
      </table>
      <div className="tablenav">
        {bulk("action2")}
      </div>
    </div>
  );
}

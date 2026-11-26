import { and, asc, count, desc, eq, ilike, inArray, ne, or, sql, type SQL } from "drizzle-orm";
import Link from "next/link";
import { db, schema } from "@/db";
import { bulkPostAction } from "../actions";
import { PostRow, type ListRow } from "./post-row";
import { Notice, PageHeading, Pagination, qs, SubSubSub } from "./ui";

const PER_PAGE = 20;
type Params = Record<string, string | undefined>;

export async function PostsList({ type, params }: { type: "post" | "page"; params: Params }) {
  const { post, postCategory, postTag, category, tag, comment } = schema;
  const base = type === "page" ? "/admin/pages/" : "/admin/posts/";
  const status = params.post_status ?? "all";
  const page = Math.max(1, Number(params.paged) || 1);
  const s = params.s?.trim();
  const orderby = params.orderby ?? "date";
  const order = params.order === "asc" ? "asc" : "desc";

  const where: SQL[] = [eq(post.type, type)];
  if (status === "all") where.push(ne(post.status, "trash"));
  else if (status === "future") where.push(eq(post.status, "publish"), sql`${post.publishedAt} > now()`);
  else if (status === "publish") where.push(eq(post.status, "publish"), sql`(${post.publishedAt} is null or ${post.publishedAt} <= now())`);
  else where.push(eq(post.status, status));
  if (s) where.push(or(ilike(post.title, `%${s}%`), ilike(post.content, `%${s}%`))!);
  if (params.cat) where.push(sql`exists (select 1 from post_category pc where pc.post_id = ${post.id} and pc.category_id = ${Number(params.cat)})`);
  if (params.tag) where.push(sql`exists (select 1 from post_tag pt join tag t on t.id = pt.tag_id where pt.post_id = ${post.id} and t.slug = ${params.tag})`);
  if (params.m && /^\d{6}$/.test(params.m)) where.push(sql`to_char(coalesce(${post.publishedAt}, ${post.updatedAt}), 'YYYYMM') = ${params.m}`);
  if (params.seo === "good") where.push(sql`${post.seoScore} > 80`);
  if (params.seo === "ok") where.push(sql`${post.seoScore} between 51 and 80`);
  if (params.seo === "bad") where.push(sql`(${post.seoScore} <= 50 or ${post.focusKeyword} is null)`);

  const dir = order === "asc" ? asc : desc;
  const orderBy =
    orderby === "title" ? [dir(post.title)] : orderby === "seo" ? [dir(sql`coalesce(${post.seoScore}, -1)`)] : [dir(sql`coalesce(${post.publishedAt}, ${post.updatedAt})`)];

  const [rows, [{ total }], statusCounts, months, categories] = await Promise.all([
    db
      .select({
        id: post.id, title: post.title, slug: post.slug, status: post.status, author: post.author, lang: post.lang,
        publishedAt: post.publishedAt, updatedAt: post.updatedAt, seoScore: post.seoScore, focusKeyword: post.focusKeyword,
        commentStatus: post.commentStatus, type: post.type,
      })
      .from(post)
      .where(and(...where))
      .orderBy(...orderBy)
      .limit(PER_PAGE)
      .offset((page - 1) * PER_PAGE),
    db.select({ total: count() }).from(post).where(and(...where)),
    db
      .select({
        status: post.status,
        future: sql<boolean>`${post.status} = 'publish' and ${post.publishedAt} > now()`,
        n: count(),
      })
      .from(post)
      .where(eq(post.type, type))
      .groupBy(post.status, sql`${post.status} = 'publish' and ${post.publishedAt} > now()`),
    db
      .selectDistinct({ m: sql<string>`to_char(coalesce(${post.publishedAt}, ${post.updatedAt}), 'YYYYMM')` })
      .from(post)
      .where(and(eq(post.type, type), ne(post.status, "trash")))
      .orderBy(desc(sql`1`)),
    db.select({ id: category.id, name: category.name }).from(category).orderBy(category.name),
  ]);

  const ids = rows.map((r) => r.id);
  const [cats, tags, comments] = ids.length
    ? await Promise.all([
        db.select({ postId: postCategory.postId, id: category.id, name: category.name }).from(postCategory).innerJoin(category, eq(category.id, postCategory.categoryId)).where(inArray(postCategory.postId, ids)),
        db.select({ postId: postTag.postId, name: tag.name, slug: tag.slug }).from(postTag).innerJoin(tag, eq(tag.id, postTag.tagId)).where(inArray(postTag.postId, ids)),
        db.select({ postId: comment.postId, status: comment.status, n: count() }).from(comment).where(inArray(comment.postId, ids)).groupBy(comment.postId, comment.status),
      ])
    : [[], [], []];

  const listRows: ListRow[] = rows.map((r) => ({
    ...r,
    categories: cats.filter((c) => c.postId === r.id).map(({ id, name }) => ({ id, name })),
    tags: tags.filter((t) => t.postId === r.id).map(({ name, slug }) => ({ name, slug })),
    approved: comments.find((c) => c.postId === r.id && c.status === "approved")?.n ?? 0,
    pending: comments.find((c) => c.postId === r.id && c.status === "pending")?.n ?? 0,
  }));

  const countOf = (st: string) => statusCounts.filter((c) => c.status === st && (st !== "publish" || !c.future)).reduce((a, c) => a + c.n, 0);
  const future = statusCounts.filter((c) => c.future).reduce((a, c) => a + c.n, 0);
  const all = statusCounts.filter((c) => c.status !== "trash").reduce((a, c) => a + c.n, 0);
  const filters = [
    { key: "all", label: "All", n: all },
    { key: "publish", label: "Published", n: countOf("publish") },
    { key: "future", label: "Scheduled", n: future },
    { key: "draft", label: "Drafts", n: countOf("draft") },
    { key: "pending", label: "Pending", n: countOf("pending") },
    { key: "private", label: "Private", n: countOf("private") },
    { key: "trash", label: "Trash", n: countOf("trash") },
  ].filter((f) => f.key === "all" || f.n > 0);

  const keep: Params = { post_status: status === "all" ? undefined : status, s, cat: params.cat, m: params.m, tag: params.tag, seo: params.seo, orderby: params.orderby, order: params.order };
  const back = `${base}${qs(keep, { paged: page > 1 ? page : undefined })}`;
  const sortLink = (key: string, label: string) => {
    const active = orderby === key;
    const nextOrder = active && order === "asc" ? "desc" : "asc";
    return (
      <Link href={`${base}${qs(keep, { orderby: key, order: nextOrder, paged: undefined })}`}>
        {label} {active ? (order === "asc" ? "▲" : "▼") : ""}
      </Link>
    );
  };
  const monthLabel = (m: string) => new Date(Number(m.slice(0, 4)), Number(m.slice(4)) - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const noun = type === "page" ? "Pages" : "Posts";
  const inTrash = status === "trash";

  const bulkSelect = (name: string) => (
    <div className="actions">
      <label className="sr-only" htmlFor={`bulk-${name}`}>Select bulk action</label>
      <select id={`bulk-${name}`} name={name} form="bulk-form" defaultValue="">
        <option value="">Bulk actions</option>
        {inTrash ? (
          <>
            <option value="untrash">Restore</option>
            <option value="delete">Delete permanently</option>
          </>
        ) : (
          <>
            <option value="publish">Publish</option>
            <option value="draft">Set to draft</option>
            <option value="pending">Set to pending</option>
            <option value="trash">Move to Trash</option>
          </>
        )}
      </select>
      <button className="wp-btn" form="bulk-form">Apply</button>
    </div>
  );

  return (
    <div className="wp-wrap">
      <PageHeading title={noun} action={{ label: type === "page" ? "Add New Page" : "Add New Post", href: `${base}new/` }}>
        {s && <span style={{ color: "#646970", fontSize: 14 }}>Search results for: <strong>{s}</strong></span>}
      </PageHeading>
      {params.message && <Notice>{params.message}</Notice>}

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
        <SubSubSub items={filters.map((f) => ({ label: f.label, count: f.n, href: `${base}${qs({}, { post_status: f.key === "all" ? undefined : f.key })}`, current: status === f.key }))} />
        <form className="search-box" method="get" action={base} role="search">
          {status !== "all" && <input type="hidden" name="post_status" value={status} />}
          <label className="sr-only" htmlFor="post-search-input">Search {noun}</label>
          <input type="search" id="post-search-input" name="s" defaultValue={s} />
          <button className="wp-btn">Search {noun}</button>
        </form>
      </div>

      <form id="bulk-form" action={bulkPostAction}>
        <input type="hidden" name="back" value={back} />
      </form>
      <form id="filter-form" method="get" action={base}>
        {status !== "all" && <input type="hidden" name="post_status" value={status} />}
        {s && <input type="hidden" name="s" value={s} />}
      </form>

      <div className="tablenav">
        {bulkSelect("action")}
        <div className="actions">
          <select name="m" form="filter-form" defaultValue={params.m ?? ""} aria-label="Filter by date">
            <option value="">All dates</option>
            {months.filter((m) => m.m).map((m) => (
              <option key={m.m} value={m.m}>{monthLabel(m.m)}</option>
            ))}
          </select>
          {type === "post" && (
            <select name="cat" form="filter-form" defaultValue={params.cat ?? ""} aria-label="Filter by category">
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
          <select name="seo" form="filter-form" defaultValue={params.seo ?? ""} aria-label="Filter by SEO score">
            <option value="">All SEO Scores</option>
            <option value="good">Good (81-100)</option>
            <option value="ok">Needs work (51-80)</option>
            <option value="bad">Poor or no keyword</option>
          </select>
          <button className="wp-btn" form="filter-form">Filter</button>
        </div>
        <Pagination total={total} page={page} perPage={PER_PAGE} hrefFor={(p) => `${base}${qs(keep, { paged: p })}`} />
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="wp-list-table">
          <thead>
            <Header type={type} sortLink={sortLink} />
          </thead>
          <tbody>
            {listRows.length ? (
              listRows.map((r) => <PostRow key={r.id} row={r} allCategories={categories} />)
            ) : (
              <tr className="no-items">
                <td colSpan={type === "post" ? 8 : 6}>No {noun.toLowerCase()} found{inTrash ? " in Trash" : ""}.</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <Header type={type} sortLink={sortLink} />
          </tfoot>
        </table>
      </div>

      <div className="tablenav">
        {bulkSelect("action2")}
        <Pagination total={total} page={page} perPage={PER_PAGE} hrefFor={(p) => `${base}${qs(keep, { paged: p })}`} />
      </div>
    </div>
  );
}

function Header({ type, sortLink }: { type: "post" | "page"; sortLink: (k: string, l: string) => React.ReactNode }) {
  return (
    <tr>
      <td className="check-column">
        <span className="sr-only">Select all</span>
      </td>
      <th scope="col" style={{ width: "34%" }}>{sortLink("title", "Title")}</th>
      <th scope="col" className="hide-mobile" style={{ width: "10%" }}>Author</th>
      {type === "post" && <th scope="col" className="hide-mobile" style={{ width: "11%" }}>Categories</th>}
      {type === "post" && <th scope="col" className="hide-mobile" style={{ width: "11%" }}>Tags</th>}
      <th scope="col" className="column-comments hide-mobile" title="Comments">💬</th>
      <th scope="col" className="hide-mobile" style={{ width: "13%" }}>{sortLink("date", "Date")}</th>
      <th scope="col" style={{ width: "12%" }}>{sortLink("seo", "SEO Details")}</th>
    </tr>
  );
}

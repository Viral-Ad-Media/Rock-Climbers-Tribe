import { asc, count, eq, ilike } from "drizzle-orm";
import Link from "next/link";
import { db, schema } from "@/db";
import { deleteTerms } from "../actions";
import { TermForm } from "./term-form";
import { Notice, PageHeading } from "./ui";

export async function TermsPage({ taxonomy, params }: { taxonomy: "category" | "tag"; params: Record<string, string | undefined> }) {
  const isCat = taxonomy === "category";
  const table = isCat ? schema.category : schema.tag;
  const join = isCat ? schema.postCategory : schema.postTag;
  const joinCol = isCat ? schema.postCategory.categoryId : schema.postTag.tagId;
  const base = isCat ? "/admin/categories/" : "/admin/tags/";
  const s = params.s?.trim();

  const rows = await db
    .select({ id: table.id, name: table.name, slug: table.slug, description: table.description, n: count(join.postId) })
    .from(table)
    .leftJoin(join, eq(joinCol, table.id))
    .where(s ? ilike(table.name, `%${s}%`) : undefined)
    .groupBy(table.id)
    .orderBy(asc(table.name));
  const editing = params.edit ? rows.find((r) => r.id === Number(params.edit)) : undefined;
  const archive = (slug: string) => (isCat ? `/${slug}/` : `/tag/${slug}/`);
  const filterParam = isCat ? "cat" : "tag";

  if (editing) {
    return (
      <div className="wp-wrap" style={{ maxWidth: 640 }}>
        <PageHeading title={isCat ? "Edit Category" : "Edit Tag"} />
        <TermForm taxonomy={taxonomy} term={editing} />
      </div>
    );
  }

  return (
    <div className="wp-wrap">
      <PageHeading title={isCat ? "Categories" : "Tags"} />
      {params.message && <Notice>{params.message}</Notice>}
      <div style={{ display: "grid", gap: 30, gridTemplateColumns: "minmax(0, 1fr)" }} className="terms-layout">
        <style>{`@media (min-width: 900px){.terms-layout{grid-template-columns: minmax(0,35%) minmax(0,1fr) !important}}`}</style>
        <div>
          <TermForm taxonomy={taxonomy} />
        </div>
        <div>
          <form method="get" action={base} className="search-box" style={{ marginBottom: 8, justifyContent: "flex-end" }}>
            <input type="search" name="s" defaultValue={s} aria-label={`Search ${isCat ? "categories" : "tags"}`} />
            <button className="wp-btn">Search {isCat ? "Categories" : "Tags"}</button>
          </form>
          <form id="terms-bulk" action={deleteTerms}>
            <input type="hidden" name="taxonomy" value={taxonomy} />
            <div className="tablenav">
              <div className="actions">
                <select name="action" defaultValue="" aria-label="Bulk actions">
                  <option value="">Bulk actions</option>
                  <option value="delete">Delete</option>
                </select>
                <button className="wp-btn">Apply</button>
              </div>
              <div className="tablenav-pages">{rows.length} items</div>
            </div>
            <table className="wp-list-table">
              <thead>
                <tr>
                  <td className="check-column" />
                  <th>Name</th>
                  <th className="hide-mobile">Description</th>
                  <th>Slug</th>
                  <th style={{ width: "4.5em", textAlign: "center" }}>Count</th>
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.map((r) => (
                    <tr key={r.id}>
                      <th className="check-column">
                        <input type="checkbox" name="ids" value={r.id} aria-label={`Select ${r.name}`} />
                      </th>
                      <td>
                        <Link className="row-title" href={`${base}?edit=${r.id}`}>{r.name}</Link>
                        <div className="row-actions">
                          <span><Link href={`${base}?edit=${r.id}`}>Edit</Link></span>
                          <span><Link href={archive(r.slug)} target="_blank">View</Link></span>
                        </div>
                      </td>
                      <td className="hide-mobile">{r.description || <span aria-hidden="true">—</span>}</td>
                      <td>{r.slug}</td>
                      <td style={{ textAlign: "center" }}>
                        <Link href={`/admin/posts/?${filterParam}=${isCat ? r.id : r.slug}`}>{r.n}</Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="no-items"><td colSpan={5}>No {isCat ? "categories" : "tags"} found.</td></tr>
                )}
              </tbody>
            </table>
          </form>
          <p style={{ color: "#646970", marginTop: 12 }}>
            {isCat
              ? "Deleting a category does not delete the posts in it. Category pages live at /category-slug/."
              : "Tags are added from the post editor. Tag archives live at /tag/tag-slug/."}
          </p>
        </div>
      </div>
    </div>
  );
}

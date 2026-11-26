import { count, desc, ilike, or, sql } from "drizzle-orm";
import Link from "next/link";
import { db, schema } from "@/db";
import { MediaGrid } from "../_components/media-grid";
import { Notice, PageHeading, Pagination, qs, wpDate } from "../_components/ui";
import { bulkDeleteMedia } from "./actions";

export const metadata = { title: "Media Library" };
const PER_PAGE = 40;

export default async function MediaLibrary({ searchParams }: PageProps<"/admin/media">) {
  const params = (await searchParams) as Record<string, string | undefined>;
  const mode = params.mode === "list" ? "list" : "grid";
  const s = params.s?.trim();
  const page = Math.max(1, Number(params.paged) || 1);
  const where = s ? or(ilike(schema.media.filename, `%${s}%`), ilike(schema.media.title, `%${s}%`), ilike(schema.media.alt, `%${s}%`)) : undefined;
  const filter =
    params.attachment === "missing-alt" ? sql`(${schema.media.alt} is null or ${schema.media.alt} = '')` : undefined;
  const cond = where && filter ? sql`${where} and ${filter}` : (where ?? filter);

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: schema.media.id, url: schema.media.url, filename: schema.media.filename, mimeType: schema.media.mimeType, size: schema.media.size,
        width: schema.media.width, height: schema.media.height, title: schema.media.title, alt: schema.media.alt, caption: schema.media.caption, createdAt: schema.media.createdAt,
      })
      .from(schema.media)
      .where(cond)
      .orderBy(desc(schema.media.createdAt), desc(schema.media.id))
      .limit(PER_PAGE)
      .offset((page - 1) * PER_PAGE),
    db.select({ total: count() }).from(schema.media).where(cond),
  ]);
  const keep = { mode: mode === "list" ? "list" : undefined, s, attachment: params.attachment };

  return (
    <div className="wp-wrap">
      <PageHeading title="Media Library" action={{ label: "Add New Media File", href: "/admin/media/new/" }} />
      {params.message && <Notice>{params.message}</Notice>}
      <div className="tablenav" style={{ background: "#fff", border: "1px solid #c3c4c7", padding: "8px 12px", marginBottom: 16 }}>
        <div className="actions">
          <Link href={`/admin/media/${qs(keep, { mode: "list" })}`} className={`wp-btn wp-btn-small ${mode === "list" ? "wp-btn-primary" : ""}`} aria-label="List view">☰</Link>
          <Link href={`/admin/media/${qs(keep, { mode: undefined })}`} className={`wp-btn wp-btn-small ${mode === "grid" ? "wp-btn-primary" : ""}`} aria-label="Grid view">▦</Link>
        </div>
        <form method="get" action="/admin/media/" className="actions" style={{ marginLeft: 8 }}>
          {mode === "list" && <input type="hidden" name="mode" value="list" />}
          <select name="attachment" defaultValue={params.attachment ?? ""} aria-label="Filter media">
            <option value="">All media items</option>
            <option value="missing-alt">Missing alt text</option>
          </select>
          <input type="search" name="s" defaultValue={s} placeholder="Search media" aria-label="Search media" />
          <button className="wp-btn">Filter</button>
        </form>
        <Pagination total={total} page={page} perPage={PER_PAGE} hrefFor={(p) => `/admin/media/${qs(keep, { paged: p })}`} />
      </div>

      {mode === "grid" ? (
        <MediaGrid items={rows} />
      ) : (
        <form action={bulkDeleteMedia}>
          <div className="tablenav">
            <div className="actions">
              <select name="action" defaultValue="" aria-label="Bulk actions">
                <option value="">Bulk actions</option>
                <option value="delete">Delete permanently</option>
              </select>
              <button className="wp-btn">Apply</button>
            </div>
          </div>
          <table className="wp-list-table">
            <thead>
              <tr>
                <td className="check-column" />
                <th style={{ width: "45%" }}>File</th>
                <th className="hide-mobile">Alt text</th>
                <th className="hide-mobile" style={{ width: "15%" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id}>
                  <th className="check-column"><input type="checkbox" name="ids" value={m.id} aria-label={`Select ${m.filename}`} /></th>
                  <td>
                    <div style={{ display: "flex", gap: 10 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.url} alt="" width={60} height={60} style={{ objectFit: "cover", width: 60, height: 60 }} loading="lazy" />
                      <div>
                        <Link className="row-title" href={`/admin/media/${m.id}/`}>{m.title || m.filename}</Link>
                        <div style={{ color: "#646970" }}>{m.filename}</div>
                        <div className="row-actions">
                          <span><Link href={`/admin/media/${m.id}/`}>Edit</Link></span>
                          <span><Link href={m.url} target="_blank">View</Link></span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hide-mobile">{m.alt || <em style={{ color: "#d63638" }}>Missing</em>}</td>
                  <td className="hide-mobile">{wpDate(m.createdAt).split(" at")[0]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </form>
      )}
    </div>
  );
}

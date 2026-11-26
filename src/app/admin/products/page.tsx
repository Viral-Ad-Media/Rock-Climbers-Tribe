import { asc, desc, ilike, or } from "drizzle-orm";
import Link from "next/link";
import { db, schema } from "@/db";
import { extractProductSlugs } from "@/lib/products";
import { requireStaff } from "@/lib/session";
import { ProductRow } from "../_components/product-row";
import { Notice, PageHeading, qs } from "../_components/ui";
import { bulkProductAction } from "./actions";

export const metadata = { title: "Affiliate Products" };

const SORTS = { name: schema.product.name, clicks: schema.product.clicks, date: schema.product.updatedAt } as const;

export default async function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  await requireStaff();
  const params = (await searchParams) as Record<string, string | undefined>;
  const s = params.s?.trim() ?? "";
  const orderby = (params.orderby as keyof typeof SORTS) in SORTS ? (params.orderby as keyof typeof SORTS) : "date";
  const order = params.order === "asc" ? "asc" : "desc";
  const col = SORTS[orderby];

  const [rows, posts] = await Promise.all([
    db
      .select()
      .from(schema.product)
      .where(s ? or(ilike(schema.product.name, `%${s}%`), ilike(schema.product.merchant, `%${s}%`), ilike(schema.product.url, `%${s}%`)) : undefined)
      .orderBy(order === "asc" ? asc(col) : desc(col)),
    db.select({ id: schema.post.id, title: schema.post.title, content: schema.post.content, status: schema.post.status }).from(schema.post),
  ]);
  // Which posts show each product
  const usage = new Map<string, { id: number; title: string }[]>();
  for (const p of posts) {
    if (p.status === "trash") continue;
    for (const slug of extractProductSlugs(p.content)) usage.set(slug, [...(usage.get(slug) ?? []), { id: p.id, title: p.title }]);
  }
  const keep = { s: s || undefined, orderby: params.orderby, order: params.order };
  const sortLink = (key: keyof typeof SORTS, label: string) => {
    const active = orderby === key;
    return (
      <Link href={`/admin/products/${qs(keep, { orderby: key, order: active && order === "asc" ? "desc" : "asc" })}`}>
        {label} {active ? (order === "asc" ? "▲" : "▼") : ""}
      </Link>
    );
  };
  const bulk = (name: string) => (
    <div className="actions">
      <select name={name} form="products-bulk" defaultValue="" aria-label="Bulk actions">
        <option value="">Bulk actions</option>
        <option value="reset_clicks">Reset click count</option>
        <option value="delete">Delete permanently</option>
      </select>
      <button className="wp-btn" form="products-bulk">Apply</button>
    </div>
  );
  const header = (
    <tr>
      <td className="check-column"><span className="sr-only">Select</span></td>
      <th scope="col" className="column-thumb hide-mobile"><span className="sr-only">Image</span></th>
      <th scope="col" style={{ width: "30%" }}>{sortLink("name", "Product")}</th>
      <th scope="col" className="hide-mobile">Price</th>
      <th scope="col" className="hide-mobile">Shortcode</th>
      <th scope="col" className="hide-mobile">Used in</th>
      <th scope="col">{sortLink("clicks", "Clicks")}</th>
      <th scope="col" className="hide-mobile">{sortLink("date", "Last modified")}</th>
    </tr>
  );

  return (
    <div className="wp-wrap">
      <PageHeading title="Affiliate Products" action={{ label: "Add New Product", href: "/admin/products/new/" }}>
        {s && <span style={{ color: "#646970", fontSize: 14 }}>Search results for: <strong>{s}</strong></span>}
      </PageHeading>
      {params.message && <Notice>{params.message}</Notice>}
      <p style={{ color: "#50575e", maxWidth: 760 }}>
        Add each product once with its affiliate link, then drop it into any post with <strong>Add Product</strong> in the editor.
        Links go through <code>/go/product-name/</code>, so clicks are counted and you can change a link in one place.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
        <ul className="subsubsub"><li className="current">All <span className="count">({rows.length})</span></li></ul>
        <form className="search-box" method="get" action="/admin/products/" role="search">
          <label className="sr-only" htmlFor="product-search">Search Products</label>
          <input type="search" id="product-search" name="s" defaultValue={s} />
          <button className="wp-btn">Search Products</button>
        </form>
      </div>

      <form id="products-bulk" action={bulkProductAction} />
      <div className="tablenav">{bulk("action")}<div className="tablenav-pages">{rows.length} items</div></div>
      <div style={{ overflowX: "auto" }}>
        <table className="wp-list-table">
          <thead>{header}</thead>
          <tbody>
            {rows.length ? (
              rows.map((p) => <ProductRow key={p.id} product={p} usedIn={usage.get(p.slug) ?? []} />)
            ) : (
              <tr className="no-items">
                <td colSpan={8}>
                  {s ? "No products found." : <>No products yet. <Link href="/admin/products/new/">Add your first product</Link>.</>}
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>{header}</tfoot>
        </table>
      </div>
      <div className="tablenav">{bulk("action2")}</div>
    </div>
  );
}

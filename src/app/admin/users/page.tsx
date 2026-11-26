import { asc, count, eq, ilike, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { Notice, PageHeading, qs, SubSubSub, wpDate } from "../_components/ui";
import { requireAdmin, ROLES, type Role } from "@/lib/session";
import { bulkUserAction } from "./actions";

export const metadata = { title: "Users" };

export default async function Users({ searchParams }: PageProps<"/admin/users">) {
  const session = await requireAdmin();
  const params = (await searchParams) as Record<string, string | undefined>;
  const s = params.s?.trim();
  const role = params.role;
  const { user } = schema;
  const search = s ? or(ilike(user.name, `%${s}%`), ilike(user.email, `%${s}%`)) : undefined;
  const [rows, counts] = await Promise.all([
    db
      .select({ id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt })
      .from(user)
      .where(role ? (search ? or(eq(user.role, role), search) : eq(user.role, role)) : search)
      .orderBy(asc(user.name)),
    db.select({ role: user.role, n: count() }).from(user).groupBy(user.role),
  ]);
  const total = counts.reduce((a, c) => a + c.n, 0);

  return (
    <div className="wp-wrap">
      <PageHeading title="Users" />
      {params.message && <Notice>{params.message}</Notice>}
      <Notice type="info">
        New people create their own account at <a href="/sign-up/" target="_blank">/sign-up/</a>. Emails listed in the ADMIN_EMAILS setting become Administrators automatically; everyone else starts as a Subscriber until you change their role here.
      </Notice>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
        <SubSubSub
          items={[
            { label: "All", href: "/admin/users/", count: total, current: !role },
            ...counts.map((c) => ({ label: ROLES[c.role as Role] ?? c.role, href: `/admin/users/${qs({}, { role: c.role })}`, count: c.n, current: role === c.role })),
          ]}
        />
        <form className="search-box" method="get" action="/admin/users/">
          <input type="search" name="s" defaultValue={s} aria-label="Search users" />
          <button className="wp-btn">Search Users</button>
        </form>
      </div>
      <form action={bulkUserAction}>
        <div className="tablenav">
          <div className="actions">
            <select name="action" defaultValue="" aria-label="Bulk actions">
              <option value="">Bulk actions</option>
              <option value="delete">Delete</option>
            </select>
            <button className="wp-btn">Apply</button>
          </div>
          <div className="actions">
            <select name="new_role" defaultValue="" aria-label="Change role to">
              <option value="">Change role to…</option>
              {Object.entries(ROLES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <button className="wp-btn" name="change_role" value="1">Change</button>
          </div>
          <div className="tablenav-pages">{rows.length} items</div>
        </div>
        <table className="wp-list-table">
          <thead>
            <tr>
              <td className="check-column" />
              <th>Name</th>
              <th>Email</th>
              <th style={{ width: "14%" }}>Role</th>
              <th className="hide-mobile" style={{ width: "18%" }}>Registered</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <th className="check-column">
                  {u.id !== session.user.id && <input type="checkbox" name="ids" value={u.id} aria-label={`Select ${u.name}`} />}
                </th>
                <td>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span aria-hidden="true" style={{ width: 32, height: 32, borderRadius: 2, background: "#c3c4c7", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
                      {u.name.slice(0, 1).toUpperCase()}
                    </span>
                    <strong>{u.name}</strong>
                    {u.id === session.user.id && <em style={{ color: "#646970" }}>(you)</em>}
                  </span>
                </td>
                <td><a href={`mailto:${u.email}`}>{u.email}</a></td>
                <td>{ROLES[u.role as Role] ?? u.role}</td>
                <td className="hide-mobile">{wpDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </form>
    </div>
  );
}

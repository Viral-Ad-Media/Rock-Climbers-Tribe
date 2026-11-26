import { and, count, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getOptions } from "@/lib/options";
import { requireStaff } from "@/lib/session";
import { AdminShell } from "./_components/admin-shell";
import "./admin.css";

export const metadata = { title: { default: "Dashboard", template: "%s ‹ Admin" }, robots: { index: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await requireStaff();
  const [options, [{ pending }]] = await Promise.all([
    getOptions(),
    db.select({ pending: count() }).from(schema.comment).where(and(eq(schema.comment.status, "pending"))),
  ]);
  return (
    <AdminShell
      siteName={options.blogname}
      userName={session.user.name || session.user.email}
      isAdmin={session.role === "admin"}
      pendingComments={pending}
    >
      {children}
    </AdminShell>
  );
}

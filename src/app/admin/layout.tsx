import Link from "next/link";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Admin", robots: { index: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await requireAdmin();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-granite-100 pb-4">
        <Link href="/admin/" className="font-display text-2xl font-bold">
          Admin
        </Link>
        <p className="text-sm text-granite-500">Signed in as {session.user.email}</p>
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}

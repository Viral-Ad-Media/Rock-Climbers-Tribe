import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export const ROLES = {
  admin: "Administrator",
  editor: "Editor",
  member: "Subscriber",
} as const;
export type Role = keyof typeof ROLES;

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export const roleOf = (user: unknown): Role => ((user as { role?: Role })?.role ?? "member");

/** Admins and editors: can manage posts, pages, media and comments. Use at the top of every admin page and action. */
export async function requireStaff() {
  const session = await getSession();
  if (!session) redirect("/sign-in/?next=/admin/");
  const role = roleOf(session.user);
  if (role !== "admin" && role !== "editor") redirect("/?error=forbidden");
  return { ...session, role };
}

/** Administrators only: users and settings. */
export async function requireAdmin() {
  const session = await requireStaff();
  if (session.role !== "admin") redirect("/admin/?error=forbidden");
  return session;
}

"use server";

import { and, inArray, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { requireAdmin, ROLES } from "@/lib/session";

export async function bulkUserAction(form: FormData) {
  const session = await requireAdmin();
  const ids = form.getAll("ids").map(String).filter((id) => id && id !== session.user.id);
  const action = String(form.get("action") || "");
  const role = String(form.get("new_role") || "");
  let message = "";
  if (ids.length && form.get("change_role") && role in ROLES) {
    await db.update(schema.user).set({ role, updatedAt: new Date() }).where(inArray(schema.user.id, ids));
    message = `Changed roles for ${ids.length} user(s).`;
  } else if (ids.length && action === "delete") {
    await db.delete(schema.user).where(and(inArray(schema.user.id, ids), ne(schema.user.id, session.user.id)));
    message = `${ids.length} user(s) deleted.`;
  } else if (form.getAll("ids").includes(session.user.id)) {
    message = "You can’t change your own role or delete yourself here.";
  }
  revalidatePath("/admin/users/");
  redirect(`/admin/users/${message ? `?message=${encodeURIComponent(message)}` : ""}`);
}

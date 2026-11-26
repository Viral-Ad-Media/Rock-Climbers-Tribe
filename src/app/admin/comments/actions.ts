"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { requireStaff } from "@/lib/session";

const MAP: Record<string, string> = { approve: "approved", unapprove: "pending", spam: "spam", trash: "trash", unspam: "pending", untrash: "pending" };

async function apply(action: string, ids: number[]) {
  if (!ids.length) return 0;
  if (action === "delete") await db.delete(schema.comment).where(inArray(schema.comment.id, ids));
  else if (MAP[action]) await db.update(schema.comment).set({ status: MAP[action] }).where(inArray(schema.comment.id, ids));
  else return 0;
  revalidatePath("/", "layout");
  return ids.length;
}

export async function commentRowAction(id: number, action: string) {
  await requireStaff();
  await apply(action, [id]);
}

export async function bulkCommentAction(form: FormData) {
  await requireStaff();
  const action = String(form.get("action") || form.get("action2") || "");
  const ids = form.getAll("ids").map(Number).filter(Boolean);
  const n = await apply(action, ids);
  const back = String(form.get("back") || "/admin/comments/");
  redirect(n ? `${back}${back.includes("?") ? "&" : "?"}message=${encodeURIComponent(`${n} comment(s) updated.`)}` : back);
}

export async function replyToComment(parentId: number, content: string) {
  const session = await requireStaff();
  const [parent] = await db.select().from(schema.comment).where(eq(schema.comment.id, parentId)).limit(1);
  if (!parent || !content.trim()) return;
  await db.insert(schema.comment).values({
    postId: parent.postId,
    parentId,
    authorName: session.user.name,
    authorEmail: session.user.email,
    userId: session.user.id,
    content: content.trim(),
    status: "approved",
  });
  if (parent.status === "pending") await db.update(schema.comment).set({ status: "approved" }).where(eq(schema.comment.id, parentId));
  revalidatePath("/", "layout");
}

export async function editComment(id: number, values: { authorName: string; authorEmail: string; authorUrl: string; content: string }) {
  await requireStaff();
  await db
    .update(schema.comment)
    .set({ authorName: values.authorName.trim() || "Anonymous", authorEmail: values.authorEmail.trim() || null, authorUrl: values.authorUrl.trim() || null, content: values.content.trim() })
    .where(eq(schema.comment.id, id));
  revalidatePath("/", "layout");
}

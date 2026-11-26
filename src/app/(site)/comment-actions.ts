"use server";

import { and, eq, gt, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db, schema } from "@/db";
import { getOptions } from "@/lib/options";
import { getSession, roleOf } from "@/lib/session";

export type CommentState = { ok?: boolean; error?: string; message?: string };

export async function submitComment(_prev: CommentState, form: FormData): Promise<CommentState> {
  // Bots fill every field; people never see this one
  if (String(form.get("website_url") ?? "")) return { ok: true, message: "Thanks! Your comment is awaiting moderation." };

  const options = await getOptions();
  const session = await getSession();
  const postId = Number(form.get("postId"));
  const content = String(form.get("content") ?? "").trim().slice(0, 5000);
  const authorName = (String(form.get("authorName") ?? "").trim() || session?.user.name || "").slice(0, 100);
  const authorEmail = (String(form.get("authorEmail") ?? "").trim() || session?.user.email || "").slice(0, 200);
  let authorUrl = String(form.get("authorUrl") ?? "").trim().slice(0, 200);
  if (authorUrl && !/^https?:\/\//i.test(authorUrl)) authorUrl = "";

  if (!content) return { error: "Please write a comment." };
  if (options.comment_registration === "1" && !session) return { error: "You must be signed in to comment." };
  if (options.require_name_email === "1" && (!authorName || !authorEmail)) return { error: "Please fill in your name and email." };
  if (authorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail)) return { error: "Please enter a valid email address." };

  const [post] = await db
    .select({ id: schema.post.id, slug: schema.post.slug, status: schema.post.status, commentStatus: schema.post.commentStatus })
    .from(schema.post)
    .where(eq(schema.post.id, postId))
    .limit(1);
  if (!post || post.status !== "publish" || post.commentStatus !== "open") return { error: "Comments are closed for this post." };

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;
  // Simple flood control: one comment per IP every 20 seconds
  if (ip) {
    const [recent] = await db
      .select({ id: schema.comment.id })
      .from(schema.comment)
      .where(and(eq(schema.comment.ip, ip), gt(schema.comment.createdAt, sql`now() - interval '20 seconds'`)))
      .limit(1);
    if (recent) return { error: "You are posting comments too quickly. Slow down." };
  }

  const staff = session && ["admin", "editor"].includes(roleOf(session.user));
  const approved = staff || options.comment_moderation !== "1";
  const linkHeavy = (content.match(/https?:\/\//g) ?? []).length > 2;
  await db.insert(schema.comment).values({
    postId,
    authorName: authorName || "Anonymous",
    authorEmail: authorEmail || null,
    authorUrl: authorUrl || null,
    userId: session?.user.id ?? null,
    content,
    status: linkHeavy && !staff ? "pending" : approved ? "approved" : "pending",
    ip,
  });
  revalidatePath(`/${post.slug}/`);
  return approved && !(linkHeavy && !staff)
    ? { ok: true, message: "Thanks! Your comment has been posted." }
    : { ok: true, message: "Thanks! Your comment is awaiting moderation." };
}

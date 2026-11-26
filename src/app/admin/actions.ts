"use server";

import { and, eq, inArray, isNull, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { getOptions } from "@/lib/options";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import { fold, parseKeywords, slugify } from "@/lib/seo/analyze";
import { computeSeoScore } from "@/lib/seo/score";
import { requireStaff } from "@/lib/session";

export type SaveState = { error?: string; saved?: boolean; message?: string; savedAt?: number };

const POST_STATUSES = ["publish", "draft", "pending", "private", "trash"] as const;

function str(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}
function nullable(form: FormData, key: string) {
  return str(form, key) || null;
}
function parseDate(value: string) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function otherKeywords(excludeId: number | null) {
  const rows = await db
    .select({ id: schema.post.id, kw: schema.post.focusKeyword })
    .from(schema.post)
    .where(ne(schema.post.status, "trash"));
  return rows.filter((r) => r.id !== excludeId).map((r) => fold(parseKeywords(r.kw)[0] ?? ""));
}

async function uniqueSlug(base: string, id: number | null) {
  let slug = base;
  for (let i = 2; i < 100; i++) {
    const [clash] = await db.select({ id: schema.post.id }).from(schema.post).where(eq(schema.post.slug, slug)).limit(1);
    const [cat] = await db.select({ id: schema.category.id }).from(schema.category).where(eq(schema.category.slug, slug)).limit(1);
    if ((!clash || clash.id === id) && !cat) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

/** Turns "a, b, c" into tag ids, creating tags that don't exist yet. */
async function resolveTags(input: string) {
  const names = [...new Set(input.split(",").map((t) => t.trim()).filter(Boolean))];
  const ids: number[] = [];
  for (const name of names) {
    const slug = slugify(name);
    if (!slug) continue;
    const [existing] = await db.select({ id: schema.tag.id }).from(schema.tag).where(eq(schema.tag.slug, slug)).limit(1);
    if (existing) ids.push(existing.id);
    else {
      const [row] = await db.insert(schema.tag).values({ slug, name }).returning({ id: schema.tag.id });
      ids.push(row.id);
    }
  }
  return ids;
}

async function setTerms(postId: number, categoryIds: number[] | null, tagIds: number[] | null) {
  if (categoryIds) {
    await db.delete(schema.postCategory).where(eq(schema.postCategory.postId, postId));
    if (categoryIds.length) await db.insert(schema.postCategory).values(categoryIds.map((categoryId) => ({ postId, categoryId })));
  }
  if (tagIds) {
    await db.delete(schema.postTag).where(eq(schema.postTag.postId, postId));
    if (tagIds.length) await db.insert(schema.postTag).values(tagIds.map((tagId) => ({ postId, tagId })));
  }
}

async function keepOldUrl(oldSlug: string, newSlug: string) {
  if (oldSlug === newSlug) return;
  await db.delete(schema.redirect).where(eq(schema.redirect.source, newSlug));
  await db
    .insert(schema.redirect)
    .values({ source: oldSlug, destination: newSlug })
    .onConflictDoUpdate({ target: schema.redirect.source, set: { destination: newSlug } });
  // Older redirects that pointed at the old slug now point straight at the new one
  await db.update(schema.redirect).set({ destination: newSlug }).where(eq(schema.redirect.destination, oldSlug));
}

function refreshSite() {
  revalidatePath("/", "layout");
}

/* ------------------------------------------------------------------ */
/* Full editor save                                                    */
/* ------------------------------------------------------------------ */

export async function savePost(_prev: SaveState, form: FormData): Promise<SaveState> {
  const session = await requireStaff();

  const id = Number(form.get("id")) || null;
  const type = form.get("type") === "page" ? "page" : "post";
  const title = str(form, "title");
  if (!title) return { error: "Please add a title." };
  const slug = await uniqueSlug(slugify(str(form, "slug") || title) || "untitled", id);

  const intent = str(form, "intent"); // draft | pending | publish
  const visibility = str(form, "visibility"); // public | private
  const date = parseDate(str(form, "date"));
  const [existing] = id ? await db.select().from(schema.post).where(eq(schema.post.id, id)).limit(1) : [];
  if (id && !existing) return { error: "That item no longer exists." };

  let status: string;
  if (!intent && existing && (existing.status === "publish" || existing.status === "private")) status = existing.status;
  else if (intent === "publish") status = visibility === "private" ? "private" : "publish";
  else if (intent === "pending") status = "pending";
  else status = "draft";

  let publishedAt = date ?? existing?.publishedAt ?? null;
  if ((status === "publish" || status === "private") && !publishedAt) publishedAt = new Date();

  const content = sanitizeArticleHtml(String(form.get("content") ?? ""));
  const values = {
    type,
    title,
    slug,
    status,
    lang: form.get("lang") === "es" ? "es" : "en",
    excerpt: nullable(form, "excerpt"),
    content,
    coverImage: nullable(form, "coverImage"),
    coverImageAlt: nullable(form, "coverImageAlt"),
    author: nullable(form, "author") ?? session.user.name,
    seoTitle: nullable(form, "seoTitle"),
    seoDescription: nullable(form, "seoDescription"),
    focusKeyword: parseKeywords(str(form, "focusKeyword")).slice(0, 5).join(", ") || null,
    canonicalUrl: nullable(form, "canonicalUrl"),
    robotsNoindex: form.get("robotsNoindex") === "1",
    schemaType: ["BlogPosting", "Article", "NewsArticle", "none"].includes(str(form, "schemaType")) ? str(form, "schemaType") : "BlogPosting",
    commentStatus: form.get("commentStatus") === "open" ? "open" : "closed",
    showToc: form.get("showToc") !== "0",
    publishedAt,
    updatedAt: new Date(),
  };
  const seoScore = computeSeoScore({ ...values }, await otherKeywords(id));

  let postId = id;
  if (existing) {
    await db.update(schema.post).set({ ...values, seoScore }).where(eq(schema.post.id, existing.id));
    if (existing.status === "publish" || existing.status === "private") await keepOldUrl(existing.slug, slug);
  } else {
    const [row] = await db.insert(schema.post).values({ ...values, seoScore }).returning({ id: schema.post.id });
    postId = row.id;
  }

  const categoryIds = type === "post" ? form.getAll("categories").map(Number).filter(Boolean) : [];
  const tagIds = type === "post" ? await resolveTags(str(form, "tags")) : [];
  await setTerms(postId!, categoryIds, tagIds);

  refreshSite();
  const noun = type === "page" ? "Page" : "Post";
  const message =
    status === "publish"
      ? publishedAt && publishedAt > new Date()
        ? `${noun} scheduled.`
        : existing?.status === "publish"
          ? `${noun} updated.`
          : `${noun} published.`
      : status === "pending"
        ? `${noun} submitted for review.`
        : status === "private"
          ? `${noun} privately published.`
          : `${noun} draft updated.`;
  if (!id) redirect(`/admin/${type === "page" ? "pages" : "posts"}/${postId}/?message=${encodeURIComponent(message)}`);
  return { saved: true, message, savedAt: Date.now() };
}

/* ------------------------------------------------------------------ */
/* List table: quick edit, row actions, bulk actions                   */
/* ------------------------------------------------------------------ */

export async function quickEditPost(_prev: SaveState, form: FormData): Promise<SaveState> {
  await requireStaff();
  const id = Number(form.get("id"));
  const [existing] = await db.select().from(schema.post).where(eq(schema.post.id, id)).limit(1);
  if (!existing) return { error: "That item no longer exists." };
  const title = str(form, "title");
  if (!title) return { error: "Please add a title." };
  const slug = await uniqueSlug(slugify(str(form, "slug") || title), id);
  const status = POST_STATUSES.includes(str(form, "status") as (typeof POST_STATUSES)[number]) ? str(form, "status") : existing.status;
  const publishedAt = parseDate(str(form, "date")) ?? existing.publishedAt ?? (status === "publish" ? new Date() : null);

  const next = { ...existing, title, slug, status, publishedAt, commentStatus: form.get("commentStatus") === "open" ? "open" : "closed" };
  const seoScore = computeSeoScore(next, await otherKeywords(id));
  await db
    .update(schema.post)
    .set({ title, slug, status, publishedAt, commentStatus: next.commentStatus, seoScore, updatedAt: new Date() })
    .where(eq(schema.post.id, id));
  if (existing.status === "publish") await keepOldUrl(existing.slug, slug);

  if (existing.type === "post") {
    await setTerms(id, form.getAll("categories").map(Number).filter(Boolean), await resolveTags(str(form, "tags")));
  }
  refreshSite();
  return { saved: true, savedAt: Date.now() };
}

async function applyPostAction(action: string, ids: number[]) {
  if (!ids.length) return 0;
  const rows = await db.select({ id: schema.post.id, status: schema.post.status, trashedFrom: schema.post.trashedFrom }).from(schema.post).where(inArray(schema.post.id, ids));
  switch (action) {
    case "trash":
      for (const r of rows.filter((r) => r.status !== "trash")) {
        await db.update(schema.post).set({ status: "trash", trashedFrom: r.status, updatedAt: new Date() }).where(eq(schema.post.id, r.id));
      }
      break;
    case "untrash":
      for (const r of rows.filter((r) => r.status === "trash")) {
        await db.update(schema.post).set({ status: r.trashedFrom ?? "draft", trashedFrom: null, updatedAt: new Date() }).where(eq(schema.post.id, r.id));
      }
      break;
    case "delete":
      await db.delete(schema.post).where(and(inArray(schema.post.id, ids), eq(schema.post.status, "trash")));
      break;
    case "publish":
    case "draft":
    case "pending":
      await db.update(schema.post).set({ status: action, updatedAt: new Date() }).where(inArray(schema.post.id, ids));
      if (action === "publish") {
        await db
          .update(schema.post)
          .set({ publishedAt: new Date() })
          .where(and(inArray(schema.post.id, ids), isNull(schema.post.publishedAt)));
      }
      break;
    default:
      return 0;
  }
  refreshSite();
  return rows.length;
}

/** Row action buttons ("Trash", "Restore", "Delete Permanently") */
export async function postRowAction(id: number, action: string) {
  await requireStaff();
  await applyPostAction(action, [id]);
}

/** Bulk actions form on the Posts and Pages screens */
export async function bulkPostAction(form: FormData) {
  await requireStaff();
  const action = str(form, "action") || str(form, "action2");
  const ids = form.getAll("ids").map(Number).filter(Boolean);
  const n = await applyPostAction(action, ids);
  const back = str(form, "back") || "/admin/posts/";
  const label: Record<string, string> = {
    trash: "moved to the Trash",
    untrash: "restored from the Trash",
    delete: "permanently deleted",
    publish: "published",
    draft: "set to draft",
    pending: "set to pending review",
  };
  const sep = back.includes("?") ? "&" : "?";
  redirect(n ? `${back}${sep}message=${encodeURIComponent(`${n} ${n === 1 ? "item" : "items"} ${label[action] ?? "updated"}.`)}` : back);
}

/** Dashboard "Quick Draft" widget */
export async function quickDraft(_prev: SaveState, form: FormData): Promise<SaveState> {
  const session = await requireStaff();
  const title = str(form, "title");
  if (!title) return { error: "Please add a title." };
  const content = sanitizeArticleHtml(
    str(form, "content")
      .split(/\n{2,}/)
      .map((p) => `<p>${p.replace(/</g, "&lt;")}</p>`)
      .join("\n"),
  );
  const slug = await uniqueSlug(slugify(title) || "draft", null);
  await db.insert(schema.post).values({ title, slug, content, status: "draft", author: session.user.name, updatedAt: new Date() });
  return { saved: true, message: "Draft saved.", savedAt: Date.now() };
}

/* ------------------------------------------------------------------ */
/* Categories & tags                                                   */
/* ------------------------------------------------------------------ */

type Taxonomy = "category" | "tag";

export async function saveTerm(taxonomy: Taxonomy, _prev: SaveState, form: FormData): Promise<SaveState> {
  await requireStaff();
  const id = Number(form.get("id")) || null;
  const name = str(form, "name");
  if (!name) return { error: "A name is required." };
  const slug = slugify(str(form, "slug") || name);
  const description = nullable(form, "description");
  const table = taxonomy === "category" ? schema.category : schema.tag;

  const [clash] = await db.select({ id: table.id }).from(table).where(eq(table.slug, slug)).limit(1);
  if (clash && clash.id !== id) return { error: `A ${taxonomy} with the slug “${slug}” already exists.` };
  if (taxonomy === "category") {
    const [postClash] = await db.select({ id: schema.post.id }).from(schema.post).where(eq(schema.post.slug, slug)).limit(1);
    if (postClash) return { error: `A post already uses /${slug}/. Choose another slug.` };
  }

  if (id) await db.update(table).set({ name, slug, description }).where(eq(table.id, id));
  else await db.insert(table).values({ name, slug, description });
  refreshSite();
  return { saved: true, message: id ? `${taxonomy === "category" ? "Category" : "Tag"} updated.` : `${taxonomy === "category" ? "Category" : "Tag"} added.`, savedAt: Date.now() };
}

export async function deleteTerms(form: FormData) {
  await requireStaff();
  const taxonomy = str(form, "taxonomy") as Taxonomy;
  const ids = form.getAll("ids").map(Number).filter(Boolean);
  const table = taxonomy === "category" ? schema.category : schema.tag;
  if (ids.length && (str(form, "action") === "delete" || str(form, "action") === "")) {
    await db.delete(table).where(inArray(table.id, ids));
    refreshSite();
  }
  const back = taxonomy === "category" ? "/admin/categories/" : "/admin/tags/";
  redirect(ids.length ? `${back}?message=${encodeURIComponent(`${ids.length} deleted.`)}` : back);
}

/** Used by the editor's "+ Add New Category" link */
export async function addCategoryInline(name: string) {
  await requireStaff();
  const slug = slugify(name);
  if (!slug) return null;
  const [existing] = await db.select().from(schema.category).where(eq(schema.category.slug, slug)).limit(1);
  if (existing) return { id: existing.id, name: existing.name };
  const [row] = await db.insert(schema.category).values({ name: name.trim(), slug }).returning();
  return { id: row.id, name: row.name };
}

export async function defaultCommentStatus() {
  const options = await getOptions();
  return options.default_comment_status;
}

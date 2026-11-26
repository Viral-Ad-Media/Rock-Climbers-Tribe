"use server";

import { desc, eq, ilike, inArray, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { slugify } from "@/lib/seo/analyze";
import { requireStaff } from "@/lib/session";

export type MediaItem = {
  id: number;
  url: string;
  filename: string;
  mimeType: string;
  size: number | null;
  width: number | null;
  height: number | null;
  title: string | null;
  alt: string | null;
  caption: string | null;
  createdAt: Date;
};

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif", "image/svg+xml", "application/pdf"];

const fields = {
  id: schema.media.id,
  url: schema.media.url,
  filename: schema.media.filename,
  mimeType: schema.media.mimeType,
  size: schema.media.size,
  width: schema.media.width,
  height: schema.media.height,
  title: schema.media.title,
  alt: schema.media.alt,
  caption: schema.media.caption,
  createdAt: schema.media.createdAt,
};

export async function listMedia(search = "", limit = 200): Promise<MediaItem[]> {
  await requireStaff();
  const q = search.trim();
  return db
    .select(fields)
    .from(schema.media)
    .where(q ? or(ilike(schema.media.filename, `%${q}%`), ilike(schema.media.title, `%${q}%`), ilike(schema.media.alt, `%${q}%`)) : undefined)
    .orderBy(desc(schema.media.createdAt), desc(schema.media.id))
    .limit(limit);
}

/** Reads width/height from PNG, GIF, WebP (VP8X) and JPEG headers without extra dependencies. */
function imageSize(buf: Buffer): { width: number; height: number } | null {
  try {
    if (buf.subarray(1, 4).toString() === "PNG") return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    if (buf.subarray(0, 3).toString() === "GIF") return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
    if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(12, 16).toString() === "VP8X") {
      return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
    }
    if (buf[0] === 0xff && buf[1] === 0xd8) {
      let i = 2;
      while (i < buf.length) {
        if (buf[i] !== 0xff) return null;
        const marker = buf[i + 1];
        const len = buf.readUInt16BE(i + 2);
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
        }
        i += 2 + len;
      }
    }
  } catch {}
  return null;
}

export async function uploadMedia(form: FormData): Promise<{ items: MediaItem[]; errors: string[] }> {
  const session = await requireStaff();
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  const items: MediaItem[] = [];
  const errors: string[] = [];
  for (const file of files) {
    if (!ALLOWED.includes(file.type)) {
      errors.push(`${file.name}: this file type is not allowed.`);
      continue;
    }
    if (file.size > MAX_BYTES) {
      errors.push(`${file.name}: larger than 4 MB.`);
      continue;
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const ext = (file.name.match(/\.[a-z0-9]+$/i)?.[0] ?? "").toLowerCase();
    const stem = slugify(file.name.replace(/\.[a-z0-9]+$/i, "")) || "file";
    const filename = `${stem}${ext}`;
    const dims = imageSize(buf);
    const title = file.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ");
    // Insert first to get an id, then set the URL that includes it
    const [row] = await db
      .insert(schema.media)
      .values({
        url: `pending-${Date.now()}-${Math.random()}`,
        filename,
        mimeType: file.type,
        size: file.size,
        width: dims?.width ?? null,
        height: dims?.height ?? null,
        title,
        data: buf,
        uploadedBy: session.user.id,
      })
      .returning({ id: schema.media.id });
    const url = `/media/${row.id}/${filename}`;
    await db.update(schema.media).set({ url }).where(eq(schema.media.id, row.id));
    const [item] = await db.select(fields).from(schema.media).where(eq(schema.media.id, row.id));
    items.push(item);
  }
  revalidatePath("/admin/media/");
  return { items, errors };
}

export async function updateMedia(id: number, values: { title?: string; alt?: string; caption?: string }) {
  await requireStaff();
  await db
    .update(schema.media)
    .set({ title: values.title ?? null, alt: values.alt ?? null, caption: values.caption ?? null })
    .where(eq(schema.media.id, id));
  revalidatePath("/admin/media/");
}

export async function deleteMedia(ids: number[]) {
  await requireStaff();
  if (ids.length) await db.delete(schema.media).where(inArray(schema.media.id, ids));
  revalidatePath("/admin/media/");
}

export async function bulkDeleteMedia(form: FormData) {
  await requireStaff();
  const ids = form.getAll("ids").map(Number).filter(Boolean);
  if (form.get("action") === "delete") await deleteMedia(ids);
  redirect(`/admin/media/?mode=list${ids.length ? `&message=${encodeURIComponent(`${ids.length} media file(s) permanently deleted.`)}` : ""}`);
}

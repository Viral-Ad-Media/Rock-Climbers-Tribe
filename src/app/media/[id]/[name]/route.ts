import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

/** Serves files uploaded through the admin Media Library (stored in Postgres). */
export async function GET(_req: Request, { params }: RouteContext<"/media/[id]/[name]">) {
  const { id } = await params;
  const [file] = await db
    .select({ data: schema.media.data, mimeType: schema.media.mimeType, filename: schema.media.filename })
    .from(schema.media)
    .where(eq(schema.media.id, Number(id)))
    .limit(1);
  if (!file?.data) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": `inline; filename="${file.filename}"`,
      ...(file.mimeType === "image/svg+xml" ? { "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'" } : {}),
    },
  });
}

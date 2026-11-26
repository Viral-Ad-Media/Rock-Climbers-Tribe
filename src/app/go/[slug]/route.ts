import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, schema } from "@/db";

export const dynamic = "force-dynamic";

/** Affiliate redirect (like a ThirstyAffiliates/Pretty Links cloaked link): counts the click, then sends the visitor to the product URL. */
export async function GET(req: Request, { params }: RouteContext<"/go/[slug]">) {
  const { slug } = await params;
  const [row] = await db
    .update(schema.product)
    .set({ clicks: sql`${schema.product.clicks} + 1` })
    .where(eq(schema.product.slug, slug))
    .returning({ url: schema.product.url });
  if (!row || !/^https?:\/\//i.test(row.url)) return NextResponse.redirect(new URL("/", req.url), 302);
  return new NextResponse(null, {
    status: 302,
    headers: { Location: row.url, "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer-when-downgrade" },
  });
}

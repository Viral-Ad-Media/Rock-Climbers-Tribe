"use server";

import { desc, eq, ilike, inArray, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import type { Product } from "@/db/schema";
import { parseBoxDesign } from "@/lib/products";
import { slugify } from "@/lib/seo/analyze";
import { requireStaff } from "@/lib/session";

export type ProductState = { error?: string; saved?: boolean; savedAt?: number; id?: number };

const str = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const nullable = (form: FormData, key: string) => str(form, key) || null;

async function uniqueProductSlug(base: string, id: number | null) {
  let slug = base || "product";
  for (let i = 2; i < 100; i++) {
    const [clash] = await db.select({ id: schema.product.id }).from(schema.product).where(eq(schema.product.slug, slug)).limit(1);
    if (!clash || clash.id === id) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

/** Rebuilds posts that show products, so a changed price or link appears straight away */
function revalidateSite() {
  revalidatePath("/", "layout");
}

export async function saveProduct(_prev: ProductState, form: FormData): Promise<ProductState> {
  await requireStaff();
  const id = Number(form.get("id")) || null;
  const name = str(form, "name");
  const url = str(form, "url");
  if (!name) return { error: "Please enter a product name." };
  if (!/^https?:\/\/\S+$/i.test(url)) return { error: "The affiliate link must be a full URL starting with https://." };
  const rating = str(form, "rating");
  if (rating && !(Number(rating) >= 0 && Number(rating) <= 5)) return { error: "Rating must be a number from 0 to 5." };
  const image = str(form, "image");
  if (image && !/^(https?:\/\/|\/)/i.test(image)) return { error: "The image must be a URL or a Media Library file." };

  const slug = await uniqueProductSlug(slugify(str(form, "slug") || name), id);
  const values = {
    name,
    slug,
    url,
    merchant: nullable(form, "merchant"),
    image: image || null,
    imageAlt: nullable(form, "imageAlt"),
    price: nullable(form, "price"),
    rating: rating ? String(Math.round(Number(rating) * 10) / 10) : null,
    badge: nullable(form, "badge"),
    description: nullable(form, "description"),
    pros: nullable(form, "pros"),
    cons: nullable(form, "cons"),
    buttonText: nullable(form, "buttonText"),
    // Re-validated so only known keys and safe colors are stored
    design: str(form, "design") ? JSON.stringify(parseBoxDesign(str(form, "design"))) : null,
    updatedAt: new Date(),
  };
  let productId = id;
  if (id) {
    await db.update(schema.product).set(values).where(eq(schema.product.id, id));
  } else {
    const [row] = await db.insert(schema.product).values(values).returning({ id: schema.product.id });
    productId = row.id;
  }
  revalidateSite();
  if (!id) redirect(`/admin/products/${productId}/?message=Product%20published.`);
  return { saved: true, savedAt: Date.now(), id: productId ?? undefined };
}

export async function deleteProduct(id: number) {
  await requireStaff();
  await db.delete(schema.product).where(eq(schema.product.id, id));
  revalidateSite();
}

export async function bulkProductAction(form: FormData) {
  await requireStaff();
  const action = str(form, "action") || str(form, "action2");
  const ids = form.getAll("ids").map(Number).filter(Boolean);
  if (action === "delete" && ids.length) {
    await db.delete(schema.product).where(inArray(schema.product.id, ids));
    revalidateSite();
    redirect(`/admin/products/?message=${encodeURIComponent(`${ids.length} product${ids.length === 1 ? "" : "s"} permanently deleted.`)}`);
  }
  if (action === "reset_clicks" && ids.length) {
    await db.update(schema.product).set({ clicks: 0 }).where(inArray(schema.product.id, ids));
    redirect(`/admin/products/?message=${encodeURIComponent("Click counts reset.")}`);
  }
  redirect("/admin/products/");
}

/** For the editor's Insert Product dialog */
export async function listProducts(search = ""): Promise<Product[]> {
  await requireStaff();
  const q = search.trim();
  return db
    .select()
    .from(schema.product)
    .where(q ? or(ilike(schema.product.name, `%${q}%`), ilike(schema.product.merchant, `%${q}%`)) : undefined)
    .orderBy(desc(schema.product.updatedAt))
    .limit(60);
}

import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { getOptions } from "@/lib/options";
import { requireStaff } from "@/lib/session";
import { ProductForm } from "../../_components/product-form";
import { PageHeading } from "../../_components/ui";

export const metadata = { title: "Edit Product" };

export default async function EditProduct({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  await requireStaff();
  const { id } = await params;
  const { message } = (await searchParams) as { message?: string };
  const [[product], o] = await Promise.all([db.select().from(schema.product).where(eq(schema.product.id, Number(id))).limit(1), getOptions()]);
  if (!product) notFound();
  return (
    <div className="wp-wrap">
      <PageHeading title="Edit Product" action={{ label: "Add New Product", href: "/admin/products/new/" }} />
      <ProductForm product={product} message={message} defaultButton={o.affiliate_button_text} newTab={o.affiliate_new_tab === "1"} />
    </div>
  );
}

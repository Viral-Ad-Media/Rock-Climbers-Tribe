import { getOptions } from "@/lib/options";
import { requireStaff } from "@/lib/session";
import { ProductForm } from "../../_components/product-form";
import { PageHeading } from "../../_components/ui";

export const metadata = { title: "Add New Product" };

export default async function NewProduct() {
  await requireStaff();
  const o = await getOptions();
  return (
    <div className="wp-wrap">
      <PageHeading title="Add New Product" />
      <ProductForm defaultButton={o.affiliate_button_text} newTab={o.affiliate_new_tab === "1"} />
    </div>
  );
}

import Link from "next/link";
import { BoxDesignSetting } from "../../_components/box-design-setting";
import { Row, SettingsForm } from "../../_components/settings-form";
import { PageHeading } from "../../_components/ui";
import { getOptions } from "@/lib/options";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Affiliate Link Settings" };

export default async function AffiliateSettings() {
  await requireAdmin();
  const o = await getOptions();
  return (
    <div className="wp-wrap">
      <PageHeading title="Affiliate Links" />
      <p style={{ color: "#50575e", maxWidth: 760 }}>
        Defaults for the product boxes added from <Link href="/admin/products/">Affiliate Products</Link>. Every product link is marked
        <code> rel=&quot;sponsored nofollow&quot;</code>, as Google requires for paid links, and goes through <code>/go/…/</code>, which search engines are told not to crawl.
      </p>
      <SettingsForm fields={["affiliate_new_tab", "affiliate_button_text", "affiliate_box_design"]}>
        <Row label="Open links">
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input type="checkbox" name="affiliate_new_tab" value="1" defaultChecked={o.affiliate_new_tab === "1"} /> Open affiliate links in a new tab
          </label>
        </Row>
        <Row label="Default button text" htmlFor="affiliate_button_text" description="Used when a product doesn't set its own button text.">
          <input id="affiliate_button_text" name="affiliate_button_text" type="text" className="regular-text" defaultValue={o.affiliate_button_text} />
        </Row>
        <Row label="Product box design" description="Applies to every product box on the site. A product can switch to its own design on its edit screen.">
          <BoxDesignSetting initial={o.affiliate_box_design} buttonText={o.affiliate_button_text} newTab={o.affiliate_new_tab === "1"} />
        </Row>
      </SettingsForm>
    </div>
  );
}

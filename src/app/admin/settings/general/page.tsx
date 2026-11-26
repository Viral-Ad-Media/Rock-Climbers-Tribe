import { Row, SettingsForm } from "../../_components/settings-form";
import { PageHeading } from "../../_components/ui";
import { getOptions } from "@/lib/options";
import { site } from "@/lib/site";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "General Settings" };

export default async function General() {
  await requireAdmin();
  const o = await getOptions();
  return (
    <div className="wp-wrap">
      <PageHeading title="General Settings" />
      <SettingsForm fields={["blogname", "blogdescription", "site_description"]}>
        <Row label="Site Title" htmlFor="blogname">
          <input id="blogname" name="blogname" type="text" defaultValue={o.blogname} className="regular-text" />
        </Row>
        <Row label="Tagline" htmlFor="blogdescription" description="In a few words, explain what this site is about.">
          <input id="blogdescription" name="blogdescription" type="text" defaultValue={o.blogdescription} className="regular-text" />
        </Row>
        <Row label="Site Description" htmlFor="site_description" description="The default meta description for pages that don't have their own.">
          <textarea id="site_description" name="site_description" rows={3} defaultValue={o.site_description} className="large-text" />
        </Row>
        <Row label="Site Address (URL)" description="Set by the NEXT_PUBLIC_SITE_URL environment variable in Vercel.">
          <input type="url" value={site.url} readOnly disabled className="regular-text" />
        </Row>
      </SettingsForm>
    </div>
  );
}

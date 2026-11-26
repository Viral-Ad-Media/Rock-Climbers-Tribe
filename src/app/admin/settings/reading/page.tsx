import { Row, SettingsForm } from "../../_components/settings-form";
import { PageHeading } from "../../_components/ui";
import { getOptions } from "@/lib/options";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Reading Settings" };

export default async function Reading() {
  await requireAdmin();
  const o = await getOptions();
  return (
    <div className="wp-wrap">
      <PageHeading title="Reading Settings" />
      <SettingsForm fields={["blog_public"]}>
        <Row label="Search engine visibility" description="It is up to search engines to honor this request.">
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {/* Checked = discourage, so the stored value is inverted */}
            <input type="checkbox" name="blog_public" value="0" defaultChecked={o.blog_public === "0"} />
            Discourage search engines from indexing this site
          </label>
          <input type="hidden" name="blog_public" value="1" />
        </Row>
      </SettingsForm>
    </div>
  );
}

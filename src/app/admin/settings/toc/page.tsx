import { Row, SettingsForm } from "../../_components/settings-form";
import { PageHeading } from "../../_components/ui";
import { getOptions } from "@/lib/options";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Table of Contents Settings" };

export default async function TocSettings() {
  await requireAdmin();
  const o = await getOptions();
  return (
    <div className="wp-wrap">
      <PageHeading title="Table of Contents" />
      <p style={{ color: "#50575e", maxWidth: 760 }}>
        The table of contents lists a post&apos;s headings beside the article. These are the site-wide rules; each post also has a
        <strong> Table of Contents</strong> box in the editor to switch it off for that post.
      </p>
      <SettingsForm fields={["toc_enabled_posts", "toc_enabled_pages", "toc_min_headings", "toc_title", "toc_title_es"]}>
        <Row label="Enable support">
          <fieldset style={{ display: "grid", gap: 6 }}>
            <legend className="sr-only">Show the table of contents on</legend>
            <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input type="checkbox" name="toc_enabled_posts" value="1" defaultChecked={o.toc_enabled_posts === "1"} /> Posts
            </label>
            <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input type="checkbox" name="toc_enabled_pages" value="1" defaultChecked={o.toc_enabled_pages === "1"} /> Pages
            </label>
          </fieldset>
        </Row>
        <Row label="Show when" htmlFor="toc_min_headings" description="The table of contents only appears when a post has at least this many headings.">
          <select id="toc_min_headings" name="toc_min_headings" defaultValue={o.toc_min_headings}>
            {[2, 3, 4, 5, 6, 8, 10].map((n) => (
              <option key={n} value={n}>{n} or more headings are present</option>
            ))}
          </select>
        </Row>
        <Row label="Header label" htmlFor="toc_title">
          <input id="toc_title" name="toc_title" type="text" className="regular-text" defaultValue={o.toc_title} />
        </Row>
        <Row label="Header label (Spanish posts)" htmlFor="toc_title_es">
          <input id="toc_title_es" name="toc_title_es" type="text" className="regular-text" defaultValue={o.toc_title_es} />
        </Row>
      </SettingsForm>
    </div>
  );
}

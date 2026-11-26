import { Row, SettingsForm } from "../../_components/settings-form";
import { PageHeading } from "../../_components/ui";
import { getOptions } from "@/lib/options";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Titles & Meta" };

export default async function SeoSettings() {
  await requireAdmin();
  const o = await getOptions();
  return (
    <div className="wp-wrap">
      <PageHeading title="Rank Math SEO: Titles & Meta" />
      <SettingsForm
        fields={[
          "seo_separator", "seo_home_title", "seo_home_description", "seo_default_og_image", "seo_org_name", "seo_org_logo",
          "seo_default_schema", "seo_noindex_empty_archives", "seo_noindex_tags", "seo_twitter_username", "seo_facebook_url",
        ]}
      >
        <Row label="Separator Character" htmlFor="seo_separator" description="Used between the post title and the site name when a post has no custom SEO title.">
          <select id="seo_separator" name="seo_separator" defaultValue={o.seo_separator}>
            {["|", "-", "–", "—", "·", "•", "»", ":"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Row>
        <Row label="Homepage Title" htmlFor="seo_home_title" description="Leave empty to use “Site Title: Tagline”.">
          <input id="seo_home_title" name="seo_home_title" type="text" defaultValue={o.seo_home_title} className="large-text" />
        </Row>
        <Row label="Homepage Meta Description" htmlFor="seo_home_description" description="120-160 characters works best.">
          <textarea id="seo_home_description" name="seo_home_description" rows={3} defaultValue={o.seo_home_description} className="large-text" />
        </Row>
        <Row label="Default Social Image" htmlFor="seo_default_og_image" description="Shown when a shared post has no featured image. Paste a Media Library URL.">
          <input id="seo_default_og_image" name="seo_default_og_image" type="text" defaultValue={o.seo_default_og_image} className="large-text" />
        </Row>
        <Row label="Organization Name" htmlFor="seo_org_name">
          <input id="seo_org_name" name="seo_org_name" type="text" defaultValue={o.seo_org_name} className="regular-text" />
        </Row>
        <Row label="Logo" htmlFor="seo_org_logo" description="Used in the Organization schema.">
          <input id="seo_org_logo" name="seo_org_logo" type="text" defaultValue={o.seo_org_logo} className="large-text" />
        </Row>
        <Row label="Default Article Type" htmlFor="seo_default_schema">
          <select id="seo_default_schema" name="seo_default_schema" defaultValue={o.seo_default_schema}>
            <option value="BlogPosting">Blog Post</option>
            <option value="Article">Article</option>
            <option value="NewsArticle">News Article</option>
          </select>
        </Row>
        <Row label="Archives">
          <fieldset>
            <label>
              <input type="checkbox" name="seo_noindex_empty_archives" value="1" defaultChecked={o.seo_noindex_empty_archives === "1"} />
              Noindex empty category and tag archives
            </label>
            <label>
              <input type="checkbox" name="seo_noindex_tags" value="1" defaultChecked={o.seo_noindex_tags === "1"} />
              Noindex all tag archives
            </label>
          </fieldset>
        </Row>
        <Row label="X (Twitter) Username" htmlFor="seo_twitter_username">
          <input id="seo_twitter_username" name="seo_twitter_username" type="text" defaultValue={o.seo_twitter_username} placeholder="@handle" className="regular-text" />
        </Row>
        <Row label="Facebook Page URL" htmlFor="seo_facebook_url">
          <input id="seo_facebook_url" name="seo_facebook_url" type="url" defaultValue={o.seo_facebook_url} className="regular-text" />
        </Row>
      </SettingsForm>
    </div>
  );
}

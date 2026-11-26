import { Row, SettingsForm } from "../../_components/settings-form";
import { PageHeading } from "../../_components/ui";
import { getOptions } from "@/lib/options";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Discussion Settings" };

export default async function Discussion() {
  await requireAdmin();
  const o = await getOptions();
  return (
    <div className="wp-wrap">
      <PageHeading title="Discussion Settings" />
      <SettingsForm fields={["default_comment_status", "require_name_email", "comment_registration", "comment_moderation"]}>
        <Row label="Default post settings">
          <fieldset>
            <label>
              <input type="checkbox" name="default_comment_status" value="open" defaultChecked={o.default_comment_status === "open"} />
              Allow people to submit comments on new posts
            </label>
          </fieldset>
        </Row>
        <Row label="Other comment settings">
          <fieldset>
            <label>
              <input type="checkbox" name="require_name_email" value="1" defaultChecked={o.require_name_email === "1"} />
              Comment author must fill out name and email
            </label>
            <label>
              <input type="checkbox" name="comment_registration" value="1" defaultChecked={o.comment_registration === "1"} />
              Users must be registered and logged in to comment
            </label>
          </fieldset>
        </Row>
        <Row label="Before a comment appears">
          <fieldset>
            <label>
              <input type="checkbox" name="comment_moderation" value="1" defaultChecked={o.comment_moderation === "1"} />
              Comment must be manually approved
            </label>
          </fieldset>
        </Row>
      </SettingsForm>
    </div>
  );
}

import { UploadScreen } from "../../_components/upload-screen";
import { PageHeading } from "../../_components/ui";

export const metadata = { title: "Upload New Media" };

export default function NewMedia() {
  return (
    <div className="wp-wrap">
      <PageHeading title="Upload New Media" />
      <UploadScreen />
    </div>
  );
}

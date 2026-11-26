import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { AttachmentDetails } from "../../_components/media-modal";
import { PageHeading } from "../../_components/ui";

export const metadata = { title: "Edit Media" };

export default async function EditMedia({ params }: PageProps<"/admin/media/[id]">) {
  const { id } = await params;
  const [m] = await db
    .select({
      id: schema.media.id, url: schema.media.url, filename: schema.media.filename, mimeType: schema.media.mimeType, size: schema.media.size,
      width: schema.media.width, height: schema.media.height, title: schema.media.title, alt: schema.media.alt, caption: schema.media.caption, createdAt: schema.media.createdAt,
    })
    .from(schema.media)
    .where(eq(schema.media.id, Number(id)))
    .limit(1);
  if (!m) notFound();
  return (
    <div className="wp-wrap">
      <PageHeading title="Edit Media" action={{ label: "Add New Media File", href: "/admin/media/new/" }} />
      <div className="editor-layout">
        <div style={{ background: "#fff", border: "1px solid #c3c4c7", padding: 16, textAlign: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.url} alt={m.alt ?? ""} style={{ maxWidth: "100%", maxHeight: "70vh" }} />
        </div>
        <div className="postbox">
          <div className="inside">
            <AttachmentDetails item={m} />
            <p><Link href="/admin/media/">← Back to Media Library</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

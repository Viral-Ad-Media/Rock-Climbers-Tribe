import { EditorPage } from "../../_components/editor-page";

export const metadata = { title: "Edit Page" };

export default async function EditPage({ params, searchParams }: PageProps<"/admin/pages/[id]">) {
  const [{ id }, { message }] = await Promise.all([params, searchParams]);
  return <EditorPage type="page" id={Number(id)} message={typeof message === "string" ? message : undefined} />;
}

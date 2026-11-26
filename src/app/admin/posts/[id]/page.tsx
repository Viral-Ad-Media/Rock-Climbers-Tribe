import { EditorPage } from "../../_components/editor-page";

export const metadata = { title: "Edit Post" };

export default async function EditPost({ params, searchParams }: PageProps<"/admin/posts/[id]">) {
  const [{ id }, { message }] = await Promise.all([params, searchParams]);
  return <EditorPage type="post" id={Number(id)} message={typeof message === "string" ? message : undefined} />;
}

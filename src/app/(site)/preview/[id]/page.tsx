import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Article } from "@/components/article";
import { getPostForPreview } from "@/lib/content";
import { requireStaff } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

export default async function PreviewPage({ params }: PageProps<"/preview/[id]">) {
  await requireStaff();
  const { id } = await params;
  const post = await getPostForPreview(Number(id));
  if (!post) notFound();
  return <Article post={post} preview />;
}

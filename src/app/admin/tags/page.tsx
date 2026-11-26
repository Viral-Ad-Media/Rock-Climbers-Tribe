import { TermsPage } from "../_components/terms-page";

export const metadata = { title: "Tags" };

export default async function Tags({ searchParams }: PageProps<"/admin/tags">) {
  return <TermsPage taxonomy="tag" params={(await searchParams) as Record<string, string>} />;
}

import { TermsPage } from "../_components/terms-page";

export const metadata = { title: "Categories" };

export default async function Categories({ searchParams }: PageProps<"/admin/categories">) {
  return <TermsPage taxonomy="category" params={(await searchParams) as Record<string, string>} />;
}

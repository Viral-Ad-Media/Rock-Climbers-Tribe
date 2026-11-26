import type { MetadataRoute } from "next";
import { getOptions } from "@/lib/options";
import { site } from "@/lib/site";

export const revalidate = 3600;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const options = await getOptions();
  if (options.blog_public === "0") return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/account/", "/api/", "/search/", "/preview/", "/go/"] },
    sitemap: `${site.url}/sitemap.xml`,
  };
}

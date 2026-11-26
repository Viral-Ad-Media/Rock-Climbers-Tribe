import type { Metadata } from "next";
import { Inter, Roboto_Slab } from "next/font/google";
import Script from "next/script";
import { getOptions } from "@/lib/options";
import { site } from "@/lib/site";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const slab = Roboto_Slab({ variable: "--font-slab", subsets: ["latin"], weight: ["500", "700"] });

export async function generateMetadata(): Promise<Metadata> {
  const o = await getOptions();
  const name = o.blogname || site.name;
  const sep = o.seo_separator || "|";
  return {
    metadataBase: new URL(site.url),
    title: { default: o.seo_home_title || `${name} ${sep} ${o.blogdescription}`, template: `%s ${sep} ${name}` },
    description: o.seo_home_description || o.site_description,
    robots: o.blog_public === "0" ? { index: false, follow: false } : undefined,
    openGraph: {
      siteName: name,
      type: "website",
      locale: "en_US",
      images: o.seo_default_og_image ? [o.seo_default_og_image] : undefined,
    },
    twitter: { card: "summary_large_image", site: o.seo_twitter_username ? `@${o.seo_twitter_username.replace(/^@/, "")}` : undefined },
    verification: site.googleVerification ? { google: site.googleVerification } : undefined,
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${slab.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  );
}

function Analytics() {
  return (
    <>
      {site.adsenseClient && (
        <Script
          async
          strategy="afterInteractive"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${site.adsenseClient}`}
          crossOrigin="anonymous"
        />
      )}
      {site.gaId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${site.gaId}`} strategy="afterInteractive" />
          <Script id="ga" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${site.gaId}');`}
          </Script>
        </>
      )}
      {site.metaPixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${site.metaPixelId}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}

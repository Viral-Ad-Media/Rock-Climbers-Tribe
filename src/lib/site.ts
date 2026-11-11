export const site = {
  name: "Rock Climbers Tribe",
  tagline: "Unbiased reviews for top climbing products",
  description:
    "Honest climbing gear reviews and beginner guides: shoes, harnesses, ropes, helmets, carabiners and more, tested and compared for rock climbers.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://rockclimberstribe.com").replace(/\/$/, ""),
  adsenseClient: process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "",
  gaId: process.env.NEXT_PUBLIC_GA_ID ?? "",
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "",
  googleVerification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "",
};

export function formatDate(d: Date | string | null | undefined, lang = "en") {
  if (!d) return "";
  return new Date(d).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

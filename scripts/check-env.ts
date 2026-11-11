/**
 * Fails the build early, with a readable message, when required settings are missing.
 * Runs first in `npm run vercel-build`.
 */
const required: Record<string, string> = {
  DATABASE_URL: "the Neon connection string (Neon console > Connect)",
  BETTER_AUTH_SECRET: "a random secret, e.g. the output of `openssl rand -base64 32`",
};
const recommended: Record<string, string> = {
  BETTER_AUTH_URL: "the public site URL, e.g. https://rockclimberstribe.com",
  NEXT_PUBLIC_SITE_URL: "the public site URL, used for canonical links and the sitemap",
  ADMIN_EMAILS: "comma-separated emails that get admin access when they sign up",
};

const missing = Object.keys(required).filter((k) => !process.env[k]?.trim());
for (const k of Object.keys(recommended).filter((k) => !process.env[k]?.trim())) {
  console.warn(`⚠ ${k} is not set: ${recommended[k]}`);
}
if (missing.length) {
  console.error("\n✖ Missing required environment variables:\n");
  for (const k of missing) console.error(`  ${k}: ${required[k]}`);
  console.error("\nAdd them in Vercel under Project Settings > Environment Variables, then redeploy.\n");
  process.exit(1);
}
console.log("✓ Environment variables look good");

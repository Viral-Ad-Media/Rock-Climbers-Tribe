/**
 * Fails the build early, with a readable message, when required settings are missing.
 * Runs first in `npm run vercel-build`.
 *
 * Preview deployments need their own DATABASE_URL (the Neon "preview" branch), because the
 * build runs migrations, the seed and the SEO sync against whatever database it is given.
 * BETTER_AUTH_URL and NEXT_PUBLIC_SITE_URL are optional on previews: the app derives them
 * from the deployment URL.
 */
const vercelEnv = process.env.VERCEL_ENV ?? "development";
const isPreview = vercelEnv === "preview";

const required: Record<string, string> = {
  DATABASE_URL: isPreview
    ? "the connection string of the Neon \"preview\" branch (never the production branch)"
    : "the Neon connection string (Neon console > Connect)",
  BETTER_AUTH_SECRET: "a random secret, e.g. the output of `openssl rand -base64 32`",
};
const recommended: Record<string, string> = isPreview
  ? {}
  : {
      BETTER_AUTH_URL: "the public site URL, e.g. https://rockclimberstribe.com",
      NEXT_PUBLIC_SITE_URL: "the public site URL, used for canonical links and the sitemap",
      ADMIN_EMAILS: "comma-separated emails that get admin access when they sign up",
    };

const missing = Object.keys(required).filter((k) => !process.env[k]?.trim());
for (const k of Object.keys(recommended).filter((k) => !process.env[k]?.trim())) {
  console.warn(`⚠ ${k} is not set: ${recommended[k]}`);
}
if (missing.length) {
  const where = isPreview ? "the Preview environment" : vercelEnv === "production" ? "the Production environment" : "your .env file";
  console.error(`\n✖ Missing required environment variables for ${where}:\n`);
  for (const k of missing) console.error(`  ${k}: ${required[k]}`);
  console.error("\nAdd them in Vercel under Project Settings > Environment Variables, then redeploy.\n");
  process.exit(1);
}
console.log(`✓ Environment variables look good (${vercelEnv})`);

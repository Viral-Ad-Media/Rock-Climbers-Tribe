import type { NextConfig } from "next";

/** Old WordPress slugs that were renamed. Read from the database at build time. */
async function slugRedirects() {
  const url = process.env.DATABASE_URL;
  if (!url) return [];
  try {
    let rows: { source: string; destination: string }[];
    if (/@(localhost|127\.0\.0\.1)[:/]/.test(url)) {
      const { Client } = await import("pg");
      const client = new Client({ connectionString: url });
      await client.connect();
      rows = (await client.query("select source, destination from redirect")).rows;
      await client.end();
    } else {
      const { neon } = await import("@neondatabase/serverless");
      rows = (await neon(url)`select source, destination from redirect`) as typeof rows;
    }
    return rows.map((r) => ({
      source: `/${r.source}/`,
      destination: `/${r.destination}/`,
      permanent: true,
    }));
  } catch (err) {
    console.warn("Could not load redirects from the database:", err);
    return [];
  }
}

const nextConfig: NextConfig = {
  // WordPress URLs ended in a slash; keep them identical so search rankings carry over
  trailingSlash: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return [
      // Old date-based permalinks: /2023/01/17/some-post/ -> /some-post/
      {
        source: "/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})/:slug/",
        destination: "/:slug/",
        permanent: true,
      },
      { source: "/category/:slug/", destination: "/:slug/", permanent: true },
      { source: "/feed/", destination: "/blog/", permanent: false },
      ...(await slugRedirects()),
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;

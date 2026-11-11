import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");
}

/**
 * Neon's HTTP driver in production. A plain local Postgres (localhost) works too,
 * which is handy for offline development and tests.
 */
const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url);

export const db = (
  isLocal ? drizzlePg(url, { schema }) : drizzleNeon(neon(url), { schema })
) as ReturnType<typeof drizzleNeon<typeof schema>>;

export { schema };

# Rock Climbers Tribe

The rockclimberstribe.com site, rebuilt from the WordPress backup of 19 Oct 2026 as a
Next.js app. Stack: **Next.js 16 (App Router) · Tailwind CSS 4 · Neon Postgres (Drizzle ORM) · Better Auth**.

## What's here

| Route | What it is |
| --- | --- |
| `/` | Home: hero search, categories, latest reviews, Spanish guides |
| `/blog/` | Every published article |
| `/<slug>/` | An article, or a category (`/outdoor-climbers/`, `/indoor-climbers-2/`, `/climbing-gear/`, `/spanish/`) |
| `/search/?q=` | Full-text search over titles, excerpts and content |
| `/sign-in/`, `/sign-up/`, `/account/` | Better Auth email + password |
| `/admin/` | Admin-only post list and editor (title, slug, HTML body, SEO fields, categories, draft/publish) |
| `/sitemap.xml`, `/robots.txt`, `/ads.txt` | SEO and AdSense files |

URLs match the old site exactly (same slugs, trailing slashes). Old slugs that WordPress
renamed (e.g. `/best-climbing-shoes-2023/`) and date-style permalinks permanently redirect
to the current article. Images live in `public/wp-content/uploads/` at their original paths.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL and BETTER_AUTH_SECRET
npm run db:migrate           # create tables
npm run db:seed              # load the articles from seed/content.json
npm run dev
```

To get admin access, put your email in `ADMIN_EMAILS` **before** signing up at `/sign-up/`.

`DATABASE_URL` can point at Neon (production) or a local Postgres on `localhost` for offline work.

## Deploying (Vercel)

Set these environment variables: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
(the public site URL, e.g. `https://rockclimberstribe.com`), `NEXT_PUBLIC_SITE_URL`,
`ADMIN_EMAILS`, and optionally the tracking IDs in `.env.example`.

Vercel runs `npm run vercel-build`, which migrates the database, seeds it if it is empty,
then builds. Seeding never overwrites a database that already has posts.

## Content scripts

- `npm run import:wp -- path/to/export.sql`: re-import from a WordPress SQL export (phpMyAdmin
  or mysqldump). Elementor layouts are converted to plain HTML; TablePress tables are inlined;
  everything passes through the same HTML sanitiser the admin editor uses.
- `npm run seed:export`: write the current database content to `seed/content.json`.

## Notes from the migration

- The old WordPress install was **compromised on 20 Aug 2026** (backdoor must-use plugins,
  a rogue admin user, and fake article folders proxying content from an attacker's server).
  None of the old PHP is used here; only the article text, images and SEO fields were carried over.
- Comparison-table star ratings and "View on Amazon" images were hot-linked from another site;
  they are now plain text and buttons.
- The "Brand: Eureka! | Occupancy: 6 Person…" lines under product headings were leftover
  tent-template placeholders and were dropped. The duplicated "Bestsellers" sidebar was dropped too.

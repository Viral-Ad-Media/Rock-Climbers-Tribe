import {
  boolean,
  customType,
  index,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Better Auth tables (core schema for email + password auth)          */
/* ------------------------------------------------------------------ */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("member"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

/* ------------------------------------------------------------------ */
/* Site content                                                        */
/* ------------------------------------------------------------------ */

export const category = pgTable("category", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  /** WordPress term_id, kept so re-imports update instead of duplicating */
  wpId: integer("wp_id").unique(),
});

export const post = pgTable(
  "post",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    /** "post" for articles, "page" for standalone pages */
    type: text("type").notNull().default("post"),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    /** Sanitised HTML body */
    content: text("content").notNull().default(""),
    coverImage: text("cover_image"),
    author: text("author"),
    /** "publish" | "draft" | "pending" | "private" | "trash". A publish date in the future means scheduled. */
    status: text("status").notNull().default("draft"),
    lang: text("lang").notNull().default("en"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    /** Rank Math-style focus keywords, comma separated; the first one is the primary keyword */
    focusKeyword: text("focus_keyword"),
    /** Last computed SEO score (0-100), refreshed on every save */
    seoScore: integer("seo_score"),
    canonicalUrl: text("canonical_url"),
    robotsNoindex: boolean("robots_noindex").notNull().default(false),
    /** Schema.org type for the article: "BlogPosting" | "Article" | "NewsArticle" | "none" */
    schemaType: text("schema_type").notNull().default("BlogPosting"),
    coverImageAlt: text("cover_image_alt"),
    /** "open" | "closed" */
    commentStatus: text("comment_status").notNull().default("open"),
    /** Status before it was trashed, so Restore puts it back */
    trashedFrom: text("trashed_from"),
    /** Show the table of contents on this post (when the site-wide setting allows it) */
    showToc: boolean("show_toc").notNull().default(true),
    publishedAt: timestamp("published_at"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    /** WordPress post ID, kept so re-imports update instead of duplicating */
    wpId: integer("wp_id").unique(),
  },
  (t) => [index("post_status_published_idx").on(t.status, t.publishedAt)],
);

export const postCategory = pgTable(
  "post_category",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => category.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.categoryId] })],
);

export const tag = pgTable("tag", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
});

export const postTag = pgTable(
  "post_tag",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.tagId] })],
);

export const comment = pgTable(
  "comment",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    parentId: integer("parent_id"),
    authorName: text("author_name").notNull(),
    authorEmail: text("author_email"),
    authorUrl: text("author_url"),
    userId: text("user_id"),
    content: text("content").notNull(),
    /** "pending" | "approved" | "spam" | "trash" */
    status: text("status").notNull().default("pending"),
    ip: text("ip"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("comment_post_status_idx").on(t.postId, t.status)],
);

/** bytea that works over both node-postgres and Neon's HTTP driver (which returns hex strings) */
const bytea = customType<{ data: Buffer; driverData: Buffer | string }>({
  dataType: () => "bytea",
  toDriver: (value) => `\\x${value.toString("hex")}`,
  fromDriver: (value) =>
    typeof value === "string" ? Buffer.from(value.replace(/^\\x/, ""), "hex") : Buffer.from(value),
});

/** Media library. Uploaded files live in `data`; imported WordPress files are served from /public via `url`. */
export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  url: text("url").notNull().unique(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size"),
  width: integer("width"),
  height: integer("height"),
  title: text("title"),
  alt: text("alt"),
  caption: text("caption"),
  data: bytea("data"),
  uploadedBy: text("uploaded_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Affiliate products, inserted into posts as product boxes with [product id="slug"] */
export const product = pgTable("product", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  /** The affiliate URL the visitor is sent to through /go/{slug}/ */
  url: text("url").notNull(),
  merchant: text("merchant"),
  image: text("image"),
  imageAlt: text("image_alt"),
  price: text("price"),
  /** 0-5, one decimal */
  rating: text("rating"),
  badge: text("badge"),
  description: text("description"),
  /** One item per line */
  pros: text("pros"),
  cons: text("cons"),
  buttonText: text("button_text"),
  /** JSON with this product's own box design; null means the site default (Settings > Affiliate Links) */
  design: text("design"),
  clicks: integer("clicks").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Site settings, like wp_options */
export const option = pgTable("option", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

/** Old URLs (renamed slugs from WordPress) that should permanently redirect */
export const redirect = pgTable("redirect", {
  source: text("source").primaryKey(),
  destination: text("destination").notNull(),
});

export type Post = typeof post.$inferSelect;
export type Category = typeof category.$inferSelect;
export type Tag = typeof tag.$inferSelect;
export type Product = typeof product.$inferSelect;
export type Comment = typeof comment.$inferSelect;
export type Media = typeof media.$inferSelect;

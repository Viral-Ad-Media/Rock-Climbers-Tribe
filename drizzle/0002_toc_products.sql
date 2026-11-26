CREATE TABLE "product" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"merchant" text,
	"image" text,
	"image_alt" text,
	"price" text,
	"rating" text,
	"badge" text,
	"description" text,
	"pros" text,
	"cons" text,
	"button_text" text,
	"clicks" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "post" ADD COLUMN "show_toc" boolean DEFAULT true NOT NULL;
CREATE TYPE "public"."category_color" AS ENUM('blue', 'cyan', 'teal', 'green', 'lime', 'yellow', 'orange', 'red', 'pink', 'purple', 'violet', 'slate');--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "color" "category_color" DEFAULT 'blue' NOT NULL;--> statement-breakpoint
UPDATE "categories" AS c
SET "color" = spread."color"
FROM (
	SELECT
		"id",
		(ARRAY['blue', 'cyan', 'teal', 'green', 'lime', 'yellow', 'orange', 'red', 'pink', 'purple', 'violet', 'slate']::"public"."category_color"[])[
			1 + ((row_number() OVER (PARTITION BY "user_id", "type" ORDER BY "name", "id") - 1) % 12)
		] AS "color"
	FROM "categories"
) AS spread
WHERE c."id" = spread."id";

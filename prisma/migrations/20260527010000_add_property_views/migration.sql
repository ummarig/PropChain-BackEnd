-- Migration: Add property views tracking (TASK 2)
-- Adds raw view events table and a denormalized view_count counter on properties.

ALTER TABLE "properties"
    ADD COLUMN IF NOT EXISTS "view_count" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "properties_view_count_idx"
    ON "properties" ("view_count");

CREATE TABLE "property_views" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "user_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "referrer" TEXT,
    "session_id" TEXT,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_views_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "property_views_property_id_viewed_at_idx"
    ON "property_views" ("property_id", "viewed_at");

CREATE INDEX "property_views_user_id_idx"
    ON "property_views" ("user_id");

CREATE INDEX "property_views_ip_address_idx"
    ON "property_views" ("ip_address");

ALTER TABLE "property_views"
    ADD CONSTRAINT "property_views_property_id_fkey"
    FOREIGN KEY ("property_id") REFERENCES "properties" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "property_views"
    ADD CONSTRAINT "property_views_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users" ("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

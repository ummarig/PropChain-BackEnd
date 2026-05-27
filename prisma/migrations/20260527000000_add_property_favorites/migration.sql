-- Migration: Add property_favorites table (TASK 1: Property Favorites)
-- Allows users to save/bookmark properties.

CREATE TABLE "property_favorites" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_favorites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "property_favorites_user_id_property_id_key"
    ON "property_favorites" ("user_id", "property_id");

CREATE INDEX "property_favorites_user_id_created_at_idx"
    ON "property_favorites" ("user_id", "created_at");

CREATE INDEX "property_favorites_property_id_idx"
    ON "property_favorites" ("property_id");

ALTER TABLE "property_favorites"
    ADD CONSTRAINT "property_favorites_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "property_favorites"
    ADD CONSTRAINT "property_favorites_property_id_fkey"
    FOREIGN KEY ("property_id") REFERENCES "properties" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

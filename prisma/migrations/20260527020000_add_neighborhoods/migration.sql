-- Migration: Add neighborhood data (TASK 4: school ratings, crime stats, amenities, walk score)

CREATE TABLE "neighborhoods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'USA',
    "walk_score" INTEGER,
    "transit_score" INTEGER,
    "bike_score" INTEGER,
    "crime_index" DOUBLE PRECISION,
    "crime_rate" JSONB,
    "school_rating" DOUBLE PRECISION,
    "description" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "neighborhoods_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "neighborhoods_name_city_state_key"
    ON "neighborhoods" ("name", "city", "state");

CREATE INDEX "neighborhoods_city_state_idx"
    ON "neighborhoods" ("city", "state");

CREATE TABLE "neighborhood_schools" (
    "id" TEXT NOT NULL,
    "neighborhood_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "distance_miles" DOUBLE PRECISION,
    "student_teacher_ratio" DOUBLE PRECISION,
    "enrollment_count" INTEGER,
    "url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "neighborhood_schools_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "neighborhood_schools_neighborhood_id_idx"
    ON "neighborhood_schools" ("neighborhood_id");
CREATE INDEX "neighborhood_schools_type_idx"
    ON "neighborhood_schools" ("type");

ALTER TABLE "neighborhood_schools"
    ADD CONSTRAINT "neighborhood_schools_neighborhood_id_fkey"
    FOREIGN KEY ("neighborhood_id") REFERENCES "neighborhoods" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "neighborhood_amenities" (
    "id" TEXT NOT NULL,
    "neighborhood_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "distance_miles" DOUBLE PRECISION,
    "rating" DOUBLE PRECISION,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "neighborhood_amenities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "neighborhood_amenities_neighborhood_id_idx"
    ON "neighborhood_amenities" ("neighborhood_id");
CREATE INDEX "neighborhood_amenities_category_idx"
    ON "neighborhood_amenities" ("category");

ALTER TABLE "neighborhood_amenities"
    ADD CONSTRAINT "neighborhood_amenities_neighborhood_id_fkey"
    FOREIGN KEY ("neighborhood_id") REFERENCES "neighborhoods" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "properties"
    ADD COLUMN IF NOT EXISTS "neighborhood_id" TEXT;

CREATE INDEX IF NOT EXISTS "properties_neighborhood_id_idx"
    ON "properties" ("neighborhood_id");

ALTER TABLE "properties"
    ADD CONSTRAINT "properties_neighborhood_id_fkey"
    FOREIGN KEY ("neighborhood_id") REFERENCES "neighborhoods" ("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

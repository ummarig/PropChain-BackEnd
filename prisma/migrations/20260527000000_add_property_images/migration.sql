-- Property gallery images with optimized variants and ordering (#TASK2)

CREATE TABLE IF NOT EXISTS "property_images" (
  "id"            TEXT          NOT NULL,
  "property_id"   TEXT          NOT NULL,
  "url"           TEXT          NOT NULL,
  "thumbnail_url" TEXT          NOT NULL,
  "medium_url"    TEXT          NOT NULL,
  "filename"      TEXT          NOT NULL,
  "mime_type"     TEXT          NOT NULL,
  "size"          INTEGER       NOT NULL,
  "width"         INTEGER,
  "height"        INTEGER,
  "order"         INTEGER       NOT NULL DEFAULT 0,
  "is_primary"    BOOLEAN       NOT NULL DEFAULT FALSE,
  "created_at"    TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP(3)  NOT NULL,

  CONSTRAINT "property_images_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "property_images_property_id_fkey"
    FOREIGN KEY ("property_id")
    REFERENCES "properties"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "property_images_property_id_order_idx"
  ON "property_images"("property_id", "order");

CREATE INDEX IF NOT EXISTS "property_images_property_id_is_primary_idx"
  ON "property_images"("property_id", "is_primary");

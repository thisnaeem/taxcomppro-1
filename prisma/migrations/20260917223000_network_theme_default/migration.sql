ALTER TABLE "pro_networks" ALTER COLUMN "accentColor" SET DEFAULT '#e8c449';
UPDATE "pro_networks" SET "accentColor" = '#e8c449' WHERE "accentColor" = '#d2f58a';

ALTER TABLE "pro_network_discussions" ADD COLUMN "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], ADD COLUMN "videoUrl" TEXT;
ALTER TABLE "pro_networks" ALTER COLUMN "accentColor" SET DEFAULT '#65a832';

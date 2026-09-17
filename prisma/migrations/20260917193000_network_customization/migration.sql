ALTER TABLE "users" ADD COLUMN "professionalTitle" TEXT;
ALTER TABLE "pro_networks" ADD COLUMN "accentColor" TEXT NOT NULL DEFAULT '#d2f58a';
ALTER TABLE "pro_networks" ALTER COLUMN "monthlyPrice" SET DEFAULT 0;

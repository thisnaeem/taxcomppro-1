ALTER TABLE "users" ADD COLUMN "profileSlug" TEXT;
CREATE UNIQUE INDEX "users_profileSlug_key" ON "users"("profileSlug");

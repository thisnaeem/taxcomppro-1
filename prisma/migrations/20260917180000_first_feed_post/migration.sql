ALTER TABLE "users" ADD COLUMN "firstFeedPostAt" TIMESTAMP(3);

-- Existing authors have already passed this milestone.
UPDATE "users" AS u
SET "firstFeedPostAt" = p."firstPublishedAt"
FROM (
  SELECT "authorId", MIN("createdAt") AS "firstPublishedAt"
  FROM "posts"
  WHERE "communityId" IS NULL AND "scheduledAt" IS NULL
  GROUP BY "authorId"
) AS p
WHERE u.id = p."authorId";

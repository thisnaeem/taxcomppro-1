-- CreateTable
CREATE TABLE "ai_specialists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "about" TEXT NOT NULL,
    "expertise" TEXT[],
    "starters" TEXT[],
    "signature" TEXT NOT NULL,
    "courseNames" TEXT[],
    "personality" TEXT NOT NULL,
    "boundaries" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'auto',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "autoPublish" BOOLEAN NOT NULL DEFAULT false,
    "autoReply" BOOLEAN NOT NULL DEFAULT false,
    "weeklyPosts" INTEGER NOT NULL DEFAULT 2,
    "destination" TEXT NOT NULL DEFAULT 'FEED',
    "destinationId" TEXT,
    "knowledge" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_specialists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_activities" (
    "id" TEXT NOT NULL,
    "specialistId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'POST',
    "status" TEXT NOT NULL DEFAULT 'GENERATING',
    "destination" TEXT NOT NULL,
    "destinationId" TEXT,
    "parentId" TEXT,
    "content" TEXT NOT NULL DEFAULT '',
    "provider" TEXT,
    "error" TEXT,
    "publishedUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_specialists_userId_key" ON "ai_specialists"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_activities_key_key" ON "ai_activities"("key");

-- CreateIndex
CREATE INDEX "ai_activities_specialistId_createdAt_idx" ON "ai_activities"("specialistId", "createdAt");

-- AddForeignKey
ALTER TABLE "ai_specialists" ADD CONSTRAINT "ai_specialists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_activities" ADD CONSTRAINT "ai_activities_specialistId_fkey" FOREIGN KEY ("specialistId") REFERENCES "ai_specialists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

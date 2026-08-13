-- CreateEnum
CREATE TYPE "TrainingStatus" AS ENUM ('INVITED', 'REGISTERED', 'TRAINING_STARTED', 'VIDEO_COMPLETED', 'ASSESSMENT_REQUIRED', 'PASSED', 'FAILED_RETAKE_REQUIRED', 'TRAINING_COMPLETED', 'ACCESS_REVOKED');

-- CreateTable
CREATE TABLE "training_versions" (
    "id" TEXT NOT NULL,
    "toolkitId" TEXT NOT NULL,
    "versionLabel" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "videoProvider" TEXT NOT NULL DEFAULT 'youtube',
    "videoId" TEXT,
    "videoUrl" TEXT,
    "videoDurationSeconds" INTEGER NOT NULL DEFAULT 0,
    "passingScore" INTEGER NOT NULL DEFAULT 80,
    "questionsToShow" INTEGER NOT NULL DEFAULT 25,
    "maxAttempts" INTEGER NOT NULL DEFAULT 2,
    "acknowledgmentText" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_questions" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT[],
    "correctIndex" INTEGER NOT NULL,
    "explanation" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_licenses" (
    "id" TEXT NOT NULL,
    "eroId" TEXT NOT NULL,
    "toolkitId" TEXT NOT NULL,
    "officeName" TEXT,
    "totalSeats" INTEGER NOT NULL DEFAULT 5,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_seat_purchases" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "seats" INTEGER NOT NULL,
    "priceUsd" DOUBLE PRECISION NOT NULL,
    "stripeSessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_seat_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_invitations" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "eroId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "inviteToken" TEXT NOT NULL,
    "status" "TrainingStatus" NOT NULL DEFAULT 'INVITED',
    "videoFurthestSeconds" INTEGER NOT NULL DEFAULT 0,
    "videoCompletedAt" TIMESTAMP(3),
    "trainingStartedAt" TIMESTAMP(3),
    "registeredAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_attempts" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "questionIds" TEXT[],
    "answers" INTEGER[],
    "score" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "assessment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_acknowledgments" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "officeName" TEXT,
    "versionLabel" TEXT NOT NULL,
    "statements" TEXT[],
    "signatureName" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_acknowledgments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_certificates" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "score" INTEGER NOT NULL,
    "versionLabel" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "training_licenses_eroId_toolkitId_key" ON "training_licenses"("eroId", "toolkitId");

-- CreateIndex
CREATE UNIQUE INDEX "training_seat_purchases_stripeSessionId_key" ON "training_seat_purchases"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_invitations_inviteToken_key" ON "staff_invitations"("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "staff_invitations_licenseId_email_key" ON "staff_invitations"("licenseId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "training_acknowledgments_invitationId_key" ON "training_acknowledgments"("invitationId");

-- CreateIndex
CREATE UNIQUE INDEX "training_certificates_invitationId_key" ON "training_certificates"("invitationId");

-- CreateIndex
CREATE UNIQUE INDEX "training_certificates_certificateNumber_key" ON "training_certificates"("certificateNumber");

-- AddForeignKey
ALTER TABLE "training_questions" ADD CONSTRAINT "training_questions_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "training_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_licenses" ADD CONSTRAINT "training_licenses_eroId_fkey" FOREIGN KEY ("eroId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_seat_purchases" ADD CONSTRAINT "training_seat_purchases_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "training_licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_invitations" ADD CONSTRAINT "staff_invitations_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "training_licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_invitations" ADD CONSTRAINT "staff_invitations_eroId_fkey" FOREIGN KEY ("eroId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_invitations" ADD CONSTRAINT "staff_invitations_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "training_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_invitations" ADD CONSTRAINT "staff_invitations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "staff_invitations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_acknowledgments" ADD CONSTRAINT "training_acknowledgments_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "staff_invitations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_certificates" ADD CONSTRAINT "training_certificates_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "staff_invitations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

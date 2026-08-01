-- CreateEnum
CREATE TYPE "CardVisibility" AS ENUM ('PUBLIC', 'MEMBERS_ONLY', 'PRIVATE');

-- CreateTable
CREATE TABLE "digital_cards" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "isActivated" BOOLEAN NOT NULL DEFAULT false,
    "activatedAt" TIMESTAMP(3),
    "professionalTitle" TEXT,
    "businessName" TEXT,
    "businessDescription" TEXT,
    "phone" TEXT,
    "bookingUrl" TEXT,
    "businessAddress" TEXT,
    "logoUrl" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'classic',
    "accentColor" TEXT NOT NULL DEFAULT '#0a1628',
    "phoneVisibility" "CardVisibility" NOT NULL DEFAULT 'PUBLIC',
    "emailVisibility" "CardVisibility" NOT NULL DEFAULT 'PUBLIC',
    "addressVisibility" "CardVisibility" NOT NULL DEFAULT 'PRIVATE',
    "bookingVisibility" "CardVisibility" NOT NULL DEFAULT 'PUBLIC',
    "websiteVisibility" "CardVisibility" NOT NULL DEFAULT 'PUBLIC',
    "socialVisibility" "CardVisibility" NOT NULL DEFAULT 'PUBLIC',
    "servicesVisibility" "CardVisibility" NOT NULL DEFAULT 'PUBLIC',
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "nfcTaps" INTEGER NOT NULL DEFAULT 0,
    "qrScans" INTEGER NOT NULL DEFAULT 0,
    "contactSaves" INTEGER NOT NULL DEFAULT 0,
    "shareClicks" INTEGER NOT NULL DEFAULT 0,
    "fullProfileClicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "digital_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_links" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "scheduledStart" TIMESTAMP(3),
    "scheduledEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "digital_cards_userId_key" ON "digital_cards"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "digital_cards_username_key" ON "digital_cards"("username");

-- AddForeignKey
ALTER TABLE "digital_cards" ADD CONSTRAINT "digital_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_links" ADD CONSTRAINT "card_links_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "digital_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

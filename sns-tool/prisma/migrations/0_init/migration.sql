-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "profileUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourcePost" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "originalText" TEXT NOT NULL,
    "mediaUrls" TEXT,
    "engagement" INTEGER NOT NULL DEFAULT 0,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourcePost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Draft" (
    "id" TEXT NOT NULL,
    "sourcePostId" TEXT,
    "originalText" TEXT,
    "rewrittenText" TEXT NOT NULL,
    "imageUrl" TEXT,
    "imageSource" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "errorMessage" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "platforms" TEXT NOT NULL DEFAULT '["x","threads"]',
    "xPostId" TEXT,
    "threadsPostId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Draft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_platform_username_key" ON "Account"("platform", "username");

-- CreateIndex
CREATE UNIQUE INDEX "SourcePost_platform_originalUrl_key" ON "SourcePost"("platform", "originalUrl");

-- AddForeignKey
ALTER TABLE "SourcePost" ADD CONSTRAINT "SourcePost_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Draft" ADD CONSTRAINT "Draft_sourcePostId_fkey" FOREIGN KEY ("sourcePostId") REFERENCES "SourcePost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

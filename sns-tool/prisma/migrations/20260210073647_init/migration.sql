-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "profileUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SourcePost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "originalText" TEXT NOT NULL,
    "mediaUrls" TEXT,
    "engagement" INTEGER NOT NULL DEFAULT 0,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SourcePost_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Draft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourcePostId" TEXT,
    "originalText" TEXT,
    "rewrittenText" TEXT NOT NULL,
    "imageUrl" TEXT,
    "imageSource" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "errorMessage" TEXT,
    "scheduledAt" DATETIME,
    "publishedAt" DATETIME,
    "platforms" TEXT NOT NULL DEFAULT '["x","threads"]',
    "xPostId" TEXT,
    "threadsPostId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Draft_sourcePostId_fkey" FOREIGN KEY ("sourcePostId") REFERENCES "SourcePost" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_platform_username_key" ON "Account"("platform", "username");

-- CreateIndex
CREATE UNIQUE INDEX "SourcePost_platform_originalUrl_key" ON "SourcePost"("platform", "originalUrl");

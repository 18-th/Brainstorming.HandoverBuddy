-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "githubId" TEXT NOT NULL,
    "githubLogin" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Handover" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "leavingDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "creatorId" TEXT NOT NULL,
    CONSTRAINT "Handover_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HandoverItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prNumber" INTEGER NOT NULL,
    "prTitle" TEXT NOT NULL,
    "prUrl" TEXT NOT NULL,
    "repoFullName" TEXT NOT NULL,
    "newOwnerLogin" TEXT,
    "notes" TEXT,
    "confirmToken" TEXT NOT NULL,
    "confirmedAt" DATETIME,
    "confirmedByName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "handoverId" TEXT NOT NULL,
    CONSTRAINT "HandoverItem_handoverId_fkey" FOREIGN KEY ("handoverId") REFERENCES "Handover" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_githubId_key" ON "User"("githubId");

-- CreateIndex
CREATE UNIQUE INDEX "HandoverItem_confirmToken_key" ON "HandoverItem"("confirmToken");

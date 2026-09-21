/*
  Warnings:

  - You are about to drop the column `notes` on the `Progress` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Todo',
    "masteryLevel" INTEGER NOT NULL DEFAULT 0,
    "interval" INTEGER NOT NULL DEFAULT 0,
    "easiness" REAL NOT NULL DEFAULT 2.5,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "lastReview" DATETIME,
    "nextReview" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Progress_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Progress" ("createdAt", "easiness", "id", "interval", "lastReview", "masteryLevel", "nextReview", "problemId", "reviewCount", "status", "updatedAt", "userId") SELECT "createdAt", "easiness", "id", "interval", "lastReview", "masteryLevel", "nextReview", "problemId", "reviewCount", "status", "updatedAt", "userId" FROM "Progress";
DROP TABLE "Progress";
ALTER TABLE "new_Progress" RENAME TO "Progress";
CREATE UNIQUE INDEX "Progress_userId_problemId_key" ON "Progress"("userId", "problemId");
CREATE TABLE "new_Submission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "progressId" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "language" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Submission_progressId_fkey" FOREIGN KEY ("progressId") REFERENCES "Progress" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Submission" ("code", "createdAt", "id", "isMain", "language", "progressId", "updatedAt") SELECT "code", "createdAt", "id", "isMain", "language", "progressId", "updatedAt" FROM "Submission";
DROP TABLE "Submission";
ALTER TABLE "new_Submission" RENAME TO "Submission";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

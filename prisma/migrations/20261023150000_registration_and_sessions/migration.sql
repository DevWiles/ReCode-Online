-- Self-registration with invite codes, verified emails, account disabling and
-- revocable sessions. Only adds columns and tables; every existing row is kept.

-- CreateTable
CREATE TABLE "InviteCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" DATETIME,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InviteCode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmailCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "userId" TEXT,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "ip" TEXT NOT NULL DEFAULT 'unknown',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "email" TEXT,
    "emailVerifiedAt" DATETIME,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "sessionVersion" INTEGER NOT NULL DEFAULT 0,
    "inviteCodeId" TEXT,
    "avatar" TEXT,
    "preferredLang" TEXT NOT NULL DEFAULT 'typescript',
    "uiLanguage" TEXT NOT NULL DEFAULT 'en',
    "themeColor" TEXT NOT NULL DEFAULT 'emerald',
    "dailyReviewLimit" INTEGER NOT NULL DEFAULT 50,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_inviteCodeId_fkey" FOREIGN KEY ("inviteCodeId") REFERENCES "InviteCode" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("avatar", "createdAt", "dailyReviewLimit", "id", "passwordHash", "preferredLang", "role", "themeColor", "uiLanguage", "username") SELECT "avatar", "createdAt", "dailyReviewLimit", "id", "passwordHash", "preferredLang", "role", "themeColor", "uiLanguage", "username" FROM "User";
-- Abort (the CHECK fails and the migration rolls back) if any account went missing
CREATE TEMP TABLE "_NoUserLost" ("ok" INTEGER NOT NULL CHECK ("ok" = 1));
INSERT INTO "_NoUserLost" SELECT (SELECT count(*) FROM "new_User") = (SELECT count(*) FROM "User");
DROP TABLE "_NoUserLost";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "InviteCode_code_key" ON "InviteCode"("code");

-- CreateIndex
CREATE INDEX "EmailCode_email_purpose_idx" ON "EmailCode"("email", "purpose");

-- CreateIndex
CREATE INDEX "EmailCode_ip_createdAt_idx" ON "EmailCode"("ip", "createdAt");


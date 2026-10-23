-- Problems become private to the user who recorded them.
--
-- Each existing problem goes to the user of its earliest progress row. Should
-- several users already share one, everyone after the first gets a copy whose
-- id is "<original id>_<user id>", and their progress is pointed at it.
-- Problems nobody has progress on go to the administrator, so no row is lost.

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Problem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'LEETCODE',
    "pid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "url" TEXT,
    "difficulty" TEXT NOT NULL,
    "difficultyLevel" INTEGER NOT NULL DEFAULT 1,
    "tags" TEXT NOT NULL,
    CONSTRAINT "Problem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TEMP TABLE "_ProblemOwner" AS
SELECT
    "id" AS "progressId",
    "problemId",
    "userId",
    ROW_NUMBER() OVER (PARTITION BY "problemId" ORDER BY "createdAt", "id") AS "rank"
FROM "Progress";

INSERT INTO "new_Problem" ("id", "userId", "platform", "pid", "title", "slug", "url", "difficulty", "difficultyLevel", "tags")
SELECT
    CASE WHEN o."rank" = 1 THEN p."id" ELSE p."id" || '_' || o."userId" END,
    o."userId", p."platform", p."pid", p."title", p."slug", p."url", p."difficulty", p."difficultyLevel", p."tags"
FROM "_ProblemOwner" o
JOIN "Problem" p ON p."id" = o."problemId";

-- Rows without progress: earliest admin, else earliest account
INSERT INTO "new_Problem" ("id", "userId", "platform", "pid", "title", "slug", "url", "difficulty", "difficultyLevel", "tags")
SELECT
    p."id",
    (SELECT "id" FROM "User" ORDER BY ("role" = 'ADMIN') DESC, "createdAt", "id" LIMIT 1),
    p."platform", p."pid", p."title", p."slug", p."url", p."difficulty", p."difficultyLevel", p."tags"
FROM "Problem" p
WHERE p."id" NOT IN (SELECT "problemId" FROM "_ProblemOwner")
  AND EXISTS (SELECT 1 FROM "User");

UPDATE "Progress"
SET "problemId" = "problemId" || '_' || "userId"
WHERE "id" IN (SELECT "progressId" FROM "_ProblemOwner" WHERE "rank" > 1);

-- Abort (the CHECK fails and the migration rolls back) if any row went missing
CREATE TEMP TABLE "_NoRowLost" ("ok" INTEGER NOT NULL CHECK ("ok" = 1));
INSERT INTO "_NoRowLost" SELECT
    (SELECT count(*) FROM "new_Problem") >= (SELECT count(*) FROM "Problem")
    AND (SELECT count(*) FROM "Progress" g LEFT JOIN "new_Problem" n ON n."id" = g."problemId" AND n."userId" = g."userId" WHERE n."id" IS NULL) = 0;
DROP TABLE "_NoRowLost";

DROP TABLE "_ProblemOwner";
DROP TABLE "Problem";
ALTER TABLE "new_Problem" RENAME TO "Problem";
CREATE UNIQUE INDEX "Problem_userId_platform_pid_key" ON "Problem"("userId", "platform", "pid");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

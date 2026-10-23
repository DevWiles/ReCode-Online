-- AlterTable
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'USER';

-- The original owner account becomes the administrator
UPDATE "User" SET "role" = 'ADMIN' WHERE lower("username") = 'devwiles';

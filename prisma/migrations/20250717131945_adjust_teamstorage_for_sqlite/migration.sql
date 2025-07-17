/*
  Warnings:

  - You are about to drop the `project_asset_settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `translatable_assets` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `projectId` to the `assets` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "project_asset_settings_projectId_assetId_key";

-- DropIndex
DROP INDEX "translatable_assets_assetId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "project_asset_settings";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "translatable_assets";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "team_storages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "teamId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "assetTypes" TEXT NOT NULL,
    CONSTRAINT "team_storages_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "project_proposals" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "teamId" INTEGER NOT NULL,
    "contentId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "storageMapping" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_proposals_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "project_proposals_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "contents" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "teamId" INTEGER NOT NULL,
    "contentId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECRUITING',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proposalId" INTEGER,
    CONSTRAINT "Project_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Project_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "contents" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Project_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "project_proposals" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);
INSERT INTO "new_Project" ("contentId", "createdAt", "id", "isPublic", "name", "status", "teamId") SELECT "contentId", "createdAt", "id", "isPublic", "name", "status", "teamId" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE UNIQUE INDEX "Project_proposalId_key" ON "Project"("proposalId");
CREATE TABLE "new_assets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isNonDialogue" BOOLEAN NOT NULL DEFAULT false,
    "uploadedById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contentId" INTEGER,
    CONSTRAINT "assets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assets_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "assets_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "contents" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_assets" ("contentId", "createdAt", "id", "name", "path", "type", "uploadedById") SELECT "contentId", "createdAt", "id", "name", "path", "type", "uploadedById" FROM "assets";
DROP TABLE "assets";
ALTER TABLE "new_assets" RENAME TO "assets";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

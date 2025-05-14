/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `dubbing_artists` table. All the data in the column will be lost.
  - You are about to drop the column `coverImage` on the `projects` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_dubbing_artists" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "bio" TEXT,
    "imagePublicId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_dubbing_artists" ("bio", "createdAt", "firstName", "id", "lastName", "updatedAt") SELECT "bio", "createdAt", "firstName", "id", "lastName", "updatedAt" FROM "dubbing_artists";
DROP TABLE "dubbing_artists";
ALTER TABLE "new_dubbing_artists" RENAME TO "dubbing_artists";
CREATE TABLE "new_projects" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "coverImagePublicId" TEXT,
    "releaseDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_projects" ("coverImagePublicId", "createdAt", "description", "id", "isPublished", "releaseDate", "slug", "title", "type", "updatedAt") SELECT "coverImagePublicId", "createdAt", "description", "id", "isPublished", "releaseDate", "slug", "title", "type", "updatedAt" FROM "projects";
DROP TABLE "projects";
ALTER TABLE "new_projects" RENAME TO "projects";
CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

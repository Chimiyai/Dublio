-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_dubbing_artists" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "slug" TEXT,
    "bio" TEXT,
    "imagePublicId" TEXT,
    "siteRole" TEXT,
    "websiteUrl" TEXT,
    "twitterUrl" TEXT,
    "instagramUrl" TEXT,
    "youtubeUrl" TEXT,
    "linkedinUrl" TEXT,
    "githubUrl" TEXT,
    "donationLink" TEXT,
    "isTeamMember" BOOLEAN NOT NULL DEFAULT false,
    "teamOrder" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_dubbing_artists" ("bio", "createdAt", "firstName", "id", "imagePublicId", "lastName", "updatedAt") SELECT "bio", "createdAt", "firstName", "id", "imagePublicId", "lastName", "updatedAt" FROM "dubbing_artists";
DROP TABLE "dubbing_artists";
ALTER TABLE "new_dubbing_artists" RENAME TO "dubbing_artists";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

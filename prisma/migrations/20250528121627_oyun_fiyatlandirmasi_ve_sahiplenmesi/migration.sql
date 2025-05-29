-- AlterTable
ALTER TABLE "projects" ADD COLUMN "currency" TEXT DEFAULT 'TRY';
ALTER TABLE "projects" ADD COLUMN "price" REAL;

-- CreateTable
CREATE TABLE "user_owned_games" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "projectId" INTEGER NOT NULL,
    "purchasedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purchasePrice" REAL,
    CONSTRAINT "user_owned_games_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_owned_games_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "user_owned_games_userId_projectId_key" ON "user_owned_games"("userId", "projectId");

-- CreateTable
CREATE TABLE "dubbing_artist_likes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "artistId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dubbing_artist_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "dubbing_artist_likes_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "dubbing_artists" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dubbing_artist_favorites" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "artistId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dubbing_artist_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "dubbing_artist_favorites_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "dubbing_artists" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "dubbing_artist_likes_userId_artistId_key" ON "dubbing_artist_likes"("userId", "artistId");

-- CreateIndex
CREATE UNIQUE INDEX "dubbing_artist_favorites_userId_artistId_key" ON "dubbing_artist_favorites"("userId", "artistId");

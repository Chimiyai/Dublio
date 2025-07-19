-- CreateTable
CREATE TABLE "raw_voice_recordings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lineId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "raw_voice_recordings_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "translation_lines" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "raw_voice_recordings_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_translation_lines" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sourceAssetId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "originalText" TEXT,
    "translatedText" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NOT_TRANSLATED',
    "notes" TEXT,
    "voiceRecordingUrl" TEXT,
    "recordingStatus" TEXT NOT NULL DEFAULT 'PENDING_RECORDING',
    "isNonDialogue" BOOLEAN NOT NULL DEFAULT false,
    "characterId" INTEGER,
    "originalVoiceReferenceAssetId" INTEGER,
    CONSTRAINT "translation_lines_sourceAssetId_fkey" FOREIGN KEY ("sourceAssetId") REFERENCES "assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "translation_lines_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "translation_lines_originalVoiceReferenceAssetId_fkey" FOREIGN KEY ("originalVoiceReferenceAssetId") REFERENCES "assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_translation_lines" ("characterId", "id", "isNonDialogue", "key", "notes", "originalText", "originalVoiceReferenceAssetId", "sourceAssetId", "status", "translatedText", "voiceRecordingUrl") SELECT "characterId", "id", "isNonDialogue", "key", "notes", "originalText", "originalVoiceReferenceAssetId", "sourceAssetId", "status", "translatedText", "voiceRecordingUrl" FROM "translation_lines";
DROP TABLE "translation_lines";
ALTER TABLE "new_translation_lines" RENAME TO "translation_lines";
CREATE UNIQUE INDEX "translation_lines_sourceAssetId_key_key" ON "translation_lines"("sourceAssetId", "key");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "raw_voice_recordings_lineId_key" ON "raw_voice_recordings"("lineId");

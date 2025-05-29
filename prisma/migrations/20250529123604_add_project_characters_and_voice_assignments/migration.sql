-- CreateTable
CREATE TABLE "project_characters" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "project_characters_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "voice_assignments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectAssignmentId" INTEGER NOT NULL,
    "projectCharacterId" INTEGER NOT NULL,
    CONSTRAINT "voice_assignments_projectAssignmentId_fkey" FOREIGN KEY ("projectAssignmentId") REFERENCES "project_assignments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "voice_assignments_projectCharacterId_fkey" FOREIGN KEY ("projectCharacterId") REFERENCES "project_characters" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "project_characters_projectId_idx" ON "project_characters"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "project_characters_projectId_name_key" ON "project_characters"("projectId", "name");

-- CreateIndex
CREATE INDEX "voice_assignments_projectAssignmentId_idx" ON "voice_assignments"("projectAssignmentId");

-- CreateIndex
CREATE INDEX "voice_assignments_projectCharacterId_idx" ON "voice_assignments"("projectCharacterId");

-- CreateIndex
CREATE UNIQUE INDEX "voice_assignments_projectAssignmentId_projectCharacterId_key" ON "voice_assignments"("projectAssignmentId", "projectCharacterId");

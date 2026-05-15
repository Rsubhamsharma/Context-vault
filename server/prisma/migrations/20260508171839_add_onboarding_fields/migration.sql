-- AlterTable
ALTER TABLE "User" ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboardingCompletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SmartExportCache" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "normalizedTask" TEXT NOT NULL,
    "originalTask" TEXT NOT NULL,
    "targetPlatform" TEXT NOT NULL,
    "exportText" TEXT NOT NULL,
    "characterCount" INTEGER NOT NULL,
    "estimatedTokens" INTEGER NOT NULL,
    "fullEstimatedTokens" INTEGER NOT NULL,
    "estimatedSavingsPercent" DOUBLE PRECISION,
    "relevanceMode" TEXT NOT NULL,
    "aiMetadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmartExportCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SmartExportCache_projectId_versionNumber_normalizedTask_tar_key" ON "SmartExportCache"("projectId", "versionNumber", "normalizedTask", "targetPlatform");

-- AddForeignKey
ALTER TABLE "SmartExportCache" ADD CONSTRAINT "SmartExportCache_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

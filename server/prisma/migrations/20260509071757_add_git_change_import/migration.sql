-- CreateTable
CREATE TABLE "GitChangeImport" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "changeType" TEXT NOT NULL,
    "branch" TEXT,
    "baseBranch" TEXT,
    "sanitizedInputPreview" TEXT,
    "rawInputHash" TEXT,
    "suggestedUpdateJson" JSONB,
    "redactionCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "createdVersionId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "appliedAt" TIMESTAMP(3),

    CONSTRAINT "GitChangeImport_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GitChangeImport" ADD CONSTRAINT "GitChangeImport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

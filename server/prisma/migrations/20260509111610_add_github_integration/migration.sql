-- CreateTable
CREATE TABLE "GitHubIntegration" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "repoOwner" TEXT NOT NULL,
    "repoName" TEXT NOT NULL,
    "repoFullName" TEXT NOT NULL,
    "repoUrl" TEXT NOT NULL,
    "defaultBranch" TEXT NOT NULL,
    "selectedBranch" TEXT,
    "installationId" TEXT,
    "githubAccountId" TEXT,
    "accessTokenEncrypted" TEXT,
    "permissionsSummary" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSyncedCommitSha" TEXT,

    CONSTRAINT "GitHubIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GitHubIntegration_projectId_key" ON "GitHubIntegration"("projectId");

-- AddForeignKey
ALTER TABLE "GitHubIntegration" ADD CONSTRAINT "GitHubIntegration_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

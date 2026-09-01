/*
  `roles.name` widens from the `SystemRole` enum to TEXT so that organizations can
  define custom (non-system) roles alongside the built-in ones. Existing values are
  preserved verbatim via an explicit cast — no data is dropped. The pre-existing
  `roles_name_key` unique index is rebuilt automatically by ALTER COLUMN ... TYPE.
*/
-- AlterTable
ALTER TABLE "roles" ALTER COLUMN "name" SET DATA TYPE TEXT USING "name"::TEXT;

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "altText" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "media_assets_organizationId_idx" ON "media_assets"("organizationId");

-- CreateIndex
CREATE INDEX "media_assets_uploadedById_idx" ON "media_assets"("uploadedById");

-- CreateIndex
CREATE INDEX "media_assets_mimeType_idx" ON "media_assets"("mimeType");

-- CreateIndex
CREATE INDEX "media_assets_deletedAt_idx" ON "media_assets"("deletedAt");

-- CreateIndex
CREATE INDEX "media_assets_organizationId_deletedAt_idx" ON "media_assets"("organizationId", "deletedAt");

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

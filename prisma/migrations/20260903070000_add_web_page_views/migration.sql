-- Website traffic analytics: one row per page view, grouped by sessionId.
CREATE TABLE "web_page_views" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "durationMs" INTEGER,
    "country" TEXT,
    "city" TEXT,
    "region" TEXT,
    "deviceType" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "web_page_views_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "web_page_views_sessionId_idx" ON "web_page_views"("sessionId");
CREATE INDEX "web_page_views_createdAt_idx" ON "web_page_views"("createdAt");
CREATE INDEX "web_page_views_path_idx" ON "web_page_views"("path");
CREATE INDEX "web_page_views_country_idx" ON "web_page_views"("country");

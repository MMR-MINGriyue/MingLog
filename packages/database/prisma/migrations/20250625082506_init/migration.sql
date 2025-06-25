-- CreateTable
CREATE TABLE "graphs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "settings" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "pages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "properties" TEXT,
    "tags" TEXT NOT NULL DEFAULT '',
    "isJournal" BOOLEAN NOT NULL DEFAULT false,
    "journalDate" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "graphId" TEXT NOT NULL,
    CONSTRAINT "pages_graphId_fkey" FOREIGN KEY ("graphId") REFERENCES "graphs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "blocks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "properties" TEXT,
    "refs" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "pageId" TEXT NOT NULL,
    "graphId" TEXT NOT NULL,
    CONSTRAINT "blocks_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "blocks_graphId_fkey" FOREIGN KEY ("graphId") REFERENCES "graphs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "blocks_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "blocks" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "links" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "linkType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fromBlockId" TEXT NOT NULL,
    "toPageId" TEXT,
    "fromPageId" TEXT,
    CONSTRAINT "links_fromBlockId_fkey" FOREIGN KEY ("fromBlockId") REFERENCES "blocks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "links_toPageId_fkey" FOREIGN KEY ("toPageId") REFERENCES "pages" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "links_fromPageId_fkey" FOREIGN KEY ("fromPageId") REFERENCES "pages" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "plugins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT,
    "author" TEXT,
    "main" TEXT NOT NULL,
    "permissions" TEXT NOT NULL DEFAULT '',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "settings" TEXT,
    "installedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "graphs_path_key" ON "graphs"("path");

-- CreateIndex
CREATE INDEX "pages_name_idx" ON "pages"("name");

-- CreateIndex
CREATE INDEX "pages_journalDate_idx" ON "pages"("journalDate");

-- CreateIndex
CREATE UNIQUE INDEX "pages_graphId_name_key" ON "pages"("graphId", "name");

-- CreateIndex
CREATE INDEX "blocks_pageId_idx" ON "blocks"("pageId");

-- CreateIndex
CREATE INDEX "blocks_parentId_idx" ON "blocks"("parentId");

-- CreateIndex
CREATE INDEX "blocks_content_idx" ON "blocks"("content");

-- CreateIndex
CREATE INDEX "links_fromBlockId_idx" ON "links"("fromBlockId");

-- CreateIndex
CREATE INDEX "links_toPageId_idx" ON "links"("toPageId");

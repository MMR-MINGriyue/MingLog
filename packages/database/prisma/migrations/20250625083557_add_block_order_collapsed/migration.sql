-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_blocks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "properties" TEXT,
    "refs" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "collapsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "pageId" TEXT NOT NULL,
    "graphId" TEXT NOT NULL,
    CONSTRAINT "blocks_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "blocks_graphId_fkey" FOREIGN KEY ("graphId") REFERENCES "graphs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "blocks_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "blocks" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_blocks" ("content", "createdAt", "graphId", "id", "pageId", "parentId", "properties", "refs", "updatedAt") SELECT "content", "createdAt", "graphId", "id", "pageId", "parentId", "properties", "refs", "updatedAt" FROM "blocks";
DROP TABLE "blocks";
ALTER TABLE "new_blocks" RENAME TO "blocks";
CREATE INDEX "blocks_pageId_idx" ON "blocks"("pageId");
CREATE INDEX "blocks_parentId_idx" ON "blocks"("parentId");
CREATE INDEX "blocks_order_idx" ON "blocks"("order");
CREATE INDEX "blocks_content_idx" ON "blocks"("content");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

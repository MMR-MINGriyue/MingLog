-- Performance optimization indexes for MingLog database
-- Migration 004: Add indexes for improved query performance

-- Full-text search indexes for pages
CREATE INDEX IF NOT EXISTS idx_pages_name_fts ON pages(name);
CREATE INDEX IF NOT EXISTS idx_pages_title_fts ON pages(title);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_pages_graph_created ON pages(graph_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pages_graph_updated ON pages(graph_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_pages_journal_date ON pages(is_journal, journal_date DESC);

-- Block indexes for performance
CREATE INDEX IF NOT EXISTS idx_blocks_page_order ON blocks(page_id, "order" ASC);
CREATE INDEX IF NOT EXISTS idx_blocks_page_created ON blocks(page_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blocks_parent ON blocks(parent_id);

-- Full-text search on block content
CREATE INDEX IF NOT EXISTS idx_blocks_content_fts ON blocks(content);

-- JSON field indexes for tags and refs (SQLite 3.38+)
-- Note: These may not work on older SQLite versions, but will be ignored if unsupported
CREATE INDEX IF NOT EXISTS idx_pages_tags ON pages(json_extract(tags, '$')) WHERE json_valid(tags);
CREATE INDEX IF NOT EXISTS idx_blocks_refs ON blocks(json_extract(refs, '$')) WHERE json_valid(refs);

-- Graph relationship indexes
CREATE INDEX IF NOT EXISTS idx_pages_graph_id ON pages(graph_id);
CREATE INDEX IF NOT EXISTS idx_blocks_graph_id ON blocks(graph_id);

-- Tag indexes
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_created ON tags(created_at DESC);

-- Performance indexes for search operations
CREATE INDEX IF NOT EXISTS idx_pages_search_composite ON pages(graph_id, name, title, is_journal);
CREATE INDEX IF NOT EXISTS idx_blocks_search_composite ON blocks(graph_id, page_id, content);

-- Indexes for common filtering operations
CREATE INDEX IF NOT EXISTS idx_pages_updated_desc ON pages(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_blocks_updated_desc ON blocks(updated_at DESC);

-- Covering indexes for frequently accessed columns
CREATE INDEX IF NOT EXISTS idx_pages_list_covering ON pages(graph_id, id, name, title, is_journal, created_at, updated_at);
CREATE INDEX IF NOT EXISTS idx_blocks_list_covering ON blocks(page_id, id, content, "order", created_at, updated_at);

use crate::error::{AppError, Result};

#[cfg(test)]
mod tests;
#[cfg(test)]
mod integration_tests;
use crate::models::{
    Graph, Page, Block, Note, Tag, Settings, Task, Project, TimeEntry,
    CreateGraphRequest, UpdateGraphRequest,
    CreatePageRequest, UpdatePageRequest,
    CreateBlockRequest, UpdateBlockRequest,
    CreateNoteRequest, UpdateNoteRequest, CreateTagRequest,
    CreateTaskRequest, UpdateTaskRequest,
    CreateProjectRequest, UpdateProjectRequest,
    CreateTimeEntryRequest,
    SearchRequest, SearchResult
};
use chrono::Utc;
use sqlx::{sqlite::{SqlitePool, SqlitePoolOptions}, Row};
use std::str::FromStr;
use std::path::PathBuf;

#[derive(Debug)]
pub struct Database {
    pool: SqlitePool,
}

#[allow(dead_code)]
impl Database {
    pub async fn new() -> Result<Self> {
        let db_path = Self::get_database_path()?;
        
        // Ensure the parent directory exists
        if let Some(parent) = db_path.parent() {
            tokio::fs::create_dir_all(parent).await?;
        }
        
        let database_url = format!("sqlite:{}", db_path.display());

        // Optimized connection pool settings for performance
        let pool = SqlitePoolOptions::new().max_connections(10)
            .max_connections(20)  // Increased for better concurrency
            .min_connections(5)   // Keep minimum connections alive
            .acquire_timeout(std::time::Duration::from_secs(30))
            .idle_timeout(std::time::Duration::from_secs(600))
            .max_lifetime(std::time::Duration::from_secs(1800))
            .connect_with(
                sqlx::sqlite::SqliteConnectOptions::from_str(&database_url)?
                    .create_if_missing(true)
                    .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal)  // WAL mode for better performance
                    .synchronous(sqlx::sqlite::SqliteSynchronous::Normal)  // Balanced safety/performance
                    .busy_timeout(std::time::Duration::from_secs(30))
                    .pragma("cache_size", "10000")  // 10MB cache
                    .pragma("temp_store", "memory")  // Use memory for temp tables
                    .pragma("mmap_size", "268435456")  // 256MB memory map
                    .pragma("foreign_keys", "ON")  // Enable foreign key constraints
            )
            .await?;
        
        let db = Self { pool };
        db.migrate().await?;

        // Optimize database after migrations
        db.optimize_database().await?;

        Ok(db)
    }

    #[allow(dead_code)]
    pub async fn new_with_path(db_path: &str) -> Result<Self> {
        // Ensure the parent directory exists
        let path = std::path::Path::new(db_path);
        if let Some(parent) = path.parent() {
            tokio::fs::create_dir_all(parent).await?;
        }

        let database_url = format!("sqlite:{}", db_path);

        // Use the same optimized settings as the main constructor
        let pool = SqlitePoolOptions::new()
            .max_connections(10)
            .acquire_timeout(std::time::Duration::from_secs(30))
            .connect_with(
                sqlx::sqlite::SqliteConnectOptions::from_str(&database_url)?
                    .create_if_missing(true)
                    .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal)
                    .synchronous(sqlx::sqlite::SqliteSynchronous::Normal)
                    .busy_timeout(std::time::Duration::from_secs(30))
                    .pragma("foreign_keys", "ON")  // Enable foreign key constraints
            )
            .await?;

        let db = Self { pool };
        db.migrate().await?;

        Ok(db)
    }

    fn get_database_path() -> Result<PathBuf> {
        let app_data_dir = dirs::data_dir()
            .ok_or_else(|| AppError::Internal("Could not find app data directory".to_string()))?;
        
        let app_dir = app_data_dir.join("com.minglog.desktop");
        Ok(app_dir.join("minglog.db"))
    }
    
    async fn migrate(&self) -> Result<()> {
        // Create new Graph/Page/Block tables
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS graphs (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                path TEXT NOT NULL UNIQUE,
                settings TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS pages (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                title TEXT,
                properties TEXT,
                tags TEXT NOT NULL DEFAULT '',
                is_journal BOOLEAN NOT NULL DEFAULT FALSE,
                journal_date TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                graph_id TEXT NOT NULL,
                FOREIGN KEY (graph_id) REFERENCES graphs(id) ON DELETE CASCADE,
                UNIQUE(graph_id, name)
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS blocks (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                parent_id TEXT,
                properties TEXT,
                refs TEXT NOT NULL DEFAULT '',
                "order" INTEGER NOT NULL DEFAULT 0,
                collapsed BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                page_id TEXT NOT NULL,
                graph_id TEXT NOT NULL,
                FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
                FOREIGN KEY (graph_id) REFERENCES graphs(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_id) REFERENCES blocks(id) ON DELETE CASCADE
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Create legacy tables for backward compatibility
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                tags TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
                is_archived BOOLEAN NOT NULL DEFAULT FALSE
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS tags (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                color TEXT,
                created_at TEXT NOT NULL
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            "#,
        )
        .execute(&self.pool)
        .await?;
        
        // Create indexes for new tables
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_graphs_name ON graphs(name)")
            .execute(&self.pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_pages_name ON pages(name)")
            .execute(&self.pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_pages_graph_id ON pages(graph_id)")
            .execute(&self.pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_pages_journal_date ON pages(journal_date)")
            .execute(&self.pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_blocks_page_id ON blocks(page_id)")
            .execute(&self.pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_blocks_parent_id ON blocks(parent_id)")
            .execute(&self.pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_blocks_order ON blocks(\"order\")")
            .execute(&self.pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_blocks_content ON blocks(content)")
            .execute(&self.pool)
            .await?;

        // Create indexes for legacy tables
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at)")
            .execute(&self.pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at)")
            .execute(&self.pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_notes_title ON notes(title)")
            .execute(&self.pool)
            .await?;
        
        // Create FTS tables for search
        sqlx::query(
            r#"
            CREATE VIRTUAL TABLE IF NOT EXISTS blocks_fts USING fts5(
                id UNINDEXED,
                content,
                page_id UNINDEXED,
                graph_id UNINDEXED,
                content='blocks',
                content_rowid='rowid'
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE VIRTUAL TABLE IF NOT EXISTS pages_fts USING fts5(
                id UNINDEXED,
                name,
                title,
                graph_id UNINDEXED,
                content='pages',
                content_rowid='rowid'
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Legacy FTS table for notes
        sqlx::query(
            r#"
            CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
                id UNINDEXED,
                title,
                content,
                content='notes',
                content_rowid='rowid'
            )
            "#,
        )
        .execute(&self.pool)
        .await?;
        
        // Create triggers to keep FTS tables in sync

        // Blocks FTS triggers
        sqlx::query(
            r#"
            CREATE TRIGGER IF NOT EXISTS blocks_fts_insert AFTER INSERT ON blocks BEGIN
                INSERT INTO blocks_fts(id, content, page_id, graph_id) VALUES (new.id, new.content, new.page_id, new.graph_id);
            END
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TRIGGER IF NOT EXISTS blocks_fts_delete AFTER DELETE ON blocks BEGIN
                DELETE FROM blocks_fts WHERE id = old.id;
            END
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TRIGGER IF NOT EXISTS blocks_fts_update AFTER UPDATE ON blocks BEGIN
                DELETE FROM blocks_fts WHERE id = old.id;
                INSERT INTO blocks_fts(id, content, page_id, graph_id) VALUES (new.id, new.content, new.page_id, new.graph_id);
            END
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Pages FTS triggers
        sqlx::query(
            r#"
            CREATE TRIGGER IF NOT EXISTS pages_fts_insert AFTER INSERT ON pages BEGIN
                INSERT INTO pages_fts(id, name, title, graph_id) VALUES (new.id, new.name, new.title, new.graph_id);
            END
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TRIGGER IF NOT EXISTS pages_fts_delete AFTER DELETE ON pages BEGIN
                DELETE FROM pages_fts WHERE id = old.id;
            END
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TRIGGER IF NOT EXISTS pages_fts_update AFTER UPDATE ON pages BEGIN
                DELETE FROM pages_fts WHERE id = old.id;
                INSERT INTO pages_fts(id, name, title, graph_id) VALUES (new.id, new.name, new.title, new.graph_id);
            END
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Legacy notes FTS triggers
        sqlx::query(
            r#"
            CREATE TRIGGER IF NOT EXISTS notes_fts_insert AFTER INSERT ON notes BEGIN
                INSERT INTO notes_fts(id, title, content) VALUES (new.id, new.title, new.content);
            END
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TRIGGER IF NOT EXISTS notes_fts_delete AFTER DELETE ON notes BEGIN
                DELETE FROM notes_fts WHERE id = old.id;
            END
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TRIGGER IF NOT EXISTS notes_fts_update AFTER UPDATE ON notes BEGIN
                DELETE FROM notes_fts WHERE id = old.id;
                INSERT INTO notes_fts(id, title, content) VALUES (new.id, new.title, new.content);
            END
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Create default graph if it doesn't exist (for testing compatibility)
        sqlx::query(
            r#"
            INSERT OR IGNORE INTO graphs (id, name, path, settings, created_at, updated_at)
            VALUES ('default', 'Default Graph', 'default', '{}', datetime('now'), datetime('now'))
            "#
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    // Database optimization method
    async fn optimize_database(&self) -> Result<()> {
        // Run ANALYZE to update query planner statistics
        sqlx::query("ANALYZE")
            .execute(&self.pool)
            .await?;

        // Optimize FTS tables
        sqlx::query("INSERT INTO blocks_fts(blocks_fts) VALUES('optimize')")
            .execute(&self.pool)
            .await
            .ok(); // Ignore errors if FTS table doesn't exist

        sqlx::query("INSERT INTO pages_fts(pages_fts) VALUES('optimize')")
            .execute(&self.pool)
            .await
            .ok(); // Ignore errors if FTS table doesn't exist

        sqlx::query("INSERT INTO notes_fts(notes_fts) VALUES('optimize')")
            .execute(&self.pool)
            .await
            .ok(); // Ignore errors if FTS table doesn't exist

        // Create task management tables - projects first, then tasks
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                status TEXT NOT NULL DEFAULT 'active',
                color TEXT,
                start_date TEXT,
                due_date TEXT,
                completed_at TEXT,
                linked_notes TEXT DEFAULT '[]',
                linked_files TEXT DEFAULT '[]',
                progress INTEGER DEFAULT 0,
                total_tasks INTEGER DEFAULT 0,
                completed_tasks INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                created_by TEXT
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                status TEXT NOT NULL DEFAULT 'todo',
                priority TEXT NOT NULL DEFAULT 'medium',
                due_date TEXT,
                completed_at TEXT,
                estimated_time INTEGER,
                actual_time INTEGER,
                project_id TEXT,
                parent_task_id TEXT,
                linked_notes TEXT DEFAULT '[]',
                linked_files TEXT DEFAULT '[]',
                tags TEXT DEFAULT '[]',
                contexts TEXT DEFAULT '[]',
                recurrence TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                created_by TEXT,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
                FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS task_time_entries (
                id TEXT PRIMARY KEY,
                task_id TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT,
                duration INTEGER,
                description TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Create indexes for task management tables
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)")
            .execute(&self.pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)")
            .execute(&self.pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)")
            .execute(&self.pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id)")
            .execute(&self.pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at)")
            .execute(&self.pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)")
            .execute(&self.pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_projects_due_date ON projects(due_date)")
            .execute(&self.pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_time_entries_task_id ON task_time_entries(task_id)")
            .execute(&self.pool)
            .await?;

        // Create FTS tables for task search
        sqlx::query(
            r#"
            CREATE VIRTUAL TABLE IF NOT EXISTS tasks_fts USING fts5(
                id UNINDEXED,
                title,
                description,
                tags UNINDEXED,
                contexts UNINDEXED,
                content='tasks',
                content_rowid='rowid'
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE VIRTUAL TABLE IF NOT EXISTS projects_fts USING fts5(
                id UNINDEXED,
                name,
                description,
                content='projects',
                content_rowid='rowid'
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Create links table for bidirectional linking
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS links (
                id TEXT PRIMARY KEY,
                source_type TEXT NOT NULL CHECK (source_type IN ('page', 'block')),
                source_id TEXT NOT NULL,
                target_type TEXT NOT NULL CHECK (target_type IN ('page', 'block')),
                target_id TEXT NOT NULL,
                link_type TEXT NOT NULL CHECK (link_type IN ('page-reference', 'block-reference')),
                context TEXT,
                position INTEGER,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                UNIQUE(source_type, source_id, target_type, target_id, position)
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Create page aliases table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS page_aliases (
                id TEXT PRIMARY KEY,
                page_id TEXT NOT NULL,
                alias TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
                UNIQUE(alias)
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Create indexes for links table
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_links_source ON links(source_type, source_id)")
            .execute(&self.pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_links_target ON links(target_type, target_id)")
            .execute(&self.pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_links_type ON links(link_type)")
            .execute(&self.pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at)")
            .execute(&self.pool)
            .await?;

        // Create indexes for page aliases table
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_page_aliases_page_id ON page_aliases(page_id)")
            .execute(&self.pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_page_aliases_alias ON page_aliases(alias)")
            .execute(&self.pool)
            .await?;

        // Run VACUUM to reclaim space (only if needed)
        // Note: This is expensive, so we only do it occasionally
        sqlx::query("PRAGMA auto_vacuum = INCREMENTAL")
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    // Get database pool for advanced queries
    pub fn get_pool(&self) -> &SqlitePool {
        &self.pool
    }

    // Note operations
    pub async fn create_note(&self, request: CreateNoteRequest) -> Result<Note> {
        let mut note = Note::new(request.title, request.content);
        
        if let Some(tags) = request.tags {
            note.set_tags(tags);
        }
        
        sqlx::query(
            r#"
            INSERT INTO notes (id, title, content, tags, created_at, updated_at, is_favorite, is_archived)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&note.id)
        .bind(&note.title)
        .bind(&note.content)
        .bind(&note.tags)
        .bind(note.created_at.to_rfc3339())
        .bind(note.updated_at.to_rfc3339())
        .bind(note.is_favorite)
        .bind(note.is_archived)
        .execute(&self.pool)
        .await?;
        
        Ok(note)
    }
    
    pub async fn get_note(&self, id: &str) -> Result<Note> {
        let row = sqlx::query_as::<_, Note>(
            "SELECT id, title, content, tags, created_at, updated_at, is_favorite, is_archived FROM notes WHERE id = ?"
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await?;
        
        Ok(row)
    }
    
    pub async fn get_notes(&self, limit: Option<i32>, offset: Option<i32>) -> Result<Vec<Note>> {
        let limit = limit.unwrap_or(50);
        let offset = offset.unwrap_or(0);
        
        let notes = sqlx::query_as::<_, Note>(
            r#"
            SELECT id, title, content, tags, created_at, updated_at, is_favorite, is_archived 
            FROM notes 
            WHERE is_archived = FALSE 
            ORDER BY updated_at DESC 
            LIMIT ? OFFSET ?
            "#
        )
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.pool)
        .await?;
        
        Ok(notes)
    }
    
    pub async fn update_note(&self, request: UpdateNoteRequest) -> Result<Note> {
        let mut note = self.get_note(&request.id).await?;
        
        if let Some(title) = request.title {
            note.title = title;
        }
        
        if let Some(content) = request.content {
            note.content = content;
        }
        
        if let Some(tags) = request.tags {
            note.set_tags(tags);
        }
        
        if let Some(is_favorite) = request.is_favorite {
            note.is_favorite = is_favorite;
        }
        
        if let Some(is_archived) = request.is_archived {
            note.is_archived = is_archived;
        }
        
        note.updated_at = Utc::now();
        
        sqlx::query(
            r#"
            UPDATE notes 
            SET title = ?, content = ?, tags = ?, updated_at = ?, is_favorite = ?, is_archived = ?
            WHERE id = ?
            "#,
        )
        .bind(&note.title)
        .bind(&note.content)
        .bind(&note.tags)
        .bind(note.updated_at.to_rfc3339())
        .bind(note.is_favorite)
        .bind(note.is_archived)
        .bind(&note.id)
        .execute(&self.pool)
        .await?;
        
        Ok(note)
    }
    
    pub async fn delete_note(&self, id: &str) -> Result<()> {
        sqlx::query("DELETE FROM notes WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        
        Ok(())
    }
    
    pub async fn search_notes(&self, request: SearchRequest) -> Result<SearchResult> {
        let limit = request.limit.unwrap_or(50);
        let offset = request.offset.unwrap_or(0);
        let include_archived = request.include_archived.unwrap_or(false);
        
        let mut query = String::from(
            r#"
            SELECT n.id, n.title, n.content, n.tags, n.created_at, n.updated_at, n.is_favorite, n.is_archived
            FROM notes n
            "#
        );
        
        let mut conditions = Vec::new();
        let mut params: Vec<Box<dyn sqlx::Encode<'_, sqlx::Sqlite> + Send + Sync>> = Vec::new();
        
        if !request.query.is_empty() {
            // Use LIKE search for better compatibility and reliability
            conditions.push("(n.title LIKE ? OR n.content LIKE ?)");
            let search_pattern = format!("%{}%", request.query);
            params.push(Box::new(search_pattern.clone()));
            params.push(Box::new(search_pattern));
        }
        
        if !include_archived {
            conditions.push("n.is_archived = FALSE");
        }
        
        if let Some(date_from) = request.date_from {
            conditions.push("n.created_at >= ?");
            params.push(Box::new(date_from.to_rfc3339()));
        }
        
        if let Some(date_to) = request.date_to {
            conditions.push("n.created_at <= ?");
            params.push(Box::new(date_to.to_rfc3339()));
        }
        
        if !conditions.is_empty() {
            query.push_str(" WHERE ");
            query.push_str(&conditions.join(" AND "));
        }
        
        query.push_str(" ORDER BY n.updated_at DESC LIMIT ? OFFSET ?");
        params.push(Box::new(limit));
        params.push(Box::new(offset));
        
        // Prepare search pattern outside the if block to avoid lifetime issues
        let search_pattern = if !request.query.is_empty() {
            Some(format!("%{}%", request.query))
        } else {
            None
        };

        // Execute query with proper parameter binding
        let mut query_builder = sqlx::query_as::<_, Note>(&query);

        // Bind search parameters if query is not empty
        if let Some(ref pattern) = search_pattern {
            query_builder = query_builder.bind(pattern).bind(pattern);
        }

        // Bind date parameters if present
        if let Some(date_from) = request.date_from {
            query_builder = query_builder.bind(date_from.to_rfc3339());
        }

        if let Some(date_to) = request.date_to {
            query_builder = query_builder.bind(date_to.to_rfc3339());
        }

        // Bind limit and offset
        query_builder = query_builder.bind(limit).bind(offset);

        let notes = query_builder.fetch_all(&self.pool).await?;
        
        // Get total count
        let total_row = sqlx::query("SELECT COUNT(*) as count FROM notes WHERE is_archived = ?")
            .bind(!include_archived)
            .fetch_one(&self.pool)
            .await?;
        let total: i64 = total_row.get("count");
        
        Ok(SearchResult {
            notes,
            total,
            has_more: (offset + limit as i32) < total as i32,
        })
    }
    
    // Tag operations
    pub async fn get_tags(&self) -> Result<Vec<Tag>> {
        let tags = sqlx::query_as::<_, Tag>(
            "SELECT id, name, color, created_at FROM tags ORDER BY name"
        )
        .fetch_all(&self.pool)
        .await?;
        
        Ok(tags)
    }
    
    pub async fn create_tag(&self, request: CreateTagRequest) -> Result<Tag> {
        let tag = Tag::new(request.name, request.color);
        
        sqlx::query(
            "INSERT INTO tags (id, name, color, created_at) VALUES (?, ?, ?, ?)"
        )
        .bind(&tag.id)
        .bind(&tag.name)
        .bind(&tag.color)
        .bind(tag.created_at.to_rfc3339())
        .execute(&self.pool)
        .await?;
        
        Ok(tag)
    }
    
    pub async fn delete_tag(&self, id: &str) -> Result<()> {
        sqlx::query("DELETE FROM tags WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        
        Ok(())
    }
    
    // Settings operations
    #[allow(dead_code)]
    pub async fn get_setting(&self, key: &str) -> Result<Option<String>> {
        let row = sqlx::query("SELECT value FROM settings WHERE key = ?")
            .bind(key)
            .fetch_optional(&self.pool)
            .await?;
        
        Ok(row.map(|r| r.get("value")))
    }
    
    pub async fn set_setting(&self, key: &str, value: &str) -> Result<()> {
        let now = Utc::now().to_rfc3339();
        
        sqlx::query(
            r#"
            INSERT INTO settings (key, value, updated_at) 
            VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET 
                value = excluded.value,
                updated_at = excluded.updated_at
            "#
        )
        .bind(key)
        .bind(value)
        .bind(now)
        .execute(&self.pool)
        .await?;
        
        Ok(())
    }
    
    pub async fn get_all_settings(&self) -> Result<Vec<Settings>> {
        let settings = sqlx::query_as::<_, Settings>(
            "SELECT key, value, updated_at FROM settings"
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(settings)
    }

    // Graph operations
    pub async fn create_graph(&self, request: CreateGraphRequest) -> Result<Graph> {
        let graph = Graph::new(request.name, request.path, request.settings);

        sqlx::query(
            r#"
            INSERT INTO graphs (id, name, path, settings, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&graph.id)
        .bind(&graph.name)
        .bind(&graph.path)
        .bind(&graph.settings)
        .bind(graph.created_at.to_rfc3339())
        .bind(graph.updated_at.to_rfc3339())
        .execute(&self.pool)
        .await?;

        Ok(graph)
    }

    pub async fn get_graph(&self, id: &str) -> Result<Graph> {
        let graph = sqlx::query_as::<_, Graph>(
            "SELECT id, name, path, settings, created_at, updated_at FROM graphs WHERE id = ?"
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await?;

        Ok(graph)
    }

    pub async fn get_graphs(&self) -> Result<Vec<Graph>> {
        let graphs = sqlx::query_as::<_, Graph>(
            "SELECT id, name, path, settings, created_at, updated_at FROM graphs ORDER BY name"
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(graphs)
    }

    pub async fn update_graph(&self, request: UpdateGraphRequest) -> Result<Graph> {
        let now = Utc::now();

        if let Some(name) = &request.name {
            sqlx::query("UPDATE graphs SET name = ?, updated_at = ? WHERE id = ?")
                .bind(name)
                .bind(now.to_rfc3339())
                .bind(&request.id)
                .execute(&self.pool)
                .await?;
        }

        if let Some(settings) = &request.settings {
            sqlx::query("UPDATE graphs SET settings = ?, updated_at = ? WHERE id = ?")
                .bind(settings)
                .bind(now.to_rfc3339())
                .bind(&request.id)
                .execute(&self.pool)
                .await?;
        }

        self.get_graph(&request.id).await
    }

    pub async fn delete_graph(&self, id: &str) -> Result<()> {
        sqlx::query("DELETE FROM graphs WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    // Page operations
    pub async fn create_page(&self, request: CreatePageRequest) -> Result<Page> {
        let mut page = Page::new(request.name, request.graph_id);

        if let Some(title) = request.title {
            page.title = Some(title);
        }
        if let Some(properties) = request.properties {
            page.properties = Some(properties);
        }
        if let Some(tags) = request.tags {
            page.tags = tags;
        }
        if let Some(is_journal) = request.is_journal {
            page.is_journal = is_journal;
        }
        if let Some(journal_date) = request.journal_date {
            page.journal_date = Some(journal_date);
        }

        sqlx::query(
            r#"
            INSERT INTO pages (id, name, title, properties, tags, is_journal, journal_date, created_at, updated_at, graph_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&page.id)
        .bind(&page.name)
        .bind(&page.title)
        .bind(&page.properties)
        .bind(&page.tags)
        .bind(page.is_journal)
        .bind(&page.journal_date)
        .bind(page.created_at.to_rfc3339())
        .bind(page.updated_at.to_rfc3339())
        .bind(&page.graph_id)
        .execute(&self.pool)
        .await?;

        Ok(page)
    }

    pub async fn get_page(&self, id: &str) -> Result<Page> {
        let page = sqlx::query_as::<_, Page>(
            r#"
            SELECT id, name, title, properties, tags, is_journal, journal_date, created_at, updated_at, graph_id
            FROM pages WHERE id = ?
            "#
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await?;

        Ok(page)
    }

    pub async fn get_pages_by_graph(&self, graph_id: &str) -> Result<Vec<Page>> {
        let pages = sqlx::query_as::<_, Page>(
            r#"
            SELECT id, name, title, properties, tags, is_journal, journal_date, created_at, updated_at, graph_id
            FROM pages WHERE graph_id = ? ORDER BY name
            "#
        )
        .bind(graph_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(pages)
    }

    pub async fn get_all_pages(&self) -> Result<Vec<Page>> {
        let pages = sqlx::query_as::<_, Page>(
            r#"
            SELECT id, name, title, properties, tags, is_journal, journal_date, created_at, updated_at, graph_id
            FROM pages ORDER BY created_at DESC
            "#
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(pages)
    }

    pub async fn get_pages(&self, limit: Option<usize>) -> Result<Vec<Page>> {
        let query = if let Some(limit) = limit {
            format!(
                r#"
                SELECT id, name, title, properties, tags, is_journal, journal_date, created_at, updated_at, graph_id
                FROM pages ORDER BY created_at DESC LIMIT {}
                "#,
                limit
            )
        } else {
            r#"
            SELECT id, name, title, properties, tags, is_journal, journal_date, created_at, updated_at, graph_id
            FROM pages ORDER BY created_at DESC
            "#.to_string()
        };

        let pages = sqlx::query_as::<_, Page>(&query)
            .fetch_all(&self.pool)
            .await?;

        Ok(pages)
    }

    pub async fn get_recent_pages(&self, limit: usize) -> Result<Vec<Page>> {
        let pages = sqlx::query_as::<_, Page>(
            r#"
            SELECT id, name, title, properties, tags, is_journal, journal_date, created_at, updated_at, graph_id
            FROM pages ORDER BY updated_at DESC LIMIT ?
            "#
        )
        .bind(limit as i64)
        .fetch_all(&self.pool)
        .await?;

        Ok(pages)
    }

    pub async fn update_page(&self, request: UpdatePageRequest) -> Result<Page> {
        let now = Utc::now();

        if let Some(name) = &request.name {
            sqlx::query("UPDATE pages SET name = ?, updated_at = ? WHERE id = ?")
                .bind(name)
                .bind(now.to_rfc3339())
                .bind(&request.id)
                .execute(&self.pool)
                .await?;
        }

        if let Some(title) = &request.title {
            sqlx::query("UPDATE pages SET title = ?, updated_at = ? WHERE id = ?")
                .bind(title)
                .bind(now.to_rfc3339())
                .bind(&request.id)
                .execute(&self.pool)
                .await?;
        }

        if let Some(properties) = &request.properties {
            sqlx::query("UPDATE pages SET properties = ?, updated_at = ? WHERE id = ?")
                .bind(properties)
                .bind(now.to_rfc3339())
                .bind(&request.id)
                .execute(&self.pool)
                .await?;
        }

        if let Some(tags) = &request.tags {
            sqlx::query("UPDATE pages SET tags = ?, updated_at = ? WHERE id = ?")
                .bind(tags)
                .bind(now.to_rfc3339())
                .bind(&request.id)
                .execute(&self.pool)
                .await?;
        }

        self.get_page(&request.id).await
    }

    pub async fn delete_page(&self, id: &str) -> Result<()> {
        sqlx::query("DELETE FROM pages WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    // Block operations
    pub async fn create_block(&self, request: CreateBlockRequest) -> Result<Block> {
        let mut block = Block::new(request.content, request.page_id, request.graph_id);

        if let Some(parent_id) = request.parent_id {
            block.parent_id = Some(parent_id);
        }
        if let Some(properties) = request.properties {
            block.properties = Some(properties);
        }
        if let Some(refs) = request.refs {
            block.refs = refs;
        }
        if let Some(order) = request.order {
            block.order = order;
        }

        sqlx::query(
            r#"
            INSERT INTO blocks (id, content, parent_id, properties, refs, "order", collapsed, created_at, updated_at, page_id, graph_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&block.id)
        .bind(&block.content)
        .bind(&block.parent_id)
        .bind(&block.properties)
        .bind(&block.refs)
        .bind(block.order)
        .bind(block.collapsed)
        .bind(block.created_at.to_rfc3339())
        .bind(block.updated_at.to_rfc3339())
        .bind(&block.page_id)
        .bind(&block.graph_id)
        .execute(&self.pool)
        .await?;

        Ok(block)
    }

    pub async fn get_block(&self, id: &str) -> Result<Block> {
        let block = sqlx::query_as::<_, Block>(
            r#"
            SELECT id, content, parent_id, properties, refs, "order", collapsed, created_at, updated_at, page_id, graph_id
            FROM blocks WHERE id = ?
            "#
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await?;

        Ok(block)
    }

    pub async fn get_blocks_by_page(&self, page_id: &str) -> Result<Vec<Block>> {
        let blocks = sqlx::query_as::<_, Block>(
            r#"
            SELECT id, content, parent_id, properties, refs, "order", collapsed, created_at, updated_at, page_id, graph_id
            FROM blocks WHERE page_id = ? ORDER BY "order"
            "#
        )
        .bind(page_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(blocks)
    }

    pub async fn update_block(&self, request: UpdateBlockRequest) -> Result<Block> {
        let now = Utc::now();

        if let Some(content) = &request.content {
            sqlx::query("UPDATE blocks SET content = ?, updated_at = ? WHERE id = ?")
                .bind(content)
                .bind(now.to_rfc3339())
                .bind(&request.id)
                .execute(&self.pool)
                .await?;
        }

        if let Some(parent_id) = &request.parent_id {
            sqlx::query("UPDATE blocks SET parent_id = ?, updated_at = ? WHERE id = ?")
                .bind(parent_id)
                .bind(now.to_rfc3339())
                .bind(&request.id)
                .execute(&self.pool)
                .await?;
        }

        if let Some(properties) = &request.properties {
            sqlx::query("UPDATE blocks SET properties = ?, updated_at = ? WHERE id = ?")
                .bind(properties)
                .bind(now.to_rfc3339())
                .bind(&request.id)
                .execute(&self.pool)
                .await?;
        }

        if let Some(refs) = &request.refs {
            sqlx::query("UPDATE blocks SET refs = ?, updated_at = ? WHERE id = ?")
                .bind(refs)
                .bind(now.to_rfc3339())
                .bind(&request.id)
                .execute(&self.pool)
                .await?;
        }

        if let Some(order) = &request.order {
            sqlx::query("UPDATE blocks SET \"order\" = ?, updated_at = ? WHERE id = ?")
                .bind(order)
                .bind(now.to_rfc3339())
                .bind(&request.id)
                .execute(&self.pool)
                .await?;
        }

        if let Some(collapsed) = &request.collapsed {
            sqlx::query("UPDATE blocks SET collapsed = ?, updated_at = ? WHERE id = ?")
                .bind(collapsed)
                .bind(now.to_rfc3339())
                .bind(&request.id)
                .execute(&self.pool)
                .await?;
        }

        self.get_block(&request.id).await
    }

    pub async fn delete_block(&self, id: &str) -> Result<()> {
        sqlx::query("DELETE FROM blocks WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    // Task management operations
    #[allow(dead_code)]
    pub async fn create_task(&self, request: CreateTaskRequest) -> Result<Task> {
        let task = Task {
            id: uuid::Uuid::new_v4().to_string(),
            title: request.title,
            description: request.description,
            status: "todo".to_string(),
            priority: request.priority.unwrap_or_else(|| "medium".to_string()),
            due_date: request.due_date,
            completed_at: None,
            estimated_time: request.estimated_time,
            actual_time: None,
            project_id: request.project_id,
            parent_task_id: request.parent_task_id,
            linked_notes: serde_json::to_string(&request.linked_notes.unwrap_or_default()).unwrap_or_else(|_| "[]".to_string()),
            linked_files: serde_json::to_string(&request.linked_files.unwrap_or_default()).unwrap_or_else(|_| "[]".to_string()),
            tags: serde_json::to_string(&request.tags.unwrap_or_default()).unwrap_or_else(|_| "[]".to_string()),
            contexts: serde_json::to_string(&request.contexts.unwrap_or_default()).unwrap_or_else(|_| "[]".to_string()),
            recurrence: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            created_by: None,
        };

        sqlx::query(
            r#"
            INSERT INTO tasks (
                id, title, description, status, priority, due_date, estimated_time,
                project_id, parent_task_id, linked_notes, linked_files, tags, contexts,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&task.id)
        .bind(&task.title)
        .bind(&task.description)
        .bind(&task.status)
        .bind(&task.priority)
        .bind(task.due_date.map(|d| d.to_rfc3339()))
        .bind(task.estimated_time)
        .bind(&task.project_id)
        .bind(&task.parent_task_id)
        .bind(&task.linked_notes)
        .bind(&task.linked_files)
        .bind(&task.tags)
        .bind(&task.contexts)
        .bind(task.created_at.to_rfc3339())
        .bind(task.updated_at.to_rfc3339())
        .execute(&self.pool)
        .await?;

        Ok(task)
    }

    pub async fn get_task(&self, id: &str) -> Result<Task> {
        let task = sqlx::query_as::<_, Task>(
            r#"
            SELECT id, title, description, status, priority, due_date, completed_at,
                   estimated_time, actual_time, project_id, parent_task_id,
                   linked_notes, linked_files, tags, contexts, recurrence,
                   created_at, updated_at, created_by
            FROM tasks WHERE id = ?
            "#
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await?;

        Ok(task)
    }

    pub async fn update_task(&self, request: UpdateTaskRequest) -> Result<Task> {
        let now = Utc::now();

        if let Some(title) = &request.title {
            sqlx::query("UPDATE tasks SET title = ?, updated_at = ? WHERE id = ?")
                .bind(title)
                .bind(now.to_rfc3339())
                .bind(&request.id)
                .execute(&self.pool)
                .await?;
        }

        if let Some(description) = &request.description {
            sqlx::query("UPDATE tasks SET description = ?, updated_at = ? WHERE id = ?")
                .bind(description)
                .bind(now.to_rfc3339())
                .bind(&request.id)
                .execute(&self.pool)
                .await?;
        }

        if let Some(status) = &request.status {
            sqlx::query("UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?")
                .bind(status)
                .bind(now.to_rfc3339())
                .bind(&request.id)
                .execute(&self.pool)
                .await?;

            // If marking as completed, set completed_at
            if status == "done" {
                sqlx::query("UPDATE tasks SET completed_at = ?, updated_at = ? WHERE id = ?")
                    .bind(now.to_rfc3339())
                    .bind(now.to_rfc3339())
                    .bind(&request.id)
                    .execute(&self.pool)
                    .await?;
            }
        }

        if let Some(priority) = &request.priority {
            sqlx::query("UPDATE tasks SET priority = ?, updated_at = ? WHERE id = ?")
                .bind(priority)
                .bind(now.to_rfc3339())
                .bind(&request.id)
                .execute(&self.pool)
                .await?;
        }

        if let Some(due_date) = &request.due_date {
            sqlx::query("UPDATE tasks SET due_date = ?, updated_at = ? WHERE id = ?")
                .bind(due_date.to_rfc3339())
                .bind(now.to_rfc3339())
                .bind(&request.id)
                .execute(&self.pool)
                .await?;
        }

        if let Some(estimated_time) = &request.estimated_time {
            sqlx::query("UPDATE tasks SET estimated_time = ?, updated_at = ? WHERE id = ?")
                .bind(estimated_time)
                .bind(now.to_rfc3339())
                .bind(&request.id)
                .execute(&self.pool)
                .await?;
        }

        if let Some(actual_time) = &request.actual_time {
            sqlx::query("UPDATE tasks SET actual_time = ?, updated_at = ? WHERE id = ?")
                .bind(actual_time)
                .bind(now.to_rfc3339())
                .bind(&request.id)
                .execute(&self.pool)
                .await?;
        }

        if let Some(project_id) = &request.project_id {
            sqlx::query("UPDATE tasks SET project_id = ?, updated_at = ? WHERE id = ?")
                .bind(project_id)
                .bind(now.to_rfc3339())
                .bind(&request.id)
                .execute(&self.pool)
                .await?;
        }

        if let Some(tags) = &request.tags {
            let tags_json = serde_json::to_string(tags).unwrap_or_else(|_| "[]".to_string());
            sqlx::query("UPDATE tasks SET tags = ?, updated_at = ? WHERE id = ?")
                .bind(tags_json)
                .bind(now.to_rfc3339())
                .bind(&request.id)
                .execute(&self.pool)
                .await?;
        }

        if let Some(contexts) = &request.contexts {
            let contexts_json = serde_json::to_string(contexts).unwrap_or_else(|_| "[]".to_string());
            sqlx::query("UPDATE tasks SET contexts = ?, updated_at = ? WHERE id = ?")
                .bind(contexts_json)
                .bind(now.to_rfc3339())
                .bind(&request.id)
                .execute(&self.pool)
                .await?;
        }

        self.get_task(&request.id).await
    }

    pub async fn delete_task(&self, id: &str) -> Result<()> {
        sqlx::query("DELETE FROM tasks WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    pub async fn get_tasks(&self, limit: Option<usize>) -> Result<Vec<Task>> {
        let query = if let Some(limit) = limit {
            format!(
                r#"
                SELECT id, title, description, status, priority, due_date, completed_at,
                       estimated_time, actual_time, project_id, parent_task_id,
                       linked_notes, linked_files, tags, contexts, recurrence,
                       created_at, updated_at, created_by
                FROM tasks ORDER BY created_at DESC LIMIT {}
                "#,
                limit
            )
        } else {
            r#"
            SELECT id, title, description, status, priority, due_date, completed_at,
                   estimated_time, actual_time, project_id, parent_task_id,
                   linked_notes, linked_files, tags, contexts, recurrence,
                   created_at, updated_at, created_by
            FROM tasks ORDER BY created_at DESC
            "#.to_string()
        };

        let tasks = sqlx::query_as::<_, Task>(&query)
            .fetch_all(&self.pool)
            .await?;

        Ok(tasks)
    }

    // Project management operations
    pub async fn create_project(&self, request: CreateProjectRequest) -> Result<Project> {
        let project = Project {
            id: uuid::Uuid::new_v4().to_string(),
            name: request.name,
            description: request.description,
            status: "active".to_string(),
            color: request.color,
            start_date: request.start_date,
            due_date: request.due_date,
            completed_at: None,
            linked_notes: serde_json::to_string(&request.linked_notes.unwrap_or_default()).unwrap_or_else(|_| "[]".to_string()),
            linked_files: serde_json::to_string(&request.linked_files.unwrap_or_default()).unwrap_or_else(|_| "[]".to_string()),
            progress: 0,
            total_tasks: 0,
            completed_tasks: 0,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            created_by: None,
        };

        sqlx::query(
            r#"
            INSERT INTO projects (
                id, name, description, status, color, start_date, due_date,
                linked_notes, linked_files, progress, total_tasks, completed_tasks,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&project.id)
        .bind(&project.name)
        .bind(&project.description)
        .bind(&project.status)
        .bind(&project.color)
        .bind(project.start_date.map(|d| d.to_rfc3339()))
        .bind(project.due_date.map(|d| d.to_rfc3339()))
        .bind(&project.linked_notes)
        .bind(&project.linked_files)
        .bind(project.progress)
        .bind(project.total_tasks)
        .bind(project.completed_tasks)
        .bind(project.created_at.to_rfc3339())
        .bind(project.updated_at.to_rfc3339())
        .execute(&self.pool)
        .await?;

        Ok(project)
    }

    pub async fn get_project(&self, id: &str) -> Result<Project> {
        let project = sqlx::query_as::<_, Project>(
            r#"
            SELECT id, name, description, status, color, start_date, due_date, completed_at,
                   linked_notes, linked_files, progress, total_tasks, completed_tasks,
                   created_at, updated_at, created_by
            FROM projects WHERE id = ?
            "#
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await?;

        Ok(project)
    }

    pub async fn update_project(&self, request: UpdateProjectRequest) -> Result<Project> {
        let now = Utc::now();

        if let Some(name) = &request.name {
            sqlx::query("UPDATE projects SET name = ?, updated_at = ? WHERE id = ?")
                .bind(name)
                .bind(now.to_rfc3339())
                .bind(&request.id)
                .execute(&self.pool)
                .await?;
        }

        if let Some(description) = &request.description {
            sqlx::query("UPDATE projects SET description = ?, updated_at = ? WHERE id = ?")
                .bind(description)
                .bind(now.to_rfc3339())
                .bind(&request.id)
                .execute(&self.pool)
                .await?;
        }

        if let Some(status) = &request.status {
            sqlx::query("UPDATE projects SET status = ?, updated_at = ? WHERE id = ?")
                .bind(status)
                .bind(now.to_rfc3339())
                .bind(&request.id)
                .execute(&self.pool)
                .await?;

            // If marking as completed, set completed_at
            if status == "completed" {
                sqlx::query("UPDATE projects SET completed_at = ?, updated_at = ? WHERE id = ?")
                    .bind(now.to_rfc3339())
                    .bind(now.to_rfc3339())
                    .bind(&request.id)
                    .execute(&self.pool)
                    .await?;
            }
        }

        if let Some(color) = &request.color {
            sqlx::query("UPDATE projects SET color = ?, updated_at = ? WHERE id = ?")
                .bind(color)
                .bind(now.to_rfc3339())
                .bind(&request.id)
                .execute(&self.pool)
                .await?;
        }

        if let Some(start_date) = &request.start_date {
            sqlx::query("UPDATE projects SET start_date = ?, updated_at = ? WHERE id = ?")
                .bind(start_date.to_rfc3339())
                .bind(now.to_rfc3339())
                .bind(&request.id)
                .execute(&self.pool)
                .await?;
        }

        if let Some(due_date) = &request.due_date {
            sqlx::query("UPDATE projects SET due_date = ?, updated_at = ? WHERE id = ?")
                .bind(due_date.to_rfc3339())
                .bind(now.to_rfc3339())
                .bind(&request.id)
                .execute(&self.pool)
                .await?;
        }

        self.get_project(&request.id).await
    }

    pub async fn delete_project(&self, id: &str) -> Result<()> {
        // First, update all tasks in this project to remove project_id
        sqlx::query("UPDATE tasks SET project_id = NULL WHERE project_id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;

        // Then delete the project
        sqlx::query("DELETE FROM projects WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    pub async fn get_projects(&self, limit: Option<usize>) -> Result<Vec<Project>> {
        let query = if let Some(limit) = limit {
            format!(
                r#"
                SELECT id, name, description, status, color, start_date, due_date, completed_at,
                       linked_notes, linked_files, progress, total_tasks, completed_tasks,
                       created_at, updated_at, created_by
                FROM projects ORDER BY created_at DESC LIMIT {}
                "#,
                limit
            )
        } else {
            r#"
            SELECT id, name, description, status, color, start_date, due_date, completed_at,
                   linked_notes, linked_files, progress, total_tasks, completed_tasks,
                   created_at, updated_at, created_by
            FROM projects ORDER BY created_at DESC
            "#.to_string()
        };

        let projects = sqlx::query_as::<_, Project>(&query)
            .fetch_all(&self.pool)
            .await?;

        Ok(projects)
    }

    pub async fn get_tasks_by_project(&self, project_id: &str) -> Result<Vec<Task>> {
        let tasks = sqlx::query_as::<_, Task>(
            r#"
            SELECT id, title, description, status, priority, due_date, completed_at,
                   estimated_time, actual_time, project_id, parent_task_id,
                   linked_notes, linked_files, tags, contexts, recurrence,
                   created_at, updated_at, created_by
            FROM tasks WHERE project_id = ? ORDER BY created_at DESC
            "#
        )
        .bind(project_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(tasks)
    }

    // Time tracking operations
    pub async fn create_time_entry(&self, request: CreateTimeEntryRequest) -> Result<TimeEntry> {
        let time_entry = TimeEntry {
            id: uuid::Uuid::new_v4().to_string(),
            task_id: request.task_id,
            start_time: request.start_time,
            end_time: request.end_time,
            duration: request.end_time.map(|end| {
                (end - request.start_time).num_seconds() as i32
            }),
            description: request.description,
            created_at: Utc::now(),
        };

        sqlx::query(
            r#"
            INSERT INTO task_time_entries (
                id, task_id, start_time, end_time, duration, description, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&time_entry.id)
        .bind(&time_entry.task_id)
        .bind(time_entry.start_time.to_rfc3339())
        .bind(time_entry.end_time.map(|d| d.to_rfc3339()))
        .bind(time_entry.duration)
        .bind(&time_entry.description)
        .bind(time_entry.created_at.to_rfc3339())
        .execute(&self.pool)
        .await?;

        Ok(time_entry)
    }

    pub async fn get_time_entries_by_task(&self, task_id: &str) -> Result<Vec<TimeEntry>> {
        let entries = sqlx::query_as::<_, TimeEntry>(
            r#"
            SELECT id, task_id, start_time, end_time, duration, description, created_at
            FROM task_time_entries WHERE task_id = ? ORDER BY start_time DESC
            "#
        )
        .bind(task_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(entries)
    }

    pub async fn update_time_entry_end(&self, id: &str, end_time: chrono::DateTime<Utc>) -> Result<TimeEntry> {
        // Get the existing entry to calculate duration
        let entry = sqlx::query_as::<_, TimeEntry>(
            "SELECT id, task_id, start_time, end_time, duration, description, created_at FROM task_time_entries WHERE id = ?"
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await?;

        let duration = (end_time - entry.start_time).num_seconds() as i32;

        sqlx::query(
            "UPDATE task_time_entries SET end_time = ?, duration = ? WHERE id = ?"
        )
        .bind(end_time.to_rfc3339())
        .bind(duration)
        .bind(id)
        .execute(&self.pool)
        .await?;

        // Return updated entry
        let updated_entry = TimeEntry {
            id: entry.id,
            task_id: entry.task_id,
            start_time: entry.start_time,
            end_time: Some(end_time),
            duration: Some(duration),
            description: entry.description,
            created_at: entry.created_at,
        };

        Ok(updated_entry)
    }

    pub async fn delete_time_entry(&self, id: &str) -> Result<()> {
        sqlx::query("DELETE FROM task_time_entries WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    // Search operations for tasks and projects
    pub async fn search_tasks(&self, query: &str, limit: Option<usize>) -> Result<Vec<Task>> {
        let search_query = format!("%{}%", query);
        let sql = if let Some(limit) = limit {
            format!(
                r#"
                SELECT id, title, description, status, priority, due_date, completed_at,
                       estimated_time, actual_time, project_id, parent_task_id,
                       linked_notes, linked_files, tags, contexts, recurrence,
                       created_at, updated_at, created_by
                FROM tasks
                WHERE title LIKE ? OR description LIKE ? OR tags LIKE ? OR contexts LIKE ?
                ORDER BY created_at DESC LIMIT {}
                "#,
                limit
            )
        } else {
            r#"
            SELECT id, title, description, status, priority, due_date, completed_at,
                   estimated_time, actual_time, project_id, parent_task_id,
                   linked_notes, linked_files, tags, contexts, recurrence,
                   created_at, updated_at, created_by
            FROM tasks
            WHERE title LIKE ? OR description LIKE ? OR tags LIKE ? OR contexts LIKE ?
            ORDER BY created_at DESC
            "#.to_string()
        };

        let tasks = sqlx::query_as::<_, Task>(&sql)
            .bind(&search_query)
            .bind(&search_query)
            .bind(&search_query)
            .bind(&search_query)
            .fetch_all(&self.pool)
            .await?;

        Ok(tasks)
    }

    pub async fn search_projects(&self, query: &str, limit: Option<usize>) -> Result<Vec<Project>> {
        let search_query = format!("%{}%", query);
        let sql = if let Some(limit) = limit {
            format!(
                r#"
                SELECT id, name, description, status, color, start_date, due_date, completed_at,
                       linked_notes, linked_files, progress, total_tasks, completed_tasks,
                       created_at, updated_at, created_by
                FROM projects
                WHERE name LIKE ? OR description LIKE ?
                ORDER BY created_at DESC LIMIT {}
                "#,
                limit
            )
        } else {
            r#"
            SELECT id, name, description, status, color, start_date, due_date, completed_at,
                   linked_notes, linked_files, progress, total_tasks, completed_tasks,
                   created_at, updated_at, created_by
            FROM projects
            WHERE name LIKE ? OR description LIKE ?
            ORDER BY created_at DESC
            "#.to_string()
        };

        let projects = sqlx::query_as::<_, Project>(&sql)
            .bind(&search_query)
            .bind(&search_query)
            .fetch_all(&self.pool)
            .await?;

        Ok(projects)
    }
}

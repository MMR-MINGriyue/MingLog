use crate::error::{AppError, Result};
use crate::models::{Note, Tag, Settings, CreateNoteRequest, UpdateNoteRequest, CreateTagRequest, SearchRequest, SearchResult};
use chrono::Utc;
use sqlx::{sqlite::SqlitePool, Row};
use std::path::PathBuf;

#[derive(Debug)]
pub struct Database {
    pool: SqlitePool,
}

impl Database {
    pub async fn new() -> Result<Self> {
        let db_path = Self::get_database_path()?;
        
        // Ensure the parent directory exists
        if let Some(parent) = db_path.parent() {
            tokio::fs::create_dir_all(parent).await?;
        }
        
        let database_url = format!("sqlite:{}", db_path.display());
        let pool = SqlitePool::connect(&database_url).await?;
        
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
        // Create tables
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
        
        // Create indexes
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at)")
            .execute(&self.pool)
            .await?;
            
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at)")
            .execute(&self.pool)
            .await?;
            
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_notes_title ON notes(title)")
            .execute(&self.pool)
            .await?;
        
        // Create FTS table for search
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
        
        // Create triggers to keep FTS table in sync
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
        
        Ok(())
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
            query.push_str(" JOIN notes_fts fts ON n.id = fts.id ");
            conditions.push("fts MATCH ?");
            params.push(Box::new(request.query.clone()));
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
        
        // This is a simplified version - in a real implementation, you'd need to handle dynamic queries properly
        let notes = if request.query.is_empty() {
            sqlx::query_as::<_, Note>(&query)
                .bind(limit)
                .bind(offset)
                .fetch_all(&self.pool)
                .await?
        } else {
            sqlx::query_as::<_, Note>(&query)
                .bind(&request.query)
                .bind(limit)
                .bind(offset)
                .fetch_all(&self.pool)
                .await?
        };
        
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
}

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, Row};
use uuid::Uuid;

// Graph model - represents a workspace/knowledge graph
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Graph {
    pub id: String,
    pub name: String,
    pub path: String,
    pub settings: Option<String>, // JSON settings
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// Page model - represents a page in the knowledge graph
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Page {
    pub id: String,
    pub name: String,
    pub title: Option<String>,
    pub properties: Option<String>, // JSON properties
    pub tags: String,
    pub is_journal: bool,
    pub journal_date: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub graph_id: String,
}

// Block model - represents a content block within a page
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Block {
    pub id: String,
    pub content: String,
    pub parent_id: Option<String>,
    pub properties: Option<String>, // JSON properties
    pub refs: String,
    pub order: i32,
    pub collapsed: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub page_id: String,
    pub graph_id: String,
}

// Legacy Note model for backward compatibility
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Note {
    pub id: String,
    pub title: String,
    pub content: String,
    pub tags: Option<String>, // JSON array of tag IDs
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub is_favorite: bool,
    pub is_archived: bool,
}

// FromRow implementations for database mapping
impl FromRow<'_, sqlx::sqlite::SqliteRow> for Graph {
    fn from_row(row: &sqlx::sqlite::SqliteRow) -> Result<Self, sqlx::Error> {
        let created_at_str: String = row.try_get("created_at")?;
        let updated_at_str: String = row.try_get("updated_at")?;

        let created_at = DateTime::parse_from_rfc3339(&created_at_str)
            .map_err(|e| sqlx::Error::ColumnDecode {
                index: "created_at".to_string(),
                source: Box::new(e),
            })?
            .with_timezone(&Utc);

        let updated_at = DateTime::parse_from_rfc3339(&updated_at_str)
            .map_err(|e| sqlx::Error::ColumnDecode {
                index: "updated_at".to_string(),
                source: Box::new(e),
            })?
            .with_timezone(&Utc);

        Ok(Graph {
            id: row.try_get("id")?,
            name: row.try_get("name")?,
            path: row.try_get("path")?,
            settings: row.try_get("settings")?,
            created_at,
            updated_at,
        })
    }
}

impl FromRow<'_, sqlx::sqlite::SqliteRow> for Page {
    fn from_row(row: &sqlx::sqlite::SqliteRow) -> Result<Self, sqlx::Error> {
        let created_at_str: String = row.try_get("created_at")?;
        let updated_at_str: String = row.try_get("updated_at")?;

        let created_at = DateTime::parse_from_rfc3339(&created_at_str)
            .map_err(|e| sqlx::Error::ColumnDecode {
                index: "created_at".to_string(),
                source: Box::new(e),
            })?
            .with_timezone(&Utc);

        let updated_at = DateTime::parse_from_rfc3339(&updated_at_str)
            .map_err(|e| sqlx::Error::ColumnDecode {
                index: "updated_at".to_string(),
                source: Box::new(e),
            })?
            .with_timezone(&Utc);

        Ok(Page {
            id: row.try_get("id")?,
            name: row.try_get("name")?,
            title: row.try_get("title")?,
            properties: row.try_get("properties")?,
            tags: row.try_get("tags").unwrap_or_default(),
            is_journal: row.try_get("is_journal").unwrap_or(false),
            journal_date: row.try_get("journal_date")?,
            created_at,
            updated_at,
            graph_id: row.try_get("graph_id")?,
        })
    }
}

impl FromRow<'_, sqlx::sqlite::SqliteRow> for Block {
    fn from_row(row: &sqlx::sqlite::SqliteRow) -> Result<Self, sqlx::Error> {
        let created_at_str: String = row.try_get("created_at")?;
        let updated_at_str: String = row.try_get("updated_at")?;

        let created_at = DateTime::parse_from_rfc3339(&created_at_str)
            .map_err(|e| sqlx::Error::ColumnDecode {
                index: "created_at".to_string(),
                source: Box::new(e),
            })?
            .with_timezone(&Utc);

        let updated_at = DateTime::parse_from_rfc3339(&updated_at_str)
            .map_err(|e| sqlx::Error::ColumnDecode {
                index: "updated_at".to_string(),
                source: Box::new(e),
            })?
            .with_timezone(&Utc);

        Ok(Block {
            id: row.try_get("id")?,
            content: row.try_get("content")?,
            parent_id: row.try_get("parent_id")?,
            properties: row.try_get("properties")?,
            refs: row.try_get("refs").unwrap_or_default(),
            order: row.try_get("order").unwrap_or(0),
            collapsed: row.try_get("collapsed").unwrap_or(false),
            created_at,
            updated_at,
            page_id: row.try_get("page_id")?,
            graph_id: row.try_get("graph_id")?,
        })
    }
}

impl FromRow<'_, sqlx::sqlite::SqliteRow> for Note {
    fn from_row(row: &sqlx::sqlite::SqliteRow) -> Result<Self, sqlx::Error> {
        let created_at_str: String = row.try_get("created_at")?;
        let updated_at_str: String = row.try_get("updated_at")?;

        let created_at = DateTime::parse_from_rfc3339(&created_at_str)
            .map_err(|e| sqlx::Error::ColumnDecode {
                index: "created_at".to_string(),
                source: Box::new(e),
            })?
            .with_timezone(&Utc);

        let updated_at = DateTime::parse_from_rfc3339(&updated_at_str)
            .map_err(|e| sqlx::Error::ColumnDecode {
                index: "updated_at".to_string(),
                source: Box::new(e),
            })?
            .with_timezone(&Utc);

        Ok(Note {
            id: row.try_get("id")?,
            title: row.try_get("title")?,
            content: row.try_get("content")?,
            tags: row.try_get("tags")?,
            created_at,
            updated_at,
            is_favorite: row.try_get("is_favorite")?,
            is_archived: row.try_get("is_archived")?,
        })
    }
}



// Request models for Graph operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateGraphRequest {
    pub name: String,
    pub path: String,
    pub settings: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateGraphRequest {
    pub id: String,
    pub name: Option<String>,
    pub settings: Option<String>,
}

// Request models for Page operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePageRequest {
    pub name: String,
    pub title: Option<String>,
    pub properties: Option<String>,
    pub tags: Option<String>,
    pub is_journal: Option<bool>,
    pub journal_date: Option<String>,
    pub graph_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdatePageRequest {
    pub id: String,
    pub name: Option<String>,
    pub title: Option<String>,
    pub properties: Option<String>,
    pub tags: Option<String>,
    pub is_journal: Option<bool>,
    pub journal_date: Option<String>,
}

// Request models for Block operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateBlockRequest {
    pub content: String,
    pub parent_id: Option<String>,
    pub properties: Option<String>,
    pub refs: Option<String>,
    pub order: Option<i32>,
    pub page_id: String,
    pub graph_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateBlockRequest {
    pub id: String,
    pub content: Option<String>,
    pub parent_id: Option<String>,
    pub properties: Option<String>,
    pub refs: Option<String>,
    pub order: Option<i32>,
    pub collapsed: Option<bool>,
}

// Legacy request models for backward compatibility
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateNoteRequest {
    pub title: String,
    pub content: String,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateNoteRequest {
    pub id: String,
    pub title: Option<String>,
    pub content: Option<String>,
    pub tags: Option<Vec<String>>,
    pub is_favorite: Option<bool>,
    pub is_archived: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tag {
    pub id: String,
    pub name: String,
    pub color: Option<String>,
    pub created_at: DateTime<Utc>,
}

impl FromRow<'_, sqlx::sqlite::SqliteRow> for Tag {
    fn from_row(row: &sqlx::sqlite::SqliteRow) -> Result<Self, sqlx::Error> {
        let created_at_str: String = row.try_get("created_at")?;
        let created_at = DateTime::parse_from_rfc3339(&created_at_str)
            .map_err(|e| sqlx::Error::ColumnDecode {
                index: "created_at".to_string(),
                source: Box::new(e),
            })?
            .with_timezone(&Utc);

        Ok(Tag {
            id: row.try_get("id")?,
            name: row.try_get("name")?,
            color: row.try_get("color")?,
            created_at,
        })
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTagRequest {
    pub name: String,
    pub color: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchRequest {
    pub query: String,
    pub tags: Option<Vec<String>>,
    pub date_from: Option<DateTime<Utc>>,
    pub date_to: Option<DateTime<Utc>>,
    pub include_archived: Option<bool>,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub notes: Vec<Note>,
    pub total: i64,
    pub has_more: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockSearchRequest {
    pub query: String,
    pub page_id: Option<String>,
    pub include_pages: Option<bool>,
    pub include_blocks: Option<bool>,
    pub tags: Option<Vec<String>>,
    pub is_journal: Option<bool>,
    pub limit: Option<i32>,
    pub threshold: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockSearchResult {
    pub id: String,
    pub result_type: String, // "page" or "block"
    pub title: String,
    pub content: String,
    pub excerpt: String,
    pub score: f32,
    pub page_id: Option<String>,
    pub page_name: Option<String>,
    pub block_id: Option<String>,
    pub tags: Vec<String>,
    pub is_journal: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockSearchResponse {
    pub results: Vec<BlockSearchResult>,
    pub total: i64,
    pub query: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub key: String,
    pub value: String,
    pub updated_at: DateTime<Utc>,
}

impl FromRow<'_, sqlx::sqlite::SqliteRow> for Settings {
    fn from_row(row: &sqlx::sqlite::SqliteRow) -> Result<Self, sqlx::Error> {
        let updated_at_str: String = row.try_get("updated_at")?;
        let updated_at = DateTime::parse_from_rfc3339(&updated_at_str)
            .map_err(|e| sqlx::Error::ColumnDecode {
                index: "updated_at".to_string(),
                source: Box::new(e),
            })?
            .with_timezone(&Utc);

        Ok(Settings {
            key: row.try_get("key")?,
            value: row.try_get("value")?,
            updated_at,
        })
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppInfo {
    pub name: String,
    pub version: String,
    pub description: String,
    pub author: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseStats {
    pub total_notes: i64,
    pub total_tags: i64,
    pub total_size: i64,
    pub last_backup: Option<DateTime<Utc>>,
}

// Implementation methods for new models
impl Graph {
    pub fn new(name: String, path: String, settings: Option<String>) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            path,
            settings,
            created_at: now,
            updated_at: now,
        }
    }
}

impl Page {
    pub fn new(name: String, graph_id: String) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            title: None,
            properties: None,
            tags: String::new(),
            is_journal: false,
            journal_date: None,
            created_at: now,
            updated_at: now,
            graph_id,
        }
    }

    #[allow(dead_code)]
    pub fn get_tags(&self) -> Vec<String> {
        if self.tags.is_empty() {
            Vec::new()
        } else {
            self.tags.split(',').map(|s| s.trim().to_string()).collect()
        }
    }

    #[allow(dead_code)]
    pub fn set_tags(&mut self, tags: Vec<String>) {
        self.tags = tags.join(",");
    }
}

impl Block {
    pub fn new(content: String, page_id: String, graph_id: String) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            content,
            parent_id: None,
            properties: None,
            refs: String::new(),
            order: 0,
            collapsed: false,
            created_at: now,
            updated_at: now,
            page_id,
            graph_id,
        }
    }

    #[allow(dead_code)]
    pub fn get_refs(&self) -> Vec<String> {
        if self.refs.is_empty() {
            Vec::new()
        } else {
            self.refs.split(',').map(|s| s.trim().to_string()).collect()
        }
    }

    #[allow(dead_code)]
    pub fn set_refs(&mut self, refs: Vec<String>) {
        self.refs = refs.join(",");
    }
}

impl Note {
    pub fn new(title: String, content: String) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            title,
            content,
            tags: None,
            created_at: now,
            updated_at: now,
            is_favorite: false,
            is_archived: false,
        }
    }

    #[allow(dead_code)]
    pub fn get_tags(&self) -> Vec<String> {
        self.tags
            .as_ref()
            .and_then(|tags| serde_json::from_str(tags).ok())
            .unwrap_or_default()
    }

    pub fn set_tags(&mut self, tags: Vec<String>) {
        self.tags = if tags.is_empty() {
            None
        } else {
            serde_json::to_string(&tags).ok()
        };
    }
}

impl Tag {
    pub fn new(name: String, color: Option<String>) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            color,
            created_at: Utc::now(),
        }
    }
}

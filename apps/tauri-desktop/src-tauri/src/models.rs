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

// Task model - represents a task in the task management system
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub status: String, // inbox, todo, in-progress, waiting, someday, done, cancelled
    pub priority: String, // low, medium, high, urgent
    pub due_date: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub estimated_time: Option<i32>, // minutes
    pub actual_time: Option<i32>, // minutes
    pub project_id: Option<String>,
    pub parent_task_id: Option<String>,
    pub linked_notes: String, // JSON array of note IDs
    pub linked_files: String, // JSON array of file IDs
    pub tags: String, // JSON array of tags
    pub contexts: String, // JSON array of GTD contexts
    pub recurrence: Option<String>, // JSON object for recurrence settings
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: Option<String>,
}

// Project model - represents a project in the project management system
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub status: String, // active, on-hold, completed, cancelled
    pub color: Option<String>,
    pub start_date: Option<DateTime<Utc>>,
    pub due_date: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub linked_notes: String, // JSON array of note IDs
    pub linked_files: String, // JSON array of file IDs
    pub progress: i32, // 0-100
    pub total_tasks: i32,
    pub completed_tasks: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: Option<String>,
}

// TimeEntry model - represents time tracking entries
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeEntry {
    pub id: String,
    pub task_id: String,
    pub start_time: DateTime<Utc>,
    pub end_time: Option<DateTime<Utc>>,
    pub duration: Option<i32>, // seconds
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
}

// FromRow implementations for Task
impl FromRow<'_, sqlx::sqlite::SqliteRow> for Task {
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

        let due_date = if let Ok(due_date_str) = row.try_get::<Option<String>, _>("due_date") {
            due_date_str.and_then(|s| DateTime::parse_from_rfc3339(&s).ok().map(|dt| dt.with_timezone(&Utc)))
        } else {
            None
        };

        let completed_at = if let Ok(completed_at_str) = row.try_get::<Option<String>, _>("completed_at") {
            completed_at_str.and_then(|s| DateTime::parse_from_rfc3339(&s).ok().map(|dt| dt.with_timezone(&Utc)))
        } else {
            None
        };

        Ok(Task {
            id: row.try_get("id")?,
            title: row.try_get("title")?,
            description: row.try_get("description")?,
            status: row.try_get("status")?,
            priority: row.try_get("priority")?,
            due_date,
            completed_at,
            estimated_time: row.try_get("estimated_time")?,
            actual_time: row.try_get("actual_time")?,
            project_id: row.try_get("project_id")?,
            parent_task_id: row.try_get("parent_task_id")?,
            linked_notes: row.try_get("linked_notes").unwrap_or_else(|_| "[]".to_string()),
            linked_files: row.try_get("linked_files").unwrap_or_else(|_| "[]".to_string()),
            tags: row.try_get("tags").unwrap_or_else(|_| "[]".to_string()),
            contexts: row.try_get("contexts").unwrap_or_else(|_| "[]".to_string()),
            recurrence: row.try_get("recurrence")?,
            created_at,
            updated_at,
            created_by: row.try_get("created_by")?,
        })
    }
}

// FromRow implementation for Project
impl FromRow<'_, sqlx::sqlite::SqliteRow> for Project {
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

        let start_date = if let Ok(start_date_str) = row.try_get::<Option<String>, _>("start_date") {
            start_date_str.and_then(|s| DateTime::parse_from_rfc3339(&s).ok().map(|dt| dt.with_timezone(&Utc)))
        } else {
            None
        };

        let due_date = if let Ok(due_date_str) = row.try_get::<Option<String>, _>("due_date") {
            due_date_str.and_then(|s| DateTime::parse_from_rfc3339(&s).ok().map(|dt| dt.with_timezone(&Utc)))
        } else {
            None
        };

        let completed_at = if let Ok(completed_at_str) = row.try_get::<Option<String>, _>("completed_at") {
            completed_at_str.and_then(|s| DateTime::parse_from_rfc3339(&s).ok().map(|dt| dt.with_timezone(&Utc)))
        } else {
            None
        };

        Ok(Project {
            id: row.try_get("id")?,
            name: row.try_get("name")?,
            description: row.try_get("description")?,
            status: row.try_get("status")?,
            color: row.try_get("color")?,
            start_date,
            due_date,
            completed_at,
            linked_notes: row.try_get("linked_notes").unwrap_or_else(|_| "[]".to_string()),
            linked_files: row.try_get("linked_files").unwrap_or_else(|_| "[]".to_string()),
            progress: row.try_get("progress").unwrap_or(0),
            total_tasks: row.try_get("total_tasks").unwrap_or(0),
            completed_tasks: row.try_get("completed_tasks").unwrap_or(0),
            created_at,
            updated_at,
            created_by: row.try_get("created_by")?,
        })
    }
}

// FromRow implementation for TimeEntry
impl FromRow<'_, sqlx::sqlite::SqliteRow> for TimeEntry {
    fn from_row(row: &sqlx::sqlite::SqliteRow) -> Result<Self, sqlx::Error> {
        let created_at_str: String = row.try_get("created_at")?;
        let start_time_str: String = row.try_get("start_time")?;

        let created_at = DateTime::parse_from_rfc3339(&created_at_str)
            .map_err(|e| sqlx::Error::ColumnDecode {
                index: "created_at".to_string(),
                source: Box::new(e),
            })?
            .with_timezone(&Utc);

        let start_time = DateTime::parse_from_rfc3339(&start_time_str)
            .map_err(|e| sqlx::Error::ColumnDecode {
                index: "start_time".to_string(),
                source: Box::new(e),
            })?
            .with_timezone(&Utc);

        let end_time = if let Ok(end_time_str) = row.try_get::<Option<String>, _>("end_time") {
            end_time_str.and_then(|s| DateTime::parse_from_rfc3339(&s).ok().map(|dt| dt.with_timezone(&Utc)))
        } else {
            None
        };

        Ok(TimeEntry {
            id: row.try_get("id")?,
            task_id: row.try_get("task_id")?,
            start_time,
            end_time,
            duration: row.try_get("duration")?,
            description: row.try_get("description")?,
            created_at,
        })
    }
}

// Request structures for task management
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTaskRequest {
    pub title: String,
    pub description: Option<String>,
    pub priority: Option<String>,
    pub due_date: Option<DateTime<Utc>>,
    pub estimated_time: Option<i32>,
    pub project_id: Option<String>,
    pub parent_task_id: Option<String>,
    pub linked_notes: Option<Vec<String>>,
    pub linked_files: Option<Vec<String>>,
    pub tags: Option<Vec<String>>,
    pub contexts: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateTaskRequest {
    pub id: String,
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub due_date: Option<DateTime<Utc>>,
    pub estimated_time: Option<i32>,
    pub actual_time: Option<i32>,
    pub project_id: Option<String>,
    pub parent_task_id: Option<String>,
    pub linked_notes: Option<Vec<String>>,
    pub linked_files: Option<Vec<String>>,
    pub tags: Option<Vec<String>>,
    pub contexts: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateProjectRequest {
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
    pub start_date: Option<DateTime<Utc>>,
    pub due_date: Option<DateTime<Utc>>,
    pub linked_notes: Option<Vec<String>>,
    pub linked_files: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateProjectRequest {
    pub id: String,
    pub name: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub color: Option<String>,
    pub start_date: Option<DateTime<Utc>>,
    pub due_date: Option<DateTime<Utc>>,
    pub linked_notes: Option<Vec<String>>,
    pub linked_files: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTimeEntryRequest {
    pub task_id: String,
    pub start_time: DateTime<Utc>,
    pub end_time: Option<DateTime<Utc>>,
    pub description: Option<String>,
}

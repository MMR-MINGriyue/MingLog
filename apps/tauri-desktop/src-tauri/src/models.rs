use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
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

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Tag {
    pub id: String,
    pub name: String,
    pub color: Option<String>,
    pub created_at: DateTime<Utc>,
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

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Settings {
    pub key: String,
    pub value: String,
    pub updated_at: DateTime<Utc>,
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

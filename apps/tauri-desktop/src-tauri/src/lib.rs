// MingLog Desktop Library
// This file exposes the core modules for use in binaries and tests

pub mod database;
pub mod models;
pub mod error;
// pub mod monitoring; // 暂时禁用监控模块，避免兼容性问题

// Re-export commonly used types
pub use database::Database;
pub use models::{Note, Tag, Settings, CreateNoteRequest, CreateTagRequest, UpdateNoteRequest, SearchRequest, SearchResult};
pub use error::AppError;

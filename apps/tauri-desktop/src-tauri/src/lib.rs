// MingLog Desktop Library
// This file exposes the core modules for use in binaries and tests

pub mod database;
pub mod models;
pub mod error;

// Re-export commonly used types
pub use database::Database;
pub use models::{Note, Tag, Settings, CreateNoteRequest, CreateTagRequest, UpdateNoteRequest, SearchRequest, SearchResult};
pub use error::AppError;

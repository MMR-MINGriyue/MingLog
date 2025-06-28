use tauri::{command, Window, AppHandle, Manager};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use crate::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct FileInfo {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub size: u64,
    pub modified: u64,
    pub created: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PlatformInfo {
    pub os: String,
    pub arch: String,
    pub version: String,
}

// File System Commands
#[command]
pub async fn read_file_content(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file {}: {}", path, e))
}

#[command]
pub async fn write_file_content(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, content)
        .map_err(|e| format!("Failed to write file {}: {}", path, e))
}

#[command]
pub async fn list_directory(path: String) -> Result<Vec<FileInfo>, String> {
    let dir = std::fs::read_dir(&path)
        .map_err(|e| format!("Failed to read directory {}: {}", path, e))?;
    
    let mut files = Vec::new();
    
    for entry in dir {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let metadata = entry.metadata()
            .map_err(|e| format!("Failed to read file metadata: {}", e))?;
        
        let file_info = FileInfo {
            name: entry.file_name().to_string_lossy().to_string(),
            path: entry.path().to_string_lossy().to_string(),
            is_directory: metadata.is_dir(),
            size: metadata.len(),
            modified: metadata.modified()
                .unwrap_or(std::time::UNIX_EPOCH)
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
            created: metadata.created()
                .unwrap_or(std::time::UNIX_EPOCH)
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
        };
        
        files.push(file_info);
    }
    
    Ok(files)
}

#[command]
pub async fn create_directory(path: String) -> Result<(), String> {
    std::fs::create_dir_all(&path)
        .map_err(|e| format!("Failed to create directory {}: {}", path, e))
}

#[command]
pub async fn delete_file(path: String) -> Result<(), String> {
    std::fs::remove_file(&path)
        .map_err(|e| format!("Failed to delete file {}: {}", path, e))
}

#[command]
pub async fn delete_directory(path: String) -> Result<(), String> {
    std::fs::remove_dir_all(&path)
        .map_err(|e| format!("Failed to delete directory {}: {}", path, e))
}

#[command]
pub async fn copy_file(source: String, destination: String) -> Result<(), String> {
    std::fs::copy(&source, &destination)
        .map_err(|e| format!("Failed to copy file from {} to {}: {}", source, destination, e))?;
    Ok(())
}

#[command]
pub async fn move_file(source: String, destination: String) -> Result<(), String> {
    std::fs::rename(&source, &destination)
        .map_err(|e| format!("Failed to move file from {} to {}: {}", source, destination, e))
}

#[command]
pub async fn file_exists(path: String) -> Result<bool, String> {
    Ok(std::path::Path::new(&path).exists())
}

#[command]
pub async fn get_file_info(path: String) -> Result<FileInfo, String> {
    let path_buf = PathBuf::from(&path);
    let metadata = std::fs::metadata(&path)
        .map_err(|e| format!("Failed to get file info for {}: {}", path, e))?;
    
    Ok(FileInfo {
        name: path_buf.file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string(),
        path: path.clone(),
        is_directory: metadata.is_dir(),
        size: metadata.len(),
        modified: metadata.modified()
            .unwrap_or(std::time::UNIX_EPOCH)
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs(),
        created: metadata.created()
            .unwrap_or(std::time::UNIX_EPOCH)
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs(),
    })
}

// Database Commands
#[command]
pub async fn init_database(app_handle: AppHandle) -> Result<(), String> {
    use crate::database::Database;

    let app_dir = app_handle.path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app data directory")?;

    // Create app data directory if it doesn't exist
    if !app_dir.exists() {
        std::fs::create_dir_all(&app_dir)
            .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    }

    let db_path = app_dir.join("minglog.db");
    let db_path_str = db_path.to_string_lossy().to_string();

    // Initialize database
    Database::new(&db_path_str)
        .map_err(|e| format!("Failed to initialize database: {}", e))?;

    log::info!("Database initialized at: {}", db_path_str);
    Ok(())
}

#[command]
pub async fn execute_query(query: String, params: Vec<String>) -> Result<String, String> {
    // This is a generic query executor - use with caution in production
    log::info!("Executing query: {} with params: {:?}", query, params);
    // For security reasons, we'll limit this to read-only queries
    if query.trim().to_lowercase().starts_with("select") {
        Ok("{}".to_string()) // Placeholder for actual implementation
    } else {
        Err("Only SELECT queries are allowed".to_string())
    }
}

#[command]
pub async fn get_all_pages(app_handle: AppHandle) -> Result<String, String> {
    use crate::database::Database;

    let app_dir = app_handle.path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app data directory")?;

    let db_path = app_dir.join("minglog.db");
    let db_path_str = db_path.to_string_lossy().to_string();

    let db = Database::new(&db_path_str)
        .map_err(|e| format!("Failed to connect to database: {}", e))?;

    let pages = db.get_all_pages()
        .map_err(|e| format!("Failed to get pages: {}", e))?;

    serde_json::to_string(&pages)
        .map_err(|e| format!("Failed to serialize pages: {}", e))
}

#[command]
pub async fn create_page(app_handle: AppHandle, title: String, content: String) -> Result<String, String> {
    use crate::database::{Database, Page};
    use std::time::{SystemTime, UNIX_EPOCH};

    let app_dir = app_handle.path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app data directory")?;

    let db_path = app_dir.join("minglog.db");
    let db_path_str = db_path.to_string_lossy().to_string();

    let db = Database::new(&db_path_str)
        .map_err(|e| format!("Failed to connect to database: {}", e))?;

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;

    let page = Page {
        id: uuid::Uuid::new_v4().to_string(),
        title,
        content,
        created_at: now,
        updated_at: now,
    };

    db.create_page(&page)
        .map_err(|e| format!("Failed to create page: {}", e))?;

    log::info!("Created page: {} - {}", page.id, page.title);

    serde_json::to_string(&page)
        .map_err(|e| format!("Failed to serialize page: {}", e))
}

#[command]
pub async fn update_page(app_handle: AppHandle, id: String, title: String, content: String) -> Result<(), String> {
    use crate::database::{Database, Page};
    use std::time::{SystemTime, UNIX_EPOCH};

    let app_dir = app_handle.path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app data directory")?;

    let db_path = app_dir.join("minglog.db");
    let db_path_str = db_path.to_string_lossy().to_string();

    let db = Database::new(&db_path_str)
        .map_err(|e| format!("Failed to connect to database: {}", e))?;

    // Get existing page to preserve created_at
    let existing_page = db.get_page(&id)
        .map_err(|e| format!("Failed to get existing page: {}", e))?
        .ok_or("Page not found")?;

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;

    let updated_page = Page {
        id,
        title,
        content,
        created_at: existing_page.created_at,
        updated_at: now,
    };

    db.update_page(&updated_page)
        .map_err(|e| format!("Failed to update page: {}", e))?;

    log::info!("Updated page: {} - {}", updated_page.id, updated_page.title);
    Ok(())
}

#[command]
pub async fn delete_page(app_handle: AppHandle, id: String) -> Result<(), String> {
    use crate::database::Database;

    let app_dir = app_handle.path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app data directory")?;

    let db_path = app_dir.join("minglog.db");
    let db_path_str = db_path.to_string_lossy().to_string();

    let db = Database::new(&db_path_str)
        .map_err(|e| format!("Failed to connect to database: {}", e))?;

    db.delete_page(&id)
        .map_err(|e| format!("Failed to delete page: {}", e))?;

    log::info!("Deleted page: {}", id);
    Ok(())
}

// System Commands
#[command]
pub async fn get_app_version() -> Result<String, String> {
    Ok(env!("CARGO_PKG_VERSION").to_string())
}

#[command]
pub async fn get_platform_info() -> Result<PlatformInfo, String> {
    Ok(PlatformInfo {
        os: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        version: "1.0.0".to_string(), // TODO: Get actual OS version
    })
}

#[command]
pub async fn open_external_url(url: String) -> Result<(), String> {
    tauri::api::shell::open(&tauri::api::shell::Scope::default(), url, None)
        .map_err(|e| format!("Failed to open URL: {}", e))
}

#[command]
pub async fn show_in_folder(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .args(["/select,", &path])
            .spawn()
            .map_err(|e| format!("Failed to show in folder: {}", e))?;
    }
    
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .args(["-R", &path])
            .spawn()
            .map_err(|e| format!("Failed to show in folder: {}", e))?;
    }
    
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(std::path::Path::new(&path).parent().unwrap_or(std::path::Path::new("/")))
            .spawn()
            .map_err(|e| format!("Failed to show in folder: {}", e))?;
    }
    
    Ok(())
}

// Window Commands
#[command]
pub async fn minimize_window(window: Window) -> Result<(), String> {
    window.minimize().map_err(|e| format!("Failed to minimize window: {}", e))
}

#[command]
pub async fn maximize_window(window: Window) -> Result<(), String> {
    window.maximize().map_err(|e| format!("Failed to maximize window: {}", e))
}

#[command]
pub async fn close_window(window: Window) -> Result<(), String> {
    window.close().map_err(|e| format!("Failed to close window: {}", e))
}

// Additional utility commands
#[command]
pub async fn get_page_by_id(app_handle: AppHandle, id: String) -> Result<String, String> {
    use crate::database::Database;

    let app_dir = app_handle.path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app data directory")?;

    let db_path = app_dir.join("minglog.db");
    let db_path_str = db_path.to_string_lossy().to_string();

    let db = Database::new(&db_path_str)
        .map_err(|e| format!("Failed to connect to database: {}", e))?;

    let page = db.get_page(&id)
        .map_err(|e| format!("Failed to get page: {}", e))?
        .ok_or("Page not found")?;

    serde_json::to_string(&page)
        .map_err(|e| format!("Failed to serialize page: {}", e))
}

#[command]
pub async fn search_pages(app_handle: AppHandle, query: String) -> Result<String, String> {
    use crate::database::Database;

    let app_dir = app_handle.path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app data directory")?;

    let db_path = app_dir.join("minglog.db");
    let db_path_str = db_path.to_string_lossy().to_string();

    let db = Database::new(&db_path_str)
        .map_err(|e| format!("Failed to connect to database: {}", e))?;

    let all_pages = db.get_all_pages()
        .map_err(|e| format!("Failed to get pages: {}", e))?;

    // Simple text search - can be enhanced with full-text search later
    let query_lower = query.to_lowercase();
    let filtered_pages: Vec<_> = all_pages
        .into_iter()
        .filter(|page| {
            page.title.to_lowercase().contains(&query_lower) ||
            page.content.to_lowercase().contains(&query_lower)
        })
        .collect();

    serde_json::to_string(&filtered_pages)
        .map_err(|e| format!("Failed to serialize pages: {}", e))
}

#[command]
pub async fn get_recent_pages(app_handle: AppHandle, limit: Option<usize>) -> Result<String, String> {
    use crate::database::Database;

    let app_dir = app_handle.path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app data directory")?;

    let db_path = app_dir.join("minglog.db");
    let db_path_str = db_path.to_string_lossy().to_string();

    let db = Database::new(&db_path_str)
        .map_err(|e| format!("Failed to connect to database: {}", e))?;

    let mut pages = db.get_all_pages()
        .map_err(|e| format!("Failed to get pages: {}", e))?;

    // Sort by updated_at descending
    pages.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));

    // Limit results
    let limit = limit.unwrap_or(10);
    pages.truncate(limit);

    serde_json::to_string(&pages)
        .map_err(|e| format!("Failed to serialize pages: {}", e))
}

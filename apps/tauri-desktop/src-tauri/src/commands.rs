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

// Database Commands (placeholder implementations)
#[command]
pub async fn init_database(app_handle: AppHandle) -> Result<(), String> {
    // TODO: Initialize SQLite database
    log::info!("Initializing database...");
    Ok(())
}

#[command]
pub async fn execute_query(query: String, params: Vec<String>) -> Result<String, String> {
    // TODO: Execute database query
    log::info!("Executing query: {}", query);
    Ok("{}".to_string())
}

#[command]
pub async fn get_all_pages() -> Result<String, String> {
    // TODO: Get all pages from database
    Ok("[]".to_string())
}

#[command]
pub async fn create_page(title: String, content: String) -> Result<String, String> {
    // TODO: Create new page in database
    log::info!("Creating page: {}", title);
    Ok("{}".to_string())
}

#[command]
pub async fn update_page(id: String, title: String, content: String) -> Result<(), String> {
    // TODO: Update page in database
    log::info!("Updating page: {} - {}", id, title);
    Ok(())
}

#[command]
pub async fn delete_page(id: String) -> Result<(), String> {
    // TODO: Delete page from database
    log::info!("Deleting page: {}", id);
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

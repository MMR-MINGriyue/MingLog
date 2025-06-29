use crate::error::{AppError, Result};
use crate::models::{
    AppInfo, CreateNoteRequest, CreateTagRequest, DatabaseStats, Note, SearchRequest, SearchResult,
    Settings, Tag, UpdateNoteRequest,
};
use crate::state::AppState;
use serde_json::Value;
use std::collections::HashMap;
use tauri::State;

// App commands
#[tauri::command]
pub async fn init_app() -> Result<String> {
    log::info!("Initializing MingLog Desktop app");
    Ok("App initialized successfully".to_string())
}

#[tauri::command]
pub async fn get_app_info() -> Result<AppInfo> {
    Ok(AppInfo {
        name: "MingLog Desktop".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        description: env!("CARGO_PKG_DESCRIPTION").to_string(),
        author: "MingLog Team".to_string(),
    })
}

// Database commands
#[tauri::command]
pub async fn init_database(state: State<'_, AppState>) -> Result<String> {
    log::info!("Database already initialized");
    Ok("Database ready".to_string())
}

// Note commands
#[tauri::command]
pub async fn create_note(
    request: CreateNoteRequest,
    state: State<'_, AppState>,
) -> Result<Note> {
    let db = state.db.lock().await;
    db.create_note(request).await
}

#[tauri::command]
pub async fn get_note(id: String, state: State<'_, AppState>) -> Result<Note> {
    let db = state.db.lock().await;
    db.get_note(&id).await
}

#[tauri::command]
pub async fn get_notes(
    limit: Option<i32>,
    offset: Option<i32>,
    state: State<'_, AppState>,
) -> Result<Vec<Note>> {
    let db = state.db.lock().await;
    db.get_notes(limit, offset).await
}

#[tauri::command]
pub async fn update_note(
    request: UpdateNoteRequest,
    state: State<'_, AppState>,
) -> Result<Note> {
    let db = state.db.lock().await;
    db.update_note(request).await
}

#[tauri::command]
pub async fn delete_note(id: String, state: State<'_, AppState>) -> Result<()> {
    let db = state.db.lock().await;
    db.delete_note(&id).await
}

#[tauri::command]
pub async fn search_notes(
    request: SearchRequest,
    state: State<'_, AppState>,
) -> Result<SearchResult> {
    let db = state.db.lock().await;
    db.search_notes(request).await
}

// Tag commands
#[tauri::command]
pub async fn get_tags(state: State<'_, AppState>) -> Result<Vec<Tag>> {
    let db = state.db.lock().await;
    db.get_tags().await
}

#[tauri::command]
pub async fn create_tag(
    request: CreateTagRequest,
    state: State<'_, AppState>,
) -> Result<Tag> {
    let db = state.db.lock().await;
    db.create_tag(request).await
}

#[tauri::command]
pub async fn delete_tag(id: String, state: State<'_, AppState>) -> Result<()> {
    let db = state.db.lock().await;
    db.delete_tag(&id).await
}

// Settings commands
#[tauri::command]
pub async fn get_settings(state: State<'_, AppState>) -> Result<HashMap<String, String>> {
    let db = state.db.lock().await;
    let settings = db.get_all_settings().await?;
    
    let mut map = HashMap::new();
    for setting in settings {
        map.insert(setting.key, setting.value);
    }
    
    Ok(map)
}

#[tauri::command]
pub async fn update_settings(
    settings: HashMap<String, String>,
    state: State<'_, AppState>,
) -> Result<()> {
    let db = state.db.lock().await;
    
    for (key, value) in settings {
        db.set_setting(&key, &value).await?;
    }
    
    Ok(())
}

// File commands
#[tauri::command]
pub async fn save_file(
    path: String,
    content: String,
) -> Result<()> {
    tokio::fs::write(&path, content).await?;
    Ok(())
}

#[tauri::command]
pub async fn load_file(path: String) -> Result<String> {
    let content = tokio::fs::read_to_string(&path).await?;
    Ok(content)
}

#[tauri::command]
pub async fn export_data(
    path: String,
    state: State<'_, AppState>,
) -> Result<()> {
    let db = state.db.lock().await;
    
    // Get all data
    let notes = db.get_notes(None, None).await?;
    let tags = db.get_tags().await?;
    let settings = db.get_all_settings().await?;
    
    // Create export data structure
    let export_data = serde_json::json!({
        "version": "1.0",
        "exported_at": chrono::Utc::now().to_rfc3339(),
        "notes": notes,
        "tags": tags,
        "settings": settings
    });
    
    // Write to file
    let json_string = serde_json::to_string_pretty(&export_data)?;
    tokio::fs::write(&path, json_string).await?;
    
    Ok(())
}

#[tauri::command]
pub async fn import_data(
    path: String,
    state: State<'_, AppState>,
) -> Result<String> {
    let content = tokio::fs::read_to_string(&path).await?;
    let import_data: Value = serde_json::from_str(&content)?;
    
    let db = state.db.lock().await;
    
    let mut imported_count = 0;
    
    // Import notes
    if let Some(notes) = import_data["notes"].as_array() {
        for note_value in notes {
            if let Ok(note) = serde_json::from_value::<Note>(note_value.clone()) {
                let request = CreateNoteRequest {
                    title: note.title,
                    content: note.content,
                    tags: Some(note.get_tags()),
                };
                
                if db.create_note(request).await.is_ok() {
                    imported_count += 1;
                }
            }
        }
    }
    
    // Import tags
    if let Some(tags) = import_data["tags"].as_array() {
        for tag_value in tags {
            if let Ok(tag) = serde_json::from_value::<Tag>(tag_value.clone()) {
                let request = CreateTagRequest {
                    name: tag.name,
                    color: tag.color,
                };
                
                let _ = db.create_tag(request).await;
            }
        }
    }
    
    // Import settings
    if let Some(settings) = import_data["settings"].as_array() {
        for setting_value in settings {
            if let Ok(setting) = serde_json::from_value::<Settings>(setting_value.clone()) {
                let _ = db.set_setting(&setting.key, &setting.value).await;
            }
        }
    }
    
    Ok(format!("Successfully imported {} items", imported_count))
}

use crate::storage::{StorageManager, Workspace, Page, StorageMetadata};
use crate::AppState;
use tauri::State;
use serde_json::Value;

#[derive(serde::Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }
    
    pub fn error(error: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(error),
        }
    }
}

#[tauri::command]
pub async fn load_workspace(state: State<'_, AppState>) -> Result<ApiResponse<Workspace>, String> {
    let mut storage_lock = state.storage.lock().map_err(|e| e.to_string())?;
    
    if let Some(ref mut storage) = *storage_lock {
        match storage.load_workspace() {
            Ok(workspace) => Ok(ApiResponse::success(workspace)),
            Err(e) => Ok(ApiResponse::error(e.to_string())),
        }
    } else {
        Ok(ApiResponse::error("存储管理器未初始化".to_string()))
    }
}

#[tauri::command]
pub async fn save_workspace(
    workspace: Workspace,
    state: State<'_, AppState>
) -> Result<ApiResponse<()>, String> {
    let mut storage_lock = state.storage.lock().map_err(|e| e.to_string())?;
    
    if let Some(ref mut storage) = *storage_lock {
        match storage.save_workspace(&workspace) {
            Ok(_) => Ok(ApiResponse::success(())),
            Err(e) => Ok(ApiResponse::error(e.to_string())),
        }
    } else {
        Ok(ApiResponse::error("存储管理器未初始化".to_string()))
    }
}

#[tauri::command]
pub async fn create_page(
    title: String,
    state: State<'_, AppState>
) -> Result<ApiResponse<Page>, String> {
    let mut storage_lock = state.storage.lock().map_err(|e| e.to_string())?;
    
    if let Some(ref mut storage) = *storage_lock {
        match storage.create_page(title) {
            Ok(page) => Ok(ApiResponse::success(page)),
            Err(e) => Ok(ApiResponse::error(e.to_string())),
        }
    } else {
        Ok(ApiResponse::error("存储管理器未初始化".to_string()))
    }
}

#[tauri::command]
pub async fn update_page(
    page_id: String,
    updates: Value,
    state: State<'_, AppState>
) -> Result<ApiResponse<()>, String> {
    let mut storage_lock = state.storage.lock().map_err(|e| e.to_string())?;
    
    if let Some(ref mut storage) = *storage_lock {
        match storage.update_page(page_id, updates) {
            Ok(_) => Ok(ApiResponse::success(())),
            Err(e) => Ok(ApiResponse::error(e.to_string())),
        }
    } else {
        Ok(ApiResponse::error("存储管理器未初始化".to_string()))
    }
}

#[tauri::command]
pub async fn delete_page(
    page_id: String,
    state: State<'_, AppState>
) -> Result<ApiResponse<()>, String> {
    let mut storage_lock = state.storage.lock().map_err(|e| e.to_string())?;
    
    if let Some(ref mut storage) = *storage_lock {
        match storage.delete_page(page_id) {
            Ok(_) => Ok(ApiResponse::success(())),
            Err(e) => Ok(ApiResponse::error(e.to_string())),
        }
    } else {
        Ok(ApiResponse::error("存储管理器未初始化".to_string()))
    }
}

#[tauri::command]
pub async fn get_metadata(state: State<'_, AppState>) -> Result<ApiResponse<StorageMetadata>, String> {
    let storage_lock = state.storage.lock().map_err(|e| e.to_string())?;
    
    if let Some(ref storage) = *storage_lock {
        match storage.get_metadata() {
            Ok(metadata) => Ok(ApiResponse::success(metadata)),
            Err(e) => Ok(ApiResponse::error(e.to_string())),
        }
    } else {
        Ok(ApiResponse::error("存储管理器未初始化".to_string()))
    }
}

#[tauri::command]
pub async fn create_backup(state: State<'_, AppState>) -> Result<ApiResponse<String>, String> {
    // TODO: 实现备份功能
    Ok(ApiResponse::error("备份功能尚未实现".to_string()))
}

#[tauri::command]
pub async fn get_backup_list(state: State<'_, AppState>) -> Result<ApiResponse<Vec<String>>, String> {
    // TODO: 实现获取备份列表功能
    Ok(ApiResponse::error("获取备份列表功能尚未实现".to_string()))
}

#[tauri::command]
pub async fn restore_backup(
    backup_path: String,
    state: State<'_, AppState>
) -> Result<ApiResponse<()>, String> {
    // TODO: 实现恢复备份功能
    Ok(ApiResponse::error("恢复备份功能尚未实现".to_string()))
}

#[tauri::command]
pub async fn export_markdown(
    page_id: Option<String>,
    state: State<'_, AppState>
) -> Result<ApiResponse<String>, String> {
    // TODO: 实现导出Markdown功能
    Ok(ApiResponse::error("导出Markdown功能尚未实现".to_string()))
}

#[tauri::command]
pub async fn import_markdown(
    markdown: String,
    title: Option<String>,
    state: State<'_, AppState>
) -> Result<ApiResponse<Page>, String> {
    // TODO: 实现导入Markdown功能
    Ok(ApiResponse::error("导入Markdown功能尚未实现".to_string()))
}

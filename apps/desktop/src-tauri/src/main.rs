// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::State;

// 数据模型
#[derive(Debug, Clone, Serialize, Deserialize)]
struct Block {
    id: String,
    block_type: String,
    content: String,
    properties: HashMap<String, serde_json::Value>,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Page {
    id: String,
    title: String,
    blocks: Vec<Block>,
    tags: Vec<String>,
    properties: HashMap<String, serde_json::Value>,
    created_at: String,
    updated_at: String,
    is_journal: Option<bool>,
    journal_date: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct WorkspaceSettings {
    theme: String,
    font_size: u32,
    font_family: String,
    auto_save: bool,
    auto_save_interval: u32,
    backup_enabled: bool,
    backup_interval: u32,
    max_backups: u32,
}

impl Default for WorkspaceSettings {
    fn default() -> Self {
        Self {
            theme: "light".to_string(),
            font_size: 16,
            font_family: "system-ui".to_string(),
            auto_save: true,
            auto_save_interval: 30,
            backup_enabled: true,
            backup_interval: 24,
            max_backups: 10,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Workspace {
    id: String,
    name: String,
    description: Option<String>,
    pages: HashMap<String, Page>,
    settings: WorkspaceSettings,
    created_at: String,
    updated_at: String,
    version: String,
}

// 应用状态
struct AppState {
    workspace: Mutex<Option<Workspace>>,
}

// API响应结构
#[derive(Serialize)]
struct ApiResponse<T> {
    success: bool,
    data: Option<T>,
    error: Option<String>,
}

impl<T> ApiResponse<T> {
    fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    fn error(error: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(error),
        }
    }
}

// 命令函数
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_app_info() -> serde_json::Value {
    serde_json::json!({
        "name": "MingLog",
        "version": "0.1.0",
        "platform": std::env::consts::OS,
        "arch": std::env::consts::ARCH
    })
}

#[tauri::command]
fn load_workspace(state: State<AppState>) -> ApiResponse<Workspace> {
    // 创建默认工作空间
    let now = chrono::Utc::now().to_rfc3339();
    let mut pages = HashMap::new();

    // 创建欢迎页面
    let welcome_page = Page {
        id: "welcome".to_string(),
        title: "欢迎使用 MingLog".to_string(),
        blocks: vec![
            Block {
                id: uuid::Uuid::new_v4().to_string(),
                block_type: "h1".to_string(),
                content: "欢迎使用 MingLog 桌面版".to_string(),
                properties: HashMap::new(),
                created_at: now.clone(),
                updated_at: now.clone(),
            },
            Block {
                id: uuid::Uuid::new_v4().to_string(),
                block_type: "p".to_string(),
                content: "MingLog 是一个现代化的知识管理工具，专注于性能、开发体验和可维护性。".to_string(),
                properties: HashMap::new(),
                created_at: now.clone(),
                updated_at: now.clone(),
            },
        ],
        tags: vec!["欢迎".to_string(), "介绍".to_string()],
        properties: HashMap::new(),
        created_at: now.clone(),
        updated_at: now.clone(),
        is_journal: None,
        journal_date: None,
    };

    pages.insert("welcome".to_string(), welcome_page);

    let workspace = Workspace {
        id: "default".to_string(),
        name: "MingLog 工作空间".to_string(),
        description: Some("默认工作空间".to_string()),
        pages,
        settings: WorkspaceSettings::default(),
        created_at: now.clone(),
        updated_at: now,
        version: "1.0.0".to_string(),
    };

    // 保存到状态
    if let Ok(mut workspace_lock) = state.workspace.lock() {
        *workspace_lock = Some(workspace.clone());
    }

    ApiResponse::success(workspace)
}

#[tauri::command]
fn create_page(title: String, state: State<AppState>) -> ApiResponse<Page> {
    let now = chrono::Utc::now().to_rfc3339();
    let page_id = uuid::Uuid::new_v4().to_string();

    let page = Page {
        id: page_id.clone(),
        title: title.clone(),
        blocks: vec![
            Block {
                id: uuid::Uuid::new_v4().to_string(),
                block_type: "h1".to_string(),
                content: title,
                properties: HashMap::new(),
                created_at: now.clone(),
                updated_at: now.clone(),
            },
            Block {
                id: uuid::Uuid::new_v4().to_string(),
                block_type: "p".to_string(),
                content: "".to_string(),
                properties: HashMap::new(),
                created_at: now.clone(),
                updated_at: now.clone(),
            },
        ],
        tags: Vec::new(),
        properties: HashMap::new(),
        created_at: now.clone(),
        updated_at: now.clone(),
        is_journal: None,
        journal_date: None,
    };

    // 添加到工作空间
    if let Ok(mut workspace_lock) = state.workspace.lock() {
        if let Some(ref mut workspace) = *workspace_lock {
            workspace.pages.insert(page_id.clone(), page.clone());
            workspace.updated_at = now;
        }
    }

    ApiResponse::success(page)
}

#[tauri::command]
fn update_page(page_id: String, updates: serde_json::Value, state: State<AppState>) -> ApiResponse<()> {
    let now = chrono::Utc::now().to_rfc3339();

    if let Ok(mut workspace_lock) = state.workspace.lock() {
        if let Some(ref mut workspace) = *workspace_lock {
            if let Some(page) = workspace.pages.get_mut(&page_id) {
                // 更新页面字段
                if let Some(title) = updates.get("title").and_then(|v| v.as_str()) {
                    page.title = title.to_string();
                }

                if let Some(blocks_value) = updates.get("blocks") {
                    if let Ok(blocks) = serde_json::from_value::<Vec<Block>>(blocks_value.clone()) {
                        page.blocks = blocks;
                    }
                }

                page.updated_at = now.clone();
                workspace.updated_at = now;

                return ApiResponse::success(());
            }
        }
    }

    ApiResponse::error("页面不存在或更新失败".to_string())
}

#[tauri::command]
fn save_workspace(workspace: Workspace, state: State<AppState>) -> ApiResponse<()> {
    if let Ok(mut workspace_lock) = state.workspace.lock() {
        *workspace_lock = Some(workspace);
        ApiResponse::success(())
    } else {
        ApiResponse::error("保存工作空间失败".to_string())
    }
}

#[tauri::command]
fn delete_page(page_id: String, state: State<AppState>) -> ApiResponse<()> {
    let now = chrono::Utc::now().to_rfc3339();

    if let Ok(mut workspace_lock) = state.workspace.lock() {
        if let Some(ref mut workspace) = *workspace_lock {
            workspace.pages.remove(&page_id);
            workspace.updated_at = now;
            return ApiResponse::success(());
        }
    }

    ApiResponse::error("删除页面失败".to_string())
}

#[tauri::command]
fn get_metadata(state: State<AppState>) -> ApiResponse<serde_json::Value> {
    if let Ok(workspace_lock) = state.workspace.lock() {
        if let Some(ref workspace) = *workspace_lock {
            let total_blocks: usize = workspace.pages.values()
                .map(|page| page.blocks.len())
                .sum();

            let metadata = serde_json::json!({
                "version": workspace.version,
                "last_modified": workspace.updated_at,
                "total_pages": workspace.pages.len(),
                "total_blocks": total_blocks,
                "data_path": "内存存储"
            });

            return ApiResponse::success(metadata);
        }
    }

    ApiResponse::error("获取元数据失败".to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(AppState {
            workspace: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            get_app_info,
            load_workspace,
            create_page,
            update_page,
            save_workspace,
            delete_page,
            get_metadata
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

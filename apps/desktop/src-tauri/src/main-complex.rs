// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod storage;
mod commands;

use tauri::Manager;
use storage::StorageManager;

// 应用状态
#[derive(Default)]
struct AppState {
    storage: std::sync::Mutex<Option<StorageManager>>,
}

// 窗口标签
#[derive(Clone, serde::Serialize)]
struct Payload {
    args: Vec<String>,
    cwd: String,
}

// 初始化应用状态
fn init_app_state() -> AppState {
    AppState {
        storage: std::sync::Mutex::new(None),
    }
}

// 窗口事件处理
fn handle_window_event(event: tauri::GlobalWindowEvent) {
    match event.event() {
        tauri::WindowEvent::CloseRequested { .. } => {
            // 在关闭前保存数据
            println!("窗口即将关闭，保存数据...");
        }
        tauri::WindowEvent::Focused(focused) => {
            if *focused {
                println!("窗口获得焦点");
            } else {
                println!("窗口失去焦点");
            }
        }
        _ => {}
    }
}

// 菜单事件处理
fn handle_menu_event(event: tauri::WindowMenuEvent) {
    match event.menu_item_id() {
        "new_page" => {
            println!("创建新页面");
            // 发送事件到前端
            event.window().emit("menu-new-page", {}).unwrap();
        }
        "save" => {
            println!("保存");
            event.window().emit("menu-save", {}).unwrap();
        }
        "export" => {
            println!("导出");
            event.window().emit("menu-export", {}).unwrap();
        }
        "import" => {
            println!("导入");
            event.window().emit("menu-import", {}).unwrap();
        }
        "preferences" => {
            println!("偏好设置");
            event.window().emit("menu-preferences", {}).unwrap();
        }
        "quit" => {
            std::process::exit(0);
        }
        _ => {}
    }
}

fn main() {

    tauri::Builder::default()
        .manage(init_app_state())
        .on_window_event(handle_window_event)
        .invoke_handler(tauri::generate_handler![
            commands::storage::load_workspace,
            commands::storage::save_workspace,
            commands::storage::create_page,
            commands::storage::update_page,
            commands::storage::delete_page,
            commands::storage::create_backup,
            commands::storage::get_backup_list,
            commands::storage::restore_backup,
            commands::storage::export_markdown,
            commands::storage::import_markdown,
            commands::storage::get_metadata,
            commands::dialog::show_open_dialog,
            commands::dialog::show_save_dialog,
            commands::dialog::show_message_box,
            commands::fs::read_file,
            commands::fs::write_file,
            commands::app::get_app_info,
            commands::app::open_external,
            commands::app::restart_app
        ])
        .setup(|app| {
            // 初始化存储管理器
            let app_state: tauri::State<AppState> = app.state();
            let mut storage_lock = app_state.storage.lock().unwrap();
            *storage_lock = Some(StorageManager::new()?);
            
            println!("MingLog 桌面版启动成功");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

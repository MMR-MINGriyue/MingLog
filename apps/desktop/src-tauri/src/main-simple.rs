// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// 简单的测试命令
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

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![greet, get_app_info])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

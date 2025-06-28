// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use serde::{Deserialize, Serialize};

mod commands;
mod database;
mod file_system;

use commands::*;

fn main() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            // File system commands
            read_file_content,
            write_file_content,
            list_directory,
            create_directory,
            delete_file,
            delete_directory,
            copy_file,
            move_file,
            file_exists,
            get_file_info,

            // Database commands
            init_database,
            execute_query,
            get_all_pages,
            get_page_by_id,
            create_page,
            update_page,
            delete_page,
            search_pages,
            get_recent_pages,

            // System commands
            get_app_version,
            get_platform_info,
            open_external_url,
            show_in_folder,

            // Window commands
            minimize_window,
            maximize_window,
            close_window,
        ])
        .setup(|app| {
            // Log application startup
            log::info!("MingLog Tauri application starting...");

            let app_dir = app.path()
                .app_data_dir()
                .expect("Failed to get app data directory");

            log::info!("App data directory: {}", app_dir.display());

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use std::collections::HashMap;
use serde::{Deserialize, Serialize};

mod commands;
mod database;
mod file_system;

use commands::*;

#[derive(Debug, Serialize, Deserialize)]
pub struct AppState {
    pub database_path: String,
}

fn main() {
    env_logger::init();

    tauri::Builder::default()
        .manage(AppState {
            database_path: String::new(),
        })
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
            create_page,
            update_page,
            delete_page,
            
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
            // Initialize the database on startup
            let app_handle = app.handle();
            let app_dir = app.path_resolver()
                .app_data_dir()
                .expect("Failed to get app data directory");
            
            // Create app data directory if it doesn't exist
            if !app_dir.exists() {
                std::fs::create_dir_all(&app_dir)
                    .expect("Failed to create app data directory");
            }
            
            let db_path = app_dir.join("minglog.db");
            let db_path_str = db_path.to_string_lossy().to_string();
            
            // Update app state with database path
            let state: tauri::State<AppState> = app.state();
            let mut state_guard = state.inner().clone();
            state_guard.database_path = db_path_str.clone();
            
            log::info!("Database path: {}", db_path_str);
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod database;
mod error;
// mod error_reporting; // 暂时禁用，避免Sentry依赖问题
// mod error_testing; // 暂时禁用，避免Sentry依赖问题
mod models;
// mod updater; // 暂时禁用，避免tokio process依赖问题
mod state;
mod file_operations;
mod sync;

use commands::*;
use database::Database;
use state::AppState;
use std::sync::Arc;
use tauri::{Manager, SystemTray, SystemTrayMenu, SystemTrayMenuItem, SystemTrayEvent, CustomMenuItem};
use tokio::sync::Mutex;

#[tokio::main]
async fn main() {
    // Initialize logger
    env_logger::init();
    log::info!("Starting MingLog Desktop...");

    // We'll create the tray menu inside the setup function where we have access to the app handle

    // Build and run the app
    tauri::Builder::default()
        .setup(|app| {
            // Initialize database
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                match Database::new().await {
                    Ok(db) => {
                        let state = AppState {
                            db: Arc::new(Mutex::new(db)),
                            sync_manager: Arc::new(Mutex::new(sync::WebDAVSyncManager::new())),
                        };
                        app_handle.manage(state);
                        log::info!("Database initialized successfully");
                    }
                    Err(e) => {
                        log::error!("Failed to initialize database: {}", e);
                        std::process::exit(1);
                    }
                }
            });

            Ok(())
        })
        .system_tray(SystemTray::new().with_menu(
            SystemTrayMenu::new()
                .add_item(CustomMenuItem::new("show".to_string(), "Show"))
                .add_item(CustomMenuItem::new("hide".to_string(), "Hide"))
                .add_native_item(SystemTrayMenuItem::Separator)
                .add_item(CustomMenuItem::new("quit".to_string(), "Quit"))
        ))
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick { .. } => {
                if let Some(window) = app.get_window("main") {
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "quit" => {
                    std::process::exit(0);
                }
                "show" => {
                    if let Some(window) = app.get_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "hide" => {
                    if let Some(window) = app.get_window("main") {
                        let _ = window.hide();
                    }
                }
                _ => {}
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            // App commands
            init_app,
            get_app_info,

            // Database commands
            init_database,

            // Graph commands
            create_graph,
            get_graph,
            get_graphs,
            update_graph,
            delete_graph,

            // Page commands
            create_page,
            get_page,
            get_pages_by_graph,
            update_page,
            delete_page,

            // Block commands
            create_block,
            get_block,
            get_blocks_by_page,
            update_block,
            delete_block,

            // Note commands (legacy)
            create_note,
            get_note,
            get_notes,
            update_note,
            delete_note,
            search_notes,

            // Search commands
            search_blocks,
            search_in_page,

            // Graph commands
            get_graph_data,
            create_sample_graph_data,

            // File operations commands
            import_markdown_file,
            export_page_to_markdown,
            bulk_export_pages,
            create_backup,

            // File dialog commands
            open_file_dialog,
            save_file_dialog,
            select_folder_dialog,
            import_markdown_files_with_dialog,
            export_pages_with_dialog,
            create_backup_with_dialog,

            // WebDAV sync commands
            configure_webdav_sync,
            get_webdav_config,
            test_webdav_connection,
            start_webdav_sync,
            stop_webdav_sync,
            get_sync_status,
            get_sync_conflicts,
            resolve_sync_conflict,

            // Tag commands
            get_tags,
            create_tag,
            delete_tag,

            // Settings commands
            get_settings,
            update_settings,

            // File commands
            save_file,
            load_file,
            export_data,
            import_data,

            // Error reporting commands (暂时禁用)
            // error_reporting::configure_error_reporting,
            // error_reporting::toggle_error_reporting,
            // error_reporting::get_error_reporting_status,

            // Error testing commands (暂时禁用)
            // error_testing::run_error_tests,
            // error_testing::run_single_error_test,

            // Update commands (暂时禁用)
            // updater::check_for_updates,
            // updater::download_update,
            // updater::install_update,
            // updater::get_update_config,
            // updater::update_update_config
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

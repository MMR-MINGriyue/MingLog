// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod database;
mod error;
mod models;
mod state;

use commands::*;
use database::Database;
use state::AppState;
use std::sync::Arc;
use tauri::{Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, CustomMenuItem};
use tokio::sync::Mutex;

#[tokio::main]
async fn main() {
    // Initialize logger
    env_logger::init();
    log::info!("Starting MingLog Desktop...");

    // Create system tray
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let show = CustomMenuItem::new("show".to_string(), "Show");
    let hide = CustomMenuItem::new("hide".to_string(), "Hide");
    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_item(hide)
        .add_native_item(tauri::SystemTrayMenuItem::Separator)
        .add_item(quit);

    let system_tray = SystemTray::new()
        .with_menu(tray_menu)
        .with_tooltip("MingLog Desktop");

    // Build and run the app
    tauri::Builder::default()
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick {
                position: _,
                size: _,
                ..
            } => {
                let window = app.get_window("main").unwrap();
                if window.is_visible().unwrap() {
                    window.hide().unwrap();
                } else {
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
            }
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "quit" => {
                    std::process::exit(0);
                }
                "show" => {
                    let window = app.get_window("main").unwrap();
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
                "hide" => {
                    let window = app.get_window("main").unwrap();
                    window.hide().unwrap();
                }
                _ => {}
            },
            _ => {}
        })
        .setup(|app| {
            // Initialize database
            let app_handle = app.handle();
            tauri::async_runtime::spawn(async move {
                match Database::new().await {
                    Ok(db) => {
                        let state = AppState {
                            db: Arc::new(Mutex::new(db)),
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
        .invoke_handler(tauri::generate_handler![
            // App commands
            init_app,
            get_app_info,
            
            // Database commands
            init_database,
            
            // Note commands
            create_note,
            get_note,
            get_notes,
            update_note,
            delete_note,
            search_notes,
            
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
            import_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

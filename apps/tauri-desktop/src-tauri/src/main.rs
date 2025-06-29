// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod database;
mod error;
mod models;
mod state;
mod file_operations;

use commands::*;
use database::Database;
use state::AppState;
use std::sync::Arc;
use tauri::{Manager, tray::{TrayIconBuilder, TrayIconEvent}, menu::{MenuBuilder, MenuItemBuilder}};
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

            // Create tray menu
            let quit = MenuItemBuilder::with_id("quit", "Quit").build(app)?;
            let show = MenuItemBuilder::with_id("show", "Show").build(app)?;
            let hide = MenuItemBuilder::with_id("hide", "Hide").build(app)?;

            let menu = MenuBuilder::new(app)
                .item(&show)
                .item(&hide)
                .separator()
                .item(&quit)
                .build()?;

            // Create tray icon
            let app_handle = app.handle().clone();
            let _tray = TrayIconBuilder::with_id("main")
                .menu(&menu)
                .tooltip("MingLog Desktop")
                .on_menu_event(move |app, event| match event.id().as_ref() {
                    "quit" => {
                        app.app_handle().exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.app_handle().get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "hide" => {
                        if let Some(window) = app.app_handle().get_webview_window("main") {
                            let _ = window.hide();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(move |_tray, event| {
                    if let TrayIconEvent::Click { .. } = event {
                        if let Some(window) = app_handle.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
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

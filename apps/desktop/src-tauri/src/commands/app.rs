use tauri::{api::shell, AppHandle, Manager};
use serde_json::json;

#[derive(serde::Serialize)]
pub struct AppInfo {
    pub name: String,
    pub version: String,
    pub platform: String,
    pub arch: String,
}

#[tauri::command]
pub async fn get_app_info(app: AppHandle) -> Result<AppInfo, String> {
    Ok(AppInfo {
        name: app.package_info().name.clone(),
        version: app.package_info().version.to_string(),
        platform: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
    })
}

#[tauri::command]
pub async fn open_external(url: String) -> Result<(), String> {
    shell::open(&shell::Scope::default(), url, None).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn restart_app(app: AppHandle) -> Result<(), String> {
    app.restart();
    Ok(())
}

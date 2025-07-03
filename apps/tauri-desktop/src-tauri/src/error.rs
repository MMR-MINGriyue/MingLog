use serde::{Deserialize, Serialize};
use thiserror::Error;

use std::fs::{self, File};
use std::io::Write;
use std::path::PathBuf;
use chrono::Utc;

#[derive(Error, Debug, Serialize, Deserialize)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(String),
    
    #[error("IO error: {0}")]
    Io(String),
    
    #[error("Serialization error: {0}")]
    Serialization(String),
    
    #[error("Not found: {0}")]
    NotFound(String),
    
    #[error("Invalid input: {0}")]
    InvalidInput(String),
    
    #[error("Permission denied: {0}")]
    PermissionDenied(String),
    
    #[error("Internal error: {0}")]
    Internal(String),

    #[error("Sync error: {0}")]
    Sync(String),
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        match err {
            sqlx::Error::RowNotFound => AppError::NotFound("Record not found".to_string()),
            _ => AppError::Database(err.to_string()),
        }
    }
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::Io(err.to_string())
    }
}

impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        AppError::Serialization(err.to_string())
    }
}

impl From<anyhow::Error> for AppError {
    fn from(err: anyhow::Error) -> Self {
        AppError::Internal(err.to_string())
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorData {
    pub error_type: String,
    pub message: String,
    pub stack: Option<String>,
    pub component_stack: Option<String>,
    pub timestamp: String,
    pub recovery_attempts: i32,
}





impl From<reqwest::Error> for AppError {
    fn from(err: reqwest::Error) -> Self {
        AppError::Io(err.to_string())
    }
}

impl From<String> for AppError {
    fn from(err: String) -> Self {
        AppError::Internal(err)
    }
}

#[tauri::command]
#[allow(dead_code)]
pub async fn log_error(error: ErrorData) -> std::result::Result<(), String> {
    let log_dir = PathBuf::from("logs");
    if !log_dir.exists() {
        fs::create_dir_all(&log_dir).map_err(|e| e.to_string())?;
    }

    let log_file = log_dir.join(format!("error_log_{}.json", Utc::now().format("%Y%m%d")));
    let mut file = if log_file.exists() {
        File::options()
            .append(true)
            .open(log_file)
            .map_err(|e| e.to_string())?
    } else {
        File::create(log_file).map_err(|e| e.to_string())?
    };

    let log_entry = serde_json::to_string_pretty(&error).map_err(|e| e.to_string())?;
    writeln!(file, "{}", log_entry).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
#[allow(dead_code)]
pub async fn report_critical_error(error: ErrorData) -> std::result::Result<(), String> {
    // 这里可以实现发送错误到远程服务器的逻辑
    // 例如: Sentry, LogRocket等
    println!("Critical error reported: {:?}", error);
    Ok(())
}

#[tauri::command]
#[allow(dead_code)]
pub async fn retry_network_requests() -> std::result::Result<(), String> {
    // 实现重试失败的网络请求的逻辑
    Ok(())
}

#[tauri::command]
#[allow(dead_code)]
pub async fn reset_app_state() -> std::result::Result<(), String> {
    // 实现重置应用状态的逻辑
    Ok(())
}

pub type Result<T> = std::result::Result<T, AppError>;

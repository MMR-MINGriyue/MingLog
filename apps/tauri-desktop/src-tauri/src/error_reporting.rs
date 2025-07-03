use sentry::{ClientOptions, Level};
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Manager};
use crate::error::{AppError, Result};

/// 错误报告配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorReportingConfig {
    pub enabled: bool,
    pub dsn: Option<String>,
    pub environment: String,
    pub release: String,
    pub sample_rate: f32,
    pub include_personal_data: bool,
    pub auto_session_tracking: bool,
}

impl Default for ErrorReportingConfig {
    fn default() -> Self {
        Self {
            enabled: false, // 默认关闭，需要用户同意
            dsn: None,
            environment: "development".to_string(),
            release: env!("CARGO_PKG_VERSION").to_string(),
            sample_rate: 1.0,
            include_personal_data: false, // 默认不包含个人数据
            auto_session_tracking: true,
        }
    }
}

/// 错误报告管理器
pub struct ErrorReportingManager {
    config: ErrorReportingConfig,
    enabled: Arc<AtomicBool>,
}

impl ErrorReportingManager {
    pub fn new(config: ErrorReportingConfig) -> Self {
        let enabled = Arc::new(AtomicBool::new(config.enabled));
        Self { config, enabled }
    }

    /// 初始化Sentry错误报告
    pub fn initialize(&self) -> Result<()> {
        if !self.config.enabled || self.config.dsn.is_none() {
            log::info!("错误报告系统未启用或未配置DSN");
            return Ok(());
        }

        let dsn = self.config.dsn.as_ref().unwrap();
        
        let _guard = sentry::init(ClientOptions {
            dsn: Some(dsn.parse().map_err(|e| AppError::Internal(format!("无效的Sentry DSN: {}", e)))?),
            environment: Some(self.config.environment.clone().into()),
            release: Some(self.config.release.clone().into()),
            sample_rate: self.config.sample_rate,
            auto_session_tracking: self.config.auto_session_tracking,
            // 简化配置，移除复杂的数据脱敏逻辑
            ..Default::default()
        });

        log::info!("Sentry错误报告系统已初始化");
        Ok(())
    }

    /// 报告错误
    pub fn report_error(&self, error: &AppError, context: Option<&str>) {
        if !self.enabled.load(Ordering::Relaxed) {
            return;
        }

        sentry::configure_scope(|scope| {
            // 设置错误级别
            let level = match error {
                AppError::Database(_) => Level::Error,
                AppError::Io(_) => Level::Warning,
                AppError::Serialization(_) => Level::Warning,
                AppError::NotFound(_) => Level::Info,
                AppError::InvalidInput(_) => Level::Warning,
                AppError::PermissionDenied(_) => Level::Error,
                AppError::Internal(_) => Level::Error,
                AppError::Sync(_) => Level::Warning,
            };
            scope.set_level(Some(level));

            // 设置错误分类标签
            scope.set_tag("error_type", match error {
                AppError::Database(_) => "database",
                AppError::Io(_) => "io",
                AppError::Serialization(_) => "serialization",
                AppError::NotFound(_) => "not_found",
                AppError::InvalidInput(_) => "invalid_input",
                AppError::PermissionDenied(_) => "permission",
                AppError::Internal(_) => "internal",
                AppError::Sync(_) => "sync",
            });

            // 添加上下文信息
            if let Some(ctx) = context {
                scope.set_context("operation", sentry::protocol::Context::Other({
                    let mut map = std::collections::BTreeMap::new();
                    map.insert("context".to_string(), ctx.into());
                    map
                }));
            }

            // 添加应用信息
            scope.set_context("app", sentry::protocol::Context::App(Box::new(sentry::protocol::AppContext {
                app_name: Some("MingLog Desktop".to_string()),
                app_version: Some(env!("CARGO_PKG_VERSION").to_string()),
                ..Default::default()
            })));

            sentry::capture_error(error);
        });
    }

    /// 报告性能问题
    pub fn report_performance_issue(&self, operation: &str, duration_ms: u64, threshold_ms: u64) {
        if !self.enabled.load(Ordering::Relaxed) || duration_ms < threshold_ms {
            return;
        }

        sentry::configure_scope(|scope| {
            scope.set_level(Some(Level::Warning));
            scope.set_tag("issue_type", "performance");
            scope.set_tag("operation", operation);

            scope.set_context("performance", sentry::protocol::Context::Other({
                let mut map = std::collections::BTreeMap::new();
                map.insert("duration_ms".to_string(), duration_ms.into());
                map.insert("threshold_ms".to_string(), threshold_ms.into());
                map.insert("operation".to_string(), operation.into());
                map
            }));

            sentry::capture_message(
                &format!("性能问题: {} 操作耗时 {}ms (阈值: {}ms)", operation, duration_ms, threshold_ms),
                Level::Warning
            );
        });
    }

    /// 设置用户上下文（脱敏后）
    pub fn set_user_context(&self, user_id: Option<String>) {
        if !self.enabled.load(Ordering::Relaxed) {
            return;
        }

        sentry::configure_scope(|scope| {
            scope.set_user(Some(sentry::User {
                id: user_id,
                email: None, // 不包含邮箱
                username: None, // 不包含用户名
                ip_address: None, // 不包含IP地址
                ..Default::default()
            }));
        });
    }

    /// 启用/禁用错误报告
    pub fn set_enabled(&self, enabled: bool) {
        self.enabled.store(enabled, Ordering::Relaxed);
        log::info!("错误报告系统已{}", if enabled { "启用" } else { "禁用" });
    }

    /// 检查是否启用
    pub fn is_enabled(&self) -> bool {
        self.enabled.load(Ordering::Relaxed)
    }

    /// 添加面包屑
    pub fn add_breadcrumb(&self, message: &str, category: &str, level: Level) {
        if !self.enabled.load(Ordering::Relaxed) {
            return;
        }

        sentry::add_breadcrumb(sentry::protocol::Breadcrumb {
            message: Some(message.to_string()),
            category: Some(category.to_string()),
            level,
            timestamp: chrono::Utc::now().into(),
            ..Default::default()
        });
    }
}

/// Tauri命令：配置错误报告
#[tauri::command]
pub async fn configure_error_reporting(
    app: AppHandle,
    config: ErrorReportingConfig,
) -> Result<()> {
    let manager = ErrorReportingManager::new(config.clone());
    manager.initialize()?;
    
    // 存储到应用状态
    app.manage(manager);
    
    // 保存配置到本地
    save_error_reporting_config(&config).await?;
    
    Ok(())
}

/// Tauri命令：切换错误报告状态
#[tauri::command]
pub async fn toggle_error_reporting(
    app: AppHandle,
    enabled: bool,
) -> Result<()> {
    if let Some(manager) = app.try_state::<ErrorReportingManager>() {
        manager.set_enabled(enabled);
        
        // 更新配置文件
        let mut config = load_error_reporting_config().await.unwrap_or_default();
        config.enabled = enabled;
        save_error_reporting_config(&config).await?;
    }
    
    Ok(())
}

/// Tauri命令：获取错误报告状态
#[tauri::command]
pub async fn get_error_reporting_status(app: AppHandle) -> Result<bool> {
    if let Some(manager) = app.try_state::<ErrorReportingManager>() {
        Ok(manager.is_enabled())
    } else {
        Ok(false)
    }
}

/// 保存错误报告配置
async fn save_error_reporting_config(config: &ErrorReportingConfig) -> Result<()> {
    let config_dir = dirs::config_dir()
        .ok_or_else(|| AppError::Internal("无法获取配置目录".to_string()))?
        .join("MingLog");
    
    tokio::fs::create_dir_all(&config_dir).await?;
    
    let config_file = config_dir.join("error_reporting.json");
    let config_json = serde_json::to_string_pretty(config)?;
    
    tokio::fs::write(config_file, config_json).await?;
    Ok(())
}

/// 加载错误报告配置
async fn load_error_reporting_config() -> Result<ErrorReportingConfig> {
    let config_dir = dirs::config_dir()
        .ok_or_else(|| AppError::Internal("无法获取配置目录".to_string()))?
        .join("MingLog");
    
    let config_file = config_dir.join("error_reporting.json");
    
    if !config_file.exists() {
        return Ok(ErrorReportingConfig::default());
    }
    
    let config_json = tokio::fs::read_to_string(config_file).await?;
    let config: ErrorReportingConfig = serde_json::from_str(&config_json)?;
    
    Ok(config)
}

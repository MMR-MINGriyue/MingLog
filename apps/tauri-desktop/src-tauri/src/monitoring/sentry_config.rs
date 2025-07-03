use crate::error::{AppError, Result};
use sentry::{ClientOptions, Hub};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tauri::{AppHandle, Manager};

/// Sentry监控配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SentryConfig {
    pub dsn: String,
    pub environment: String,
    pub release: String,
    pub sample_rate: f32,
    pub traces_sample_rate: f32,
    pub profiles_sample_rate: f32,
    pub max_breadcrumbs: usize,
    pub attach_stacktrace: bool,
    pub send_default_pii: bool,
    pub auto_session_tracking: bool,
    pub enable_profiling: bool,
}

impl Default for SentryConfig {
    fn default() -> Self {
        Self {
            dsn: String::new(),
            environment: "production".to_string(),
            release: env!("CARGO_PKG_VERSION").to_string(),
            sample_rate: 1.0,
            traces_sample_rate: 0.1,
            profiles_sample_rate: 0.1,
            max_breadcrumbs: 100,
            attach_stacktrace: true,
            send_default_pii: false,
            auto_session_tracking: true,
            enable_profiling: true,
        }
    }
}

/// Sentry监控管理器
pub struct SentryManager {
    config: SentryConfig,
    hub: Arc<Hub>,
    app_handle: AppHandle,
}

impl SentryManager {
    /// 创建新的Sentry管理器
    pub fn new(app_handle: AppHandle, config: SentryConfig) -> Result<Self> {
        let client_options = ClientOptions {
            dsn: Some(config.dsn.parse().map_err(|e| {
                AppError::Internal(format!("Invalid Sentry DSN: {}", e))
            })?),
            environment: Some(config.environment.clone().into()),
            release: Some(config.release.clone().into()),
            sample_rate: config.sample_rate,
            traces_sample_rate: config.traces_sample_rate,
            profiles_sample_rate: config.profiles_sample_rate,
            max_breadcrumbs: config.max_breadcrumbs,
            attach_stacktrace: config.attach_stacktrace,
            send_default_pii: config.send_default_pii,
            auto_session_tracking: config.auto_session_tracking,
            ..Default::default()
        };

        let client = sentry::Client::from_config(client_options);
        let hub = Arc::new(Hub::new_from_top(Arc::new(client)));

        Ok(Self {
            config,
            hub,
            app_handle,
        })
    }

    /// 初始化Sentry监控
    pub fn initialize(&self) -> Result<()> {
        // 设置全局Hub
        Hub::run(self.hub.clone(), || {
            // 配置用户上下文
            sentry::configure_scope(|scope| {
                scope.set_tag("app.name", "MingLog Desktop");
                scope.set_tag("app.version", &self.config.release);
                scope.set_tag("app.environment", &self.config.environment);
                
                // 设置设备信息
                scope.set_context("device", sentry::protocol::Context::Device(Box::new(
                    sentry::protocol::DeviceContext {
                        name: Some(whoami::hostname()),
                        family: Some(std::env::consts::FAMILY.to_string()),
                        model: Some(whoami::platform().to_string()),
                        arch: Some(std::env::consts::ARCH.to_string()),
                        ..Default::default()
                    }
                )));

                // 设置操作系统信息
                scope.set_context("os", sentry::protocol::Context::Os(Box::new(
                    sentry::protocol::OsContext {
                        name: Some(std::env::consts::OS.to_string()),
                        version: Some(whoami::distro()),
                        ..Default::default()
                    }
                )));

                // 设置运行时信息
                scope.set_context("runtime", sentry::protocol::Context::Runtime(Box::new(
                    sentry::protocol::RuntimeContext {
                        name: Some("Rust".to_string()),
                        version: Some(rustc_version_runtime::version().to_string()),
                        ..Default::default()
                    }
                )));
            });

            log::info!("Sentry监控已初始化 - 环境: {}, 版本: {}", 
                      self.config.environment, self.config.release);
        });

        Ok(())
    }

    /// 捕获错误
    pub fn capture_error(&self, error: &AppError) {
        Hub::run(self.hub.clone(), || {
            sentry::configure_scope(|scope| {
                // 设置错误级别
                let level = match error {
                    AppError::Database(_) => sentry::Level::Error,
                    AppError::Io(_) => sentry::Level::Warning,
                    AppError::Serialization(_) => sentry::Level::Warning,
                    AppError::NotFound(_) => sentry::Level::Info,
                    AppError::InvalidInput(_) => sentry::Level::Warning,
                    AppError::PermissionDenied(_) => sentry::Level::Error,
                    AppError::Internal(_) => sentry::Level::Error,
                    AppError::Sync(_) => sentry::Level::Warning,
                };
                scope.set_level(Some(level));

                // 设置错误标签
                scope.set_tag("error.type", match error {
                    AppError::Database(_) => "database",
                    AppError::Io(_) => "io",
                    AppError::Serialization(_) => "serialization",
                    AppError::NotFound(_) => "not_found",
                    AppError::InvalidInput(_) => "invalid_input",
                    AppError::PermissionDenied(_) => "permission",
                    AppError::Internal(_) => "internal",
                    AppError::Sync(_) => "sync",
                });

                // 设置错误上下文
                let mut extra = HashMap::new();
                extra.insert("error_message".to_string(), error.to_string().into());
                extra.insert("timestamp".to_string(), chrono::Utc::now().to_rfc3339().into());
                scope.set_extras(extra);
            });

            sentry::capture_error(error);
        });
    }

    /// 捕获消息
    pub fn capture_message(&self, message: &str, level: sentry::Level) {
        Hub::run(self.hub.clone(), || {
            sentry::capture_message(message, level);
        });
    }

    /// 添加面包屑
    pub fn add_breadcrumb(&self, message: &str, category: &str, level: sentry::Level) {
        Hub::run(self.hub.clone(), || {
            sentry::add_breadcrumb(sentry::protocol::Breadcrumb {
                message: Some(message.to_string()),
                category: Some(category.to_string()),
                level,
                timestamp: chrono::Utc::now().into(),
                ..Default::default()
            });
        });
    }

    /// 开始性能事务
    pub fn start_transaction(&self, name: &str, operation: &str) -> sentry::TransactionOrSpan {
        Hub::run(self.hub.clone(), || {
            let ctx = sentry::TransactionContext::new(name, operation);
            sentry::start_transaction(ctx)
        })
    }

    /// 设置用户信息
    pub fn set_user(&self, user_id: Option<String>, email: Option<String>) {
        Hub::run(self.hub.clone(), || {
            sentry::configure_scope(|scope| {
                scope.set_user(Some(sentry::User {
                    id: user_id,
                    email,
                    ip_address: None, // 不收集IP地址保护隐私
                    username: None,   // 不收集用户名保护隐私
                    ..Default::default()
                }));
            });
        });
    }

    /// 设置自定义标签
    pub fn set_tag(&self, key: &str, value: &str) {
        Hub::run(self.hub.clone(), || {
            sentry::configure_scope(|scope| {
                scope.set_tag(key, value);
            });
        });
    }

    /// 设置自定义上下文
    pub fn set_context(&self, key: &str, context: sentry::protocol::Context) {
        Hub::run(self.hub.clone(), || {
            sentry::configure_scope(|scope| {
                scope.set_context(key, context);
            });
        });
    }

    /// 刷新事件（确保事件被发送）
    pub async fn flush(&self, timeout: Option<std::time::Duration>) {
        let timeout = timeout.unwrap_or(std::time::Duration::from_secs(2));
        Hub::run(self.hub.clone(), || {
            sentry::Hub::current().client().unwrap().flush(Some(timeout));
        });
    }

    /// 获取配置
    pub fn get_config(&self) -> &SentryConfig {
        &self.config
    }

    /// 更新配置
    pub fn update_config(&mut self, new_config: SentryConfig) -> Result<()> {
        self.config = new_config;
        // 重新初始化客户端
        let client_options = ClientOptions {
            dsn: Some(self.config.dsn.parse().map_err(|e| {
                AppError::Internal(format!("Invalid Sentry DSN: {}", e))
            })?),
            environment: Some(self.config.environment.clone().into()),
            release: Some(self.config.release.clone().into()),
            sample_rate: self.config.sample_rate,
            traces_sample_rate: self.config.traces_sample_rate,
            profiles_sample_rate: self.config.profiles_sample_rate,
            max_breadcrumbs: self.config.max_breadcrumbs,
            attach_stacktrace: self.config.attach_stacktrace,
            send_default_pii: self.config.send_default_pii,
            auto_session_tracking: self.config.auto_session_tracking,
            ..Default::default()
        };

        let client = sentry::Client::from_config(client_options);
        self.hub = Arc::new(Hub::new_from_top(Arc::new(client)));
        
        Ok(())
    }
}

/// Tauri命令：获取Sentry配置
#[tauri::command]
pub async fn get_sentry_config(app: AppHandle) -> Result<SentryConfig> {
    if let Some(manager) = app.try_state::<SentryManager>() {
        Ok(manager.get_config().clone())
    } else {
        Err(AppError::Internal("Sentry管理器未初始化".to_string()))
    }
}

/// Tauri命令：更新Sentry配置
#[tauri::command]
pub async fn update_sentry_config(app: AppHandle, config: SentryConfig) -> Result<()> {
    if let Some(manager) = app.try_state::<SentryManager>() {
        let mut manager = manager.clone();
        manager.update_config(config)?;
        Ok(())
    } else {
        Err(AppError::Internal("Sentry管理器未初始化".to_string()))
    }
}

/// Tauri命令：手动发送测试事件
#[tauri::command]
pub async fn send_test_event(app: AppHandle, message: String) -> Result<()> {
    if let Some(manager) = app.try_state::<SentryManager>() {
        manager.capture_message(&message, sentry::Level::Info);
        manager.flush(Some(std::time::Duration::from_secs(5))).await;
        Ok(())
    } else {
        Err(AppError::Internal("Sentry管理器未初始化".to_string()))
    }
}

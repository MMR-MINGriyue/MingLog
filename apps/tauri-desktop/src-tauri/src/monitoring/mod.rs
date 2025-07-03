// 监控模块
// 提供错误监控、性能监控、用户反馈等功能

pub mod sentry_config;
pub mod performance;
pub mod feedback;

// 重新导出主要类型
pub use sentry_config::{SentryConfig, SentryManager};
pub use performance::{PerformanceMonitor, PerformanceMetrics, AppMetrics};
pub use feedback::{FeedbackManager, UserFeedback, FeedbackType, FeedbackPriority, FeedbackStatus, FeedbackStats};

use crate::error::Result;
use tauri::AppHandle;

/// 初始化所有监控组件
pub async fn initialize_monitoring(app_handle: AppHandle) -> Result<()> {
    // 初始化Sentry监控
    let sentry_config = SentryConfig::default();
    let sentry_manager = SentryManager::new(app_handle.clone(), sentry_config)?;
    sentry_manager.initialize()?;
    app_handle.manage(sentry_manager);

    // 初始化性能监控
    let performance_monitor = PerformanceMonitor::new(app_handle.clone());
    performance_monitor.start_monitoring().await?;
    app_handle.manage(performance_monitor);

    // 初始化反馈系统
    let feedback_manager = FeedbackManager::new(app_handle.clone())?;
    feedback_manager.initialize().await?;
    app_handle.manage(feedback_manager);

    log::info!("所有监控组件已初始化");
    Ok(())
}

use crate::error::{AppError, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use sysinfo::{System, SystemExt, ProcessExt, CpuExt, DiskExt, NetworkExt};
use tauri::{AppHandle, Manager};
use tokio::time::interval;

/// 性能指标数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    pub timestamp: u64,
    pub cpu_usage: f32,
    pub memory_usage: u64,
    pub memory_total: u64,
    pub disk_usage: HashMap<String, DiskUsage>,
    pub network_stats: NetworkStats,
    pub app_metrics: AppMetrics,
}

/// 磁盘使用情况
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiskUsage {
    pub total: u64,
    pub used: u64,
    pub available: u64,
    pub usage_percent: f32,
}

/// 网络统计
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkStats {
    pub bytes_sent: u64,
    pub bytes_received: u64,
    pub packets_sent: u64,
    pub packets_received: u64,
}

/// 应用程序指标
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppMetrics {
    pub startup_time: Option<Duration>,
    pub response_times: HashMap<String, Vec<Duration>>,
    pub error_count: u64,
    pub active_users: u64,
    pub database_connections: u32,
    pub cache_hit_rate: f32,
}

/// 性能事件
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceEvent {
    pub id: String,
    pub name: String,
    pub operation: String,
    pub start_time: Instant,
    pub duration: Option<Duration>,
    pub tags: HashMap<String, String>,
    pub data: HashMap<String, serde_json::Value>,
}

/// 性能监控管理器
pub struct PerformanceMonitor {
    system: Arc<Mutex<System>>,
    app_handle: AppHandle,
    metrics_history: Arc<Mutex<Vec<PerformanceMetrics>>>,
    active_events: Arc<Mutex<HashMap<String, PerformanceEvent>>>,
    app_metrics: Arc<Mutex<AppMetrics>>,
    collection_interval: Duration,
    max_history_size: usize,
}

impl PerformanceMonitor {
    /// 创建新的性能监控器
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            system: Arc::new(Mutex::new(System::new_all())),
            app_handle,
            metrics_history: Arc::new(Mutex::new(Vec::new())),
            active_events: Arc::new(Mutex::new(HashMap::new())),
            app_metrics: Arc::new(Mutex::new(AppMetrics {
                startup_time: None,
                response_times: HashMap::new(),
                error_count: 0,
                active_users: 0,
                database_connections: 0,
                cache_hit_rate: 0.0,
            })),
            collection_interval: Duration::from_secs(30),
            max_history_size: 1000,
        }
    }

    /// 启动性能监控
    pub async fn start_monitoring(&self) -> Result<()> {
        let system = self.system.clone();
        let metrics_history = self.metrics_history.clone();
        let app_metrics = self.app_metrics.clone();
        let app_handle = self.app_handle.clone();
        let collection_interval = self.collection_interval;
        let max_history_size = self.max_history_size;

        tokio::spawn(async move {
            let mut interval = interval(collection_interval);
            
            loop {
                interval.tick().await;
                
                // 收集系统指标
                let metrics = {
                    let mut sys = system.lock().unwrap();
                    sys.refresh_all();
                    
                    let timestamp = SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap()
                        .as_secs();

                    // CPU使用率
                    let cpu_usage = sys.global_cpu_info().cpu_usage();

                    // 内存使用情况
                    let memory_usage = sys.used_memory();
                    let memory_total = sys.total_memory();

                    // 磁盘使用情况
                    let mut disk_usage = HashMap::new();
                    for disk in sys.disks() {
                        let name = disk.name().to_string_lossy().to_string();
                        let total = disk.total_space();
                        let available = disk.available_space();
                        let used = total - available;
                        let usage_percent = if total > 0 {
                            (used as f32 / total as f32) * 100.0
                        } else {
                            0.0
                        };

                        disk_usage.insert(name, DiskUsage {
                            total,
                            used,
                            available,
                            usage_percent,
                        });
                    }

                    // 网络统计
                    let mut bytes_sent = 0;
                    let mut bytes_received = 0;
                    let mut packets_sent = 0;
                    let mut packets_received = 0;

                    for (_, network) in sys.networks() {
                        bytes_sent += network.total_transmitted();
                        bytes_received += network.total_received();
                        packets_sent += network.total_packets_transmitted();
                        packets_received += network.total_packets_received();
                    }

                    let network_stats = NetworkStats {
                        bytes_sent,
                        bytes_received,
                        packets_sent,
                        packets_received,
                    };

                    // 应用程序指标
                    let app_metrics = app_metrics.lock().unwrap().clone();

                    PerformanceMetrics {
                        timestamp,
                        cpu_usage,
                        memory_usage,
                        memory_total,
                        disk_usage,
                        network_stats,
                        app_metrics,
                    }
                };

                // 存储指标历史
                {
                    let mut history = metrics_history.lock().unwrap();
                    history.push(metrics.clone());
                    
                    // 限制历史记录大小
                    if history.len() > max_history_size {
                        history.remove(0);
                    }
                }

                // 发送指标到前端
                let _ = app_handle.emit_all("performance-metrics", &metrics);

                // 检查性能告警
                Self::check_performance_alerts(&metrics, &app_handle).await;
            }
        });

        log::info!("性能监控已启动，收集间隔: {:?}", self.collection_interval);
        Ok(())
    }

    /// 开始性能事件跟踪
    pub fn start_event(&self, name: &str, operation: &str) -> String {
        let event_id = uuid::Uuid::new_v4().to_string();
        let event = PerformanceEvent {
            id: event_id.clone(),
            name: name.to_string(),
            operation: operation.to_string(),
            start_time: Instant::now(),
            duration: None,
            tags: HashMap::new(),
            data: HashMap::new(),
        };

        let mut active_events = self.active_events.lock().unwrap();
        active_events.insert(event_id.clone(), event);

        event_id
    }

    /// 结束性能事件跟踪
    pub fn end_event(&self, event_id: &str) -> Option<Duration> {
        let mut active_events = self.active_events.lock().unwrap();
        
        if let Some(mut event) = active_events.remove(event_id) {
            let duration = event.start_time.elapsed();
            event.duration = Some(duration);

            // 记录响应时间
            {
                let mut app_metrics = self.app_metrics.lock().unwrap();
                app_metrics.response_times
                    .entry(event.operation.clone())
                    .or_insert_with(Vec::new)
                    .push(duration);
            }

            // 发送事件到Sentry
            if let Some(sentry_manager) = self.app_handle.try_state::<crate::monitoring::sentry_config::SentryManager>() {
                let transaction = sentry_manager.start_transaction(&event.name, &event.operation);
                transaction.set_data("duration_ms", duration.as_millis() as f64);
                transaction.finish();
            }

            Some(duration)
        } else {
            None
        }
    }

    /// 添加事件标签
    pub fn add_event_tag(&self, event_id: &str, key: &str, value: &str) {
        let mut active_events = self.active_events.lock().unwrap();
        if let Some(event) = active_events.get_mut(event_id) {
            event.tags.insert(key.to_string(), value.to_string());
        }
    }

    /// 添加事件数据
    pub fn add_event_data(&self, event_id: &str, key: &str, value: serde_json::Value) {
        let mut active_events = self.active_events.lock().unwrap();
        if let Some(event) = active_events.get_mut(event_id) {
            event.data.insert(key.to_string(), value);
        }
    }

    /// 记录错误
    pub fn record_error(&self) {
        let mut app_metrics = self.app_metrics.lock().unwrap();
        app_metrics.error_count += 1;
    }

    /// 设置活跃用户数
    pub fn set_active_users(&self, count: u64) {
        let mut app_metrics = self.app_metrics.lock().unwrap();
        app_metrics.active_users = count;
    }

    /// 设置数据库连接数
    pub fn set_database_connections(&self, count: u32) {
        let mut app_metrics = self.app_metrics.lock().unwrap();
        app_metrics.database_connections = count;
    }

    /// 设置缓存命中率
    pub fn set_cache_hit_rate(&self, rate: f32) {
        let mut app_metrics = self.app_metrics.lock().unwrap();
        app_metrics.cache_hit_rate = rate;
    }

    /// 获取性能指标历史
    pub fn get_metrics_history(&self, limit: Option<usize>) -> Vec<PerformanceMetrics> {
        let history = self.metrics_history.lock().unwrap();
        let limit = limit.unwrap_or(history.len());
        
        if history.len() <= limit {
            history.clone()
        } else {
            history[history.len() - limit..].to_vec()
        }
    }

    /// 获取当前性能指标
    pub fn get_current_metrics(&self) -> Option<PerformanceMetrics> {
        let history = self.metrics_history.lock().unwrap();
        history.last().cloned()
    }

    /// 检查性能告警
    async fn check_performance_alerts(metrics: &PerformanceMetrics, app_handle: &AppHandle) {
        let mut alerts = Vec::new();

        // CPU使用率告警
        if metrics.cpu_usage > 80.0 {
            alerts.push(format!("CPU使用率过高: {:.1}%", metrics.cpu_usage));
        }

        // 内存使用率告警
        let memory_usage_percent = (metrics.memory_usage as f32 / metrics.memory_total as f32) * 100.0;
        if memory_usage_percent > 85.0 {
            alerts.push(format!("内存使用率过高: {:.1}%", memory_usage_percent));
        }

        // 磁盘使用率告警
        for (disk, usage) in &metrics.disk_usage {
            if usage.usage_percent > 90.0 {
                alerts.push(format!("磁盘 {} 使用率过高: {:.1}%", disk, usage.usage_percent));
            }
        }

        // 错误率告警
        if metrics.app_metrics.error_count > 100 {
            alerts.push(format!("错误数量过多: {}", metrics.app_metrics.error_count));
        }

        // 发送告警
        if !alerts.is_empty() {
            let _ = app_handle.emit_all("performance-alerts", &alerts);
            
            // 发送到Sentry
            if let Some(sentry_manager) = app_handle.try_state::<crate::monitoring::sentry_config::SentryManager>() {
                for alert in &alerts {
                    sentry_manager.capture_message(alert, sentry::Level::Warning);
                }
            }
        }
    }
}

/// Tauri命令：获取性能指标历史
#[tauri::command]
pub async fn get_performance_metrics(app: AppHandle, limit: Option<usize>) -> Result<Vec<PerformanceMetrics>> {
    if let Some(monitor) = app.try_state::<PerformanceMonitor>() {
        Ok(monitor.get_metrics_history(limit))
    } else {
        Err(AppError::Internal("性能监控器未初始化".to_string()))
    }
}

/// Tauri命令：获取当前性能指标
#[tauri::command]
pub async fn get_current_performance_metrics(app: AppHandle) -> Result<Option<PerformanceMetrics>> {
    if let Some(monitor) = app.try_state::<PerformanceMonitor>() {
        Ok(monitor.get_current_metrics())
    } else {
        Err(AppError::Internal("性能监控器未初始化".to_string()))
    }
}

/// Tauri命令：开始性能事件跟踪
#[tauri::command]
pub async fn start_performance_event(app: AppHandle, name: String, operation: String) -> Result<String> {
    if let Some(monitor) = app.try_state::<PerformanceMonitor>() {
        Ok(monitor.start_event(&name, &operation))
    } else {
        Err(AppError::Internal("性能监控器未初始化".to_string()))
    }
}

/// Tauri命令：结束性能事件跟踪
#[tauri::command]
pub async fn end_performance_event(app: AppHandle, event_id: String) -> Result<Option<u64>> {
    if let Some(monitor) = app.try_state::<PerformanceMonitor>() {
        Ok(monitor.end_event(&event_id).map(|d| d.as_millis() as u64))
    } else {
        Err(AppError::Internal("性能监控器未初始化".to_string()))
    }
}

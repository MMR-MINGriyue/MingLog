use crate::error::{AppError, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use tokio::fs;
use uuid::Uuid;

/// 反馈类型
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FeedbackType {
    Bug,        // 错误报告
    Feature,    // 功能请求
    Improvement, // 改进建议
    Question,   // 问题咨询
    Praise,     // 表扬
    Complaint,  // 投诉
}

/// 反馈优先级
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FeedbackPriority {
    Low,
    Medium,
    High,
    Critical,
}

/// 反馈状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FeedbackStatus {
    New,        // 新建
    InProgress, // 处理中
    Resolved,   // 已解决
    Closed,     // 已关闭
    Rejected,   // 已拒绝
}

/// 用户反馈数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserFeedback {
    pub id: String,
    pub feedback_type: FeedbackType,
    pub priority: FeedbackPriority,
    pub status: FeedbackStatus,
    pub title: String,
    pub description: String,
    pub user_email: Option<String>,
    pub user_id: Option<String>,
    pub app_version: String,
    pub os_info: String,
    pub device_info: String,
    pub steps_to_reproduce: Option<String>,
    pub expected_behavior: Option<String>,
    pub actual_behavior: Option<String>,
    pub attachments: Vec<String>,
    pub tags: Vec<String>,
    pub metadata: HashMap<String, serde_json::Value>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub resolved_at: Option<chrono::DateTime<chrono::Utc>>,
    pub response: Option<String>,
}

/// 反馈统计
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeedbackStats {
    pub total_count: u64,
    pub by_type: HashMap<String, u64>,
    pub by_priority: HashMap<String, u64>,
    pub by_status: HashMap<String, u64>,
    pub resolution_time_avg: Option<f64>, // 平均解决时间（小时）
    pub satisfaction_score: Option<f32>,  // 满意度评分
}

/// 用户反馈管理器
pub struct FeedbackManager {
    app_handle: AppHandle,
    feedback_dir: PathBuf,
    api_endpoint: Option<String>,
    auto_submit: bool,
}

impl FeedbackManager {
    /// 创建新的反馈管理器
    pub fn new(app_handle: AppHandle) -> Result<Self> {
        let app_data_dir = app_handle
            .path_resolver()
            .app_data_dir()
            .ok_or_else(|| AppError::Internal("无法获取应用数据目录".to_string()))?;
        
        let feedback_dir = app_data_dir.join("feedback");

        Ok(Self {
            app_handle,
            feedback_dir,
            api_endpoint: None,
            auto_submit: true,
        })
    }

    /// 初始化反馈系统
    pub async fn initialize(&self) -> Result<()> {
        // 创建反馈目录
        fs::create_dir_all(&self.feedback_dir).await?;
        
        log::info!("用户反馈系统已初始化，存储目录: {:?}", self.feedback_dir);
        Ok(())
    }

    /// 提交用户反馈
    pub async fn submit_feedback(&self, mut feedback: UserFeedback) -> Result<String> {
        // 生成反馈ID
        feedback.id = Uuid::new_v4().to_string();
        feedback.created_at = chrono::Utc::now();
        feedback.updated_at = feedback.created_at;

        // 收集系统信息
        feedback.app_version = env!("CARGO_PKG_VERSION").to_string();
        feedback.os_info = format!("{} {}", std::env::consts::OS, whoami::distro());
        feedback.device_info = format!("{} - {}", whoami::hostname(), std::env::consts::ARCH);

        // 保存到本地
        self.save_feedback_locally(&feedback).await?;

        // 如果启用自动提交，尝试提交到服务器
        if self.auto_submit {
            if let Err(e) = self.submit_to_server(&feedback).await {
                log::warn!("提交反馈到服务器失败: {}, 已保存到本地", e);
            }
        }

        // 发送到Sentry（如果是错误报告）
        if matches!(feedback.feedback_type, FeedbackType::Bug) {
            if let Some(sentry_manager) = self.app_handle.try_state::<crate::monitoring::sentry_config::SentryManager>() {
                sentry_manager.add_breadcrumb(
                    &format!("用户反馈: {}", feedback.title),
                    "feedback",
                    sentry::Level::Info,
                );
                
                // 设置用户上下文
                sentry_manager.set_user(feedback.user_id.clone(), feedback.user_email.clone());
                
                // 发送反馈事件
                sentry_manager.capture_message(
                    &format!("用户错误报告: {}\n{}", feedback.title, feedback.description),
                    sentry::Level::Error,
                );
            }
        }

        // 发送通知到前端
        let _ = self.app_handle.emit_all("feedback-submitted", &feedback);

        log::info!("用户反馈已提交: {} - {}", feedback.id, feedback.title);
        Ok(feedback.id)
    }

    /// 获取反馈列表
    pub async fn get_feedback_list(&self, limit: Option<usize>, status_filter: Option<FeedbackStatus>) -> Result<Vec<UserFeedback>> {
        let mut feedback_list = Vec::new();
        
        let mut entries = fs::read_dir(&self.feedback_dir).await?;
        while let Some(entry) = entries.next_entry().await? {
            if entry.path().extension().and_then(|s| s.to_str()) == Some("json") {
                if let Ok(content) = fs::read_to_string(entry.path()).await {
                    if let Ok(feedback) = serde_json::from_str::<UserFeedback>(&content) {
                        // 应用状态过滤
                        if let Some(ref filter_status) = status_filter {
                            if !matches!(feedback.status, ref filter_status) {
                                continue;
                            }
                        }
                        feedback_list.push(feedback);
                    }
                }
            }
        }

        // 按创建时间排序
        feedback_list.sort_by(|a, b| b.created_at.cmp(&a.created_at));

        // 应用限制
        if let Some(limit) = limit {
            feedback_list.truncate(limit);
        }

        Ok(feedback_list)
    }

    /// 获取反馈详情
    pub async fn get_feedback(&self, feedback_id: &str) -> Result<UserFeedback> {
        let feedback_path = self.feedback_dir.join(format!("{}.json", feedback_id));
        
        if !feedback_path.exists() {
            return Err(AppError::NotFound(format!("反馈不存在: {}", feedback_id)));
        }

        let content = fs::read_to_string(feedback_path).await?;
        let feedback = serde_json::from_str(&content)?;
        Ok(feedback)
    }

    /// 更新反馈状态
    pub async fn update_feedback_status(&self, feedback_id: &str, status: FeedbackStatus, response: Option<String>) -> Result<()> {
        let mut feedback = self.get_feedback(feedback_id).await?;
        
        feedback.status = status;
        feedback.updated_at = chrono::Utc::now();
        feedback.response = response;

        // 如果状态为已解决，设置解决时间
        if matches!(feedback.status, FeedbackStatus::Resolved) {
            feedback.resolved_at = Some(chrono::Utc::now());
        }

        self.save_feedback_locally(&feedback).await?;

        // 发送通知到前端
        let _ = self.app_handle.emit_all("feedback-updated", &feedback);

        Ok(())
    }

    /// 删除反馈
    pub async fn delete_feedback(&self, feedback_id: &str) -> Result<()> {
        let feedback_path = self.feedback_dir.join(format!("{}.json", feedback_id));
        
        if feedback_path.exists() {
            fs::remove_file(feedback_path).await?;
            log::info!("反馈已删除: {}", feedback_id);
        }

        Ok(())
    }

    /// 获取反馈统计
    pub async fn get_feedback_stats(&self) -> Result<FeedbackStats> {
        let feedback_list = self.get_feedback_list(None, None).await?;
        
        let mut stats = FeedbackStats {
            total_count: feedback_list.len() as u64,
            by_type: HashMap::new(),
            by_priority: HashMap::new(),
            by_status: HashMap::new(),
            resolution_time_avg: None,
            satisfaction_score: None,
        };

        let mut resolution_times = Vec::new();

        for feedback in &feedback_list {
            // 按类型统计
            let type_key = format!("{:?}", feedback.feedback_type);
            *stats.by_type.entry(type_key).or_insert(0) += 1;

            // 按优先级统计
            let priority_key = format!("{:?}", feedback.priority);
            *stats.by_priority.entry(priority_key).or_insert(0) += 1;

            // 按状态统计
            let status_key = format!("{:?}", feedback.status);
            *stats.by_status.entry(status_key).or_insert(0) += 1;

            // 计算解决时间
            if let Some(resolved_at) = feedback.resolved_at {
                let resolution_time = resolved_at.signed_duration_since(feedback.created_at);
                resolution_times.push(resolution_time.num_hours() as f64);
            }
        }

        // 计算平均解决时间
        if !resolution_times.is_empty() {
            let avg_time = resolution_times.iter().sum::<f64>() / resolution_times.len() as f64;
            stats.resolution_time_avg = Some(avg_time);
        }

        Ok(stats)
    }

    /// 导出反馈数据
    pub async fn export_feedback(&self, format: &str) -> Result<String> {
        let feedback_list = self.get_feedback_list(None, None).await?;
        
        match format.to_lowercase().as_str() {
            "json" => {
                let json_data = serde_json::to_string_pretty(&feedback_list)?;
                let export_path = self.feedback_dir.join("export.json");
                fs::write(&export_path, json_data).await?;
                Ok(export_path.to_string_lossy().to_string())
            }
            "csv" => {
                let mut csv_content = String::new();
                csv_content.push_str("ID,Type,Priority,Status,Title,Description,User Email,Created At,Updated At\n");
                
                for feedback in &feedback_list {
                    csv_content.push_str(&format!(
                        "{},{:?},{:?},{:?},{},{},{},{},{}\n",
                        feedback.id,
                        feedback.feedback_type,
                        feedback.priority,
                        feedback.status,
                        feedback.title.replace(',', ';'),
                        feedback.description.replace(',', ';').replace('\n', ' '),
                        feedback.user_email.as_deref().unwrap_or(""),
                        feedback.created_at.format("%Y-%m-%d %H:%M:%S"),
                        feedback.updated_at.format("%Y-%m-%d %H:%M:%S")
                    ));
                }
                
                let export_path = self.feedback_dir.join("export.csv");
                fs::write(&export_path, csv_content).await?;
                Ok(export_path.to_string_lossy().to_string())
            }
            _ => Err(AppError::InvalidInput("不支持的导出格式".to_string()))
        }
    }

    /// 保存反馈到本地
    async fn save_feedback_locally(&self, feedback: &UserFeedback) -> Result<()> {
        let feedback_path = self.feedback_dir.join(format!("{}.json", feedback.id));
        let content = serde_json::to_string_pretty(feedback)?;
        fs::write(feedback_path, content).await?;
        Ok(())
    }

    /// 提交反馈到服务器
    async fn submit_to_server(&self, feedback: &UserFeedback) -> Result<()> {
        if let Some(ref endpoint) = self.api_endpoint {
            let client = reqwest::Client::new();
            let response = client
                .post(endpoint)
                .json(feedback)
                .send()
                .await?;

            if response.status().is_success() {
                log::info!("反馈已成功提交到服务器: {}", feedback.id);
            } else {
                return Err(AppError::Internal(format!(
                    "服务器返回错误: {}",
                    response.status()
                )));
            }
        }
        Ok(())
    }

    /// 设置API端点
    pub fn set_api_endpoint(&mut self, endpoint: String) {
        self.api_endpoint = Some(endpoint);
    }

    /// 设置自动提交
    pub fn set_auto_submit(&mut self, auto_submit: bool) {
        self.auto_submit = auto_submit;
    }
}

/// Tauri命令：提交用户反馈
#[tauri::command]
pub async fn submit_user_feedback(app: AppHandle, feedback: UserFeedback) -> Result<String> {
    if let Some(manager) = app.try_state::<FeedbackManager>() {
        manager.submit_feedback(feedback).await
    } else {
        Err(AppError::Internal("反馈管理器未初始化".to_string()))
    }
}

/// Tauri命令：获取反馈列表
#[tauri::command]
pub async fn get_user_feedback_list(
    app: AppHandle,
    limit: Option<usize>,
    status_filter: Option<FeedbackStatus>
) -> Result<Vec<UserFeedback>> {
    if let Some(manager) = app.try_state::<FeedbackManager>() {
        manager.get_feedback_list(limit, status_filter).await
    } else {
        Err(AppError::Internal("反馈管理器未初始化".to_string()))
    }
}

/// Tauri命令：获取反馈统计
#[tauri::command]
pub async fn get_feedback_statistics(app: AppHandle) -> Result<FeedbackStats> {
    if let Some(manager) = app.try_state::<FeedbackManager>() {
        manager.get_feedback_stats().await
    } else {
        Err(AppError::Internal("反馈管理器未初始化".to_string()))
    }
}

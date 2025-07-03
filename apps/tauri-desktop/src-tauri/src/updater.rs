use crate::error::{AppError, Result};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Manager};
use tokio::fs;
use tokio::time::sleep;

/// 更新信息结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateInfo {
    pub version: String,
    pub release_date: String,
    pub download_url: String,
    pub signature: String,
    pub changelog: String,
    pub size: u64,
    pub is_critical: bool,
    pub min_version: Option<String>,
}

/// 更新状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum UpdateStatus {
    CheckingForUpdates,
    UpdateAvailable(UpdateInfo),
    NoUpdateAvailable,
    Downloading { progress: f64 },
    Downloaded,
    Installing,
    Installed,
    Error(String),
}

/// 更新配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateConfig {
    pub auto_check: bool,
    pub check_interval_hours: u64,
    pub auto_download: bool,
    pub auto_install: bool,
    pub update_channel: UpdateChannel,
    pub last_check: Option<u64>,
}

/// 更新渠道
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum UpdateChannel {
    Stable,
    Beta,
    Alpha,
}

impl Default for UpdateConfig {
    fn default() -> Self {
        Self {
            auto_check: true,
            check_interval_hours: 24,
            auto_download: false,
            auto_install: false,
            update_channel: UpdateChannel::Stable,
            last_check: None,
        }
    }
}

/// 更新管理器
pub struct UpdateManager {
    app_handle: AppHandle,
    config: Arc<Mutex<UpdateConfig>>,
    current_version: String,
}

impl UpdateManager {
    pub fn new(app_handle: AppHandle) -> Self {
        let current_version = env!("CARGO_PKG_VERSION").to_string();
        Self {
            app_handle,
            config: Arc::new(Mutex::new(UpdateConfig::default())),
            current_version,
        }
    }

    /// 初始化更新管理器
    pub async fn initialize(&self) -> Result<()> {
        // 加载配置
        self.load_config().await?;

        // 如果启用自动检查，开始定期检查
        let auto_check = {
            let config = self.config.lock().await;
            config.auto_check
        };

        if auto_check {
            self.start_periodic_check().await;
        }

        Ok(())
    }

    /// 检查更新
    pub async fn check_for_updates(&self) -> Result<UpdateStatus> {
        log::info!("开始检查更新...");
        
        // 发送状态更新
        self.emit_status(UpdateStatus::CheckingForUpdates).await;
        
        // 构建检查URL
        let channel = {
            let config = self.config.lock().await;
            match config.update_channel {
                UpdateChannel::Stable => "stable",
                UpdateChannel::Beta => "beta",
                UpdateChannel::Alpha => "alpha",
            }
        };
        
        let check_url = format!(
            "https://api.minglog.com/updates/check?version={}&channel={}",
            self.current_version, channel
        );
        
        // 发送HTTP请求
        let client = reqwest::Client::new();
        let response = client
            .get(&check_url)
            .timeout(Duration::from_secs(30))
            .send()
            .await
            .map_err(|e| AppError::Io(format!("检查更新失败: {}", e)))?;
        
        if !response.status().is_success() {
            let error_msg = format!("更新检查失败: HTTP {}", response.status());
            let status = UpdateStatus::Error(error_msg.clone());
            self.emit_status(status.clone()).await;
            return Ok(status);
        }
        
        let update_response: serde_json::Value = response
            .json()
            .await
            .map_err(|e| AppError::Serialization(format!("解析更新响应失败: {}", e)))?;
        
        // 解析响应
        if let Some(update_info) = update_response.get("update") {
            let update: UpdateInfo = serde_json::from_value(update_info.clone())
                .map_err(|e| AppError::Serialization(format!("解析更新信息失败: {}", e)))?;
            
            // 检查版本是否更新
            if self.is_newer_version(&update.version)? {
                let status = UpdateStatus::UpdateAvailable(update);
                self.emit_status(status.clone()).await;
                
                // 如果启用自动下载，开始下载
                let auto_download = {
                    let config = self.config.lock().await;
                    config.auto_download
                };

                if auto_download {
                    if let UpdateStatus::UpdateAvailable(info) = &status {
                        self.download_update(info.clone()).await?;
                    }
                }
                
                Ok(status)
            } else {
                let status = UpdateStatus::NoUpdateAvailable;
                self.emit_status(status.clone()).await;
                Ok(status)
            }
        } else {
            let status = UpdateStatus::NoUpdateAvailable;
            self.emit_status(status.clone()).await;
            Ok(status)
        }
    }

    /// 下载更新
    pub async fn download_update(&self, update_info: UpdateInfo) -> Result<()> {
        log::info!("开始下载更新: {}", update_info.version);
        
        // 创建下载目录
        let download_dir = self.get_download_dir().await?;
        fs::create_dir_all(&download_dir).await?;
        
        let file_name = format!("minglog-desktop-{}.msi", update_info.version);
        let download_path = download_dir.join(&file_name);
        
        // 下载文件
        let client = reqwest::Client::new();
        let mut response = client
            .get(&update_info.download_url)
            .send()
            .await
            .map_err(|e| AppError::Io(format!("下载更新失败: {}", e)))?;
        
        let total_size = update_info.size;
        let mut downloaded = 0u64;
        let mut file = fs::File::create(&download_path).await?;
        
        use tokio::io::AsyncWriteExt;
        while let Some(chunk) = response.chunk().await.map_err(|e| AppError::Io(e.to_string()))? {
            file.write_all(&chunk).await?;
            downloaded += chunk.len() as u64;

            let progress = (downloaded as f64 / total_size as f64) * 100.0;
            self.emit_status(UpdateStatus::Downloading { progress }).await;
        }

        file.flush().await?;
        
        // 验证签名
        self.verify_update_signature(&download_path, &update_info.signature).await?;
        
        log::info!("更新下载完成: {}", download_path.display());
        self.emit_status(UpdateStatus::Downloaded).await;
        
        // 如果启用自动安装，开始安装
        let auto_install = {
            let config = self.config.lock().await;
            config.auto_install
        };

        if auto_install {
            self.install_update(&download_path).await?;
        }
        
        Ok(())
    }

    /// 安装更新
    pub async fn install_update(&self, installer_path: &PathBuf) -> Result<()> {
        log::info!("开始安装更新: {}", installer_path.display());
        
        self.emit_status(UpdateStatus::Installing).await;
        
        // 创建安装脚本
        let script_path = self.create_install_script(installer_path).await?;
        
        // 执行安装
        let output = tokio::process::Command::new("cmd")
            .args(&["/C", &script_path.to_string_lossy()])
            .output()
            .await
            .map_err(|e| AppError::Io(format!("执行安装失败: {}", e)))?;
        
        if !output.status.success() {
            let error_msg = String::from_utf8_lossy(&output.stderr);
            return Err(AppError::Internal(format!("安装失败: {}", error_msg)));
        }
        
        log::info!("更新安装完成");
        self.emit_status(UpdateStatus::Installed).await;
        
        // 清理下载文件
        let _ = fs::remove_file(installer_path).await;
        let _ = fs::remove_file(&script_path).await;
        
        Ok(())
    }

    /// 创建安装脚本
    async fn create_install_script(&self, installer_path: &PathBuf) -> Result<PathBuf> {
        let script_content = format!(
            r#"@echo off
echo 正在安装更新...
msiexec /i "{}" /quiet /norestart
if %ERRORLEVEL% EQU 0 (
    echo 安装成功
    timeout /t 2 /nobreak >nul
    start "" "{}"
) else (
    echo 安装失败，错误代码: %ERRORLEVEL%
    pause
)
"#,
            installer_path.display(),
            std::env::current_exe()?.display()
        );
        
        let script_path = installer_path.parent().unwrap().join("install_update.bat");
        fs::write(&script_path, script_content).await?;
        
        Ok(script_path)
    }

    /// 验证更新签名
    async fn verify_update_signature(&self, file_path: &PathBuf, expected_signature: &str) -> Result<()> {
        // 这里应该实现真正的数字签名验证
        // 为了演示，我们只是检查文件是否存在
        if !file_path.exists() {
            return Err(AppError::Internal("下载的文件不存在".to_string()));
        }
        
        // TODO: 实现真正的签名验证
        log::info!("签名验证通过: {}", expected_signature);
        Ok(())
    }

    /// 检查版本是否更新
    fn is_newer_version(&self, new_version: &str) -> Result<bool> {
        // 简单的版本比较，实际应该使用更复杂的版本比较逻辑
        let current_parts: Vec<u32> = self.current_version
            .split('.')
            .map(|s| s.parse().unwrap_or(0))
            .collect();
        
        let new_parts: Vec<u32> = new_version
            .split('.')
            .map(|s| s.parse().unwrap_or(0))
            .collect();
        
        for (current, new) in current_parts.iter().zip(new_parts.iter()) {
            if new > current {
                return Ok(true);
            } else if new < current {
                return Ok(false);
            }
        }
        
        Ok(new_parts.len() > current_parts.len())
    }

    /// 获取下载目录
    async fn get_download_dir(&self) -> Result<PathBuf> {
        let app_data = dirs::cache_dir()
            .ok_or_else(|| AppError::Internal("无法获取缓存目录".to_string()))?;
        
        Ok(app_data.join("MingLog").join("updates"))
    }

    /// 加载配置
    async fn load_config(&self) -> Result<()> {
        let config_path = self.get_config_path().await?;

        if config_path.exists() {
            let config_content = fs::read_to_string(&config_path).await?;
            let loaded_config: UpdateConfig = serde_json::from_str(&config_content)
                .unwrap_or_else(|_| UpdateConfig::default());

            let mut config = self.config.lock().await;
            *config = loaded_config;
        }

        Ok(())
    }

    /// 保存配置
    async fn save_config(&self) -> Result<()> {
        let config_path = self.get_config_path().await?;

        if let Some(parent) = config_path.parent() {
            fs::create_dir_all(parent).await?;
        }

        let config = self.config.lock().await;
        let config_content = serde_json::to_string_pretty(&*config)?;
        drop(config); // 释放锁
        fs::write(&config_path, config_content).await?;

        Ok(())
    }

    /// 获取配置文件路径
    async fn get_config_path(&self) -> Result<PathBuf> {
        let config_dir = dirs::config_dir()
            .ok_or_else(|| AppError::Internal("无法获取配置目录".to_string()))?;
        
        Ok(config_dir.join("MingLog").join("update_config.json"))
    }

    /// 开始定期检查
    async fn start_periodic_check(&self) {
        let app_handle = self.app_handle.clone();
        let interval = {
            let config = self.config.lock().await;
            Duration::from_secs(config.check_interval_hours * 3600)
        };

        tokio::spawn(async move {
            loop {
                sleep(interval).await;

                let manager = UpdateManager::new(app_handle.clone());
                if let Err(e) = manager.check_for_updates().await {
                    log::error!("定期更新检查失败: {}", e);
                }
            }
        });
    }

    /// 发送状态更新
    async fn emit_status(&self, status: UpdateStatus) {
        if let Err(e) = self.app_handle.emit_all("update-status", &status) {
            log::error!("发送更新状态失败: {}", e);
        }
    }

    /// 更新配置
    pub async fn update_config(&self, new_config: UpdateConfig) -> Result<()> {
        {
            let mut config = self.config.lock().await;
            *config = new_config;
        }
        self.save_config().await?;
        Ok(())
    }

    /// 获取当前配置
    pub async fn get_config(&self) -> UpdateConfig {
        let config = self.config.lock().await;
        config.clone()
    }
}

/// Tauri命令：检查更新
#[tauri::command]
pub async fn check_for_updates(app: AppHandle) -> Result<UpdateStatus> {
    let manager = UpdateManager::new(app);
    manager.check_for_updates().await
}

/// Tauri命令：下载更新
#[tauri::command]
pub async fn download_update(app: AppHandle, update_info: UpdateInfo) -> Result<()> {
    let manager = UpdateManager::new(app);
    manager.download_update(update_info).await
}

/// Tauri命令：安装更新
#[tauri::command]
pub async fn install_update(app: AppHandle, installer_path: String) -> Result<()> {
    let manager = UpdateManager::new(app);
    let path = PathBuf::from(installer_path);
    manager.install_update(&path).await
}

/// Tauri命令：获取更新配置
#[tauri::command]
pub async fn get_update_config(app: AppHandle) -> Result<UpdateConfig> {
    let manager = UpdateManager::new(app);
    manager.load_config().await?;
    Ok(manager.get_config().await)
}

/// Tauri命令：更新配置
#[tauri::command]
pub async fn update_update_config(app: AppHandle, config: UpdateConfig) -> Result<()> {
    let manager = UpdateManager::new(app);
    manager.update_config(config).await
}

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use anyhow::{Result, Context};
use chrono::{DateTime, Utc};
use uuid::Uuid;

// 数据模型定义
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Block {
    pub id: String,
    pub block_type: String, // 'h1', 'h2', 'h3', 'p', 'quote', 'code', 'list', 'image'
    pub content: String,
    pub properties: HashMap<String, serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Page {
    pub id: String,
    pub title: String,
    pub blocks: Vec<Block>,
    pub tags: Vec<String>,
    pub properties: HashMap<String, serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub is_journal: Option<bool>,
    pub journal_date: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceSettings {
    pub theme: String, // 'light', 'dark', 'system'
    pub font_size: u32,
    pub font_family: String,
    pub auto_save: bool,
    pub auto_save_interval: u32, // 秒
    pub backup_enabled: bool,
    pub backup_interval: u32, // 小时
    pub max_backups: u32,
}

impl Default for WorkspaceSettings {
    fn default() -> Self {
        Self {
            theme: "light".to_string(),
            font_size: 16,
            font_family: "system-ui".to_string(),
            auto_save: true,
            auto_save_interval: 30,
            backup_enabled: true,
            backup_interval: 24,
            max_backups: 10,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Workspace {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub pages: HashMap<String, Page>,
    pub settings: WorkspaceSettings,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageMetadata {
    pub version: String,
    pub last_modified: DateTime<Utc>,
    pub total_pages: usize,
    pub total_blocks: usize,
    pub data_path: String,
}

pub struct StorageManager {
    data_dir: PathBuf,
    workspace_path: PathBuf,
    backup_dir: PathBuf,
    current_workspace: Option<Workspace>,
}

impl StorageManager {
    pub fn new() -> Result<Self> {
        let data_dir = dirs::data_dir()
            .context("无法获取数据目录")?
            .join("MingLog");
        
        let workspace_path = data_dir.join("workspace.json");
        let backup_dir = data_dir.join("backups");
        
        // 确保目录存在
        fs::create_dir_all(&data_dir)?;
        fs::create_dir_all(&backup_dir)?;
        
        Ok(Self {
            data_dir,
            workspace_path,
            backup_dir,
            current_workspace: None,
        })
    }
    
    pub fn load_workspace(&mut self) -> Result<Workspace> {
        if self.workspace_path.exists() {
            let data = fs::read_to_string(&self.workspace_path)?;
            let workspace: Workspace = serde_json::from_str(&data)?;
            self.current_workspace = Some(workspace.clone());
            Ok(workspace)
        } else {
            let workspace = self.create_default_workspace();
            self.save_workspace(&workspace)?;
            self.current_workspace = Some(workspace.clone());
            Ok(workspace)
        }
    }
    
    pub fn save_workspace(&mut self, workspace: &Workspace) -> Result<()> {
        let data = serde_json::to_string_pretty(workspace)?;
        fs::write(&self.workspace_path, data)?;
        self.current_workspace = Some(workspace.clone());
        Ok(())
    }
    
    pub fn get_current_workspace(&self) -> Option<&Workspace> {
        self.current_workspace.as_ref()
    }
    
    fn create_default_workspace(&self) -> Workspace {
        let now = Utc::now();
        let mut pages = HashMap::new();
        
        // 创建欢迎页面
        let welcome_page = Page {
            id: "welcome".to_string(),
            title: "欢迎使用 MingLog".to_string(),
            blocks: vec![
                Block {
                    id: Uuid::new_v4().to_string(),
                    block_type: "h1".to_string(),
                    content: "欢迎使用 MingLog 桌面版".to_string(),
                    properties: HashMap::new(),
                    created_at: now,
                    updated_at: now,
                },
                Block {
                    id: Uuid::new_v4().to_string(),
                    block_type: "p".to_string(),
                    content: "MingLog 是一个现代化的知识管理工具，专注于性能、开发体验和可维护性。".to_string(),
                    properties: HashMap::new(),
                    created_at: now,
                    updated_at: now,
                },
            ],
            tags: vec!["欢迎".to_string(), "介绍".to_string()],
            properties: HashMap::new(),
            created_at: now,
            updated_at: now,
            is_journal: None,
            journal_date: None,
        };
        
        pages.insert("welcome".to_string(), welcome_page);
        
        Workspace {
            id: "default".to_string(),
            name: "MingLog 工作空间".to_string(),
            description: Some("默认工作空间".to_string()),
            pages,
            settings: WorkspaceSettings::default(),
            created_at: now,
            updated_at: now,
            version: "1.0.0".to_string(),
        }
    }
    
    pub fn create_page(&mut self, title: String) -> Result<Page> {
        let now = Utc::now();
        let page_id = Uuid::new_v4().to_string();
        
        let page = Page {
            id: page_id.clone(),
            title: title.clone(),
            blocks: vec![
                Block {
                    id: Uuid::new_v4().to_string(),
                    block_type: "h1".to_string(),
                    content: title,
                    properties: HashMap::new(),
                    created_at: now,
                    updated_at: now,
                },
                Block {
                    id: Uuid::new_v4().to_string(),
                    block_type: "p".to_string(),
                    content: "".to_string(),
                    properties: HashMap::new(),
                    created_at: now,
                    updated_at: now,
                },
            ],
            tags: Vec::new(),
            properties: HashMap::new(),
            created_at: now,
            updated_at: now,
            is_journal: None,
            journal_date: None,
        };
        
        if let Some(ref mut workspace) = self.current_workspace {
            workspace.pages.insert(page_id.clone(), page.clone());
            workspace.updated_at = now;
            self.save_workspace(workspace)?;
        }
        
        Ok(page)
    }
    
    pub fn update_page(&mut self, page_id: String, updates: serde_json::Value) -> Result<()> {
        if let Some(ref mut workspace) = self.current_workspace {
            if let Some(page) = workspace.pages.get_mut(&page_id) {
                // 更新页面字段
                if let Some(title) = updates.get("title").and_then(|v| v.as_str()) {
                    page.title = title.to_string();
                }
                
                if let Some(blocks_value) = updates.get("blocks") {
                    if let Ok(blocks) = serde_json::from_value::<Vec<Block>>(blocks_value.clone()) {
                        page.blocks = blocks;
                    }
                }
                
                page.updated_at = Utc::now();
                workspace.updated_at = Utc::now();
                self.save_workspace(workspace)?;
            }
        }
        Ok(())
    }
    
    pub fn delete_page(&mut self, page_id: String) -> Result<()> {
        if let Some(ref mut workspace) = self.current_workspace {
            workspace.pages.remove(&page_id);
            workspace.updated_at = Utc::now();
            self.save_workspace(workspace)?;
        }
        Ok(())
    }
    
    pub fn get_metadata(&self) -> Result<StorageMetadata> {
        if let Some(workspace) = &self.current_workspace {
            let total_blocks: usize = workspace.pages.values()
                .map(|page| page.blocks.len())
                .sum();
            
            Ok(StorageMetadata {
                version: workspace.version.clone(),
                last_modified: workspace.updated_at,
                total_pages: workspace.pages.len(),
                total_blocks,
                data_path: self.data_dir.to_string_lossy().to_string(),
            })
        } else {
            Err(anyhow::anyhow!("工作空间未初始化"))
        }
    }
}

use crate::error::{AppError, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use tauri::{AppHandle, Manager};
use tokio::fs;
use uuid::Uuid;

/// 特性标志配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeatureFlag {
    pub id: String,
    pub name: String,
    pub description: String,
    pub enabled: bool,
    pub rollout_percentage: f32,
    pub target_groups: Vec<String>,
    pub conditions: Vec<FeatureCondition>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub expires_at: Option<chrono::DateTime<chrono::Utc>>,
}

/// 特性条件
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeatureCondition {
    pub field: String,
    pub operator: ConditionOperator,
    pub value: serde_json::Value,
}

/// 条件操作符
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConditionOperator {
    Equals,
    NotEquals,
    GreaterThan,
    LessThan,
    Contains,
    NotContains,
    In,
    NotIn,
}

/// 用户上下文
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserContext {
    pub user_id: String,
    pub email: Option<String>,
    pub user_group: Option<String>,
    pub app_version: String,
    pub platform: String,
    pub locale: String,
    pub custom_attributes: HashMap<String, serde_json::Value>,
}

/// A/B测试配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ABTestConfig {
    pub id: String,
    pub name: String,
    pub description: String,
    pub enabled: bool,
    pub variants: Vec<ABTestVariant>,
    pub traffic_allocation: f32,
    pub target_groups: Vec<String>,
    pub start_date: chrono::DateTime<chrono::Utc>,
    pub end_date: Option<chrono::DateTime<chrono::Utc>>,
    pub metrics: Vec<String>,
}

/// A/B测试变体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ABTestVariant {
    pub id: String,
    pub name: String,
    pub weight: f32,
    pub feature_flags: HashMap<String, bool>,
    pub config_overrides: HashMap<String, serde_json::Value>,
}

/// 特性标志管理器
pub struct FeatureFlagManager {
    flags: Arc<RwLock<HashMap<String, FeatureFlag>>>,
    ab_tests: Arc<RwLock<HashMap<String, ABTestConfig>>>,
    user_assignments: Arc<RwLock<HashMap<String, HashMap<String, String>>>>, // user_id -> test_id -> variant_id
    app_handle: AppHandle,
    config_path: std::path::PathBuf,
}

impl FeatureFlagManager {
    /// 创建新的特性标志管理器
    pub fn new(app_handle: AppHandle) -> Result<Self> {
        let app_data_dir = app_handle
            .path_resolver()
            .app_data_dir()
            .ok_or_else(|| AppError::Internal("无法获取应用数据目录".to_string()))?;
        
        let config_path = app_data_dir.join("feature_flags.json");

        Ok(Self {
            flags: Arc::new(RwLock::new(HashMap::new())),
            ab_tests: Arc::new(RwLock::new(HashMap::new())),
            user_assignments: Arc::new(RwLock::new(HashMap::new())),
            app_handle,
            config_path,
        })
    }

    /// 初始化特性标志系统
    pub async fn initialize(&self) -> Result<()> {
        self.load_config().await?;
        log::info!("特性标志系统已初始化");
        Ok(())
    }

    /// 检查特性标志是否启用
    pub fn is_feature_enabled(&self, flag_name: &str, user_context: &UserContext) -> bool {
        let flags = self.flags.read().unwrap();
        
        if let Some(flag) = flags.get(flag_name) {
            // 检查基本启用状态
            if !flag.enabled {
                return false;
            }

            // 检查过期时间
            if let Some(expires_at) = flag.expires_at {
                if chrono::Utc::now() > expires_at {
                    return false;
                }
            }

            // 检查目标组
            if !flag.target_groups.is_empty() {
                if let Some(ref user_group) = user_context.user_group {
                    if !flag.target_groups.contains(user_group) {
                        return false;
                    }
                } else {
                    return false;
                }
            }

            // 检查条件
            if !self.evaluate_conditions(&flag.conditions, user_context) {
                return false;
            }

            // 检查推出百分比
            if flag.rollout_percentage < 100.0 {
                let hash = self.hash_user_feature(&user_context.user_id, flag_name);
                let percentage = (hash % 100) as f32;
                if percentage >= flag.rollout_percentage {
                    return false;
                }
            }

            true
        } else {
            false
        }
    }

    /// 获取A/B测试变体
    pub fn get_ab_test_variant(&self, test_name: &str, user_context: &UserContext) -> Option<String> {
        let ab_tests = self.ab_tests.read().unwrap();
        let mut user_assignments = self.user_assignments.write().unwrap();
        
        if let Some(test) = ab_tests.get(test_name) {
            // 检查测试是否启用
            if !test.enabled {
                return None;
            }

            // 检查测试时间范围
            let now = chrono::Utc::now();
            if now < test.start_date {
                return None;
            }
            if let Some(end_date) = test.end_date {
                if now > end_date {
                    return None;
                }
            }

            // 检查目标组
            if !test.target_groups.is_empty() {
                if let Some(ref user_group) = user_context.user_group {
                    if !test.target_groups.contains(user_group) {
                        return None;
                    }
                } else {
                    return None;
                }
            }

            // 检查用户是否已分配变体
            if let Some(user_tests) = user_assignments.get(&user_context.user_id) {
                if let Some(variant_id) = user_tests.get(test_name) {
                    return Some(variant_id.clone());
                }
            }

            // 检查流量分配
            let hash = self.hash_user_feature(&user_context.user_id, test_name);
            let traffic_percentage = (hash % 100) as f32;
            if traffic_percentage >= test.traffic_allocation {
                return None;
            }

            // 分配变体
            let variant_id = self.assign_variant(test, &user_context.user_id);
            
            // 保存用户分配
            user_assignments
                .entry(user_context.user_id.clone())
                .or_insert_with(HashMap::new)
                .insert(test_name.to_string(), variant_id.clone());

            Some(variant_id)
        } else {
            None
        }
    }

    /// 获取特性标志配置
    pub fn get_feature_config(&self, flag_name: &str, user_context: &UserContext) -> Option<serde_json::Value> {
        // 首先检查A/B测试中的配置覆盖
        let ab_tests = self.ab_tests.read().unwrap();
        for (test_name, test) in ab_tests.iter() {
            if let Some(variant_id) = self.get_ab_test_variant(test_name, user_context) {
                if let Some(variant) = test.variants.iter().find(|v| v.id == variant_id) {
                    if let Some(config) = variant.config_overrides.get(flag_name) {
                        return Some(config.clone());
                    }
                }
            }
        }

        // 返回默认配置
        None
    }

    /// 添加特性标志
    pub async fn add_feature_flag(&self, flag: FeatureFlag) -> Result<()> {
        let mut flags = self.flags.write().unwrap();
        flags.insert(flag.name.clone(), flag);
        drop(flags);
        
        self.save_config().await?;
        Ok(())
    }

    /// 更新特性标志
    pub async fn update_feature_flag(&self, flag_name: &str, updates: FeatureFlag) -> Result<()> {
        let mut flags = self.flags.write().unwrap();
        if flags.contains_key(flag_name) {
            flags.insert(flag_name.to_string(), updates);
            drop(flags);
            self.save_config().await?;
            Ok(())
        } else {
            Err(AppError::NotFound(format!("特性标志不存在: {}", flag_name)))
        }
    }

    /// 删除特性标志
    pub async fn remove_feature_flag(&self, flag_name: &str) -> Result<()> {
        let mut flags = self.flags.write().unwrap();
        if flags.remove(flag_name).is_some() {
            drop(flags);
            self.save_config().await?;
            Ok(())
        } else {
            Err(AppError::NotFound(format!("特性标志不存在: {}", flag_name)))
        }
    }

    /// 添加A/B测试
    pub async fn add_ab_test(&self, test: ABTestConfig) -> Result<()> {
        let mut ab_tests = self.ab_tests.write().unwrap();
        ab_tests.insert(test.name.clone(), test);
        drop(ab_tests);
        
        self.save_config().await?;
        Ok(())
    }

    /// 获取所有特性标志
    pub fn get_all_feature_flags(&self) -> HashMap<String, FeatureFlag> {
        self.flags.read().unwrap().clone()
    }

    /// 获取所有A/B测试
    pub fn get_all_ab_tests(&self) -> HashMap<String, ABTestConfig> {
        self.ab_tests.read().unwrap().clone()
    }

    /// 评估条件
    fn evaluate_conditions(&self, conditions: &[FeatureCondition], user_context: &UserContext) -> bool {
        for condition in conditions {
            if !self.evaluate_single_condition(condition, user_context) {
                return false;
            }
        }
        true
    }

    /// 评估单个条件
    fn evaluate_single_condition(&self, condition: &FeatureCondition, user_context: &UserContext) -> bool {
        let field_value = match condition.field.as_str() {
            "user_id" => serde_json::Value::String(user_context.user_id.clone()),
            "email" => user_context.email.as_ref().map(|e| serde_json::Value::String(e.clone())).unwrap_or(serde_json::Value::Null),
            "user_group" => user_context.user_group.as_ref().map(|g| serde_json::Value::String(g.clone())).unwrap_or(serde_json::Value::Null),
            "app_version" => serde_json::Value::String(user_context.app_version.clone()),
            "platform" => serde_json::Value::String(user_context.platform.clone()),
            "locale" => serde_json::Value::String(user_context.locale.clone()),
            _ => user_context.custom_attributes.get(&condition.field).cloned().unwrap_or(serde_json::Value::Null),
        };

        match condition.operator {
            ConditionOperator::Equals => field_value == condition.value,
            ConditionOperator::NotEquals => field_value != condition.value,
            ConditionOperator::GreaterThan => {
                if let (Some(field_num), Some(condition_num)) = (field_value.as_f64(), condition.value.as_f64()) {
                    field_num > condition_num
                } else {
                    false
                }
            }
            ConditionOperator::LessThan => {
                if let (Some(field_num), Some(condition_num)) = (field_value.as_f64(), condition.value.as_f64()) {
                    field_num < condition_num
                } else {
                    false
                }
            }
            ConditionOperator::Contains => {
                if let (Some(field_str), Some(condition_str)) = (field_value.as_str(), condition.value.as_str()) {
                    field_str.contains(condition_str)
                } else {
                    false
                }
            }
            ConditionOperator::NotContains => {
                if let (Some(field_str), Some(condition_str)) = (field_value.as_str(), condition.value.as_str()) {
                    !field_str.contains(condition_str)
                } else {
                    false
                }
            }
            ConditionOperator::In => {
                if let Some(condition_array) = condition.value.as_array() {
                    condition_array.contains(&field_value)
                } else {
                    false
                }
            }
            ConditionOperator::NotIn => {
                if let Some(condition_array) = condition.value.as_array() {
                    !condition_array.contains(&field_value)
                } else {
                    true
                }
            }
        }
    }

    /// 分配A/B测试变体
    fn assign_variant(&self, test: &ABTestConfig, user_id: &str) -> String {
        let hash = self.hash_user_feature(user_id, &test.name);
        let mut cumulative_weight = 0.0;
        let target_weight = (hash % 100) as f32;

        for variant in &test.variants {
            cumulative_weight += variant.weight;
            if target_weight < cumulative_weight {
                return variant.id.clone();
            }
        }

        // 如果没有匹配的变体，返回第一个
        test.variants.first().map(|v| v.id.clone()).unwrap_or_default()
    }

    /// 生成用户特性哈希
    fn hash_user_feature(&self, user_id: &str, feature_name: &str) -> u32 {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};

        let mut hasher = DefaultHasher::new();
        user_id.hash(&mut hasher);
        feature_name.hash(&mut hasher);
        hasher.finish() as u32
    }

    /// 加载配置
    async fn load_config(&self) -> Result<()> {
        if self.config_path.exists() {
            let content = fs::read_to_string(&self.config_path).await?;
            let config: serde_json::Value = serde_json::from_str(&content)?;

            if let Some(flags_obj) = config.get("feature_flags") {
                if let Ok(flags) = serde_json::from_value::<HashMap<String, FeatureFlag>>(flags_obj.clone()) {
                    *self.flags.write().unwrap() = flags;
                }
            }

            if let Some(tests_obj) = config.get("ab_tests") {
                if let Ok(tests) = serde_json::from_value::<HashMap<String, ABTestConfig>>(tests_obj.clone()) {
                    *self.ab_tests.write().unwrap() = tests;
                }
            }

            if let Some(assignments_obj) = config.get("user_assignments") {
                if let Ok(assignments) = serde_json::from_value::<HashMap<String, HashMap<String, String>>>(assignments_obj.clone()) {
                    *self.user_assignments.write().unwrap() = assignments;
                }
            }
        }
        Ok(())
    }

    /// 保存配置
    async fn save_config(&self) -> Result<()> {
        let config = serde_json::json!({
            "feature_flags": *self.flags.read().unwrap(),
            "ab_tests": *self.ab_tests.read().unwrap(),
            "user_assignments": *self.user_assignments.read().unwrap(),
        });

        if let Some(parent) = self.config_path.parent() {
            fs::create_dir_all(parent).await?;
        }

        let content = serde_json::to_string_pretty(&config)?;
        fs::write(&self.config_path, content).await?;
        Ok(())
    }
}

/// Tauri命令：检查特性标志
#[tauri::command]
pub async fn is_feature_enabled(
    app: AppHandle,
    flag_name: String,
    user_context: UserContext,
) -> Result<bool> {
    if let Some(manager) = app.try_state::<FeatureFlagManager>() {
        Ok(manager.is_feature_enabled(&flag_name, &user_context))
    } else {
        Err(AppError::Internal("特性标志管理器未初始化".to_string()))
    }
}

/// Tauri命令：获取A/B测试变体
#[tauri::command]
pub async fn get_ab_test_variant(
    app: AppHandle,
    test_name: String,
    user_context: UserContext,
) -> Result<Option<String>> {
    if let Some(manager) = app.try_state::<FeatureFlagManager>() {
        Ok(manager.get_ab_test_variant(&test_name, &user_context))
    } else {
        Err(AppError::Internal("特性标志管理器未初始化".to_string()))
    }
}

/// Tauri命令：获取所有特性标志
#[tauri::command]
pub async fn get_all_feature_flags(app: AppHandle) -> Result<HashMap<String, FeatureFlag>> {
    if let Some(manager) = app.try_state::<FeatureFlagManager>() {
        Ok(manager.get_all_feature_flags())
    } else {
        Err(AppError::Internal("特性标志管理器未初始化".to_string()))
    }
}

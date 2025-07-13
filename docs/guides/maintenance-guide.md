# 🔧 MingLog 维护指南

## 📋 维护概览

本指南为MingLog应用的长期维护提供详细的操作指导，包括监控、更新、故障排除和性能优化。

### 🎯 维护目标
- **可用性**: 保持99.5%+的应用可用性
- **性能**: 维持启动时间<3秒，响应时间<100ms
- **稳定性**: 减少崩溃和错误发生率
- **用户满意度**: 及时响应用户反馈和问题

## 📊 监控系统

### 性能监控

#### 关键指标监控
```typescript
// 性能指标阈值
const PERFORMANCE_THRESHOLDS = {
  startupTime: 3000,      // 启动时间 <3秒
  memoryUsage: 200,       // 内存使用 <200MB
  searchResponse: 100,    // 搜索响应 <100ms
  renderTime: 16,         // 渲染时间 <16ms (60fps)
  errorRate: 0.01         // 错误率 <1%
}

// 监控检查
export const performanceCheck = {
  async checkStartupTime(): Promise<boolean> {
    const startTime = performance.now()
    // 模拟启动检查
    await new Promise(resolve => setTimeout(resolve, 100))
    const duration = performance.now() - startTime
    return duration < PERFORMANCE_THRESHOLDS.startupTime
  },

  async checkMemoryUsage(): Promise<boolean> {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      const usageMB = memory.usedJSHeapSize / (1024 * 1024)
      return usageMB < PERFORMANCE_THRESHOLDS.memoryUsage
    }
    return true
  }
}
```

#### 自动监控脚本
```bash
#!/bin/bash
# monitor.sh - 自动监控脚本

LOG_FILE="/var/log/minglog/monitor.log"
ALERT_EMAIL="admin@minglog.com"

check_performance() {
    echo "$(date): 开始性能检查" >> $LOG_FILE
    
    # 检查内存使用
    MEMORY_USAGE=$(ps aux | grep minglog | awk '{sum+=$6} END {print sum/1024}')
    if (( $(echo "$MEMORY_USAGE > 200" | bc -l) )); then
        echo "警告: 内存使用过高 ${MEMORY_USAGE}MB" >> $LOG_FILE
        send_alert "内存使用警告" "当前内存使用: ${MEMORY_USAGE}MB"
    fi
    
    # 检查CPU使用
    CPU_USAGE=$(ps aux | grep minglog | awk '{sum+=$3} END {print sum}')
    if (( $(echo "$CPU_USAGE > 50" | bc -l) )); then
        echo "警告: CPU使用过高 ${CPU_USAGE}%" >> $LOG_FILE
        send_alert "CPU使用警告" "当前CPU使用: ${CPU_USAGE}%"
    fi
}

send_alert() {
    local subject="$1"
    local message="$2"
    echo "$message" | mail -s "$subject" "$ALERT_EMAIL"
}

# 每5分钟检查一次
while true; do
    check_performance
    sleep 300
done
```

### 错误监控

#### 错误分类和处理
```rust
// 错误级别定义
#[derive(Debug, Clone)]
pub enum ErrorLevel {
    Critical,  // 严重错误，需要立即处理
    High,      // 高优先级错误
    Medium,    // 中等优先级错误
    Low,       // 低优先级错误
    Info,      // 信息性错误
}

// 错误处理策略
pub struct ErrorHandler {
    pub fn handle_error(&self, error: &AppError) {
        match error.level {
            ErrorLevel::Critical => {
                self.send_immediate_alert(error);
                self.create_incident_ticket(error);
                self.log_error(error);
            },
            ErrorLevel::High => {
                self.send_alert(error);
                self.log_error(error);
            },
            ErrorLevel::Medium | ErrorLevel::Low => {
                self.log_error(error);
            },
            ErrorLevel::Info => {
                self.log_info(error);
            }
        }
    }
}
```

#### 日志管理
```bash
# 日志轮转配置 (/etc/logrotate.d/minglog)
/var/log/minglog/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 minglog minglog
    postrotate
        systemctl reload minglog-monitor
    endscript
}
```

## 🔄 更新管理

### 版本发布流程

#### 1. 预发布检查
```bash
#!/bin/bash
# pre-release-check.sh

echo "🔍 开始预发布检查..."

# 检查测试覆盖率
echo "📊 检查测试覆盖率..."
npm run test:coverage
if [ $? -ne 0 ]; then
    echo "❌ 测试覆盖率检查失败"
    exit 1
fi

# 检查代码质量
echo "🔍 检查代码质量..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ 代码质量检查失败"
    exit 1
fi

# 检查安全漏洞
echo "🛡️ 检查安全漏洞..."
npm audit --audit-level high
if [ $? -ne 0 ]; then
    echo "❌ 安全检查失败"
    exit 1
fi

# 构建测试
echo "🔨 测试构建..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ 构建测试失败"
    exit 1
fi

echo "✅ 预发布检查通过"
```

#### 2. 自动更新部署
```rust
// 更新服务
pub struct UpdateService {
    current_version: String,
    update_server: String,
}

impl UpdateService {
    pub async fn check_for_updates(&self) -> Result<Option<UpdateInfo>, UpdateError> {
        let url = format!("{}/api/updates/check", self.update_server);
        let response = reqwest::get(&url).await?;
        
        if response.status().is_success() {
            let update_info: UpdateInfo = response.json().await?;
            if update_info.version > self.current_version {
                Ok(Some(update_info))
            } else {
                Ok(None)
            }
        } else {
            Err(UpdateError::ServerError(response.status()))
        }
    }

    pub async fn download_update(&self, update_info: &UpdateInfo) -> Result<PathBuf, UpdateError> {
        let download_url = &update_info.download_url;
        let response = reqwest::get(download_url).await?;
        
        let temp_file = tempfile::NamedTempFile::new()?;
        let mut file = File::create(&temp_file)?;
        
        let content = response.bytes().await?;
        file.write_all(&content)?;
        
        // 验证签名
        self.verify_signature(&temp_file, &update_info.signature)?;
        
        Ok(temp_file.into_temp_path().keep()?)
    }
}
```

### 数据库维护

#### 定期维护任务
```sql
-- 数据库优化脚本 (maintenance.sql)

-- 1. 重建索引
REINDEX;

-- 2. 分析表统计信息
ANALYZE;

-- 3. 清理已删除的页面
DELETE FROM pages WHERE is_deleted = 1 AND updated_at < strftime('%s', 'now', '-30 days');

-- 4. 压缩数据库
VACUUM;

-- 5. 检查数据库完整性
PRAGMA integrity_check;

-- 6. 更新全文搜索索引
INSERT INTO pages_fts(pages_fts) VALUES('rebuild');
```

#### 备份策略
```bash
#!/bin/bash
# backup.sh - 数据库备份脚本

BACKUP_DIR="/var/backups/minglog"
DB_PATH="$HOME/.minglog/database.db"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/minglog_backup_$DATE.db"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 创建备份
echo "📦 创建数据库备份..."
sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"

if [ $? -eq 0 ]; then
    echo "✅ 备份成功: $BACKUP_FILE"
    
    # 压缩备份文件
    gzip "$BACKUP_FILE"
    echo "🗜️ 备份已压缩: ${BACKUP_FILE}.gz"
    
    # 清理旧备份 (保留30天)
    find "$BACKUP_DIR" -name "*.gz" -mtime +30 -delete
    echo "🧹 清理旧备份完成"
else
    echo "❌ 备份失败"
    exit 1
fi
```

## 🐛 故障排除

### 常见问题诊断

#### 1. 应用启动问题
```bash
# 启动诊断脚本
diagnose_startup() {
    echo "🔍 诊断应用启动问题..."
    
    # 检查系统资源
    echo "💾 内存使用情况:"
    free -h
    
    echo "💿 磁盘空间:"
    df -h
    
    echo "🖥️ CPU负载:"
    uptime
    
    # 检查依赖
    echo "📦 检查依赖..."
    if command -v minglog &> /dev/null; then
        echo "✅ MingLog已安装"
    else
        echo "❌ MingLog未安装"
        return 1
    fi
    
    # 检查配置文件
    CONFIG_FILE="$HOME/.minglog/config.json"
    if [ -f "$CONFIG_FILE" ]; then
        echo "✅ 配置文件存在"
        if jq empty "$CONFIG_FILE" 2>/dev/null; then
            echo "✅ 配置文件格式正确"
        else
            echo "❌ 配置文件格式错误"
            return 1
        fi
    else
        echo "⚠️ 配置文件不存在，将使用默认配置"
    fi
    
    # 检查数据库
    DB_FILE="$HOME/.minglog/database.db"
    if [ -f "$DB_FILE" ]; then
        echo "✅ 数据库文件存在"
        if sqlite3 "$DB_FILE" "PRAGMA integrity_check;" | grep -q "ok"; then
            echo "✅ 数据库完整性检查通过"
        else
            echo "❌ 数据库损坏"
            return 1
        fi
    else
        echo "⚠️ 数据库文件不存在，将创建新数据库"
    fi
}
```

#### 2. 性能问题诊断
```typescript
// 性能诊断工具
export class PerformanceDiagnostic {
  static async diagnosePerformance(): Promise<DiagnosticReport> {
    const report: DiagnosticReport = {
      timestamp: Date.now(),
      issues: [],
      recommendations: []
    }

    // 检查内存使用
    const memoryUsage = this.getMemoryUsage()
    if (memoryUsage.percentage > 80) {
      report.issues.push({
        type: 'memory',
        severity: 'high',
        description: `内存使用过高: ${memoryUsage.percentage}%`
      })
      report.recommendations.push('建议重启应用或清理缓存')
    }

    // 检查渲染性能
    const renderMetrics = await this.measureRenderPerformance()
    if (renderMetrics.averageFrameTime > 16) {
      report.issues.push({
        type: 'rendering',
        severity: 'medium',
        description: `渲染性能低于60fps: ${renderMetrics.fps}fps`
      })
      report.recommendations.push('建议关闭不必要的动画效果')
    }

    // 检查数据库性能
    const dbMetrics = await this.measureDatabasePerformance()
    if (dbMetrics.averageQueryTime > 100) {
      report.issues.push({
        type: 'database',
        severity: 'medium',
        description: `数据库查询缓慢: ${dbMetrics.averageQueryTime}ms`
      })
      report.recommendations.push('建议重建数据库索引')
    }

    return report
  }
}
```

### 恢复程序

#### 数据恢复
```bash
#!/bin/bash
# recovery.sh - 数据恢复脚本

recover_from_backup() {
    local backup_file="$1"
    local db_path="$HOME/.minglog/database.db"
    
    echo "🔄 开始数据恢复..."
    
    # 备份当前数据库
    if [ -f "$db_path" ]; then
        cp "$db_path" "${db_path}.recovery_backup"
        echo "📦 当前数据库已备份"
    fi
    
    # 恢复数据
    if [ -f "$backup_file" ]; then
        if [[ "$backup_file" == *.gz ]]; then
            gunzip -c "$backup_file" > "$db_path"
        else
            cp "$backup_file" "$db_path"
        fi
        
        # 验证恢复的数据库
        if sqlite3 "$db_path" "PRAGMA integrity_check;" | grep -q "ok"; then
            echo "✅ 数据恢复成功"
            rm -f "${db_path}.recovery_backup"
        else
            echo "❌ 恢复的数据库损坏，回滚到原数据库"
            mv "${db_path}.recovery_backup" "$db_path"
            return 1
        fi
    else
        echo "❌ 备份文件不存在: $backup_file"
        return 1
    fi
}

# 自动恢复最新备份
auto_recovery() {
    local backup_dir="/var/backups/minglog"
    local latest_backup=$(ls -t "$backup_dir"/*.gz 2>/dev/null | head -1)
    
    if [ -n "$latest_backup" ]; then
        echo "🔍 找到最新备份: $latest_backup"
        recover_from_backup "$latest_backup"
    else
        echo "❌ 未找到可用的备份文件"
        return 1
    fi
}
```

## 📈 性能优化

### 定期优化任务

#### 1. 数据库优化
```sql
-- 每周执行的优化任务
-- optimize_weekly.sql

-- 清理过期的搜索缓存
DELETE FROM search_cache WHERE created_at < strftime('%s', 'now', '-7 days');

-- 优化页面表
UPDATE pages SET content = trim(content) WHERE content != trim(content);

-- 重建全文搜索索引
DROP TABLE IF EXISTS pages_fts_temp;
CREATE VIRTUAL TABLE pages_fts_temp USING fts5(title, content);
INSERT INTO pages_fts_temp SELECT title, content FROM pages WHERE is_deleted = 0;
DROP TABLE pages_fts;
ALTER TABLE pages_fts_temp RENAME TO pages_fts;

-- 更新统计信息
ANALYZE;
```

#### 2. 缓存优化
```typescript
// 缓存清理策略
export class CacheOptimizer {
  static async optimizeCache(): Promise<void> {
    // 清理过期缓存
    const expiredKeys = await this.getExpiredCacheKeys()
    for (const key of expiredKeys) {
      await this.removeFromCache(key)
    }

    // 清理低频访问的缓存
    const lowFrequencyKeys = await this.getLowFrequencyCacheKeys()
    for (const key of lowFrequencyKeys) {
      await this.removeFromCache(key)
    }

    // 压缩缓存数据
    await this.compressCache()
    
    console.log(`缓存优化完成，清理了 ${expiredKeys.length + lowFrequencyKeys.length} 个条目`)
  }

  static async scheduleOptimization(): Promise<void> {
    // 每天凌晨2点执行缓存优化
    setInterval(async () => {
      const now = new Date()
      if (now.getHours() === 2 && now.getMinutes() === 0) {
        await this.optimizeCache()
      }
    }, 60000) // 每分钟检查一次
  }
}
```

## 📞 用户支持

### 反馈收集系统

#### 应用内反馈
```typescript
// 反馈收集组件
export const FeedbackCollector: React.FC = () => {
  const [feedback, setFeedback] = useState({
    type: 'bug' as 'bug' | 'feature' | 'general',
    title: '',
    description: '',
    email: '',
    includeSystemInfo: true
  })

  const submitFeedback = async () => {
    const systemInfo = feedback.includeSystemInfo ? await getSystemInfo() : null
    
    const feedbackData = {
      ...feedback,
      systemInfo,
      timestamp: Date.now(),
      version: await getAppVersion(),
      userAgent: navigator.userAgent
    }

    try {
      await invoke('submit_feedback', { feedback: feedbackData })
      showNotification('反馈提交成功，感谢您的建议！', 'success')
    } catch (error) {
      showNotification('反馈提交失败，请稍后重试', 'error')
    }
  }

  return (
    <div className="feedback-form">
      {/* 反馈表单UI */}
    </div>
  )
}
```

#### 自动错误报告
```rust
// 自动错误报告
pub struct ErrorReporter {
    endpoint: String,
    api_key: String,
}

impl ErrorReporter {
    pub async fn report_error(&self, error: &AppError) -> Result<(), ReportError> {
        let report = ErrorReport {
            error_id: Uuid::new_v4(),
            message: error.message.clone(),
            stack_trace: error.stack_trace.clone(),
            timestamp: SystemTime::now(),
            app_version: env!("CARGO_PKG_VERSION").to_string(),
            os_info: self.get_os_info(),
            user_consent: true, // 用户已同意错误报告
        };

        let client = reqwest::Client::new();
        let response = client
            .post(&self.endpoint)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .json(&report)
            .send()
            .await?;

        if response.status().is_success() {
            log::info!("错误报告已提交: {}", report.error_id);
            Ok(())
        } else {
            Err(ReportError::ServerError(response.status()))
        }
    }
}
```

### 支持流程

#### 1. 问题分类
- **P0 - 严重**: 应用崩溃、数据丢失 (4小时内响应)
- **P1 - 高**: 核心功能不可用 (24小时内响应)
- **P2 - 中**: 功能异常、性能问题 (3天内响应)
- **P3 - 低**: 功能改进、文档问题 (1周内响应)

#### 2. 响应模板
```markdown
# 问题响应模板

## 自动回复
感谢您的反馈！我们已收到您的问题报告。

**问题编号**: #{issue_id}
**优先级**: {priority}
**预计响应时间**: {response_time}

我们会尽快处理您的问题，并通过邮件通知您处理进度。

## 问题确认
我们正在调查您报告的问题：
- 问题描述: {description}
- 复现步骤: {steps}
- 系统信息: {system_info}

## 解决方案
根据您的问题，我们建议：
1. {solution_step_1}
2. {solution_step_2}
3. {solution_step_3}

如果问题仍然存在，请回复此邮件。
```

---

**维护指南版本**: v1.0.0  
**最后更新**: 2025年1月  
**维护团队**: MingLog技术支持团队

# 🛠️ MingLog 技术实施指南

## 📋 概述

本文档为MingLog 2025年开发路线图提供详细的技术实施指导，包含具体的代码示例、架构设计和最佳实践。

## 🏗️ 第一阶段：稳定性与质量提升

### 1.1 测试体系完善

#### 单元测试覆盖率提升
```rust
// src-tauri/src/database/tests.rs
#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;
    
    #[tokio::test]
    async fn test_database_crud_operations() {
        let temp_dir = tempdir().unwrap();
        let db_path = temp_dir.path().join("test.db");
        let db = Database::new_with_path(db_path).await.unwrap();
        
        // 测试创建页面
        let page = db.create_page("Test Page", "Test content").await.unwrap();
        assert_eq!(page.title, "Test Page");
        
        // 测试读取页面
        let retrieved = db.get_page(page.id).await.unwrap();
        assert_eq!(retrieved.title, "Test Page");
        
        // 测试更新页面
        db.update_page(page.id, "Updated Title", "Updated content").await.unwrap();
        let updated = db.get_page(page.id).await.unwrap();
        assert_eq!(updated.title, "Updated Title");
        
        // 测试删除页面
        db.delete_page(page.id).await.unwrap();
        assert!(db.get_page(page.id).await.is_err());
    }
    
    #[tokio::test]
    async fn test_concurrent_operations() {
        let db = Database::new().await.unwrap();
        let handles: Vec<_> = (0..10).map(|i| {
            let db = db.clone();
            tokio::spawn(async move {
                db.create_page(&format!("Page {}", i), "Content").await
            })
        }).collect();
        
        for handle in handles {
            assert!(handle.await.unwrap().is_ok());
        }
    }
}
```

#### 前端组件测试
```typescript
// src/components/__tests__/BlockEditor.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BlockEditor } from '../BlockEditor';
import { vi } from 'vitest';

describe('BlockEditor', () => {
  const mockOnChange = vi.fn();
  
  beforeEach(() => {
    mockOnChange.mockClear();
  });
  
  test('renders editor with initial content', () => {
    render(
      <BlockEditor 
        content="Initial content" 
        onChange={mockOnChange} 
      />
    );
    
    expect(screen.getByText('Initial content')).toBeInTheDocument();
  });
  
  test('handles text input correctly', async () => {
    render(<BlockEditor content="" onChange={mockOnChange} />);
    
    const editor = screen.getByRole('textbox');
    fireEvent.input(editor, { target: { textContent: 'New content' } });
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('New content');
    });
  });
  
  test('supports keyboard shortcuts', async () => {
    render(<BlockEditor content="" onChange={mockOnChange} />);
    
    const editor = screen.getByRole('textbox');
    fireEvent.keyDown(editor, { key: 'b', ctrlKey: true });
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /bold/i })).toHaveClass('active');
    });
  });
});
```

#### E2E测试场景
```typescript
// tests/e2e/user-workflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Complete User Workflow', () => {
  test('user can create, edit, and delete pages', async ({ page }) => {
    // 启动应用
    await page.goto('/');
    await expect(page.locator('[data-testid="app-title"]')).toBeVisible();
    
    // 创建新页面
    await page.click('[data-testid="create-page-btn"]');
    await page.fill('[data-testid="page-title-input"]', 'Test Page');
    await page.fill('[data-testid="page-content-editor"]', 'Test content');
    await page.click('[data-testid="save-page-btn"]');
    
    // 验证页面创建成功
    await expect(page.locator('[data-testid="page-list"]')).toContainText('Test Page');
    
    // 编辑页面
    await page.click('[data-testid="page-item"]:has-text("Test Page")');
    await page.fill('[data-testid="page-content-editor"]', 'Updated content');
    await page.keyboard.press('Control+S');
    
    // 验证保存成功
    await expect(page.locator('[data-testid="save-status"]')).toContainText('已保存');
    
    // 删除页面
    await page.click('[data-testid="page-menu-btn"]');
    await page.click('[data-testid="delete-page-btn"]');
    await page.click('[data-testid="confirm-delete-btn"]');
    
    // 验证删除成功
    await expect(page.locator('[data-testid="page-list"]')).not.toContainText('Test Page');
  });
  
  test('performance benchmarks', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(2000); // 启动时间<2秒
    
    // 测试大量数据渲染性能
    await page.evaluate(() => {
      // 创建1000个测试页面
      for (let i = 0; i < 1000; i++) {
        window.testAPI.createPage(`Page ${i}`, `Content ${i}`);
      }
    });
    
    const renderStart = Date.now();
    await page.click('[data-testid="refresh-list-btn"]');
    await page.waitForSelector('[data-testid="page-list"] [data-testid="page-item"]:nth-child(1000)');
    const renderTime = Date.now() - renderStart;
    
    expect(renderTime).toBeLessThan(1000); // 渲染时间<1秒
  });
});
```

### 1.2 错误处理优化

#### Rust错误类型系统
```rust
// src-tauri/src/error.rs
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug, Serialize, Deserialize)]
pub enum AppError {
    #[error("数据库错误: {message}")]
    Database { message: String, code: i32 },
    
    #[error("文件操作错误: {message}")]
    FileOperation { message: String, path: String },
    
    #[error("网络错误: {message}")]
    Network { message: String, url: String },
    
    #[error("验证错误: {field} - {message}")]
    Validation { field: String, message: String },
    
    #[error("权限错误: {message}")]
    Permission { message: String, resource: String },
    
    #[error("配置错误: {message}")]
    Configuration { message: String, key: String },
}

impl AppError {
    pub fn error_code(&self) -> &'static str {
        match self {
            AppError::Database { .. } => "DB_ERROR",
            AppError::FileOperation { .. } => "FILE_ERROR",
            AppError::Network { .. } => "NET_ERROR",
            AppError::Validation { .. } => "VALIDATION_ERROR",
            AppError::Permission { .. } => "PERMISSION_ERROR",
            AppError::Configuration { .. } => "CONFIG_ERROR",
        }
    }
    
    pub fn severity(&self) -> ErrorSeverity {
        match self {
            AppError::Database { .. } => ErrorSeverity::High,
            AppError::FileOperation { .. } => ErrorSeverity::Medium,
            AppError::Network { .. } => ErrorSeverity::Low,
            AppError::Validation { .. } => ErrorSeverity::Low,
            AppError::Permission { .. } => ErrorSeverity::High,
            AppError::Configuration { .. } => ErrorSeverity::Medium,
        }
    }
    
    pub fn is_recoverable(&self) -> bool {
        match self {
            AppError::Network { .. } => true,
            AppError::FileOperation { .. } => true,
            AppError::Database { .. } => false,
            AppError::Permission { .. } => false,
            AppError::Validation { .. } => true,
            AppError::Configuration { .. } => false,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub enum ErrorSeverity {
    Low,
    Medium,
    High,
    Critical,
}

// 错误恢复策略
pub struct ErrorRecovery;

impl ErrorRecovery {
    pub async fn handle_error(error: &AppError) -> Result<(), AppError> {
        match error {
            AppError::Network { .. } => {
                // 网络错误：重试机制
                Self::retry_with_backoff(3, Duration::from_secs(1)).await
            },
            AppError::FileOperation { path, .. } => {
                // 文件错误：尝试创建目录或修复权限
                Self::fix_file_permissions(path).await
            },
            AppError::Database { .. } => {
                // 数据库错误：尝试重新连接
                Self::reconnect_database().await
            },
            _ => Err(error.clone()),
        }
    }
    
    async fn retry_with_backoff(max_retries: u32, initial_delay: Duration) -> Result<(), AppError> {
        for attempt in 1..=max_retries {
            tokio::time::sleep(initial_delay * attempt).await;
            // 重试逻辑
            if Self::test_connection().await.is_ok() {
                return Ok(());
            }
        }
        Err(AppError::Network {
            message: "重试失败".to_string(),
            url: "unknown".to_string(),
        })
    }
}
```

#### 前端错误边界增强
```typescript
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;
  
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }
  
  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // 记录错误
    this.logError(error, errorInfo);
    
    // 调用外部错误处理器
    this.props.onError?.(error, errorInfo);
    
    // 尝试自动恢复
    this.attemptRecovery(error);
  }
  
  private logError(error: Error, errorInfo: ErrorInfo) {
    const errorReport = {
      id: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
    
    // 发送错误报告到后端
    window.electronAPI?.reportError(errorReport);
    
    // 本地存储错误日志
    const errorLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
    errorLogs.push(errorReport);
    localStorage.setItem('errorLogs', JSON.stringify(errorLogs.slice(-100))); // 保留最近100条
  }
  
  private attemptRecovery(error: Error) {
    if (this.retryCount < this.maxRetries) {
      setTimeout(() => {
        this.retryCount++;
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
        });
      }, 1000 * this.retryCount); // 递增延迟
    }
  }
  
  private handleManualRetry = () => {
    this.retryCount = 0;
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };
  
  private handleReportIssue = () => {
    const issueUrl = `https://github.com/MMR-MINGriyue/MingLog/issues/new?title=Error%20Report&body=${encodeURIComponent(
      `Error ID: ${this.state.errorId}\nMessage: ${this.state.error?.message}\nStack: ${this.state.error?.stack}`
    )}`;
    window.open(issueUrl, '_blank');
  };
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary">
          <h2>🚨 应用遇到了问题</h2>
          <p>我们已经记录了这个错误，正在努力修复。</p>
          
          <div className="error-actions">
            <button onClick={this.handleManualRetry} className="btn-primary">
              重试
            </button>
            <button onClick={this.handleReportIssue} className="btn-secondary">
              报告问题
            </button>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="error-details">
              <summary>错误详情</summary>
              <pre>{this.state.error?.stack}</pre>
              <pre>{this.state.errorInfo?.componentStack}</pre>
            </details>
          )}
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### 1.3 性能监控系统

#### 实时性能监控
```rust
// src-tauri/src/monitoring.rs
use std::sync::Arc;
use tokio::sync::Mutex;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PerformanceMetrics {
    pub timestamp: i64,
    pub memory_usage: u64,      // MB
    pub cpu_usage: f32,         // 百分比
    pub startup_time: u64,      // 毫秒
    pub api_response_time: u64, // 毫秒
    pub db_query_time: u64,     // 毫秒
    pub active_connections: u32,
    pub error_count: u32,
}

pub struct PerformanceMonitor {
    metrics_history: Arc<Mutex<Vec<PerformanceMetrics>>>,
    alert_thresholds: AlertThresholds,
}

#[derive(Debug)]
pub struct AlertThresholds {
    pub memory_limit: u64,      // 100MB
    pub cpu_limit: f32,         // 80%
    pub response_time_limit: u64, // 500ms
    pub error_rate_limit: f32,  // 5%
}

impl PerformanceMonitor {
    pub fn new() -> Self {
        Self {
            metrics_history: Arc::new(Mutex::new(Vec::new())),
            alert_thresholds: AlertThresholds {
                memory_limit: 100,
                cpu_limit: 80.0,
                response_time_limit: 500,
                error_rate_limit: 5.0,
            },
        }
    }
    
    pub async fn collect_metrics(&self) -> PerformanceMetrics {
        let metrics = PerformanceMetrics {
            timestamp: chrono::Utc::now().timestamp_millis(),
            memory_usage: self.get_memory_usage().await,
            cpu_usage: self.get_cpu_usage().await,
            startup_time: self.get_startup_time().await,
            api_response_time: self.measure_api_response().await,
            db_query_time: self.measure_db_query().await,
            active_connections: self.get_active_connections().await,
            error_count: self.get_error_count().await,
        };
        
        // 存储历史数据
        let mut history = self.metrics_history.lock().await;
        history.push(metrics.clone());
        
        // 保留最近1000条记录
        if history.len() > 1000 {
            history.remove(0);
        }
        
        // 检查告警
        self.check_alerts(&metrics).await;
        
        metrics
    }
    
    async fn check_alerts(&self, metrics: &PerformanceMetrics) {
        if metrics.memory_usage > self.alert_thresholds.memory_limit {
            self.send_alert(AlertType::HighMemoryUsage, metrics).await;
        }
        
        if metrics.cpu_usage > self.alert_thresholds.cpu_limit {
            self.send_alert(AlertType::HighCpuUsage, metrics).await;
        }
        
        if metrics.api_response_time > self.alert_thresholds.response_time_limit {
            self.send_alert(AlertType::SlowResponse, metrics).await;
        }
    }
    
    async fn send_alert(&self, alert_type: AlertType, metrics: &PerformanceMetrics) {
        let alert = Alert {
            alert_type,
            timestamp: metrics.timestamp,
            message: format!("性能告警: {:?}", alert_type),
            metrics: metrics.clone(),
        };
        
        // 发送到前端
        tauri::emit_all("performance_alert", &alert).unwrap();
        
        // 记录日志
        log::warn!("Performance alert: {:?}", alert);
    }
}

#[derive(Debug, Serialize)]
pub enum AlertType {
    HighMemoryUsage,
    HighCpuUsage,
    SlowResponse,
    DatabaseError,
    NetworkError,
}

#[derive(Debug, Serialize)]
pub struct Alert {
    pub alert_type: AlertType,
    pub timestamp: i64,
    pub message: String,
    pub metrics: PerformanceMetrics,
}
```

## 🔧 第二阶段：功能增强与体验优化

### 2.1 编辑器功能增强

#### 虚拟滚动优化
```typescript
// src/components/VirtualizedBlockList.tsx
import React, { useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';

interface Block {
  id: string;
  content: string;
  type: 'text' | 'heading' | 'list' | 'code';
  level?: number;
}

interface VirtualizedBlockListProps {
  blocks: Block[];
  onBlockChange: (blockId: string, content: string) => void;
  onBlockDelete: (blockId: string) => void;
  onBlockAdd: (afterBlockId: string) => void;
}

const ITEM_HEIGHT = 60; // 每个块的固定高度

export const VirtualizedBlockList: React.FC<VirtualizedBlockListProps> = ({
  blocks,
  onBlockChange,
  onBlockDelete,
  onBlockAdd,
}) => {
  const BlockItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const block = blocks[index];
    
    return (
      <div style={style} className="block-item">
        <BlockEditor
          key={block.id}
          block={block}
          onChange={(content) => onBlockChange(block.id, content)}
          onDelete={() => onBlockDelete(block.id)}
          onAddBelow={() => onBlockAdd(block.id)}
        />
      </div>
    );
  }, [blocks, onBlockChange, onBlockDelete, onBlockAdd]);
  
  const listHeight = Math.min(blocks.length * ITEM_HEIGHT, window.innerHeight - 200);
  
  return (
    <List
      height={listHeight}
      itemCount={blocks.length}
      itemSize={ITEM_HEIGHT}
      itemData={blocks}
      overscanCount={5} // 预渲染5个项目
    >
      {BlockItem}
    </List>
  );
};
```

#### 协作编辑基础架构
```typescript
// src/services/CollaborationService.ts
export class CollaborationService {
  private ws: WebSocket | null = null;
  private operationQueue: Operation[] = [];
  private documentState: DocumentState;
  
  constructor(documentId: string) {
    this.documentState = new DocumentState(documentId);
    this.connect();
  }
  
  private connect() {
    this.ws = new WebSocket(`ws://localhost:8080/collaborate/${this.documentState.id}`);
    
    this.ws.onmessage = (event) => {
      const operation = JSON.parse(event.data) as Operation;
      this.handleRemoteOperation(operation);
    };
    
    this.ws.onopen = () => {
      console.log('Collaboration connection established');
      this.sendQueuedOperations();
    };
  }
  
  public applyOperation(operation: Operation) {
    // 应用本地操作
    this.documentState.apply(operation);
    
    // 发送到服务器
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(operation));
    } else {
      this.operationQueue.push(operation);
    }
  }
  
  private handleRemoteOperation(operation: Operation) {
    // 转换操作以解决冲突
    const transformedOp = this.transformOperation(operation);
    
    // 应用远程操作
    this.documentState.apply(transformedOp);
    
    // 通知UI更新
    this.notifyDocumentChange();
  }
  
  private transformOperation(operation: Operation): Operation {
    // 实现操作转换算法 (Operational Transformation)
    // 这里简化实现，实际需要复杂的冲突解决逻辑
    return operation;
  }
}

interface Operation {
  type: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
  author: string;
  timestamp: number;
}

class DocumentState {
  constructor(public id: string, public content: string = '') {}
  
  apply(operation: Operation) {
    switch (operation.type) {
      case 'insert':
        this.content = 
          this.content.slice(0, operation.position) +
          operation.content +
          this.content.slice(operation.position);
        break;
      case 'delete':
        this.content = 
          this.content.slice(0, operation.position) +
          this.content.slice(operation.position + (operation.length || 0));
        break;
    }
  }
}
```

---

**🔧 本指南将持续更新，为MingLog的技术实施提供详细指导。** 🔧

**文档版本**: v1.0  
**最后更新**: 2024年12月30日

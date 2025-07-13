# MingLog项目清理报告 - 2025-01-10

## 执行概述
本报告详细分析了MingLog项目的文件结构，识别了需要清理的文件和目录，并提供了系统化的清理建议。

## 1. 构建产物和缓存文件分析

### 1.1 Rust构建产物 (可清理)
- `apps/tauri-desktop/src-tauri/target/` - Rust编译产物
  - `target/debug/` - 调试版本构建产物 (~500MB+)
  - `target/release/` - 发布版本构建产物 (~200MB+)
  - 建议：保留CACHEDIR.TAG，清理其他内容

### 1.2 前端构建产物 (可清理)
- `apps/tauri-desktop/dist/` - Vite构建输出
- `packages/*/dist/` - 各包的构建输出
  - `packages/core/dist/`
  - `packages/modules/*/dist/`
  - `packages/ui/dist/` (如存在)

### 1.3 Node.js依赖和缓存 (部分可清理)
- `node_modules/` - 根目录依赖 (~2GB+)
- `apps/tauri-desktop/node_modules/` - 应用依赖
- `packages/*/node_modules/` - 各包依赖
- `.pnpm/` 缓存目录

## 2. 开发环境文件分析

### 2.1 IDE和编辑器文件 (可清理)
- `.vscode/settings.json` - VS Code配置 (保留)
- 临时编辑器文件 (如存在)

### 2.2 测试和覆盖率文件 (可清理)
- `coverage/` 目录 (如存在)
- `.nyc_output/` (如存在)
- 测试快照文件的临时版本

### 2.3 日志和临时文件 (可清理)
- `*.log` 文件
- `*.tmp` 文件
- `.cache/` 目录

## 3. 文档和配置文件分析

### 3.1 文档文件 (保留，需整理)
- `docs/` 目录包含大量文档文件
- 建议按主题重新组织，移除过时文档

### 3.2 配置文件 (保留)
- `package.json`, `pnpm-workspace.yaml` - 项目配置
- `tsconfig.json`, `vite.config.ts` - 构建配置
- `tauri.conf.json` - Tauri配置

## 4. 清理建议和安全确认

### 4.1 高优先级清理 (安全)
```bash
# Rust构建产物
rm -rf apps/tauri-desktop/src-tauri/target/debug
rm -rf apps/tauri-desktop/src-tauri/target/release

# 前端构建产物
rm -rf apps/tauri-desktop/dist
rm -rf packages/*/dist

# 测试覆盖率
rm -rf coverage
rm -rf .nyc_output
```

### 4.2 中等优先级清理 (需确认)
```bash
# Node.js依赖 (可通过pnpm install重新安装)
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
```

### 4.3 低优先级清理 (谨慎)
- 清理过时的文档文件
- 整理测试数据文件

## 5. 清理后的预期效果

### 5.1 磁盘空间节省
- Rust构建产物: ~700MB
- 前端构建产物: ~100MB
- Node.js依赖: ~3GB (可重新安装)
- 总计: ~3.8GB

### 5.2 项目结构优化
- 更清晰的项目结构
- 更快的Git操作
- 减少IDE索引时间

## 6. 清理执行计划

### 阶段1: 安全清理 (立即执行)
1. 清理Rust构建产物
2. 清理前端构建产物
3. 清理测试覆盖率文件

### 阶段2: 依赖清理 (需确认)
1. 备份package.json和lock文件
2. 清理node_modules
3. 重新安装依赖

### 阶段3: 文档整理 (后续执行)
1. 分析文档相关性
2. 归档过时文档
3. 重新组织文档结构

## 7. 风险评估和回滚计划

### 7.1 风险等级
- **低风险**: 构建产物清理 (可重新构建)
- **中风险**: 依赖清理 (可重新安装)
- **高风险**: 源代码和配置文件 (不建议清理)

### 7.2 回滚计划
- Git提交当前状态作为检查点
- 保留关键配置文件备份
- 记录清理前的目录大小

## 8. 执行确认

**请确认是否执行以下清理操作：**

- [ ] 清理Rust构建产物 (target目录)
- [ ] 清理前端构建产物 (dist目录)
- [ ] 清理测试覆盖率文件
- [ ] 清理Node.js依赖 (需重新安装)
- [ ] 整理文档结构

**注意**: 清理后需要重新运行构建命令来恢复开发环境。

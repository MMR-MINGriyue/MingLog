# 🧹 MingLog 项目文件整理和桌面应用构建计划

**执行日期**: 2025-01-15  
**目标**: 系统性整理项目文件，清理冗余内容，构建桌面应用

## 📋 当前项目状态分析

### 项目结构概览
```
minglog/
├── apps/
│   └── tauri-desktop/          # 桌面应用主目录
│       ├── dist/               # 构建输出 (需清理)
│       ├── node_modules/       # 依赖包 (需重新安装)
│       ├── src/                # 源代码
│       ├── src-tauri/          # Rust后端
│       ├── public/             # 静态资源
│       └── *.md               # 大量报告文档 (需整理)
├── packages/                   # 共享包
└── 配置文件
```

### 发现的问题
1. **文档文件过多**: 大量的报告和总结文档散布在应用目录中
2. **构建产物**: dist目录包含旧的构建文件
3. **依赖状态**: node_modules可能包含过时的依赖
4. **文件组织**: 缺少统一的文档管理

## 🎯 整理计划

### Phase 1: 文件清理和整理 (15分钟)

#### 1.1 清理构建产物
```bash
# 清理前端构建产物
rm -rf apps/tauri-desktop/dist/
rm -rf apps/tauri-desktop/.vite/

# 清理Rust构建产物
rm -rf apps/tauri-desktop/src-tauri/target/

# 清理依赖
rm -rf apps/tauri-desktop/node_modules/
rm -rf node_modules/
```

#### 1.2 整理文档文件
```bash
# 创建文档目录
mkdir -p docs/reports/
mkdir -p docs/summaries/
mkdir -p docs/plans/

# 移动报告文件
mv apps/tauri-desktop/*_SUMMARY_*.md docs/summaries/
mv apps/tauri-desktop/*_PLAN_*.md docs/plans/
mv apps/tauri-desktop/*_REPORT_*.md docs/reports/
```

#### 1.3 清理临时文件
```bash
# 清理日志文件
find . -name "*.log" -delete
find . -name ".DS_Store" -delete

# 清理编辑器临时文件
find . -name "*.swp" -delete
find . -name "*.swo" -delete
find . -name "*~" -delete
```

### Phase 2: 依赖管理和更新 (10分钟)

#### 2.1 重新安装依赖
```bash
# 根目录依赖安装
pnpm install

# 验证workspace依赖
pnpm list --depth=0
```

#### 2.2 检查依赖版本
```bash
# 检查过时的依赖
pnpm outdated

# 更新关键依赖（如需要）
pnpm update @tauri-apps/api @tauri-apps/cli
```

### Phase 3: 构建环境验证 (10分钟)

#### 3.1 验证Tauri环境
```bash
# 检查Rust工具链
rustc --version
cargo --version

# 检查Tauri CLI
pnpm tauri info
```

#### 3.2 验证前端构建
```bash
cd apps/tauri-desktop
pnpm run build
```

#### 3.3 检查图标和资源
```bash
# 验证图标文件存在
ls -la apps/tauri-desktop/src-tauri/icons/
```

### Phase 4: 桌面应用构建 (20分钟)

#### 4.1 开发模式测试
```bash
cd apps/tauri-desktop
pnpm run tauri:dev
```

#### 4.2 生产构建
```bash
cd apps/tauri-desktop
pnpm run tauri:build
```

#### 4.3 构建产物验证
```bash
# 检查构建输出
ls -la apps/tauri-desktop/src-tauri/target/release/bundle/
```

## 📁 文档重组方案

### 新的文档结构
```
docs/
├── reports/                    # 技术报告
│   ├── week5/
│   │   ├── test-coverage-fix-summary.md
│   │   ├── editor-enhancement-summary.md
│   │   └── keyboard-shortcuts-summary.md
│   └── week6/
│       └── macos-design-system-summary.md
├── summaries/                  # 完成总结
│   ├── week5-completion-summary.md
│   └── week6-completion-summary.md
├── plans/                      # 计划文档
│   ├── editor-enhancement-plan.md
│   └── project-cleanup-plan.md
└── build/                      # 构建相关文档
    ├── build-instructions.md
    └── deployment-guide.md
```

### 文档索引创建
创建 `docs/README.md` 作为文档导航：
```markdown
# MingLog 项目文档

## 📊 项目报告
- [Week 5 完成总结](summaries/week5-completion-summary.md)
- [Week 6 完成总结](summaries/week6-completion-summary.md)

## 🔧 技术报告
- [测试覆盖率修复](reports/week5/test-coverage-fix-summary.md)
- [编辑器功能完善](reports/week5/editor-enhancement-summary.md)
- [键盘快捷键实现](reports/week5/keyboard-shortcuts-summary.md)
- [macOS设计系统](reports/week6/macos-design-system-summary.md)

## 📋 计划文档
- [编辑器增强计划](plans/editor-enhancement-plan.md)
- [项目清理计划](plans/project-cleanup-plan.md)

## 🚀 构建部署
- [构建说明](build/build-instructions.md)
- [部署指南](build/deployment-guide.md)
```

## 🔧 构建配置优化

### Tauri配置检查项
- ✅ 产品名称: "MingLog Desktop"
- ✅ 版本号: "1.0.0"
- ✅ 应用标识: "com.minglog.desktop"
- ✅ 图标文件: 已配置多种格式
- ✅ 窗口设置: 1200x800, 最小800x600
- ✅ 权限配置: 文件系统、对话框权限
- ✅ 安全策略: CSP配置

### 构建目标
- **Windows**: NSIS安装包 + MSI
- **macOS**: DMG + APP bundle
- **Linux**: AppImage + DEB

### 性能优化设置
```json
{
  "build": {
    "beforeBuildCommand": "npm run build",
    "distDir": "../dist"
  },
  "bundle": {
    "active": true,
    "targets": "all"
  }
}
```

## 📊 预期结果

### 文件清理效果
- **减少文件数量**: ~50个文档文件整理到docs目录
- **减少目录大小**: 清理构建产物和依赖后减少~2GB
- **提升组织性**: 统一的文档结构和索引

### 构建产物
- **Windows**: `MingLog Desktop_1.0.0_x64_en-US.msi`
- **macOS**: `MingLog Desktop.app` + `MingLog Desktop_1.0.0_x64.dmg`
- **Linux**: `minglog-desktop_1.0.0_amd64.deb` + `MingLog Desktop_1.0.0_x86_64.AppImage`

### 质量保证
- ✅ 所有依赖最新版本
- ✅ 构建无错误和警告
- ✅ 应用正常启动和运行
- ✅ 文档结构清晰有序

## ⚠️ 注意事项

### 备份重要文件
在执行清理前，确保重要文件已备份：
- 源代码 (已在git中)
- 配置文件 (已在git中)
- 重要文档 (将移动到docs目录)

### 构建环境要求
- **Node.js**: 18+
- **Rust**: 1.70+
- **Tauri CLI**: 1.6+
- **系统依赖**: 根据目标平台安装

### 潜在问题
1. **依赖冲突**: 重新安装时可能出现版本冲突
2. **构建失败**: Rust编译或前端构建可能失败
3. **权限问题**: 某些平台可能需要签名证书

## 🚀 执行时间表

| 阶段 | 预计时间 | 主要任务 |
|------|----------|----------|
| Phase 1 | 15分钟 | 文件清理和整理 |
| Phase 2 | 10分钟 | 依赖管理和更新 |
| Phase 3 | 10分钟 | 构建环境验证 |
| Phase 4 | 20分钟 | 桌面应用构建 |
| **总计** | **55分钟** | **完整清理和构建** |

---

**计划制定**: 2025-01-15  
**执行状态**: 准备开始  
**预期完成**: 2025-01-15 下午

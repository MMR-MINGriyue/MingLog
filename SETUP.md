# 🚀 MingLog 开发环境快速设置指南

本文档提供在新环境中快速恢复MingLog开发状态的详细步骤。

## 📋 环境要求

### 必需软件
- **Node.js**: ≥18.0.0
- **pnpm**: ≥8.0.0 (推荐使用 8.15.0)
- **Rust**: ≥1.60.0 (推荐使用 1.88.0)
- **Git**: 最新版本

### 操作系统支持
- **Windows**: 10/11 (已验证)
- **macOS**: 10.15+ (待验证)
- **Linux**: Ubuntu 20.04+ (待验证)

## 🔧 快速设置步骤

### 1. 克隆项目
```bash
git clone https://github.com/MMR-MINGriyue/MingLog.git
cd MingLog
```

### 2. 安装依赖
```bash
# 安装所有workspace依赖
pnpm install

# 验证安装
pnpm run type-check
```

### 3. 验证环境
```bash
# 检查Rust环境
cargo --version
rustc --version

# 检查Node.js环境
node --version
pnpm --version

# 运行测试验证
pnpm test
```

### 4. 启动开发服务器
```bash
# 启动Web版本
pnpm run web:dev

# 启动桌面版本
pnpm run desktop:dev
```

## 📦 依赖版本要求

### 关键依赖版本（必须严格匹配）
```json
{
  "vitest": "3.2.4",
  "jsdom": "23.2.0", 
  "vite": "6.0.0",
  "typescript": "5.5.4"
}
```

### Rust依赖
```toml
[dependencies]
tauri = { version = "1.6", features = ["api-all", "devtools", "system-tray"] }
sqlx = { version = "0.7", features = ["runtime-tokio-rustls", "sqlite"] }
tokio = { version = "1.0", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
```

## 🔍 验证清单

### 编译验证
- [ ] TypeScript编译零错误
- [ ] Rust编译通过
- [ ] 前端构建成功
- [ ] 测试套件运行

### 功能验证
- [ ] Web版本正常启动
- [ ] 桌面版本正常启动
- [ ] 数据库连接正常
- [ ] 基础功能可用

## 🚨 常见问题解决

### Windows环境
```bash
# 如果遇到PowerShell执行策略问题
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 如果遇到Tauri构建问题，安装Windows构建工具
# 下载并安装 Visual Studio Build Tools
```

### macOS环境
```bash
# 安装Xcode命令行工具
xcode-select --install

# 安装Homebrew（如果需要）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Linux环境
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install build-essential libssl-dev pkg-config

# 安装Tauri依赖
sudo apt install libwebkit2gtk-4.0-dev libgtk-3-dev libayatana-appindicator3-dev
```

## 📊 性能基准

### 预期性能指标
- **前端构建时间**: ~1.1s
- **构建产物大小**: ~26kB
- **测试运行时间**: <30s
- **开发服务器启动**: <3s

### 测试覆盖率目标
- **前端测试覆盖率**: 85%+
- **后端测试覆盖率**: 90%+
- **测试通过率**: 95%+

## 🔄 同步状态验证

### Git状态检查
```bash
# 检查当前分支和状态
git status
git log --oneline -5

# 验证远程同步
git fetch origin
git status
```

### 构建状态检查
```bash
# 验证所有包构建
pnpm run build

# 运行完整测试套件
pnpm test

# 检查代码质量
pnpm run lint
pnpm run type-check
```

## 📞 获取帮助

如果在设置过程中遇到问题：

1. **检查环境要求**: 确保所有必需软件已正确安装
2. **查看错误日志**: 仔细阅读错误信息和堆栈跟踪
3. **清理重试**: 删除node_modules和target目录，重新安装
4. **查看文档**: 参考项目根目录下的其他文档文件

## 🎯 下一步

环境设置完成后，可以：

1. **查看开发指南**: `docs/developer-guide.md`
2. **了解架构设计**: `docs/architecture.md`
3. **开始开发**: 选择感兴趣的模块开始贡献
4. **运行测试**: 确保所有功能正常工作

---

**最后更新**: 2025-01-11 (Week 4 Day 4)
**文档版本**: v1.0.0-week4

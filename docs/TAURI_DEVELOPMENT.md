# 🦀 Tauri桌面应用开发指南

## 📖 概述

MingLog Tauri桌面应用是一个基于Rust + React的跨平台桌面应用，提供比Electron更轻量级和高性能的解决方案。

## 🏗️ 项目结构

```
apps/tauri-desktop/
├── src/                    # React前端代码
│   ├── components/         # React组件
│   ├── pages/             # 页面组件
│   ├── styles/            # 样式文件
│   ├── App.tsx            # 主应用组件
│   └── main.tsx           # 入口文件
├── src-tauri/             # Rust后端代码
│   ├── src/
│   │   ├── commands.rs    # Tauri命令
│   │   ├── database.rs    # 数据库操作
│   │   ├── file_system.rs # 文件系统操作
│   │   └── main.rs        # Rust主文件
│   ├── Cargo.toml         # Rust依赖配置
│   ├── tauri.conf.json    # Tauri配置
│   └── build.rs           # 构建脚本
├── package.json           # Node.js依赖
├── vite.config.ts         # Vite配置
└── tailwind.config.js     # Tailwind CSS配置
```

## 🚀 快速开始

### 环境要求

1. **Rust** (1.70+)
   ```bash
   # 安装Rust
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   
   # 或在Windows上使用我们的安装脚本
   powershell -ExecutionPolicy Bypass -File scripts/install-rust-simple.ps1
   ```

2. **Node.js** (18+)
3. **系统依赖**:
   - **Windows**: Visual Studio Build Tools, WebView2
   - **macOS**: Xcode Command Line Tools
   - **Linux**: 各种开发库 (见Tauri文档)

### 安装依赖

```bash
# 安装Node.js依赖
cd apps/tauri-desktop
pnpm install

# 安装Tauri CLI
cargo install tauri-cli
```

### 开发模式

```bash
# 启动开发服务器
pnpm tauri:dev

# 或者分别启动
pnpm dev          # 启动Vite开发服务器
cargo tauri dev   # 启动Tauri开发模式
```

### 构建应用

```bash
# 构建生产版本
pnpm tauri:build

# 构建输出位置
# Windows: src-tauri/target/release/bundle/
# macOS: src-tauri/target/release/bundle/
# Linux: src-tauri/target/release/bundle/
```

## 🔧 核心功能

### Rust后端功能

#### 文件系统操作
- `read_file_content` - 读取文件内容
- `write_file_content` - 写入文件内容
- `list_directory` - 列出目录内容
- `create_directory` - 创建目录
- `delete_file` - 删除文件
- `copy_file` - 复制文件
- `move_file` - 移动文件

#### 数据库操作
- `init_database` - 初始化SQLite数据库
- `create_page` - 创建页面
- `get_all_pages` - 获取所有页面
- `update_page` - 更新页面
- `delete_page` - 删除页面

#### 系统集成
- `get_platform_info` - 获取平台信息
- `open_external_url` - 打开外部链接
- `show_in_folder` - 在文件管理器中显示
- `minimize_window` - 最小化窗口
- `maximize_window` - 最大化窗口
- `close_window` - 关闭窗口

### React前端功能

#### 组件架构
- **TitleBar** - 自定义标题栏
- **Sidebar** - 侧边导航栏
- **HomePage** - 主页面
- **EditorPage** - 编辑器页面
- **GraphPage** - 图谱可视化页面
- **SettingsPage** - 设置页面

#### 状态管理
- 使用React Hooks进行状态管理
- Tauri API调用封装
- 错误处理和加载状态

## 🔌 API集成

### 调用Rust命令

```typescript
import { invoke } from '@tauri-apps/api/tauri';

// 文件操作
const content = await invoke('read_file_content', { path: '/path/to/file' });
await invoke('write_file_content', { path: '/path/to/file', content: 'Hello' });

// 数据库操作
const pages = await invoke('get_all_pages');
await invoke('create_page', { title: 'New Page', content: 'Content' });

// 系统操作
const platformInfo = await invoke('get_platform_info');
await invoke('open_external_url', { url: 'https://example.com' });
```

### 错误处理

```typescript
try {
  const result = await invoke('some_command', { param: 'value' });
  // 处理成功结果
} catch (error) {
  console.error('Command failed:', error);
  // 处理错误
}
```

## 🎨 样式和主题

### Tailwind CSS配置
- 自定义颜色主题
- 响应式设计
- 动画效果
- 自定义组件样式

### 主题系统
- 浅色/深色主题支持
- 系统主题跟随
- 自定义颜色配置

## 📦 打包和分发

### 构建配置

```json
// tauri.conf.json
{
  "bundle": {
    "active": true,
    "targets": "all",
    "identifier": "com.minglog.desktop",
    "icon": ["icons/32x32.png", "icons/128x128.png", "icons/icon.icns", "icons/icon.ico"]
  }
}
```

### 支持的平台
- **Windows** (.msi, .exe)
- **macOS** (.dmg, .app)
- **Linux** (.deb, .rpm, .AppImage)

### 自动更新
- 集成tauri-updater
- 增量更新支持
- 签名验证

## 🧪 测试

### 单元测试
```bash
# Rust测试
cd src-tauri
cargo test

# React测试
pnpm test
```

### 集成测试
```bash
# E2E测试
pnpm test:e2e
```

## 🔒 安全性

### 权限配置
- 最小权限原则
- API白名单
- CSP配置
- 文件系统访问限制

### 代码签名
- Windows: Authenticode
- macOS: Apple Developer ID
- Linux: GPG签名

## 🚀 性能优化

### Rust优化
- Release模式编译
- LTO (Link Time Optimization)
- 依赖优化
- 内存管理

### 前端优化
- 代码分割
- 懒加载
- 资源压缩
- 缓存策略

## 🐛 调试

### 开发工具
```bash
# 启用Rust日志
RUST_LOG=debug cargo tauri dev

# 启用前端调试
pnpm dev --debug
```

### 日志记录
- Rust: `log` crate
- 前端: Console API
- 文件日志输出

## 📚 相关资源

- [Tauri官方文档](https://tauri.app/)
- [Rust官方文档](https://doc.rust-lang.org/)
- [React官方文档](https://react.dev/)
- [Vite官方文档](https://vitejs.dev/)

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 创建Pull Request

## 📄 许可证

本项目采用AGPL-3.0许可证。

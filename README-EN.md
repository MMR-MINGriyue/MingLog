# MingLog Desktop

<div align="center">
  <img src="apps/tauri-desktop/src-tauri/icons/128x128.png" alt="MingLog Logo" width="128" height="128">
  
  **Modern Knowledge Management Tool**
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/minglog/minglog-desktop/releases)
  [![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/minglog/minglog-desktop/releases)
</div>

## 🚀 Overview

MingLog Desktop is a modern, fast, and secure knowledge management application built with Tauri and React. It helps you organize your thoughts, create connections between ideas, and build your personal knowledge base with powerful features like:

- **📝 Block-based Editor**: Intuitive editing with drag-and-drop functionality
- **🔍 Lightning-fast Search**: Full-text search across all your content with instant results
- **🕸️ Interactive Graph**: Visualize connections between your notes and ideas
- **📁 File Operations**: Import/export Markdown files and create backups
- **⚡ High Performance**: Optimized for speed with virtual scrolling and efficient rendering
- **🎨 Modern UI**: Clean, responsive interface with dark/light theme support

## ✨ Key Features

### 🧠 Knowledge Organization
- **Hierarchical Structure**: Organize content in pages and blocks
- **Tagging System**: Categorize and find content with tags
- **Reference Links**: Create connections between different pages
- **Journal Mode**: Special mode for daily journaling

### 🔍 Advanced Search
- **Full-text Search**: Search across all pages and blocks instantly
- **Smart Highlighting**: See search terms highlighted in results
- **Keyboard Navigation**: Navigate results with arrow keys
- **Search Statistics**: See result counts and search performance

### 🕸️ Graph Visualization
- **Interactive Network**: Explore your knowledge as an interactive graph
- **Node Relationships**: See how your ideas connect
- **Zoom & Pan**: Navigate large knowledge graphs smoothly
- **Filter Options**: Focus on specific types of content

### 📁 Data Management
- **Markdown Import**: Import existing Markdown files
- **Bulk Export**: Export your content to Markdown format
- **Backup System**: Create complete backups of your data
- **Cross-platform**: Works on Windows, macOS, and Linux

## 🛠️ Installation

### Download Pre-built Binaries

Visit our [Releases page](https://github.com/minglog/minglog-desktop/releases) to download the latest version for your platform:

- **Windows**: `MingLog-Desktop-1.0.0-x64.msi` or `MingLog-Desktop-1.0.0-x64.exe`
- **macOS**: `MingLog-Desktop-1.0.0-x64.dmg` (Intel) or `MingLog-Desktop-1.0.0-aarch64.dmg` (Apple Silicon)
- **Linux**: `MingLog-Desktop-1.0.0-amd64.deb` or `MingLog-Desktop-1.0.0-x86_64.AppImage`

### System Requirements

- **Windows**: Windows 10 version 1903 or later
- **macOS**: macOS 10.15 (Catalina) or later
- **Linux**: Modern distribution with GTK 3.0+ and WebKit2GTK

## 🚀 Quick Start

1. **Launch MingLog**: Open the application after installation
2. **Create Your First Page**: Click "New Page" or press `Ctrl+N` (Windows/Linux) or `Cmd+N` (macOS)
3. **Start Writing**: Use the block-based editor to organize your thoughts
4. **Search Your Content**: Press `Ctrl+K` (Windows/Linux) or `Cmd+K` (macOS) to open search
5. **Explore Connections**: Visit the Graph view to see how your ideas connect

## 📖 User Guide

### Basic Operations

#### Creating Content
- **New Page**: `Ctrl/Cmd + N` or click the "+" button
- **New Block**: Press `Enter` at the end of a block
- **Indent Block**: Press `Tab` to create nested structure
- **Outdent Block**: Press `Shift + Tab` to reduce nesting

#### Navigation
- **Search**: `Ctrl/Cmd + K` to open global search
- **Quick Navigation**: Click on page references or use the sidebar
- **Graph View**: Explore your knowledge network visually
- **Back/Forward**: Use browser-style navigation

#### Organizing Content
- **Tags**: Add tags to categorize your content
- **References**: Link to other pages using `[[Page Name]]` syntax
- **Journal Mode**: Enable for date-based organization
- **Drag & Drop**: Reorder blocks by dragging

### Advanced Features

#### Search & Discovery
- Use the global search to find content across all pages
- Search results show context and highlight matching terms
- Navigate results with keyboard arrows and press Enter to open
- Filter by content type (pages vs blocks)

#### Graph Visualization
- View your knowledge as an interactive network
- Zoom and pan to explore large graphs
- Click nodes to navigate to pages
- Filter by tags or content types

#### File Operations
- Import Markdown files to quickly add existing content
- Export pages or entire knowledge base to Markdown
- Create backups to protect your data
- Restore from backups when needed

## 🔧 Configuration

### Settings
Access settings through the gear icon in the sidebar:

- **Theme**: Choose between light, dark, or auto themes
- **Editor**: Customize editor behavior and shortcuts
- **Search**: Configure search preferences and indexing
- **File Operations**: Set default import/export locations

### Keyboard Shortcuts

| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| New Page | `Ctrl + N` | `Cmd + N` |
| Search | `Ctrl + K` | `Cmd + K` |
| Save | `Ctrl + S` | `Cmd + S` |
| Settings | `Ctrl + ,` | `Cmd + ,` |
| Toggle Sidebar | `Ctrl + B` | `Cmd + B` |

## 🏗️ Development

This is a monorepo containing:

- `apps/tauri-desktop` - Main Tauri desktop application
- `packages/core` - Core data models and utilities
- `packages/ui` - Shared UI components
- `packages/editor` - Block-based editor
- `packages/search` - Search functionality
- `packages/graph` - Graph visualization

### Getting Started

1. Install dependencies:
```bash
pnpm install
```

2. Start development server:
```bash
cd apps/tauri-desktop
npm run tauri:dev
```

### Building

```bash
cd apps/tauri-desktop
npm run tauri:build
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:

- Setting up the development environment
- Code style and conventions
- Submitting pull requests
- Reporting issues

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [User Guide](docs/user-guide.md)
- **Issues**: [GitHub Issues](https://github.com/minglog/minglog-desktop/issues)
- **Discussions**: [GitHub Discussions](https://github.com/minglog/minglog-desktop/discussions)
- **Email**: support@minglog.app

## 🙏 Acknowledgments

Built with amazing open-source technologies:

- [Tauri](https://tauri.app/) - Secure, fast, and lightweight desktop applications
- [React](https://reactjs.org/) - User interface library
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Rust](https://www.rust-lang.org/) - Systems programming language
- [SQLite](https://www.sqlite.org/) - Embedded database
- [D3.js](https://d3js.org/) - Data visualization

---

<div align="center">
  Made with ❤️ by the MingLog Team
</div>

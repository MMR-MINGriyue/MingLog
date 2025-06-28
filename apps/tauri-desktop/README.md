# 🦀 MingLog Tauri Desktop Application

A modern, lightweight desktop application for knowledge management built with Tauri, Rust, and React.

## ✨ Features

- **🚀 High Performance**: Rust backend for native performance
- **🎨 Modern UI**: React frontend with Tailwind CSS
- **📱 Cross-Platform**: Windows, macOS, and Linux support
- **🔒 Secure**: Tauri's security model with minimal attack surface
- **📦 Lightweight**: Smaller bundle size compared to Electron
- **⚡ Fast Startup**: Quick application launch and response

## 🏗️ Architecture

```
apps/tauri-desktop/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── pages/             # Application pages
│   ├── styles/            # CSS styles
│   └── main.tsx           # Entry point
├── src-tauri/             # Rust backend
│   ├── src/
│   │   ├── commands.rs    # Tauri commands
│   │   ├── database.rs    # Database operations
│   │   ├── file_system.rs # File system utilities
│   │   └── main.rs        # Main application
│   ├── icons/             # Application icons
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
└── package.json           # Node.js dependencies
```

## 🚀 Quick Start

### Prerequisites

1. **Rust** (1.70+)
2. **Node.js** (18+)
3. **pnpm** package manager
4. **System dependencies**:
   - **Windows**: Visual Studio Build Tools, WebView2
   - **macOS**: Xcode Command Line Tools
   - **Linux**: Development libraries (see Tauri docs)

### Environment Setup

```bash
# 1. Verify environment
powershell -ExecutionPolicy Bypass -File scripts/verify-tauri-env.ps1

# 2. Install Rust (if needed)
powershell -ExecutionPolicy Bypass -File scripts/install-rust-simple.ps1

# 3. Install dependencies
cd apps/tauri-desktop
pnpm install

# 4. Install Tauri CLI
cargo install tauri-cli
```

### Development

```bash
# Start development server
pnpm tauri:dev

# Or run separately
pnpm dev          # Frontend dev server
cargo tauri dev   # Tauri development mode
```

### Building

```bash
# Quick build
pnpm tauri:build

# Advanced build with scripts
powershell -ExecutionPolicy Bypass -File scripts/build-tauri.ps1

# Clean build
powershell -ExecutionPolicy Bypass -File scripts/build-tauri.ps1 -Clean

# Debug build
powershell -ExecutionPolicy Bypass -File scripts/build-tauri.ps1 -Debug
```

## 📦 Available Scripts

### Development Scripts

- `pnpm dev` - Start Vite development server
- `pnpm build` - Build frontend for production
- `pnpm tauri:dev` - Start Tauri development mode
- `pnpm tauri:build` - Build Tauri application

### PowerShell Scripts

- `scripts/verify-tauri-env.ps1` - Verify development environment
- `scripts/install-rust-simple.ps1` - Install Rust toolchain
- `scripts/generate-icons.ps1` - Generate application icons
- `scripts/test-tauri.ps1` - Test Tauri application
- `scripts/build-tauri.ps1` - Build Tauri application
- `scripts/release-tauri.ps1` - Prepare release

## 🔧 Configuration

### Tauri Configuration

Edit `src-tauri/tauri.conf.json` to configure:

- Application metadata
- Window properties
- Security permissions
- Bundle settings
- Platform-specific options

### Frontend Configuration

- `vite.config.ts` - Vite build configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration

## 🎯 Core Features

### Frontend (React)

- **HomePage**: Dashboard with page listing and search
- **EditorPage**: Rich text editor for creating/editing pages
- **GraphPage**: Knowledge graph visualization (planned)
- **SettingsPage**: Application settings and preferences

### Backend (Rust)

- **Database**: SQLite integration for data persistence
- **File System**: Secure file operations
- **Search**: Full-text search capabilities
- **System Integration**: Window management, platform APIs

## 🔌 API Commands

The application exposes these Tauri commands:

### Database Operations
- `init_database` - Initialize SQLite database
- `create_page` - Create new page
- `get_all_pages` - Get all pages
- `get_page_by_id` - Get specific page
- `update_page` - Update existing page
- `delete_page` - Delete page
- `search_pages` - Search pages by content

### File System
- `read_file_content` - Read file content
- `write_file_content` - Write file content
- `list_directory` - List directory contents
- `create_directory` - Create directory
- `delete_file` - Delete file
- `copy_file` - Copy file

### System
- `get_platform_info` - Get platform information
- `get_app_version` - Get application version
- `open_external_url` - Open URL in browser
- `minimize_window` - Minimize window
- `maximize_window` - Maximize window
- `close_window` - Close window

## 🚀 Deployment

### Building for Distribution

```bash
# Build for all platforms
powershell -ExecutionPolicy Bypass -File scripts/build-tauri.ps1

# Build for specific platform
powershell -ExecutionPolicy Bypass -File scripts/build-tauri.ps1 -Target "x86_64-pc-windows-msvc"
```

### Release Process

```bash
# Prepare release (dry run)
powershell -ExecutionPolicy Bypass -File scripts/release-tauri.ps1 -Version "1.0.0" -DryRun

# Create release
powershell -ExecutionPolicy Bypass -File scripts/release-tauri.ps1 -Version "1.0.0"
```

### Distribution Formats

- **Windows**: `.msi` installer, `.exe` portable
- **macOS**: `.dmg` disk image, `.app` bundle
- **Linux**: `.deb` package, `.rpm` package, `.AppImage`

## 🔒 Security

Tauri provides several security features:

- **Minimal API Surface**: Only enabled APIs are available
- **Content Security Policy**: Prevents XSS attacks
- **Secure Defaults**: Restrictive permissions by default
- **Code Signing**: Support for application signing

## 🧪 Testing

```bash
# Run frontend tests
pnpm test

# Run Rust tests
cd src-tauri
cargo test

# Integration tests
pnpm test:e2e
```

## 📚 Documentation

- [Tauri Documentation](https://tauri.app/)
- [Rust Documentation](https://doc.rust-lang.org/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the AGPL-3.0 License.

## 🆘 Troubleshooting

### Common Issues

1. **Rust not found**: Run `scripts/install-rust-simple.ps1`
2. **Build fails**: Check `scripts/verify-tauri-env.ps1`
3. **Icons missing**: Run `scripts/generate-icons.ps1`
4. **Dependencies error**: Run `pnpm install`

### Getting Help

- Check the [Tauri documentation](https://tauri.app/)
- Search [GitHub issues](https://github.com/MMR-MINGriyue/MingLog/issues)
- Create a new issue with detailed information

---

**Built with ❤️ using Tauri, Rust, and React**

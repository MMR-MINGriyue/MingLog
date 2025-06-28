# MingLog Desktop

🚀 **Modern Knowledge Management Desktop Application**

Built with Tauri, React, and TypeScript for a fast, secure, and native desktop experience.

## ✨ Features

- 📝 **Rich Text Editor** - Powerful editor with markdown support and syntax highlighting
- 🔍 **Full-Text Search** - Lightning-fast search across all your notes and content
- 🕸️ **Knowledge Graph** - Visualize connections and relationships between your ideas
- 🏷️ **Smart Tagging** - Organize and categorize your notes with flexible tagging
- 💾 **Local Storage** - All data stays on your device with SQLite database
- 🎨 **Modern UI** - Clean, responsive interface built with Tailwind CSS
- ⚡ **High Performance** - Native performance thanks to Rust and Tauri
- 🔒 **Privacy First** - No cloud dependencies, your data stays private
- 🌙 **Dark Mode** - Beautiful dark and light themes
- 📱 **Cross-Platform** - Works on Windows, macOS, and Linux

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Rust** latest stable ([Install](https://rustup.rs/))
- **System Dependencies** for Tauri:
  - **Windows**: Microsoft C++ Build Tools
  - **macOS**: Xcode Command Line Tools
  - **Linux**: `webkit2gtk-4.0-dev`, `build-essential`, `curl`, `wget`, `libssl-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/MMR-MINGriyue/MingLog.git
cd MingLog/apps/tauri-desktop

# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Build for production
npm run build
```

### 🛠️ Development Commands

```bash
# Development with hot reload
npm run dev                 # Start Tauri dev server
npm run vite:dev           # Start only Vite dev server

# Building
npm run build              # Build frontend and Tauri app
npm run vite:build         # Build only frontend

# Testing
npm run test               # Run tests
npm run test:run           # Run tests once
npm run test:coverage      # Run tests with coverage

# Code Quality
npm run lint               # Lint code
npm run lint:fix           # Fix linting issues
npm run format             # Format code with Prettier
npm run type-check         # TypeScript type checking

# Cleanup
npm run clean              # Clean build artifacts
npm run clean:deps         # Clean dependencies and build artifacts
```

### 🏗️ Build Commands

```bash
# Development build
npm run tauri dev

# Production build (creates installer)
npm run tauri build

# Build for specific platform
npm run tauri build -- --target x86_64-pc-windows-msvc    # Windows
npm run tauri build -- --target x86_64-apple-darwin       # macOS Intel
npm run tauri build -- --target aarch64-apple-darwin      # macOS Apple Silicon
npm run tauri build -- --target x86_64-unknown-linux-gnu  # Linux
```

## 🏛️ Architecture

### Technology Stack

- **Frontend Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS + PostCSS
- **Build Tool**: Vite 5
- **Desktop Framework**: Tauri 1.6
- **Backend Language**: Rust
- **Database**: SQLite (via Tauri)
- **Icons**: Lucide React
- **Routing**: React Router DOM

### Project Structure

```
apps/tauri-desktop/
├── src/                    # React frontend source
│   ├── components/         # Reusable UI components
│   │   ├── Layout.tsx      # Main app layout
│   │   ├── LoadingScreen.tsx
│   │   └── ErrorBoundary.tsx
│   ├── pages/              # Page components
│   │   ├── HomePage.tsx    # Dashboard/home page
│   │   ├── EditorPage.tsx  # Note editor
│   │   ├── GraphPage.tsx   # Knowledge graph
│   │   ├── SearchPage.tsx  # Search interface
│   │   └── SettingsPage.tsx
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript definitions
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # React entry point
│   └── index.css           # Global styles
├── src-tauri/              # Rust backend source
│   ├── src/                # Rust source code
│   │   ├── main.rs         # Main Rust entry point
│   │   ├── commands.rs     # Tauri commands
│   │   └── database.rs     # Database operations
│   ├── icons/              # App icons (various sizes)
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
├── dist/                   # Built frontend assets
├── package.json            # Node.js dependencies & scripts
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── README.md               # This file
```

## 🔧 Configuration

### Tauri Configuration

The main Tauri configuration is in `src-tauri/tauri.conf.json`:

- **App metadata** (name, version, description)
- **Window settings** (size, resizable, decorations)
- **Security settings** (CSP, allowlist)
- **Build settings** (bundle identifier, icons)
- **Platform-specific settings**

### Development vs Production

- **Development**: Hot reload, debug mode, dev tools enabled
- **Production**: Optimized build, minified assets, no dev tools

## 📦 Building & Distribution

### Local Build

```bash
# Build for current platform
npm run build

# Output locations:
# - Windows: src-tauri/target/release/bundle/msi/
# - macOS: src-tauri/target/release/bundle/macos/
# - Linux: src-tauri/target/release/bundle/deb/ or /appimage/
```

### GitHub Actions (Automated)

The project includes GitHub Actions workflows for automated building:

- **Manual Build**: Trigger builds for specific platforms
- **Release Build**: Automatic builds on version tags
- **Cross-Platform**: Builds for Windows, macOS, and Linux simultaneously

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (development)
npm run test:watch
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.

## 🆘 Support

- **Documentation**: [GitHub Wiki](https://github.com/MMR-MINGriyue/MingLog/wiki)
- **Issues**: [GitHub Issues](https://github.com/MMR-MINGriyue/MingLog/issues)
- **Discussions**: [GitHub Discussions](https://github.com/MMR-MINGriyue/MingLog/discussions)

## 🙏 Acknowledgments

- **Tauri Team** - For the amazing desktop app framework
- **React Team** - For the powerful UI library
- **Rust Community** - For the fast and safe systems language
- **Open Source Community** - For all the amazing tools and libraries

---

**Made with ❤️ by the MingLog Team**

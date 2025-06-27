# Changelog

All notable changes to MingLog will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2025-06-27

### Added

#### 🎨 Mubu-style Editor
- Added `MubuStyleEditor` component with Mubu-like editing experience
- Added `MubuStyleBlockTree` component with hierarchical structure display
- Improved visual design with connection lines, indentation, and hover effects
- Complete keyboard shortcut support

#### 🌐 Complete Chinese Localization
- Complete Chinese interface text (zh-CN)
- Support for dynamic Chinese-English switching
- Localized date and time formats
- File size and number formatting
- Language selector component

#### 📊 Enhanced Data Management
- Added GraphSelector component
- Added CreateGraphModal component
- Added PageManager component
- Added DataManager component
- Resolved graph selection issues with clear graph switching interface

#### 🔗 Knowledge Graph Visualization
- Added GraphVisualization component
- Added GraphSettings panel
- Added GraphPage component
- Support for page graphs, block graphs, and mixed graph display
- Implemented force-directed layout algorithm

### Changed

#### 📱 User Interface Optimization
- More intuitive block operation interface
- Improved hover effects and focus states
- Optimized keyboard shortcut support
- Better visual feedback
- Responsive design and dark theme support

#### 🎯 Visualization Features
- Interactive graph display with zoom and pan support
- Node type differentiation (pages, blocks, tags)
- Link type differentiation (reference, parent, tag)
- Configurable node size and link distance
- Show/hide orphan nodes option

### Fixed
- Fixed graph selection related UI issues
- Improved build process stability
- Optimized performance and memory usage
- Fixed various minor UI issues

## [0.1.0-beta.1] - 2025-06-26

### Added
- Initial beta release of MingLog desktop application
- Core knowledge management features
- Block-based editor with outline functionality
- Page management system
- Search functionality
- Graph visualization (coming soon)
- Multi-platform desktop support:
  - Windows (x64, ia32)
  - macOS (x64, arm64)
  - Linux (x64)

### Features
- **Editor**: Rich text editing with block-based structure
- **Pages**: Create, edit, and organize pages
- **Search**: Full-text search across all content
- **Export/Import**: JSON-based data exchange
- **Themes**: Light and dark mode support
- **Shortcuts**: Comprehensive keyboard shortcuts

### Technical
- Built with Electron, React, and TypeScript
- SQLite database for local storage
- RESTful API architecture
- Responsive design for all screen sizes

### Known Issues
- Graph visualization not yet implemented
- Some advanced formatting options pending
- Performance optimization ongoing

---

## Release Notes Template

### [Version] - YYYY-MM-DD

#### 🚀 New Features
- Feature description

#### 🔧 Improvements
- Improvement description

#### 🐛 Bug Fixes
- Bug fix description

#### 🔒 Security
- Security update description

#### 📚 Documentation
- Documentation update description

#### 🏗️ Technical Changes
- Technical change description

#### ⚠️ Breaking Changes
- Breaking change description

#### 📦 Dependencies
- Dependency update description

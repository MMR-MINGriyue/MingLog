# MingLog Desktop User Guide

Welcome to MingLog Desktop! This comprehensive guide will help you get the most out of your knowledge management experience.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Basic Concepts](#basic-concepts)
3. [Creating and Organizing Content](#creating-and-organizing-content)
4. [Search and Discovery](#search-and-discovery)
5. [Graph Visualization](#graph-visualization)
6. [File Operations](#file-operations)
7. [Customization and Settings](#customization-and-settings)
8. [Keyboard Shortcuts](#keyboard-shortcuts)
9. [Tips and Best Practices](#tips-and-best-practices)
10. [Troubleshooting](#troubleshooting)

## Getting Started

### First Launch

When you first open MingLog Desktop, you'll see:

1. **Welcome Screen**: A brief introduction to the application
2. **Empty Workspace**: Ready for you to create your first content
3. **Sidebar**: Navigation panel on the left
4. **Main Area**: Where your content will appear

### Creating Your First Page

1. Click the **"+ New Page"** button in the sidebar
2. Or use the keyboard shortcut: `Ctrl+N` (Windows/Linux) or `Cmd+N` (macOS)
3. Give your page a title
4. Start writing in the editor area

## Basic Concepts

### Pages
Pages are the top-level containers for your content. Think of them as documents or topics. Each page has:
- A unique name/title
- Optional tags for categorization
- A collection of blocks (content units)
- Creation and modification timestamps

### Blocks
Blocks are the building units of content within pages. They can contain:
- Text (paragraphs, headings, lists)
- Code snippets
- References to other pages
- Any structured content

### Tags
Tags help you categorize and find content. You can:
- Add multiple tags to any page
- Use tags to filter content
- Create tag hierarchies with nested tags

### References
References create connections between pages using the `[[Page Name]]` syntax. They enable:
- Quick navigation between related content
- Graph visualization of relationships
- Backlink tracking

## Creating and Organizing Content

### Working with Pages

#### Creating Pages
- **New Page**: `Ctrl/Cmd + N` or click "+" in sidebar
- **Duplicate Page**: Right-click a page and select "Duplicate"
- **Template Pages**: Create reusable page templates

#### Page Properties
- **Title**: The main identifier for your page
- **Tags**: Categorization labels (comma-separated)
- **Journal Mode**: Enable for date-based organization
- **Created/Modified**: Automatic timestamps

#### Organizing Pages
- Use the sidebar to browse all pages
- Sort by name, date, or tags
- Use folders (tags) to group related pages
- Pin important pages to the top

### Working with Blocks

#### Creating Blocks
- **New Block**: Press `Enter` at the end of any block
- **Split Block**: Place cursor mid-block and press `Enter`
- **Merge Blocks**: Delete at the beginning of a block

#### Block Types
- **Paragraph**: Regular text content
- **Heading**: Use `#`, `##`, `###` for different levels
- **List**: Use `-` or `*` for bullets, `1.` for numbers
- **Code**: Use ``` for code blocks
- **Quote**: Use `>` for blockquotes

#### Block Operations
- **Move Blocks**: Drag and drop to reorder
- **Indent/Outdent**: Use `Tab` and `Shift+Tab`
- **Delete Block**: `Ctrl/Cmd + Shift + K`
- **Duplicate Block**: `Ctrl/Cmd + D`

### Creating References

#### Page References
Use `[[Page Name]]` to create links to other pages:
- Type `[[` and start typing the page name
- Select from the autocomplete dropdown
- Press `Enter` to create the link

#### Block References
Reference specific blocks within pages:
- Use `[[Page Name#Block]]` syntax
- Hover over references to see previews
- Click to navigate directly to the referenced content

## Search and Discovery

### Global Search

#### Opening Search
- Press `Ctrl/Cmd + K` to open the search modal
- Or click the search icon in the toolbar

#### Search Features
- **Real-time Results**: See results as you type
- **Fuzzy Matching**: Find content even with typos
- **Context Preview**: See surrounding content
- **Highlighted Terms**: Search terms are highlighted in results

#### Search Navigation
- Use `↑` and `↓` arrow keys to navigate results
- Press `Enter` to open the selected result
- Press `Escape` to close search

#### Search Filters
- **Pages Only**: Filter to show only page results
- **Blocks Only**: Filter to show only block content
- **Tags**: Search within specific tags
- **Date Range**: Find content from specific time periods

### Advanced Search

#### Search Operators
- **Exact Phrase**: Use quotes `"exact phrase"`
- **Exclude Terms**: Use minus `-unwanted`
- **Tag Search**: Use `tag:tagname`
- **Date Search**: Use `created:2024` or `modified:today`

#### Search Tips
- Use specific keywords for better results
- Combine multiple search terms
- Use tags to narrow down results
- Search for partial words or phrases

## Graph Visualization

### Accessing the Graph
- Click the "Graph" tab in the main navigation
- Or use the keyboard shortcut `Ctrl/Cmd + G`

### Graph Features

#### Navigation
- **Zoom**: Use mouse wheel or pinch gestures
- **Pan**: Click and drag to move around
- **Center**: Double-click empty space to center view
- **Reset**: Use the reset button to return to default view

#### Node Interactions
- **Hover**: See page title and preview
- **Click**: Navigate to the page
- **Drag**: Move nodes to organize layout
- **Select**: Click to highlight connections

#### Graph Filters
- **Node Types**: Show/hide pages, blocks, or tags
- **Connection Types**: Filter by reference types
- **Tag Filter**: Show only nodes with specific tags
- **Date Filter**: Show content from specific time periods

### Graph Customization
- **Layout Algorithm**: Choose from different layout styles
- **Node Size**: Adjust based on content length or connections
- **Color Coding**: Color nodes by tags, types, or dates
- **Connection Strength**: Adjust link visibility based on relationship strength

## File Operations

### Importing Content

#### Markdown Import
1. Go to Settings → File Operations
2. Click "Import Markdown Files"
3. Select one or more `.md` files
4. Choose import options:
   - Preserve frontmatter as page properties
   - Convert headings to separate pages
   - Import images and attachments

#### Supported Formats
- **Markdown**: `.md`, `.markdown` files
- **Text Files**: `.txt` files (converted to markdown)
- **Obsidian**: Import Obsidian vaults with links preserved
- **Notion**: Import Notion exports (markdown format)

### Exporting Content

#### Single Page Export
1. Open the page you want to export
2. Use `Ctrl/Cmd + E` or go to File → Export Page
3. Choose format and location
4. Click "Export"

#### Bulk Export
1. Go to Settings → File Operations
2. Click "Export All Pages"
3. Select export format:
   - Individual markdown files
   - Single combined file
   - ZIP archive with assets
4. Choose destination folder

#### Export Formats
- **Markdown**: Standard `.md` format with frontmatter
- **HTML**: Web-ready format with styling
- **PDF**: Formatted document (requires additional setup)
- **JSON**: Raw data format for backup/migration

### Backup and Restore

#### Creating Backups
1. Go to Settings → File Operations
2. Click "Create Backup"
3. Choose backup location
4. Backup includes:
   - All pages and blocks
   - Tags and metadata
   - Settings and preferences
   - File attachments

#### Restoring from Backup
1. Go to Settings → File Operations
2. Click "Restore from Backup"
3. Select backup file
4. Choose restore options:
   - Replace all data
   - Merge with existing data
   - Import as new workspace

## Customization and Settings

### Accessing Settings
- Use `Ctrl/Cmd + ,` or click the gear icon in the sidebar

### Appearance Settings

#### Theme Options
- **Light Theme**: Clean, bright interface
- **Dark Theme**: Easy on the eyes for low-light environments
- **Auto Theme**: Follows system preference
- **Custom Themes**: Create your own color schemes

#### Font and Typography
- **Font Family**: Choose from system fonts or web fonts
- **Font Size**: Adjust for readability
- **Line Height**: Customize text spacing
- **Editor Width**: Set maximum content width

### Editor Settings

#### Behavior
- **Auto-save**: Automatically save changes
- **Spell Check**: Enable/disable spell checking
- **Word Wrap**: Control text wrapping
- **Tab Size**: Set indentation width

#### Shortcuts
- **Vim Mode**: Enable Vim-style editing
- **Emacs Mode**: Enable Emacs-style shortcuts
- **Custom Shortcuts**: Define your own key bindings

### Search Settings

#### Indexing
- **Auto-index**: Automatically index new content
- **Index Frequency**: How often to update search index
- **Include File Content**: Index imported file contents

#### Results
- **Max Results**: Limit number of search results
- **Preview Length**: Length of content previews
- **Highlight Style**: How to highlight search terms

## Keyboard Shortcuts

### Global Shortcuts

| Action | Windows/Linux | macOS | Description |
|--------|---------------|-------|-------------|
| New Page | `Ctrl + N` | `Cmd + N` | Create a new page |
| Search | `Ctrl + K` | `Cmd + K` | Open global search |
| Settings | `Ctrl + ,` | `Cmd + ,` | Open settings |
| Save | `Ctrl + S` | `Cmd + S` | Save current page |
| Toggle Sidebar | `Ctrl + B` | `Cmd + B` | Show/hide sidebar |

### Editor Shortcuts

| Action | Windows/Linux | macOS | Description |
|--------|---------------|-------|-------------|
| Bold | `Ctrl + B` | `Cmd + B` | Make text bold |
| Italic | `Ctrl + I` | `Cmd + I` | Make text italic |
| Code | `Ctrl + \`` | `Cmd + \`` | Format as code |
| Link | `Ctrl + L` | `Cmd + L` | Create a link |
| Heading | `Ctrl + H` | `Cmd + H` | Toggle heading |

### Navigation Shortcuts

| Action | Windows/Linux | macOS | Description |
|--------|---------------|-------|-------------|
| Back | `Alt + ←` | `Cmd + ←` | Go back in history |
| Forward | `Alt + →` | `Cmd + →` | Go forward in history |
| Graph View | `Ctrl + G` | `Cmd + G` | Open graph visualization |
| Quick Switch | `Ctrl + P` | `Cmd + P` | Quick page switcher |

## Tips and Best Practices

### Content Organization

#### Naming Conventions
- Use descriptive, searchable page names
- Include keywords in titles
- Use consistent naming patterns
- Avoid special characters in names

#### Tagging Strategy
- Create a consistent tag hierarchy
- Use broad categories and specific subtags
- Don't over-tag; focus on meaningful categories
- Review and clean up tags regularly

#### Reference Best Practices
- Link related concepts liberally
- Use descriptive link text
- Create hub pages for major topics
- Build connection networks gradually

### Workflow Optimization

#### Daily Workflow
1. Start with a daily note or journal page
2. Use search to find related existing content
3. Create new pages for new concepts
4. Link new content to existing knowledge
5. Review and organize weekly

#### Content Creation
- Write first, organize later
- Use templates for recurring content types
- Break large topics into smaller pages
- Create index pages for complex subjects

#### Maintenance
- Regular backup creation
- Periodic tag cleanup
- Link validation and updates
- Archive or delete outdated content

## Troubleshooting

### Common Issues

#### Performance Issues
- **Slow Search**: Rebuild search index in settings
- **Slow Graph**: Reduce visible nodes or use filters
- **Memory Usage**: Close unused pages, restart application
- **Startup Time**: Check for large databases, consider archiving

#### Data Issues
- **Missing Content**: Check backup files, restore if needed
- **Broken Links**: Use link checker in settings
- **Sync Issues**: Ensure proper file permissions
- **Corrupted Data**: Restore from recent backup

#### Interface Issues
- **Display Problems**: Try different themes or reset settings
- **Keyboard Shortcuts**: Check for conflicts with system shortcuts
- **Font Issues**: Update system fonts or change font settings
- **Window Problems**: Reset window position in settings

### Getting Help

#### Self-Help Resources
- Check this user guide for detailed instructions
- Search the FAQ section for common questions
- Review keyboard shortcuts reference
- Check system requirements and compatibility

#### Community Support
- Visit GitHub Discussions for community help
- Search existing issues for similar problems
- Join the community forum for tips and tricks
- Follow the project blog for updates and tutorials

#### Reporting Issues
1. Check if the issue is already reported
2. Gather system information and error messages
3. Create a minimal reproduction case
4. Submit detailed bug report with steps to reproduce
5. Include screenshots or screen recordings if helpful

---

This user guide covers the essential features and workflows of MingLog Desktop. For the most up-to-date information, please check the official documentation and community resources.

# Contributing to MingLog Desktop

Thank you for your interest in contributing to MingLog Desktop! This guide will help you get started with development and understand our contribution process.

## Table of Contents

1. [Development Setup](#development-setup)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Code Style and Standards](#code-style-and-standards)
5. [Testing](#testing)
6. [Submitting Changes](#submitting-changes)
7. [Issue Reporting](#issue-reporting)
8. [Community Guidelines](#community-guidelines)

## Development Setup

### Prerequisites

- **Node.js**: Version 18.0 or higher
- **pnpm**: Version 8.0 or higher (recommended package manager)
- **Rust**: Latest stable version (for Tauri backend)
- **Git**: For version control

### Installation

1. **Clone the repository**:
```bash
git clone https://github.com/minglog/minglog-desktop.git
cd minglog-desktop
```

2. **Install dependencies**:
```bash
pnpm install
```

3. **Install Rust dependencies**:
```bash
cd apps/tauri-desktop/src-tauri
cargo build
cd ../../..
```

4. **Start development server**:
```bash
cd apps/tauri-desktop
npm run tauri:dev
```

### Development Environment

#### Recommended Tools
- **VS Code**: With Rust, TypeScript, and Tauri extensions
- **Rust Analyzer**: For Rust development
- **Prettier**: For code formatting
- **ESLint**: For JavaScript/TypeScript linting

#### VS Code Extensions
```json
{
  "recommendations": [
    "rust-lang.rust-analyzer",
    "tauri-apps.tauri-vscode",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint"
  ]
}
```

## Project Structure

```
minglog-desktop/
├── apps/
│   └── tauri-desktop/          # Main Tauri application
│       ├── src/                # React frontend source
│       ├── src-tauri/          # Rust backend source
│       ├── public/             # Static assets
│       └── dist/               # Built frontend (generated)
├── packages/
│   ├── core/                   # Core data models and utilities
│   ├── ui/                     # Shared UI components
│   ├── editor/                 # Block-based editor
│   ├── search/                 # Search functionality
│   └── graph/                  # Graph visualization
├── docs/                       # Documentation
├── scripts/                    # Build and utility scripts
└── tests/                      # Integration tests
```

### Key Directories

#### Frontend (`apps/tauri-desktop/src/`)
- `components/`: React components
- `pages/`: Page-level components
- `utils/`: Utility functions and helpers
- `styles/`: CSS and styling files
- `types/`: TypeScript type definitions

#### Backend (`apps/tauri-desktop/src-tauri/src/`)
- `commands.rs`: Tauri command handlers
- `database.rs`: Database operations
- `models.rs`: Data models and structures
- `error.rs`: Error handling
- `state.rs`: Application state management

#### Packages (`packages/`)
- Each package is a self-contained module
- Shared between different applications
- Follow consistent structure and API patterns

## Development Workflow

### Branch Strategy

We use a simplified Git flow:

- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/***: Feature development branches
- **bugfix/***: Bug fix branches
- **hotfix/***: Critical fixes for production

### Feature Development

1. **Create a feature branch**:
```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

2. **Make your changes**:
- Write code following our style guidelines
- Add tests for new functionality
- Update documentation as needed

3. **Test your changes**:
```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e

# Build and test the application
npm run build
npm run tauri:build
```

4. **Commit your changes**:
```bash
git add .
git commit -m "feat: add new feature description"
```

5. **Push and create PR**:
```bash
git push origin feature/your-feature-name
```

### Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

#### Examples
```
feat(search): add fuzzy search functionality
fix(editor): resolve block deletion issue
docs(api): update command documentation
test(graph): add unit tests for node rendering
```

## Code Style and Standards

### TypeScript/JavaScript

#### Style Guidelines
- Use TypeScript for all new code
- Follow Prettier configuration for formatting
- Use ESLint rules for code quality
- Prefer functional components and hooks
- Use meaningful variable and function names

#### Code Examples
```typescript
// Good
interface SearchResult {
  id: string
  title: string
  content: string
  score: number
}

const SearchComponent: React.FC<SearchProps> = ({ onResultSelect }) => {
  const [results, setResults] = useState<SearchResult[]>([])
  
  const handleSearch = useCallback(async (query: string) => {
    const searchResults = await searchBlocks({ query })
    setResults(searchResults.results)
  }, [])

  return (
    <div className="search-container">
      {/* Component JSX */}
    </div>
  )
}
```

#### File Organization
- One component per file
- Use index files for clean imports
- Group related utilities together
- Separate types into dedicated files when complex

### Rust

#### Style Guidelines
- Follow standard Rust formatting (rustfmt)
- Use Clippy for linting
- Write comprehensive error handling
- Document public APIs with doc comments
- Use meaningful type and variable names

#### Code Examples
```rust
// Good
#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePageRequest {
    pub name: String,
    pub title: Option<String>,
    pub graph_id: String,
    pub is_journal: bool,
    pub tags: Option<Vec<String>>,
}

#[tauri::command]
pub async fn create_page(
    request: CreatePageRequest,
    state: State<'_, AppState>,
) -> Result<Page> {
    let db = state.db.lock().await;
    
    let page = db.create_page(request).await
        .map_err(|e| AppError::Database(e.to_string()))?;
    
    Ok(page)
}
```

#### Error Handling
- Use custom error types
- Provide meaningful error messages
- Handle all error cases explicitly
- Log errors appropriately

### CSS/Styling

#### Guidelines
- Use Tailwind CSS for styling
- Create reusable component classes
- Follow mobile-first responsive design
- Use CSS custom properties for theming
- Maintain consistent spacing and typography

#### Examples
```css
/* Good */
.search-result {
  @apply p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer;
  @apply dark:border-gray-700 dark:hover:bg-gray-800;
}

.search-result--selected {
  @apply bg-blue-50 border-blue-200;
  @apply dark:bg-blue-900/20 dark:border-blue-700;
}
```

## Testing

### Testing Strategy

We maintain comprehensive test coverage across multiple levels:

#### Unit Tests
- Test individual functions and components
- Mock external dependencies
- Focus on business logic and edge cases
- Target 80%+ code coverage

#### Integration Tests
- Test component interactions
- Test API endpoints with real database
- Verify data flow between layers
- Test error handling scenarios

#### End-to-End Tests
- Test complete user workflows
- Verify UI interactions and navigation
- Test cross-platform compatibility
- Validate performance requirements

### Running Tests

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage

# Rust tests
cd apps/tauri-desktop/src-tauri
cargo test
```

### Writing Tests

#### Frontend Tests
```typescript
// Component test example
import { render, screen, fireEvent } from '@testing-library/react'
import { SearchComponent } from '../SearchComponent'

describe('SearchComponent', () => {
  it('should display search results', async () => {
    const mockResults = [
      { id: '1', title: 'Test Page', content: 'Test content', score: 0.9 }
    ]
    
    render(<SearchComponent results={mockResults} />)
    
    expect(screen.getByText('Test Page')).toBeInTheDocument()
  })
})
```

#### Backend Tests
```rust
// Rust test example
#[tokio::test]
async fn test_create_page() {
    let db = create_test_database().await.unwrap();
    
    let request = CreatePageRequest {
        name: "Test Page".to_string(),
        title: Some("Test Title".to_string()),
        graph_id: "default".to_string(),
        is_journal: false,
        tags: None,
    };
    
    let page = db.create_page(request).await.unwrap();
    assert_eq!(page.name, "Test Page");
}
```

## Submitting Changes

### Pull Request Process

1. **Ensure your branch is up to date**:
```bash
git checkout develop
git pull origin develop
git checkout your-feature-branch
git rebase develop
```

2. **Run the full test suite**:
```bash
npm run test:all
npm run build
```

3. **Create a pull request**:
- Use a descriptive title
- Fill out the PR template completely
- Link related issues
- Add screenshots for UI changes
- Request appropriate reviewers

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Screenshots
(If applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

### Review Process

1. **Automated Checks**: CI/CD pipeline runs tests and builds
2. **Code Review**: Team members review code quality and design
3. **Testing**: QA testing for significant changes
4. **Approval**: At least one maintainer approval required
5. **Merge**: Squash and merge to develop branch

## Issue Reporting

### Bug Reports

Use the bug report template and include:

- **Environment**: OS, version, browser (if applicable)
- **Steps to Reproduce**: Clear, numbered steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Screenshots**: Visual evidence if applicable
- **Logs**: Error messages or console output

### Feature Requests

Use the feature request template and include:

- **Problem Statement**: What problem does this solve?
- **Proposed Solution**: How should it work?
- **Alternatives**: Other solutions considered
- **Use Cases**: Who would benefit and how?
- **Implementation Notes**: Technical considerations

### Security Issues

For security vulnerabilities:
- **Do not** create public issues
- Email security@minglog.app directly
- Include detailed reproduction steps
- Allow time for investigation and patching

## Community Guidelines

### Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please:

- Be respectful and constructive in all interactions
- Welcome newcomers and help them get started
- Focus on what's best for the community
- Show empathy towards other community members

### Communication

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and community chat
- **Discord**: Real-time development discussion
- **Email**: security@minglog.app for security issues

### Recognition

We value all contributions and recognize contributors through:

- Contributor list in README
- Release notes acknowledgments
- Community highlights
- Maintainer nominations for significant contributors

## Getting Help

### Development Questions
- Check existing documentation first
- Search GitHub issues and discussions
- Ask in Discord #development channel
- Create a discussion for complex questions

### Mentorship
- New contributors welcome!
- Maintainers available for guidance
- Good first issues labeled for beginners
- Pair programming sessions available

---

Thank you for contributing to MingLog Desktop! Your efforts help make knowledge management better for everyone.

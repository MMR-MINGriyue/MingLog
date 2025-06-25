# Development Guide

This guide will help you set up the development environment for MingLog.

## Prerequisites

- Node.js 18+ 
- pnpm 8+
- Git

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd minglog
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development server**
   ```bash
   pnpm dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## Project Structure

```
minglog/
├── apps/
│   ├── desktop/          # Tauri desktop app (coming soon)
│   └── web/              # Web application
├── packages/
│   ├── core/             # Core business logic
│   ├── editor/           # Block editor components
│   ├── graph/            # Graph visualization (coming soon)
│   ├── search/           # Search engine (coming soon)
│   ├── sync/             # Synchronization service (coming soon)
│   ├── plugins/          # Plugin system (coming soon)
│   ├── ui/               # Shared UI components
│   └── database/         # Database schemas and migrations
└── tools/                # Build and development tools
```

## Available Scripts

### Root Level
- `pnpm dev` - Start all development servers
- `pnpm build` - Build all packages and apps
- `pnpm test` - Run all tests
- `pnpm lint` - Lint all packages
- `pnpm clean` - Clean all build artifacts

### Package Level
- `pnpm --filter <package> dev` - Start development for specific package
- `pnpm --filter <package> build` - Build specific package
- `pnpm --filter <package> test` - Test specific package

### Examples
```bash
# Start web app only
pnpm web:dev

# Build core package
pnpm --filter @logseq/core build

# Test UI components
pnpm --filter @logseq/ui test
```

## Development Workflow

1. **Make changes** to any package
2. **Hot reload** will automatically update the web app
3. **Run tests** to ensure everything works
4. **Commit changes** with conventional commit messages

## Database Development

The project uses Prisma with SQLite for local development.

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Open Prisma Studio
pnpm db:studio
```

## Testing

We use Vitest for unit tests and Playwright for E2E tests.

```bash
# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Run tests in watch mode
pnpm --filter web test --watch
```

## Code Style

- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Conventional Commits** for commit messages

## Architecture Decisions

### Why Monorepo?
- **Code sharing** between packages
- **Consistent tooling** across all packages
- **Atomic changes** across multiple packages
- **Better dependency management**

### Why TypeScript?
- **Type safety** reduces runtime errors
- **Better IDE support** with autocomplete
- **Easier refactoring** with confidence
- **Self-documenting code**

### Why Zustand?
- **Lightweight** state management
- **No boilerplate** compared to Redux
- **TypeScript friendly**
- **Easy to test**

### Why TipTap?
- **Extensible** editor framework
- **React integration**
- **Rich ecosystem** of extensions
- **Customizable** for our block-based needs

## Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Add** tests for new functionality
5. **Ensure** all tests pass
6. **Submit** a pull request

## Troubleshooting

### Common Issues

**Build fails with module resolution errors**
```bash
# Clean and reinstall
pnpm clean
rm -rf node_modules
pnpm install
```

**TypeScript errors in packages**
```bash
# Rebuild all packages
pnpm build
```

**Database connection issues**
```bash
# Reset database
pnpm db:reset
```

### Getting Help

- Check the [GitHub Issues](https://github.com/logseq/logseq-next/issues)
- Join our [Discord](https://discord.gg/logseq)
- Read the [Documentation](./README.md)

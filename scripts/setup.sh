#!/bin/bash

echo "🚀 Setting up MingLog development environment..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install pnpm first:"
    echo "npm install -g pnpm"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Generate Prisma client
echo "🗄️ Setting up database..."
pnpm db:generate

# Build packages
echo "🔨 Building packages..."
pnpm build

echo "✅ Setup complete!"
echo ""
echo "🎉 You can now start development with:"
echo "   pnpm dev"
echo ""
echo "📚 Or check out the documentation:"
echo "   cat docs/development.md"

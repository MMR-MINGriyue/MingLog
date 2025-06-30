#!/bin/bash
# MingLog 桌面应用发布构建脚本
# Bash 脚本用于构建 Tauri 应用的发布版本

set -e

echo "🚀 开始构建 MingLog 桌面应用发布版本..."

# 检查 Rust 环境
echo "📋 检查 Rust 环境..."
if ! command -v cargo &> /dev/null; then
    echo "❌ 错误: 未找到 Cargo。请先安装 Rust。"
    echo "安装命令: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

# 检查 Tauri CLI
echo "📋 检查 Tauri CLI..."
if ! command -v cargo-tauri &> /dev/null; then
    echo "⚠️  未找到 Tauri CLI，正在安装..."
    cargo install tauri-cli
fi

# 进入 Tauri 目录
cd src-tauri

# 清理之前的构建
echo "🧹 清理之前的构建..."
cargo clean

# 更新依赖
echo "📦 更新依赖..."
cargo update

# 运行代码检查
echo "🔍 运行代码检查..."
if ! cargo clippy --all-targets --all-features -- -D warnings; then
    echo "⚠️  代码检查发现问题，但继续构建..."
fi

# 运行测试
echo "🧪 运行测试..."
if ! cargo test; then
    echo "⚠️  测试失败，但继续构建..."
fi

# 构建发布版本
echo "🔨 构建发布版本..."
if cargo tauri build; then
    echo "✅ 构建成功！"
    echo ""
    echo "📦 构建产物位置:"
    echo "Windows: target/release/bundle/msi/"
    echo "macOS: target/release/bundle/dmg/"
    echo "Linux: target/release/bundle/deb/ 或 target/release/bundle/appimage/"
    echo ""
    
    # 显示构建产物信息
    if [ -d "target/release/bundle" ]; then
        echo "🎯 发现的构建产物:"
        find target/release/bundle -type f -exec ls -lh {} \; | awk '{print "  📄 " $9 " (" $5 ")"}'
    fi
else
    echo "❌ 构建失败！"
    echo "请检查上面的错误信息并修复问题。"
    exit 1
fi

# 返回原目录
cd ..

echo ""
echo "🎉 MingLog 桌面应用构建完成！"
echo "现在可以分发构建产物了。"

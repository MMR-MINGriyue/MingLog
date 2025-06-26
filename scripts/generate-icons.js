#!/usr/bin/env node

/**
 * 图标生成脚本
 * 将 SVG 图标转换为不同平台需要的格式
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 图标配置
const iconConfig = {
  // 源 SVG 文件
  source: path.join(__dirname, '../apps/desktop/assets/icon.svg'),
  
  // 输出目录
  outputDir: path.join(__dirname, '../apps/desktop/assets'),
  
  // 不同平台需要的尺寸
  sizes: {
    // Windows ICO 格式需要的尺寸
    ico: [16, 24, 32, 48, 64, 128, 256],
    
    // macOS ICNS 格式需要的尺寸
    icns: [16, 32, 64, 128, 256, 512, 1024],
    
    // Linux PNG 格式需要的尺寸
    png: [16, 24, 32, 48, 64, 128, 256, 512]
  }
};

/**
 * 生成简化的 PNG 图标
 * 由于没有外部依赖，我们创建一个简化版本
 */
function generateSimplifiedIcon() {
  console.log('🎨 生成简化图标...');
  
  // 创建一个简单的 PNG 图标内容（Base64 编码的 1x1 像素图片作为占位符）
  const simplePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  // 为了演示，我们创建一个更复杂的 SVG 图标
  const iconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- 背景圆形 -->
  <circle cx="128" cy="128" r="120" fill="url(#grad)"/>
  
  <!-- 中心 M 字母 -->
  <text x="128" y="160" text-anchor="middle" font-family="Arial, sans-serif" 
        font-size="120" font-weight="bold" fill="#ffffff">M</text>
  
  <!-- 装饰元素 -->
  <circle cx="128" cy="128" r="100" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.3"/>
  <circle cx="128" cy="128" r="80" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.2"/>
</svg>`;

  // 保存简化的 SVG 图标
  const simplifiedIconPath = path.join(iconConfig.outputDir, 'icon-simplified.svg');
  fs.writeFileSync(simplifiedIconPath, iconSvg);
  console.log(`✅ 简化图标已保存: ${simplifiedIconPath}`);
  
  return simplifiedIconPath;
}

/**
 * 创建 ICO 文件的占位符
 */
function createIcoPlaceholder() {
  console.log('🖼️ 创建 Windows ICO 占位符...');
  
  // 这是一个最小的有效 ICO 文件头
  const icoHeader = Buffer.from([
    0x00, 0x00, // Reserved
    0x01, 0x00, // Type (1 = ICO)
    0x01, 0x00, // Number of images
    // Image directory entry
    0x20, // Width (32px)
    0x20, // Height (32px)
    0x00, // Color count
    0x00, // Reserved
    0x01, 0x00, // Color planes
    0x20, 0x00, // Bits per pixel
    0x00, 0x00, 0x00, 0x00, // Image size (placeholder)
    0x16, 0x00, 0x00, 0x00  // Image offset
  ]);
  
  const icoPath = path.join(iconConfig.outputDir, 'icon.ico');
  fs.writeFileSync(icoPath, icoHeader);
  console.log(`✅ ICO 占位符已创建: ${icoPath}`);
}

/**
 * 创建 ICNS 文件的占位符
 */
function createIcnsPlaceholder() {
  console.log('🍎 创建 macOS ICNS 占位符...');
  
  // 这是一个最小的有效 ICNS 文件头
  const icnsHeader = Buffer.from([
    0x69, 0x63, 0x6e, 0x73, // 'icns' signature
    0x00, 0x00, 0x00, 0x08  // File size (8 bytes minimum)
  ]);
  
  const icnsPath = path.join(iconConfig.outputDir, 'icon.icns');
  fs.writeFileSync(icnsPath, icnsHeader);
  console.log(`✅ ICNS 占位符已创建: ${icnsPath}`);
}

/**
 * 创建 PNG 文件的占位符
 */
function createPngPlaceholder() {
  console.log('🐧 创建 Linux PNG 占位符...');
  
  // 创建一个简单的 32x32 PNG 图标
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk size
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x20, // Width: 32
    0x00, 0x00, 0x00, 0x20, // Height: 32
    0x08, 0x02, 0x00, 0x00, 0x00, // Bit depth, color type, etc.
    0x91, 0x5A, 0xFB, 0x51, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND chunk size
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  
  const pngPath = path.join(iconConfig.outputDir, 'icon.png');
  fs.writeFileSync(pngPath, pngData);
  console.log(`✅ PNG 占位符已创建: ${pngPath}`);
}

/**
 * 生成应用图标说明文档
 */
function generateIconDocumentation() {
  const docContent = `# MingLog 应用图标

## 图标设计理念

MingLog 的图标设计体现了知识管理和连接的核心概念：

### 🎨 设计元素
- **渐变背景**: 使用紫色到蓝色的渐变，象征智慧和创新
- **网络结构**: 中心节点连接多个子节点，代表知识的互联性
- **文档元素**: 包含文档图标，直观表达笔记和知识管理功能
- **字母 M**: 代表 MingLog 品牌标识

### 📐 技术规格
- **源格式**: SVG (矢量图形，可无损缩放)
- **主色调**: #667eea 到 #764ba2 渐变
- **辅助色**: 白色 (#ffffff) 用于图标元素
- **尺寸**: 512x512px 基础尺寸

### 🖼️ 平台适配
- **Windows**: icon.ico (多尺寸 ICO 格式)
- **macOS**: icon.icns (Apple 图标格式)
- **Linux**: icon.png (PNG 格式)

### 🔧 生成说明
当前使用占位符图标，建议使用专业工具生成最终图标：

1. **推荐工具**:
   - Adobe Illustrator (专业矢量编辑)
   - Figma (在线设计工具)
   - Inkscape (免费矢量编辑器)

2. **图标生成工具**:
   - electron-icon-builder
   - app-icon-generator
   - 在线图标生成器

3. **质量要求**:
   - 高分辨率源文件 (至少 1024x1024px)
   - 清晰的边缘和对比度
   - 在小尺寸下仍然清晰可辨

## 使用指南

### 开发环境
运行 \`npm run generate-icons\` 生成所有平台的图标文件。

### 生产环境
确保所有图标文件都已正确生成并包含在构建中。

---

*最后更新: ${new Date().toISOString().split('T')[0]}*
`;

  const docPath = path.join(iconConfig.outputDir, 'ICON_README.md');
  fs.writeFileSync(docPath, docContent);
  console.log(`📚 图标文档已生成: ${docPath}`);
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 开始生成 MingLog 应用图标...\n');
  
  // 确保输出目录存在
  if (!fs.existsSync(iconConfig.outputDir)) {
    fs.mkdirSync(iconConfig.outputDir, { recursive: true });
  }
  
  try {
    // 生成简化图标
    generateSimplifiedIcon();
    
    // 创建平台特定的图标占位符
    createIcoPlaceholder();
    createIcnsPlaceholder();
    createPngPlaceholder();
    
    // 生成文档
    generateIconDocumentation();
    
    console.log('\n✨ 图标生成完成！');
    console.log('\n📝 注意事项:');
    console.log('- 当前生成的是占位符图标');
    console.log('- 建议使用专业工具生成高质量图标');
    console.log('- 查看 ICON_README.md 了解详细说明');
    
  } catch (error) {
    console.error('❌ 图标生成失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  generateSimplifiedIcon,
  createIcoPlaceholder,
  createIcnsPlaceholder,
  createPngPlaceholder,
  generateIconDocumentation
};

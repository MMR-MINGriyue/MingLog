# MingLog 应用图标

## 🎨 设计理念

MingLog 的图标设计体现了知识管理和连接的核心概念：

### 设计元素
- **渐变背景**: 使用紫色到蓝色的渐变 (#667eea → #764ba2)，象征智慧和创新
- **字母 M**: 代表 MingLog 品牌标识，使用粗体白色字体
- **装饰圆环**: 同心圆设计，代表知识的层次和深度
- **装饰点**: 四个方向的点，象征知识的扩散和连接

### 📐 技术规格
- **源格式**: SVG (矢量图形，可无损缩放)
- **基础尺寸**: 256x256px
- **主色调**: #667eea 到 #764ba2 渐变
- **辅助色**: 白色 (#ffffff) 用于文字和装饰元素

## 🖼️ 文件说明

### 当前文件
- `icon.svg` - 完整版本的 SVG 图标
- `icon-simple.svg` - 简化版本的 SVG 图标
- `icon.png` - PNG 格式图标 (当前为 SVG 副本)

### 需要的文件
- `icon.ico` - Windows ICO 格式 (多尺寸)
- `icon.icns` - macOS ICNS 格式
- `icon.png` - 高质量 PNG 格式 (256x256px 或更大)

## 🔧 生成建议

### 推荐工具
1. **在线转换工具**:
   - [Convertio](https://convertio.co/svg-ico/)
   - [CloudConvert](https://cloudconvert.com/svg-to-ico)
   - [Online-Convert](https://www.online-convert.com/)

2. **桌面工具**:
   - Adobe Illustrator
   - Inkscape (免费)
   - GIMP (免费)

3. **命令行工具**:
   ```bash
   # 使用 ImageMagick
   magick icon.svg icon.png
   magick icon.svg icon.ico
   
   # 使用 Inkscape
   inkscape icon.svg --export-png=icon.png --export-width=256
   ```

### 生成步骤
1. 使用 `icon-simple.svg` 作为源文件
2. 导出为高分辨率 PNG (建议 512x512px 或 1024x1024px)
3. 使用工具生成 ICO 和 ICNS 格式
4. 替换当前的占位符文件

## 📱 平台要求

### Windows (.ico)
- 包含多个尺寸: 16x16, 24x24, 32x32, 48x48, 64x64, 128x128, 256x256
- 支持透明背景
- 文件大小建议 < 100KB

### macOS (.icns)
- 包含多个尺寸: 16x16, 32x32, 64x64, 128x128, 256x256, 512x512, 1024x1024
- 支持 Retina 显示屏
- 遵循 Apple 设计指南

### Linux (.png)
- 推荐尺寸: 256x256px 或 512x512px
- 支持透明背景
- PNG-24 格式

## 🎯 设计原则

### 可识别性
- 在小尺寸 (16x16px) 下仍然清晰可辨
- 与其他应用图标有明显区别
- 符合平台设计规范

### 一致性
- 在不同平台保持视觉一致性
- 与应用内 UI 设计风格匹配
- 体现品牌特色

### 专业性
- 高质量的视觉效果
- 适当的对比度和色彩
- 符合现代设计趋势

## 🚀 快速生成

如果需要快速生成图标，可以：

1. **使用在线工具**:
   - 上传 `icon-simple.svg`
   - 选择目标格式 (ICO/ICNS/PNG)
   - 下载并替换对应文件

2. **使用 Electron 工具**:
   ```bash
   npm install -g electron-icon-maker
   electron-icon-maker --input=icon-simple.svg --output=./
   ```

3. **手动创建**:
   - 在图像编辑软件中打开 SVG
   - 导出为所需格式和尺寸
   - 确保透明背景正确

---

*最后更新: 2025-06-26*
*状态: 需要生成最终图标文件*

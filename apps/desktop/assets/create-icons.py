#!/usr/bin/env python3
"""
简单的图标生成脚本
使用 Python PIL 库生成基础图标
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import os
    
    def create_icon(size=256):
        """创建一个简单的 MingLog 图标"""
        # 创建图像
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # 绘制渐变背景圆形
        center = size // 2
        radius = int(size * 0.45)
        
        # 绘制主圆形背景
        draw.ellipse([center-radius, center-radius, center+radius, center+radius], 
                    fill=(102, 126, 234, 255))  # #667eea
        
        # 绘制内圆
        inner_radius = int(radius * 0.8)
        draw.ellipse([center-inner_radius, center-inner_radius, center+inner_radius, center+inner_radius], 
                    outline=(255, 255, 255, 180), width=max(1, size//64))
        
        # 绘制字母 M
        try:
            # 尝试使用系统字体
            font_size = int(size * 0.4)
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            # 如果没有找到字体，使用默认字体
            font = ImageFont.load_default()
        
        # 绘制 M 字母
        text = "M"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        text_x = center - text_width // 2
        text_y = center - text_height // 2
        
        draw.text((text_x, text_y), text, fill=(255, 255, 255, 255), font=font)
        
        # 绘制装饰点
        dot_radius = max(2, size // 32)
        positions = [
            (center, center - radius + dot_radius * 2),  # 上
            (center + radius - dot_radius * 2, center),  # 右
            (center, center + radius - dot_radius * 2),  # 下
            (center - radius + dot_radius * 2, center),  # 左
        ]
        
        for x, y in positions:
            draw.ellipse([x-dot_radius, y-dot_radius, x+dot_radius, y+dot_radius], 
                        fill=(255, 255, 255, 200))
        
        return img
    
    def main():
        print("🎨 生成 MingLog 图标...")
        
        # 确保目录存在
        assets_dir = os.path.dirname(os.path.abspath(__file__))
        
        # 生成不同尺寸的 PNG 图标
        sizes = [16, 24, 32, 48, 64, 128, 256, 512]
        
        for size in sizes:
            img = create_icon(size)
            filename = f"icon-{size}.png"
            filepath = os.path.join(assets_dir, filename)
            img.save(filepath, "PNG")
            print(f"✅ 已生成: {filename}")
        
        # 生成主图标文件
        main_icon = create_icon(256)
        main_icon.save(os.path.join(assets_dir, "icon.png"), "PNG")
        print("✅ 已生成: icon.png")
        
        # 尝试生成 ICO 文件 (Windows)
        try:
            ico_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
            ico_images = []
            for size, _ in ico_sizes:
                ico_images.append(create_icon(size))
            
            ico_path = os.path.join(assets_dir, "icon.ico")
            ico_images[0].save(ico_path, format='ICO', sizes=ico_sizes)
            print("✅ 已生成: icon.ico")
        except Exception as e:
            print(f"⚠️ ICO 生成失败: {e}")
        
        print("\n✨ 图标生成完成！")
        print("📝 注意: 这是基础版本的图标，建议使用专业设计工具优化")
    
    if __name__ == "__main__":
        main()

except ImportError:
    print("❌ 需要安装 Pillow 库: pip install Pillow")
    print("💡 或者手动创建图标文件")

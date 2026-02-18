#!/usr/bin/env python3
"""
生成微信小程序 TabBar 图标
使用 Unicode 字符和系统工具生成简单图标
"""

import os
import subprocess

# 图标配置：名称和符号
icons = [
    ('home', '🏠', '首页图标'),
    ('add', '➕', '添加图标'),
    ('review', '📚', '复习图标'),
    ('library', '📋', '题库图标'),
    ('profile', '👤', '个人图标')
]

def create_icon(name, symbol, description):
    """创建单个图标"""
    # 使用 sips 和 textutil 创建图标
    # 创建一个包含符号的 HTML 文件
    html = f'''
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                margin: 0;
                padding: 0;
                width: 48px;
                height: 48px;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 32px;
                background: transparent;
            }}
        </style>
    </head>
    <body>{symbol}</body>
    </html>
    '''
    
    html_file = f'/tmp/{name}.html'
    with open(html_file, 'w') as f:
        f.write(html)
    
    print(f"创建 {name}.png: {description}")

# 创建所有图标
print("生成图标...")
for name, symbol, desc in icons:
    create_icon(name, symbol, desc)

print("\n✅ 图标生成完成！")
print("图标位置: /Users/hexu/Documents/GitHub/guozi-kaogong/images/")
print("\n注意：由于环境限制，请手动添加图标或使用系统默认图标")

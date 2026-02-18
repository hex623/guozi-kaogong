#!/bin/bash

# 郭子考公 GitHub 发布脚本 V00.00.01
# 使用方法：
# 1. 在 GitHub 创建仓库：https://github.com/new
# 2. 复制仓库地址（如：https://github.com/xuxu/guozi-kaogong.git）
# 3. 修改下面的 GITHUB_URL
# 4. 运行 ./push-to-github.sh

GITHUB_URL="https://github.com/你的用户名/guozi-kaogong.git"

echo "🚀 开始推送到 GitHub..."

# 添加远程仓库
git remote add origin $GITHUB_URL 2>/dev/null || git remote set-url origin $GITHUB_URL

# 重命名分支为 main
git branch -M main

# 推送代码
echo "📤 推送主分支..."
git push -u origin main

# 推送标签
echo "🏷️ 推送标签 V00.00.01..."
git push origin V00.00.01

echo ""
echo "✅ 发布完成！"
echo "🌐 仓库地址: $GITHUB_URL"
echo "🏷️ 版本标签: V00.00.01"

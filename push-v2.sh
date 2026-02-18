#!/bin/bash
# V00.00.02 GitHub 推送脚本

echo "🚀 推送 V00.00.02 到 GitHub..."
echo "================================"
echo ""

cd ~/Documents/GitHub/guozi-kaogong

# 检查远程仓库
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "添加远程仓库..."
    git remote add origin https://github.com/hex976/guozi-kaogong.git
fi

# 推送代码
echo "📤 推送代码..."
git push -u origin main

# 推送标签
echo "🏷️  推送标签 V00.00.02..."
git push origin V00.00.02

echo ""
echo "================================"
echo "✅ V00.00.02 推送完成！"
echo "🌐 https://github.com/hex976/guozi-kaogong"
echo "🏷️  版本标签: V00.00.02"
echo "================================"

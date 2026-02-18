#!/bin/bash

# GitHub 仓库发布脚本
# 运行前请先执行: gh auth login

cd ~/.openclaw/workspace/guozi-kaogong

# 初始化git仓库
git init

# 添加所有文件
git add -A

# 提交
git commit -m "Initial commit: 郭子考公微信小程序 v1.0.0

核心功能:
- 错题拍照录入
- 艾宾浩斯遗忘曲线复习
- 数据统计Dashboard
- 错题库管理
- 考试倒计时

技术栈:
- 微信小程序原生框架
- 微信云开发（数据库+云存储+云函数）"

# 创建GitHub仓库并推送
echo "创建GitHub仓库..."
gh repo create guozi-kaogong \
  --public \
  --description "郭子考公 - 基于艾宾浩斯遗忘曲线的智能错题本小程序" \
  --source=. \
  --remote=origin \
  --push

echo "✅ 完成！仓库地址: https://github.com/$(gh api user -q .login)/guozi-kaogong"

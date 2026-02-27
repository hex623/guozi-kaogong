# 图片资源说明

## 分享封面图

需要在 `images` 目录下放置以下图片：

### 1. share-cover.png（分享封面图）
- **用途**: 小程序分享时显示的卡片图片
- **尺寸**: 500x400 像素（或 5:4 比例）
- **格式**: PNG
- **要求**: 
  - 清晰展示小程序名称和用途
  - 建议包含 "郭子考公" 字样
  - 配色简洁，与小程序风格一致

### 2. TabBar 图标（可选，如需自定义）

如果使用自定义 TabBar，需要以下图标（48x48 像素）：
- home.png / home-active.png
- add.png / add-active.png
- review.png / review-active.png
- library.png / library-active.png
- profile.png / profile-active.png

## 快速生成分享封面图

你可以使用以下方式生成：

1. **Canva** (https://www.canva.com/)
   - 搜索 "小程序分享卡片" 模板
   - 修改为 "郭子考公" 相关内容

2. **Figma** (https://www.figma.com/)
   - 创建 500x400 画布
   - 添加文字和图标

3. **在线生成工具**
   - 可以使用微信小程序分享卡片生成器

## 临时解决方案

如果没有准备分享图，可以使用题目图片作为分享图（已在对错题详情页实现）。

首页分享会使用 `share-cover.png`，如果该文件不存在，会显示默认的灰色背景。

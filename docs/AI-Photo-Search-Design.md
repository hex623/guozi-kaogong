# 郭子考公 - AI 识图解析功能设计文档

**功能名称**: 智能拍照搜题  
**目标用户**: 郭子（备考公务员）  
**核心功能**: 拍照/上传题目图片 → AI 识别 → 返回答案解析

---

## 一、功能概述

### 用户场景
1. 郭子做题时遇到不会的题
2. 打开小程序，点击「拍照搜题」
3. 拍摄题目照片或从相册选择
4. AI 识别题目内容
5. 返回：正确答案 + 详细解析 + 知识点归纳

### 技术方案选择

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **方案A: 云端大模型** (GPT-4V/Claude) | 识别准确、解析详细 | 需要联网、API费用 | ⭐⭐⭐⭐⭐ |
| **方案B: 本地OCR + 题库匹配** | 离线可用、速度快 | 需要大量题库数据 | ⭐⭐⭐ |
| **方案C: 第三方题库API** (如粉笔/华图) | 专业准确 | 需要合作授权 | ⭐⭐ |

**建议**: 先实现 **方案A** (云端大模型)，快速验证需求，后续可考虑混合方案。

---

## 二、功能流程设计

### 完整流程图

```
用户打开「拍照搜题」
    ↓
选择拍照或从相册选取
    ↓
图片预处理（压缩、裁剪）
    ↓
上传到云端/直接发送给AI
    ↓
AI识别题目内容
    ↓
AI生成答案和解析
    ↓
展示结果页面
    ↓
用户可选择：
  - 收藏到错题本
  - 查看相似题目
  - 分享解析
```

### 页面设计

#### 1. 入口页面
```
┌─────────────────────┐
│  📷 拍照搜题        │  ← 大按钮，醒目
│                     │
│  [相机图标]         │
│  点击拍照或选图     │
│                     │
├─────────────────────┤
│  📚 最近搜过的题    │  ← 历史记录
│  [题目1] [题目2]   │
│                     │
├─────────────────────┤
│  💡 使用提示        │
│  • 拍摄时对准题目   │
│  • 确保光线充足     │
│  • 避免手写字干扰   │
└─────────────────────┘
```

#### 2. 拍照/选图页面
```
┌─────────────────────┐
│ ← 拍照搜题          │
├─────────────────────┤
│                     │
│   [相机预览区域]    │
│                     │
│   [拍照按钮]        │
│                     │
├─────────────────────┤
│ [📷拍照] [🖼相册]   │
│                     │
│ ⚠️ 提示：请确保     │
│    题目文字清晰     │
└─────────────────────┘
```

#### 3. 识别中页面
```
┌─────────────────────┐
│ ← 拍照搜题          │
├─────────────────────┤
│                     │
│   [图片预览]        │
│                     │
│   🤖 AI识别中...    │
│                     │
│   [进度条动画]      │
│                     │
│   正在分析题目...   │
│   正在生成解析...   │
│                     │
└─────────────────────┘
```

#### 4. 结果展示页面（核心）
```
┌─────────────────────┐
│ ← 解析结果          │
├─────────────────────┤
│ [原图预览]          │
├─────────────────────┤
│ 📋 识别出的题目      │
│                     │
│ [题目文字展示]      │
│                     │
├─────────────────────┤
│ ✅ 正确答案          │
│ [答案选项/文字]     │
├─────────────────────┤
│ 📖 详细解析          │
│                     │
│ [解析内容]          │
│ • 解题思路          │
│ • 知识点讲解        │
│ • 易错点提醒        │
│                     │
├─────────────────────┤
│ 📚 相关知识点        │
│ [tag1] [tag2]       │
├─────────────────────┤
│ [⭐收藏] [🔄再拍]   │
└─────────────────────┘
```

---

## 三、技术实现

### 方案A: 使用云端大模型 (推荐)

#### 技术栈
- **前端**: 微信小程序 (拍照、图片上传)
- **后端**: 云函数/自有服务器 (调用AI API)
- **AI服务**: 
  - 选项1: GPT-4V (OpenAI)
  - 选项2: Claude 3 (Anthropic)
  - 选项3: 国产: 百度文心、讯飞星火、阿里通义

#### 实现步骤

**Step 1: 图片处理**
```javascript
// 压缩图片，减小体积
wx.compressImage({
  src: imagePath,
  quality: 80,  // 压缩质量
  success: (res) => {
    // 上传压缩后的图片
    uploadImage(res.tempFilePath);
  }
});
```

**Step 2: 图片转 Base64**
```javascript
// 读取图片并转为 base64
const fs = wx.getFileSystemManager();
fs.readFile({
  filePath: compressedImagePath,
  encoding: 'base64',
  success: (res) => {
    const base64Image = res.data;
    callAIAPI(base64Image);
  }
});
```

**Step 3: 调用 AI API**
```javascript
// 调用 GPT-4V API
async function analyzeQuestion(base64Image) {
  const response = await wx.request({
    url: 'https://api.openai.com/v1/chat/completions',
    method: 'POST',
    header: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    data: {
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'system',
          content: '你是一个公务员考试辅导专家。请分析图片中的题目，提供正确答案和详细解析。'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '请分析这道公务员考试题目：\n1. 识别题目内容\n2. 给出正确答案\n3. 提供详细解析\n4. 归纳涉及的知识点\n\n请以JSON格式返回：{\n  "question": "识别出的题目",\n  "answer": "正确答案",\n  "analysis": "详细解析",\n  "knowledge_points": ["知识点1", "知识点2"]\n}'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 2000
    }
  });
  
  return response.data.choices[0].message.content;
}
```

**Step 4: 解析结果并展示**
```javascript
// 解析 AI 返回的结果
function parseAIResponse(aiResponse) {
  try {
    // AI 可能返回 JSON 或 Markdown 格式的 JSON
    const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : aiResponse;
    const result = JSON.parse(jsonStr);
    
    return {
      question: result.question,
      answer: result.answer,
      analysis: result.analysis,
      knowledgePoints: result.knowledge_points
    };
  } catch (e) {
    // 如果解析失败，展示原始文本
    return {
      rawResponse: aiResponse,
      parseError: true
    };
  }
}
```

### 后端云函数 (如果使用微信云开发)

```javascript
// cloudfunctions/aiAnalysis/index.js
const axios = require('axios');

exports.main = async (event, context) => {
  const { imageBase64 } = event;
  
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'system',
          content: '你是公务员考试专家，请分析题目并提供详细解析。'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '分析这道公务员考试题，返回JSON格式：题目、答案、解析、知识点'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 2000
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    return {
      success: true,
      data: response.data.choices[0].message.content
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};
```

---

## 四、成本估算

### GPT-4V API 费用

| 使用量 | 估算费用 |
|--------|---------|
| 低分辨率图片 (512x512) | ~$0.005/张 |
| 高分辨率图片 | ~$0.015/张 |
| 文字输出 (1000 tokens) | ~$0.03 |
| **单次搜题成本** | **~$0.02-0.05** |

**月费用估算**:
- 郭子每天使用 10 次: 10 × 30 × $0.03 = **$9/月 (~¥65)**
- 如果使用国产大模型 (更便宜): **~¥20-30/月**

---

## 五、替代方案 (低成本)

### 方案B: 使用国产免费/低价大模型

**百度文心一言**
- 有免费额度
- 图片理解能力不错

**讯飞星火**
- 价格较低
- 中文理解好

**阿里通义千问**
- 免费额度充足
- API 简单易用

### 方案C: 混合方案

1. **OCR 识别**: 使用免费 OCR (如百度OCR免费额度)
2. **文本分析**: 将识别出的文字发给大模型分析
3. **成本**: 更低，因为不需要图片输入token

---

## 六、开发计划

### 第一阶段: MVP (3-5天)

- [ ] 拍照/选图页面
- [ ] 图片压缩上传
- [ ] 调用 AI API
- [ ] 结果展示页面
- [ ] 收藏到错题本

### 第二阶段: 优化 (2-3天)

- [ ] 历史记录
- [ ] 图片预处理优化
- [ ] 解析结果格式化
- [ ] 错误处理

### 第三阶段: 增强 (1周内)

- [ ] 相似题目推荐
- [ ] 知识点图谱
- [ ] 错题统计分析

---

## 七、数据结构

```javascript
// 搜题记录
{
  _id: 'search_123456',
  userId: 'guozi',
  originalImage: 'cloud://path/to/image.jpg',
  recognizedText: '识别出的题目文字',
  answer: '正确答案',
  analysis: '详细解析内容',
  knowledgePoints: ['数量关系', '工程问题'],
  createTime: '2026-03-06T10:00:00Z',
  isFavorite: false
}
```

---

## 八、注意事项

1. **隐私**: 图片上传云端，注意隐私保护说明
2. **准确性**: AI 可能识别错误，需要提示用户核对
3. **网络**: 需要联网使用，考虑弱网情况
4. **成本**: 监控 API 调用量，防止费用超支
5. **缓存**: 相同图片可以缓存结果，减少 API 调用

---

## 九、下一步

需要我：
1. 开始编写小程序代码？
2. 选择具体使用哪个 AI 服务？
3. 先做一个简单的原型测试？

告诉我你想从哪里开始！🐾
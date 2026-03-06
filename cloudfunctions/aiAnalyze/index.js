// cloudfunctions/aiAnalyze/index.js
// 微信小程序云函数：调用 Kimi API 进行图片识别

const axios = require('axios');

// Kimi API 配置
const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions';
const KIMI_API_KEY = process.env.KIMI_API_KEY; // 从环境变量读取

exports.main = async (event, context) => {
  const { imageBase64, imageType = 'jpeg' } = event;
  
  if (!imageBase64) {
    return {
      success: false,
      error: '缺少图片数据'
    };
  }
  
  try {
    console.log('开始调用 Kimi API 分析图片...');
    
    const response = await axios.post(KIMI_API_URL, {
      model: 'moonshot-v1-8k-vision-preview', // Kimi 视觉模型
      messages: [
        {
          role: 'system',
          content: `你是一个公务员考试辅导专家，专门帮助考生分析行测、申论等各类公务员考试题目。

请仔细分析用户提供的题目图片，并返回以下信息：
1. 识别出的完整题目内容
2. 正确答案（如果是选择题请标明选项）
3. 详细的解题思路和解析
4. 涉及的知识点和考点

返回格式必须是 JSON：
{
  "question": "识别出的完整题目",
  "answer": "正确答案",
  "analysis": "详细的解题思路和解析",
  "knowledgePoints": ["知识点1", "知识点2"]
}`
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/${imageType};base64,${imageBase64}`
              }
            },
            {
              type: 'text',
              text: '请分析这道公务员考试题目，返回 JSON 格式的结果。'
            }
          ]
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    }, {
      headers: {
        'Authorization': `Bearer ${KIMI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60秒超时
    });
    
    console.log('Kimi API 响应:', response.data);
    
    // 解析 AI 返回的内容
    const aiContent = response.data.choices[0].message.content;
    const result = parseAIResponse(aiContent);
    
    return {
      success: true,
      result: result
    };
    
  } catch (error) {
    console.error('Kimi API 调用失败:', error);
    
    return {
      success: false,
      error: error.response?.data?.error?.message || 'AI 分析失败，请重试'
    };
  }
};

// 解析 AI 返回的内容
function parseAIResponse(content) {
  try {
    // 尝试提取 JSON
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                      content.match(/```\n([\s\S]*?)\n```/) ||
                      content.match(/{[\s\S]*}/);
    
    let jsonStr = '';
    if (jsonMatch) {
      jsonStr = jsonMatch[1] || jsonMatch[0];
    } else {
      jsonStr = content;
    }
    
    // 清理可能的 Markdown 标记
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const result = JSON.parse(jsonStr);
    
    // 验证必要字段
    return {
      question: result.question || '题目识别失败',
      answer: result.answer || '答案识别失败',
      analysis: result.analysis || '解析生成失败',
      knowledgePoints: result.knowledgePoints || ['公务员考试'],
      confidence: result.confidence || 0.8
    };
    
  } catch (e) {
    console.error('解析 AI 响应失败:', e);
    console.log('原始内容:', content);
    
    // 如果解析失败，返回原始内容
    return {
      question: '题目内容',
      answer: '答案',
      analysis: content, // 返回原始文本
      knowledgePoints: ['公务员考试'],
      parseError: true
    };
  }
}
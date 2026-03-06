// pages/ai-search/ai-search.js
// AI 拍照搜题功能

Page({
  data: {
    // 页面状态
    status: 'idle', // idle, selecting, analyzing, result, error
    
    // 图片相关
    imageUrl: '',
    compressedImageUrl: '',
    
    // 识别结果
    result: {
      question: '',
      answer: '',
      analysis: '',
      knowledgePoints: []
    },
    
    // 历史记录
    searchHistory: [],
    
    // 错误信息
    errorMessage: ''
  },

  onLoad() {
    this.loadSearchHistory()
  },

  // 拍照
  takePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      success: (res) => {
        this.handleImageSelected(res.tempFiles[0].tempFilePath)
      },
      fail: (err) => {
        console.error('拍照失败:', err)
      }
    })
  },

  // 从相册选择
  selectFromAlbum() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        this.handleImageSelected(res.tempFiles[0].tempFilePath)
      },
      fail: (err) => {
        console.error('选择图片失败:', err)
      }
    })
  },

  // 处理选中的图片
  handleImageSelected(imagePath) {
    this.setData({
      status: 'selecting',
      imageUrl: imagePath
    })

    // 压缩图片
    this.compressImage(imagePath)
  },

  // 压缩图片
  compressImage(imagePath) {
    wx.compressImage({
      src: imagePath,
      quality: 80,
      success: (res) => {
        this.setData({
          compressedImageUrl: res.tempFilePath
        })
        // 开始分析
        this.analyzeImage(res.tempFilePath)
      },
      fail: (err) => {
        console.error('压缩失败:', err)
        // 使用原图
        this.analyzeImage(imagePath)
      }
    })
  },

  // 分析图片
  async analyzeImage(imagePath) {
    this.setData({ status: 'analyzing' })

    try {
      // 读取图片为 base64
      const base64Image = await this.imageToBase64(imagePath)
      
      // 调用 AI 分析
      const result = await this.callAIAnalysis(base64Image)
      
      // 保存到历史记录
      this.saveToHistory(result, imagePath)
      
      this.setData({
        status: 'result',
        result: result
      })

    } catch (error) {
      console.error('分析失败:', error)
      this.setData({
        status: 'error',
        errorMessage: error.message || '识别失败，请重试'
      })
    }
  },

  // 图片转 base64
  imageToBase64(imagePath) {
    return new Promise((resolve, reject) => {
      const fs = wx.getFileSystemManager()
      fs.readFile({
        filePath: imagePath,
        encoding: 'base64',
        success: (res) => {
          resolve(res.data)
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  },

  // 调用 AI 分析
  async callAIAnalysis(base64Image) {
    // 调用微信云函数
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'aiAnalyze',
        data: {
          imageBase64: base64Image,
          imageType: 'jpeg'
        },
        success: (res) => {
          if (res.result.success) {
            resolve(res.result.result)
          } else {
            reject(new Error(res.result.error || '分析失败'))
          }
        },
        fail: (err) => {
          console.error('云函数调用失败:', err)
          // 如果云函数失败，使用模拟数据（测试用）
          this.mockAnalyze().then(resolve).catch(reject)
        }
      })
    })
  },

  // 模拟分析（用于测试）
  mockAnalyze() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          question: '某工程队计划每天修 200 米公路，15 天完成。实际每天修 250 米，实际需要多少天完成？',
          answer: 'B. 12天',
          analysis: '这是一道工程问题。\n\n解题思路：\n1. 先计算总工作量：200米/天 × 15天 = 3000米\n2. 再计算实际天数：3000米 ÷ 250米/天 = 12天\n\n关键公式：工作量 = 工作效率 × 工作时间',
          knowledgePoints: ['数量关系', '工程问题', '工作效率'],
          confidence: 0.95
        })
      }, 2000)
    })
  },

  // 加载历史记录
  loadSearchHistory() {
    const history = wx.getStorageSync('aiSearchHistory') || []
    this.setData({ searchHistory: history.slice(0, 10) })
  },

  // 保存到历史记录
  saveToHistory(result, imagePath) {
    const history = wx.getStorageSync('aiSearchHistory') || []
    
    const newRecord = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      question: result.question.substring(0, 50) + '...',
      imageUrl: imagePath,
      result: result
    }
    
    history.unshift(newRecord)
    
    // 只保留最近 50 条
    if (history.length > 50) {
      history.pop()
    }
    
    wx.setStorageSync('aiSearchHistory', history)
    this.setData({ searchHistory: history.slice(0, 10) })
  },

  // 收藏到错题本
  addToFavorites() {
    const { result, imageUrl } = this.data
    
    // 构造错题对象
    const wrongQuestion = {
      _id: 'ai_' + Date.now(),
      photos: [imageUrl],
      answerType: 'text',
      correctAnswer: result.answer,
      analysis: result.analysis,
      tags: result.knowledgePoints,
      addDate: new Date().toISOString(),
      source: 'AI搜题',
      reviewCount: 0,
      status: 'learning'
    }
    
    // 保存到错题本
    const questions = wx.getStorageSync('questions') || []
    questions.unshift(wrongQuestion)
    wx.setStorageSync('questions', questions)
    
    wx.showToast({
      title: '已收藏',
      icon: 'success'
    })
  },

  // 重新拍照
  retake() {
    this.setData({
      status: 'idle',
      imageUrl: '',
      compressedImageUrl: '',
      result: {
        question: '',
        answer: '',
        analysis: '',
        knowledgePoints: []
      },
      errorMessage: ''
    })
  },

  // 查看历史记录详情
  viewHistoryDetail(e) {
    const { id } = e.currentTarget.dataset
    const history = wx.getStorageSync('aiSearchHistory') || []
    const record = history.find(h => h.id === id)
    
    if (record) {
      this.setData({
        status: 'result',
        result: record.result,
        imageUrl: record.imageUrl
      })
    }
  },

  // 分享解析
  shareAnalysis() {
    // 生成分享图片或文字
    const { result } = this.data
    const shareText = `【AI搜题解析】\n\n${result.question}\n\n✅ 正确答案：${result.answer}\n\n📖 解析：${result.analysis.substring(0, 100)}...\n\n来自：郭子考公小程序`
    
    wx.setClipboardData({
      data: shareText,
      success: () => {
        wx.showToast({
          title: '解析已复制',
          icon: 'success'
        })
      }
    })
  }
})

// 导出供其他页面使用
module.exports = {
  // 可以在其他页面调用
}
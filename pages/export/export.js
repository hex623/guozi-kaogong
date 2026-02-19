// pages/export/export.js
const { formatDate } = require('../../utils/date.js')

Page({
  data: {
    questions: [],
    selectedQuestions: [],
    exportType: 'all', // all, learning, mastered, selected
    exportMode: 'pdf', // pdf, json
    generating: false,
    progress: 0,
    canvasWidth: 595, // A4 宽度 (pt)
    canvasHeight: 842, // A4 高度 (pt)
    previewImage: '',
    filteredCount: 0
  },

  onLoad() {
    this.loadQuestions()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
  },

  // 加载错题
  loadQuestions() {
    const questions = wx.getStorageSync('questions') || []
    const formatted = questions.map(q => ({
      ...q,
      addDateStr: formatDate(new Date(q.addDate)),
      selected: false
    }))
    this.setData({ questions: formatted })
    this.updateFilteredCount()
  },

  // 切换导出类型
  changeExportType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ exportType: type })
    this.updateFilteredCount()
  },

  // 更新筛选数量
  updateFilteredCount() {
    const filtered = this.getFilteredQuestions()
    this.setData({ filteredCount: filtered.length })
  },

  // 切换导出格式
  changeExportMode(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ exportMode: mode })
  },

  // 选择/取消选择题目
  toggleSelect(e) {
    const id = e.currentTarget.dataset.id
    const { questions } = this.data
    const index = questions.findIndex(q => q._id === id)
    if (index > -1) {
      questions[index].selected = !questions[index].selected
      this.setData({ questions })
      this.updateFilteredCount()
    }
  },

  // 全选/取消全选
  toggleSelectAll() {
    const { questions, exportType } = this.data
    const filtered = this.getFilteredQuestions()
    const allSelected = filtered.every(q => q.selected)
    
    filtered.forEach(q => {
      const idx = questions.findIndex(item => item._id === q._id)
      if (idx > -1) {
        questions[idx].selected = !allSelected
      }
    })
    
    this.setData({ questions })
    this.updateFilteredCount()
  },

  // 获取筛选后的题目
  getFilteredQuestions() {
    const { questions, exportType } = this.data
    switch (exportType) {
      case 'learning':
        return questions.filter(q => q.status !== 'mastered')
      case 'mastered':
        return questions.filter(q => q.status === 'mastered')
      case 'selected':
        return questions.filter(q => q.selected)
      default:
        return questions
    }
  },

  // 开始导出
  async startExport() {
    const { exportMode } = this.data
    const questions = this.getFilteredQuestions()
    
    if (questions.length === 0) {
      wx.showToast({ title: '没有可导出的题目', icon: 'none' })
      return
    }

    if (exportMode === 'json') {
      this.exportJSON(questions)
    } else {
      this.exportPDF(questions)
    }
  },

  // 导出 JSON
  exportJSON(questions) {
    const data = {
      exportDate: new Date().toISOString(),
      appName: '郭子考公错题本',
      version: '1.0',
      totalCount: questions.length,
      questions: questions.map(q => ({
        id: q._id,
        photos: q.photos,
        answerType: q.answerType,
        correctAnswer: q.correctAnswer,
        correctAnswerImage: q.correctAnswerImage,
        wrongAnswer: q.wrongAnswer,
        tags: q.tags,
        addDate: q.addDate,
        reviewCount: q.reviewCount,
        status: q.status,
        wrongCount: q.wrongCount
      }))
    }

    const jsonStr = JSON.stringify(data, null, 2)
    
    // 复制到剪贴板
    wx.setClipboardData({
      data: jsonStr,
      success: () => {
        wx.showModal({
          title: 'JSON 已复制',
          content: `已复制 ${questions.length} 道题的数据到剪贴板，你可以粘贴保存到文件。`,
          showCancel: false
        })
      }
    })
  },

  // 导出 PDF (生成图片)
  async exportPDF(questions) {
    this.setData({ generating: true, progress: 0 })

    try {
      // 创建多个页面
      const pages = await this.generatePages(questions)
      
      // 保存第一个页面用于预览
      if (pages.length > 0) {
        this.setData({ 
          previewImage: pages[0],
          generating: false 
        })
        
        // 显示选项
        this.showExportOptions(pages)
      }
    } catch (err) {
      console.error('生成失败:', err)
      wx.showToast({ title: '生成失败', icon: 'none' })
      this.setData({ generating: false })
    }
  },

  // 生成页面
  async generatePages(questions) {
    const pages = []
    const pageSize = 3 // 每页3道题
    const totalPages = Math.ceil(questions.length / pageSize)

    for (let i = 0; i < totalPages; i++) {
      const pageQuestions = questions.slice(i * pageSize, (i + 1) * pageSize)
      const pageImage = await this.generatePage(pageQuestions, i + 1, totalPages)
      pages.push(pageImage)
      
      this.setData({ 
        progress: Math.round(((i + 1) / totalPages) * 100) 
      })
    }

    return pages
  },

  // 生成单个页面
  generatePage(questions, pageNum, totalPages) {
    return new Promise((resolve, reject) => {
      const ctx = wx.createCanvasContext('exportCanvas')
      const { canvasWidth, canvasHeight } = this.data
      const scale = 2 // 高清

      // 设置画布尺寸
      ctx.canvas.width = canvasWidth * scale
      ctx.canvas.height = canvasHeight * scale
      ctx.scale(scale, scale)

      // 白色背景
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)

      // 标题
      ctx.fillStyle = '#333333'
      ctx.font = 'bold 24px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('郭子考公 · 错题本', canvasWidth / 2, 40)

      // 副标题
      ctx.font = '12px sans-serif'
      ctx.fillStyle = '#666666'
      ctx.fillText(`导出日期: ${formatDate(new Date())}`, canvasWidth / 2, 60)

      // 绘制每道题
      let y = 90
      const margin = 30
      const contentWidth = canvasWidth - margin * 2

      questions.forEach((q, index) => {
        // 题号线
        ctx.strokeStyle = '#e0e0e0'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(margin, y)
        ctx.lineTo(canvasWidth - margin, y)
        ctx.stroke()

        // 题号
        y += 20
        ctx.fillStyle = '#333333'
        ctx.font = 'bold 14px sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(`第 ${(pageNum - 1) * 3 + index + 1} 题`, margin, y)

        // 标签
        if (q.tags && q.tags.length > 0) {
          ctx.font = '10px sans-serif'
          ctx.fillStyle = '#07c160'
          let tagX = margin + 60
          q.tags.forEach(tag => {
            ctx.fillText(`#${tag}`, tagX, y)
            tagX += ctx.measureText(`#${tag} `).width + 5
          })
        }

        // 状态
        ctx.font = '10px sans-serif'
        ctx.fillStyle = q.status === 'mastered' ? '#07c160' : '#ff9500'
        ctx.textAlign = 'right'
        ctx.fillText(q.status === 'mastered' ? '已掌握' : '学习中', canvasWidth - margin, y)

        // 答案
        y += 25
        ctx.fillStyle = '#333333'
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'left'
        if (q.answerType === 'text' && q.correctAnswer) {
          ctx.fillText(`答案: ${q.correctAnswer}`, margin, y)
        } else {
          ctx.fillText('答案: (图片)', margin, y)
        }

        // 错误记录
        if (q.wrongAnswer) {
          y += 18
          ctx.fillStyle = '#ff4444'
          ctx.font = '11px sans-serif'
          ctx.fillText(`易错: ${q.wrongAnswer}`, margin, y)
        }

        // 复习进度
        y += 18
        ctx.fillStyle = '#666666'
        ctx.font = '10px sans-serif'
        ctx.fillText(`复习进度: ${q.reviewCount || 0}/5 次 | 添加日期: ${q.addDateStr}`, margin, y)

        y += 30
      })

      // 底部页码
      ctx.fillStyle = '#999999'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`- 第 ${pageNum}/${totalPages} 页 -`, canvasWidth / 2, canvasHeight - 20)

      // 导出
      ctx.draw(false, () => {
        setTimeout(() => {
          wx.canvasToTempFilePath({
            canvasId: 'exportCanvas',
            width: canvasWidth,
            height: canvasHeight,
            destWidth: canvasWidth * scale,
            destHeight: canvasHeight * scale,
            fileType: 'png',
            quality: 1,
            success: res => resolve(res.tempFilePath),
            fail: reject
          })
        }, 200)
      })
    })
  },

  // 显示导出选项
  showExportOptions(pages) {
    const items = ['保存到相册', '分享给好友']
    if (pages.length > 1) {
      items.push(`保存全部 ${pages.length} 页`)
    }

    wx.showActionSheet({
      itemList: items,
      success: res => {
        if (res.tapIndex === 0) {
          this.saveToAlbum(pages[0])
        } else if (res.tapIndex === 1) {
          this.shareToFriend(pages[0])
        } else if (res.tapIndex === 2) {
          this.saveAllPages(pages)
        }
      }
    })
  },

  // 保存到相册
  saveToAlbum(imagePath) {
    wx.saveImageToPhotosAlbum({
      filePath: imagePath,
      success: () => {
        wx.showToast({ title: '已保存到相册', icon: 'success' })
      },
      fail: () => {
        wx.showToast({ title: '保存失败，请检查权限', icon: 'none' })
      }
    })
  },

  // 分享给好友
  shareToFriend(imagePath) {
    wx.shareFileMessage || wx.showShareImageMenu({
      path: imagePath,
      success: () => {
        wx.showToast({ title: '分享成功', icon: 'success' })
      }
    })
  },

  // 保存所有页面
  async saveAllPages(pages) {
    wx.showLoading({ title: '保存中...' })
    
    for (let i = 0; i < pages.length; i++) {
      try {
        await new Promise((resolve, reject) => {
          wx.saveImageToPhotosAlbum({
            filePath: pages[i],
            success: resolve,
            fail: reject
          })
        })
      } catch (err) {
        console.error(`保存第 ${i + 1} 页失败:`, err)
      }
      
      wx.showLoading({ title: `已保存 ${i + 1}/${pages.length} 页...` })
    }
    
    wx.hideLoading()
    wx.showToast({ 
      title: `已保存 ${pages.length} 页`, 
      icon: 'success' 
    })
  }
})

// pages/add/add.js
Page({
  data: {
    photos: [],
    answerType: 'text',
    correctAnswer: '',
    correctAnswerImage: '',
    wrongAnswer: '',
    tags: [],
    selectedTags: [],
    historyTags: [],
    tagInput: '',
    canSubmit: false,
    isSubmitting: false
  },

  onLoad() {
    this.loadHistoryTags()
  },

  onShow() {
    // 设置 tabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      })
    }
  },

  // 选择图片并裁剪
  chooseImage() {
    const { photos } = this.data
    const remainCount = 3 - photos.length
    
    wx.chooseMedia({
      count: remainCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFiles = res.tempFiles.map(file => file.tempFilePath)
        
        // 如果有图片，进行裁剪
        if (tempFiles.length > 0) {
          this.cropImages(tempFiles, 0, [])
        }
      }
    })
  },

  // 递归裁剪图片
  cropImages(files, index, croppedFiles) {
    if (index >= files.length) {
      // 所有图片裁剪完成
      const { photos } = this.data
      this.setData({
        photos: [...photos, ...croppedFiles]
      }, this.checkCanSubmit)
      return
    }

    const file = files[index]
    
    wx.cropImage({
      src: file,
      cropScale: '16:9', // 16:9 比例，适合题目拍照
      success: (res) => {
        croppedFiles.push(res.tempFilePath)
        this.cropImages(files, index + 1, croppedFiles)
      },
      fail: () => {
        // 裁剪失败（用户取消等），使用原图
        croppedFiles.push(file)
        this.cropImages(files, index + 1, croppedFiles)
      }
    })
  },

  // 预览图片
  previewImage(e) {
    const { index } = e.currentTarget.dataset
    wx.previewImage({
      current: this.data.photos[index],
      urls: this.data.photos
    })
  },

  // 删除图片
  deletePhoto(e) {
    const { index } = e.currentTarget.dataset
    const { photos } = this.data
    photos.splice(index, 1)
    this.setData({ photos }, this.checkCanSubmit)
  },

  // 切换答案类型
  switchAnswerType(e) {
    this.setData({
      answerType: e.currentTarget.dataset.type
    }, this.checkCanSubmit)
  },

  // 选择答案图片
  chooseAnswerImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          correctAnswerImage: res.tempFiles[0].tempFilePath
        }, this.checkCanSubmit)
      }
    })
  },

  // 预览答案图片
  previewAnswerImage() {
    wx.previewImage({
      urls: [this.data.correctAnswerImage]
    })
  },

  // 删除答案图片
  deleteAnswerImage() {
    this.setData({
      correctAnswerImage: ''
    }, this.checkCanSubmit)
  },

  // 输入正确答案
  onCorrectAnswerInput(e) {
    this.setData({
      correctAnswer: e.detail.value
    }, this.checkCanSubmit)
  },

  // 输入错误答案
  onWrongAnswerInput(e) {
    this.setData({
      wrongAnswer: e.detail.value
    })
  },

  // 输入标签
  onTagInput(e) {
    this.setData({
      tagInput: e.detail.value
    })
  },

  // 添加标签
  addTag() {
    const { tagInput, selectedTags } = this.data
    const tag = tagInput.trim()
    
    if (!tag) return
    if (selectedTags.includes(tag)) {
      wx.showToast({ title: '标签已存在', icon: 'none' })
      return
    }
    if (selectedTags.length >= 5) {
      wx.showToast({ title: '最多5个标签', icon: 'none' })
      return
    }
    
    this.setData({
      selectedTags: [...selectedTags, tag],
      tagInput: ''
    })
  },

  // 移除标签
  removeTag(e) {
    const { tag } = e.currentTarget.dataset
    const { selectedTags } = this.data
    const index = selectedTags.indexOf(tag)
    if (index > -1) {
      selectedTags.splice(index, 1)
      this.setData({ selectedTags: [...selectedTags] })
    }
  },

  // 切换历史标签
  toggleHistoryTag(e) {
    const { tag } = e.currentTarget.dataset
    const { selectedTags } = this.data
    
    if (selectedTags.includes(tag)) {
      this.removeTag({ currentTarget: { dataset: { tag } } })
    } else {
      if (selectedTags.length >= 5) {
        wx.showToast({ title: '最多5个标签', icon: 'none' })
        return
      }
      this.setData({
        selectedTags: [...selectedTags, tag]
      })
    }
  },

  // 加载历史标签
  loadHistoryTags() {
    const questions = wx.getStorageSync('questions') || []
    const allTags = new Set()
    questions.forEach(q => {
      if (q.tags) {
        q.tags.forEach(tag => allTags.add(tag))
      }
    })
    this.setData({
      historyTags: Array.from(allTags).slice(0, 10)
    })
  },

  // 检查是否可以提交
  checkCanSubmit() {
    const { photos, answerType, correctAnswer, correctAnswerImage } = this.data
    
    const hasPhotos = photos.length > 0
    const hasAnswer = answerType === 'text' 
      ? correctAnswer.trim().length > 0 
      : correctAnswerImage.length > 0
    
    this.setData({
      canSubmit: hasPhotos && hasAnswer
    })
  },

  // 提交错题
  async submitQuestion() {
    if (!this.data.canSubmit || this.data.isSubmitting) return
    
    this.setData({ isSubmitting: true })
    
    try {
      // 本地存储模式下，照片保存在临时路径
      const photoUrls = this.data.photos
      const answerImageUrl = this.data.correctAnswerImage
      
      // 保存到本地存储
      const questions = wx.getStorageSync('questions') || []
      const addDate = new Date()
      
      const newQuestion = {
        _id: 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        photos: photoUrls,
        answerType: this.data.answerType,
        correctAnswer: this.data.correctAnswer,
        correctAnswerImage: answerImageUrl,
        wrongAnswer: this.data.wrongAnswer,
        tags: this.data.selectedTags,
        addDate: addDate.toISOString(),
        reviewCount: 0,
        status: 'learning',
        needsMoreReview: false,
        wrongCount: 1,
        createTime: Date.now()
      }
      
      questions.unshift(newQuestion)
      wx.setStorageSync('questions', questions)
      
      // 记录今日打卡
      this.recordCheckin()
      
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
      
      // 重置表单
      setTimeout(() => {
        this.resetForm()
      }, 1500)
      
    } catch (err) {
      console.error('保存失败:', err)
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ isSubmitting: false })
    }
  },

  // 记录打卡
  recordCheckin() {
    const today = new Date().toISOString().split('T')[0]
    let records = wx.getStorageSync('checkinRecords') || []
    
    if (!records.includes(today)) {
      records.push(today)
      wx.setStorageSync('checkinRecords', records)
    }
  },

  // 重置表单
  resetForm() {
    this.setData({
      photos: [],
      answerType: 'text',
      correctAnswer: '',
      correctAnswerImage: '',
      wrongAnswer: '',
      selectedTags: [],
      tagInput: '',
      canSubmit: false
    })
    this.loadHistoryTags()
  }
})

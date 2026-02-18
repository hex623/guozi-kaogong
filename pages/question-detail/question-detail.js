// pages/question-detail/question-detail.js
const { formatDate } = require('../../utils/date.js')

Page({
  data: {
    question: null,
    reviewHistory: [],
    loading: true,
    isEditing: false,
    editData: {
      correctAnswer: '',
      wrongAnswer: '',
      tags: []
    }
  },

  onLoad(options) {
    const { id } = options
    if (id) {
      this.loadQuestionDetail(id)
    }
  },

  // 加载题目详情
  loadQuestionDetail(id) {
    const questions = wx.getStorageSync('questions') || []
    const question = questions.find(q => q._id === id)
    
    if (question) {
      // 格式化日期
      const formattedQuestion = {
        ...question,
        addDate: formatDate(new Date(question.addDate))
      }
      
      this.setData({
        question: formattedQuestion,
        loading: false,
        editData: {
          correctAnswer: question.correctAnswer || '',
          wrongAnswer: question.wrongAnswer || '',
          tags: question.tags || []
        }
      })
      
      // 加载复习历史
      this.loadReviewHistory(id)
    } else {
      wx.showToast({ title: '题目不存在', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  // 加载复习历史
  loadReviewHistory(questionId) {
    const reviewRecords = wx.getStorageSync('review_records') || []
    
    const history = reviewRecords
      .filter(r => r.questionId === questionId)
      .sort((a, b) => b.createTime - a.createTime)
      .map(item => ({
        ...item,
        date: formatDate(new Date(item.createTime))
      }))
    
    this.setData({ reviewHistory: history })
  },

  // 预览题目图片
  previewImage(e) {
    const { url } = e.currentTarget.dataset
    const { question } = this.data
    
    wx.previewImage({
      current: url,
      urls: question.photos
    })
  },

  // 预览答案图片
  previewAnswerImage() {
    wx.previewImage({
      urls: [this.data.question.correctAnswerImage]
    })
  },

  // 进入编辑模式
  startEdit() {
    this.setData({
      isEditing: true
    })
  },

  // 取消编辑
  cancelEdit() {
    const { question } = this.data
    this.setData({
      isEditing: false,
      editData: {
        correctAnswer: question.correctAnswer || '',
        wrongAnswer: question.wrongAnswer || '',
        tags: question.tags || []
      }
    })
  },

  // 输入正确答案
  onCorrectAnswerInput(e) {
    this.setData({
      'editData.correctAnswer': e.detail.value
    })
  },

  // 输入错误答案
  onWrongAnswerInput(e) {
    this.setData({
      'editData.wrongAnswer': e.detail.value
    })
  },

  // 添加标签
  addTag(e) {
    const tag = e.detail.value.trim()
    if (!tag) return
    
    const { editData } = this.data
    if (editData.tags.includes(tag)) {
      wx.showToast({ title: '标签已存在', icon: 'none' })
      return
    }
    if (editData.tags.length >= 5) {
      wx.showToast({ title: '最多5个标签', icon: 'none' })
      return
    }
    
    this.setData({
      'editData.tags': [...editData.tags, tag]
    })
  },

  // 移除标签
  removeTag(e) {
    const { tag } = e.currentTarget.dataset
    const { editData } = this.data
    const newTags = editData.tags.filter(t => t !== tag)
    this.setData({
      'editData.tags': newTags
    })
  },

  // 保存编辑
  saveEdit() {
    const { question, editData } = this.data
    const questions = wx.getStorageSync('questions') || []
    
    const index = questions.findIndex(q => q._id === question._id)
    if (index > -1) {
      // 更新数据
      questions[index].correctAnswer = editData.correctAnswer
      questions[index].wrongAnswer = editData.wrongAnswer
      questions[index].tags = editData.tags
      
      wx.setStorageSync('questions', questions)
      
      // 刷新显示
      this.setData({
        isEditing: false,
        question: {
          ...question,
          correctAnswer: editData.correctAnswer,
          wrongAnswer: editData.wrongAnswer,
          tags: editData.tags
        }
      })
      
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
    }
  },

  // 删除题目
  deleteQuestion() {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，是否继续？',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          this.doDelete()
        }
      }
    })
  },

  // 执行删除
  doDelete() {
    const { question } = this.data
    
    wx.showLoading({ title: '删除中...' })
    
    // 删除题目
    const questions = wx.getStorageSync('questions') || []
    const newQuestions = questions.filter(q => q._id !== question._id)
    wx.setStorageSync('questions', newQuestions)
    
    // 删除相关复习记录
    const reviewRecords = wx.getStorageSync('review_records') || []
    const newReviewRecords = reviewRecords.filter(r => r.questionId !== question._id)
    wx.setStorageSync('review_records', newReviewRecords)
    
    wx.hideLoading()
    wx.showToast({ title: '已删除', icon: 'success' })
    
    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  }
})

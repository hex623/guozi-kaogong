// pages/review/review.js
const { formatDate } = require('../../utils/date.js')
const { needsReviewToday, getNextReviewDate, getReviewPriority } = require('../../utils/ebinhause.js')

Page({
  data: {
    todayList: [],
    currentIndex: 0,
    currentQuestion: null,
    showAnswer: false,
    showResult: false,
    completedCount: 0,
    isSubmitting: false,
    loading: true,
    resultIcon: '',
    resultTitle: '',
    resultDesc: '',
    nextReviewDate: '',
    // 复习模式：normal（正常模式）| quick（快速模式）
    reviewMode: 'normal',
    // 掌握程度选项
    masteryLevels: [
      { level: 1, icon: '😵', label: '完全忘记', desc: '今天再复习', color: '#ff4d4f' },
      { level: 2, icon: '😰', label: '有点印象', desc: '明天再复习', color: '#ff7a45' },
      { level: 3, icon: '😐', label: '基本记得', desc: '正常周期', color: '#ffa940' },
      { level: 4, icon: '😊', label: '比较熟练', desc: '延长周期', color: '#73d13d' },
      { level: 5, icon: '🎯', label: '完全掌握', desc: '标记掌握', color: '#52c41a' }
    ]
  },

  onLoad() {
    this.loadTodayReviewList()
  },

  onShow() {
    // 设置 tabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      })
    }
    // 每次显示页面时刷新
    if (!this.data.currentQuestion) {
      this.loadTodayReviewList()
    }
  },

  // 加载今日复习列表
  loadTodayReviewList() {
    this.setData({ loading: true })
    
    const questions = wx.getStorageSync('questions') || []
    
    // 筛选今日需要复习的
    const todayList = questions
      .filter(q => needsReviewToday(q))
      .map(q => ({
        ...q,
        priority: getReviewPriority(q)
      }))
      .sort((a, b) => b.priority - a.priority)
    
    this.setData({
      todayList: todayList,
      currentIndex: 0,
      currentQuestion: todayList.length > 0 ? todayList[0] : null,
      showAnswer: false,
      showResult: false,
      completedCount: 0,
      loading: false
    })
    
    // 更新tabBar徽标
    if (todayList.length > 0) {
      wx.setTabBarBadge({
        index: 2,
        text: String(todayList.length)
      })
    } else {
      wx.removeTabBarBadge({ index: 2 })
    }
  },

  // 显示答案
  showAnswer() {
    this.setData({ showAnswer: true })
  },

  // 标记为还需复习
  markForgot() {
    if (this.data.isSubmitting) return
    
    this.setData({ isSubmitting: true })
    
    const { currentQuestion } = this.data
    const questions = wx.getStorageSync('questions') || []
    
    // 找到并更新题目
    const index = questions.findIndex(q => q._id === currentQuestion._id)
    if (index > -1) {
      questions[index].needsMoreReview = true
      questions[index].wrongCount = (questions[index].wrongCount || 0) + 1
      questions[index].lastReviewDate = new Date().toISOString()
      wx.setStorageSync('questions', questions)
    }
    
    // 记录复习历史
    this.recordReview(currentQuestion._id, false)
    
    // 显示结果
    this.setData({
      showResult: true,
      resultIcon: '📚',
      resultTitle: '已标记为"还需复习"',
      resultDesc: '这道题会在明天继续推送，加强记忆',
      nextReviewDate: '明天',
      isSubmitting: false
    })
  },

  // 标记为已掌握
  markMastered() {
    if (this.data.isSubmitting) return
    
    this.setData({ isSubmitting: true })
    
    const { currentQuestion } = this.data
    const questions = wx.getStorageSync('questions') || []
    
    const newReviewCount = (currentQuestion.reviewCount || 0) + 1
    
    // 找到并更新题目
    const index = questions.findIndex(q => q._id === currentQuestion._id)
    if (index > -1) {
      questions[index].reviewCount = newReviewCount
      questions[index].lastReviewDate = new Date().toISOString()
      questions[index].needsMoreReview = false
      
      // 如果完成所有复习周期，标记为已掌握
      if (newReviewCount >= 5) {
        questions[index].status = 'mastered'
      }
      
      wx.setStorageSync('questions', questions)
    }
    
    // 记录复习历史
    this.recordReview(currentQuestion._id, true)
    
    // 显示结果
    let resultDesc, nextReviewText
    
    if (newReviewCount >= 5) {
      resultDesc = '恭喜！你已完成全部5次复习，这道题已标记为已掌握'
      nextReviewText = null
    } else {
      const intervals = [1, 2, 4, 7, 15]
      const nextInterval = intervals[newReviewCount]
      resultDesc = `第${newReviewCount}次复习完成，坚持就是胜利！`
      nextReviewText = `${nextInterval}天后`
    }
    
    this.setData({
      showResult: true,
      resultIcon: '🎉',
      resultTitle: '已掌握',
      resultDesc: resultDesc,
      nextReviewDate: nextReviewText,
      isSubmitting: false
    })
  },

  // 记录复习历史
  recordReview(questionId, isMastered) {
    const reviewRecords = wx.getStorageSync('review_records') || []
    const today = formatDate(new Date())
    
    reviewRecords.push({
      _id: 'r_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      questionId: questionId,
      date: today,
      completed: true,
      isMastered: isMastered,
      createTime: Date.now()
    })
    
    wx.setStorageSync('review_records', reviewRecords)
    
    // 更新完成计数
    this.setData({
      completedCount: this.data.completedCount + 1
    })
  },

  // 下一题
  nextQuestion() {
    const { currentIndex, todayList } = this.data
    
    if (currentIndex < todayList.length - 1) {
      // 还有下一题
      const nextIndex = currentIndex + 1
      this.setData({
        currentIndex: nextIndex,
        currentQuestion: todayList[nextIndex],
        showAnswer: false,
        showResult: false,
        resultIcon: '',
        resultTitle: '',
        resultDesc: '',
        nextReviewDate: ''
      })
    } else {
      // 完成所有复习
      this.loadTodayReviewList()
    }
  },

  // 预览题目图片
  previewImage(e) {
    const { url } = e.currentTarget.dataset
    const { currentQuestion } = this.data
    
    wx.previewImage({
      current: url,
      urls: currentQuestion.photos
    })
  },

  // 预览答案图片
  previewAnswerImage() {
    wx.previewImage({
      urls: [this.data.currentQuestion.correctAnswerImage]
    })
  },

  // 跳转到录入页面
  goToAdd() {
    wx.switchTab({
      url: '/pages/add/add'
    })
  },

  // 分享给朋友
  onShareAppMessage() {
    const { todayList, completedCount } = this.data
    const total = todayList.length
    const remaining = total - completedCount
    
    let title
    if (total === 0) {
      title = '今日复习已完成，郭子考公助你高效备考'
    } else if (remaining === 0) {
      title = `今日${total}道错题复习全部完成，继续保持！`
    } else {
      title = `今日还有${remaining}道错题待复习，一起来刷题吧`
    }
    
    return {
      title: title,
      path: '/pages/review/review',
      imageUrl: '/images/share-cover.png'
    }
  },

  // ==================== 多级别掌握程度评估 ====================

  markMasteryLevel(level) {
    if (this.data.isSubmitting) return
    this.setData({ isSubmitting: true })
    
    const { currentQuestion } = this.data
    const questions = wx.getStorageSync('questions') || []
    const index = questions.findIndex(q => q._id === currentQuestion._id)
    
    if (index > -1) {
      const question = questions[index]
      const nextReviewDays = this.getNextReviewInterval(level, question.reviewCount || 0)
      
      question.lastReviewDate = new Date().toISOString()
      question.lastMasteryLevel = level
      question.needsMoreReview = level <= 2
      
      if (level === 5) {
        question.reviewCount = (question.reviewCount || 0) + 1
        if (question.reviewCount >= 5) question.status = 'mastered'
      } else if (level <= 2) {
        question.wrongCount = (question.wrongCount || 0) + 1
      }
      
      const nextDate = new Date()
      nextDate.setDate(nextDate.getDate() + nextReviewDays)
      question.nextReviewDate = nextDate.toISOString()
      
      wx.setStorageSync('questions', questions)
      
      const reviewRecords = wx.getStorageSync('review_records') || []
      const today = new Date().toISOString().split('T')[0]
      reviewRecords.push({
        _id: 'r_' + Date.now(),
        questionId: currentQuestion._id,
        date: today,
        completed: true,
        masteryLevel: level,
        createTime: Date.now()
      })
      wx.setStorageSync('review_records', reviewRecords)
      
      const levelInfo = this.data.masteryLevels.find(l => l.level === level)
      const resultDesc = level === 5 && question.reviewCount >= 5
        ? '恭喜！你已完成全部5次复习，这道题已标记为已掌握'
        : levelInfo.label + '，' + levelInfo.desc
      
      this.setData({
        showResult: true,
        resultIcon: levelInfo.icon,
        resultTitle: levelInfo.label,
        resultDesc: resultDesc,
        nextReviewDate: nextReviewDays === 0 ? '今天' : nextReviewDays + '天后',
        isSubmitting: false
      })
    }
  },

  getNextReviewInterval(level, reviewCount) {
    const intervals = { 1: 0, 2: 1 }
    intervals[3] = [1, 2, 4, 7, 15][reviewCount] || 7
    intervals[4] = [2, 4, 7, 15, 30][reviewCount] || 15
    intervals[5] = [4, 7, 15, 30, 60][reviewCount] || 30
    return intervals[level] || 1
  },

  // ==================== 快速复习模式 ====================
  switchReviewMode() {
    const newMode = this.data.reviewMode === 'normal' ? 'quick' : 'normal'
    this.setData({ reviewMode: newMode, showAnswer: false, showResult: false })
    wx.showToast({ title: newMode === 'quick' ? '切换到快速模式' : '切换到正常模式', icon: 'none' })
  },

  quickMark(level) {
    // 直接标记，不显示答案，显示结果后手动点击下一题
    this.markMasteryLevel(level)
  },

  // ==================== 重点标记 ====================
  toggleFavorite() {
    const { currentQuestion } = this.data
    if (!currentQuestion) return
    const questions = wx.getStorageSync('questions') || []
    const index = questions.findIndex(q => q._id === currentQuestion._id)
    if (index > -1) {
      const isFav = !questions[index].isFavorite
      questions[index].isFavorite = isFav
      wx.setStorageSync('questions', questions)
      this.setData({ 'currentQuestion.isFavorite': isFav })
      wx.showToast({ title: isFav ? '已标记为重点' : '已取消重点', icon: 'none' })
    }
  }

})
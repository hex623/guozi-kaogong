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
    nextReviewDate: ''
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
  }
})

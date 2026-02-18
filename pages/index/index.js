// pages/index/index.js
const { getCountdown, getLast7Days } = require('../../utils/date.js')
const { needsReviewToday } = require('../../utils/ebinhause.js')

Page({
  data: {
    examDate: '',
    countdownDays: 0,
    stats: {
      total: 0,
      mastered: 0,
      toReview: 0
    },
    streakDays: 0,
    last7Days: [],
    trendData: [],
    topTags: []
  },

  onLoad() {
    this.loadExamDate()
    this.loadStats()
    this.loadCheckinData()
    this.loadTrendData()
    this.loadTagStats()
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadStats()
    this.loadCheckinData()
  },

  // 加载考试日期
  loadExamDate() {
    const app = getApp()
    const examDate = app.globalData.examDate || wx.getStorageSync('examDate')
    
    if (examDate) {
      const days = getCountdown(examDate)
      this.setData({
        examDate: examDate,
        countdownDays: days > 0 ? days : 0
      })
    }
  },

  // 加载统计数据
  loadStats() {
    const questions = wx.getStorageSync('questions') || []
    
    const total = questions.length
    const mastered = questions.filter(q => q.status === 'mastered').length
    const toReview = questions.filter(q => needsReviewToday(q)).length
    
    this.setData({
      stats: {
        total,
        mastered,
        toReview
      }
    })
    
    // 更新tabBar徽标
    if (toReview > 0) {
      wx.setTabBarBadge({
        index: 2,
        text: String(toReview)
      })
    } else {
      wx.removeTabBarBadge({ index: 2 })
    }
  },

  // 加载打卡数据
  loadCheckinData() {
    const checkinRecords = wx.getStorageSync('checkinRecords') || []
    const today = new Date().toISOString().split('T')[0]
    
    // 计算连续打卡天数
    let streak = 0
    let checkDate = new Date()
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0]
      if (checkinRecords.includes(dateStr)) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else if (dateStr === today && streak === 0) {
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }
    
    // 生成最近7天打卡状态
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      last7Days.push({
        date: dateStr,
        checked: checkinRecords.includes(dateStr)
      })
    }
    
    this.setData({
      streakDays: streak,
      last7Days: last7Days
    })
  },

  // 加载趋势数据
  loadTrendData() {
    const last7Days = getLast7Days()
    const reviewRecords = wx.getStorageSync('review_records') || []
    
    const trendData = []
    
    for (const date of last7Days) {
      const count = reviewRecords.filter(r => r.date === date && r.completed).length
      
      trendData.push({
        date: date,
        shortDate: date.slice(5), // 显示 MM-DD
        count: count
      })
    }
    
    this.setData({ trendData })
  },

  // 加载标签统计
  loadTagStats() {
    const questions = wx.getStorageSync('questions') || []
    
    // 统计标签
    const tagCount = {}
    questions.forEach(q => {
      if (q.tags) {
        q.tags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1
        })
      }
    })
    
    // 转换为数组并排序
    const tagArray = Object.keys(tagCount).map(name => ({
      name,
      count: tagCount[name]
    })).sort((a, b) => b.count - a.count)
    
    // 取前5个
    const topTags = tagArray.slice(0, 5)
    
    // 计算百分比
    const maxCount = topTags[0]?.count || 1
    topTags.forEach(tag => {
      tag.percent = (tag.count / maxCount) * 100
    })
    
    this.setData({ topTags })
  },

  // 跳转到复习页面
  goToReview() {
    wx.switchTab({
      url: '/pages/review/review'
    })
  },

  // 跳转到录入页面
  goToAdd() {
    wx.switchTab({
      url: '/pages/add/add'
    })
  },

  // 跳转到设置页面
  goToProfile() {
    wx.switchTab({
      url: '/pages/profile/profile'
    })
  }
})

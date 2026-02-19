// pages/profile/profile.js
const { getCountdown } = require('../../utils/date.js')

Page({
  data: {
    userInfo: null,
    examName: '',
    examDate: '',
    countdownDays: 0,
    reminderEnabled: false,
    reminderTime: '20:00',
    stats: {
      totalDays: 0,
      totalQuestions: 0,
      totalReviews: 0,
      masteredCount: 0
    }
  },

  onLoad() {
    this.loadUserInfo()
    this.loadSettings()
    this.loadStats()
  },

  onShow() {
    // 设置 tabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 4
      })
    }
    this.loadSettings()
    this.loadStats()
  },

  // 加载用户信息
  loadUserInfo() {
    const app = getApp()
    if (app.globalData.userInfo) {
      this.setData({ userInfo: app.globalData.userInfo })
    }
  },

  // 获取用户信息
  onGetUserInfo(e) {
    if (e.detail.userInfo) {
      this.setData({ userInfo: e.detail.userInfo })
      getApp().globalData.userInfo = e.detail.userInfo
    }
  },

  // 加载设置
  loadSettings() {
    const app = getApp()
    const examName = wx.getStorageSync('examName') || ''
    const examDate = wx.getStorageSync('examDate') || ''
    const reminderTime = wx.getStorageSync('reminderTime') || '20:00'
    const reminderEnabled = wx.getStorageSync('reminderEnabled') || false
    
    const days = getCountdown(examDate)
    
    this.setData({
      examName: examName,
      examDate: examDate,
      countdownDays: days > 0 ? days : 0,
      reminderTime: reminderTime,
      reminderEnabled: reminderEnabled
    })
    
    // 更新全局数据
    app.globalData.examDate = examDate
  },

  // 设置考试名称
  setExamName() {
    wx.showModal({
      title: '设置考试名称',
      content: this.data.examName,
      editable: true,
      placeholderText: '如：2024国考、省考、事业单位...',
      success: (res) => {
        if (res.confirm && res.content !== undefined) {
          const examName = res.content.trim()
          wx.setStorageSync('examName', examName)
          this.setData({ examName })
          
          // 更新首页显示
          const app = getApp()
          if (app.globalData) {
            app.globalData.examName = examName
          }
        }
      }
    })
  },

  // 考试日期选择器变化
  onExamDateChange(e) {
    const examDate = e.detail.value
    wx.setStorageSync('examDate', examDate)
    
    const days = getCountdown(examDate)
    this.setData({
      examDate: examDate,
      countdownDays: days > 0 ? days : 0
    })
    
    // 更新全局数据
    const app = getApp()
    if (app.globalData) {
      app.globalData.examDate = examDate
    }
  },

  // 切换提醒开关
  toggleReminder(e) {
    const enabled = e.detail.value
    this.setData({ reminderEnabled: enabled })
    wx.setStorageSync('reminderEnabled', enabled)
    
    if (enabled) {
      wx.showToast({
        title: '提醒功能需订阅消息',
        icon: 'none',
        duration: 2000
      })
    }
  },

  // 提醒时间选择器变化
  onReminderTimeChange(e) {
    const reminderTime = e.detail.value
    wx.setStorageSync('reminderTime', reminderTime)
    this.setData({ reminderTime })
    
    // 更新全局数据
    const app = getApp()
    if (app.globalData) {
      app.globalData.reminderTime = reminderTime
    }
  },

  // 加载统计数据
  loadStats() {
    const questions = wx.getStorageSync('questions') || []
    const reviewRecords = wx.getStorageSync('review_records') || []
    const checkinRecords = wx.getStorageSync('checkinRecords') || []
    
    const totalQuestions = questions.length
    const masteredCount = questions.filter(q => q.status === 'mastered').length
    const totalReviews = reviewRecords.length
    
    this.setData({
      stats: {
        totalDays: checkinRecords.length,
        totalQuestions: totalQuestions,
        totalReviews: totalReviews,
        masteredCount: masteredCount
      }
    })
  },

  // 导出数据
  exportData() {
    wx.navigateTo({
      url: '/pages/export/export'
    })
  },

  // 清空所有数据
  clearAllData() {
    wx.showModal({
      title: '确认清空',
      content: '此操作将删除所有错题和复习记录，无法恢复，是否继续？',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          this.doClearData()
        }
      }
    })
  },

  // 执行清空
  doClearData() {
    wx.showLoading({ title: '清空中...' })
    
    // 清除本地存储
    wx.removeStorageSync('questions')
    wx.removeStorageSync('review_records')
    wx.removeStorageSync('checkinRecords')
    wx.removeStorageSync('examName')
    wx.removeStorageSync('examDate')
    
    // 初始化空数据
    wx.setStorageSync('questions', [])
    wx.setStorageSync('review_records', [])
    wx.setStorageSync('checkinRecords', [])
    
    wx.hideLoading()
    wx.showToast({ title: '已清空', icon: 'success' })
    
    this.loadSettings()
    this.loadStats()
  },

  // 显示关于
  showAbout() {
    wx.showModal({
      title: '关于郭子考公',
      content: '郭子考公是一款基于艾宾浩斯遗忘曲线的智能错题本小程序，帮助考公人群高效复习错题。\n\n核心功能：\n• 拍照录入错题\n• 艾宾浩斯遗忘曲线复习提醒\n• 学习数据统计\n\n版本：V00.00.02',
      showCancel: false
    })
  }
})

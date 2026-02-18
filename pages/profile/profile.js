// pages/profile/profile.js
const { getCountdown } = require('../../utils/date.js')

Page({
  data: {
    userInfo: null,
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
    const examDate = app.globalData.examDate || wx.getStorageSync('examDate')
    const reminderTime = app.globalData.reminderTime || wx.getStorageSync('reminderTime') || '20:00'
    const reminderEnabled = wx.getStorageSync('reminderEnabled') || false
    
    const days = getCountdown(examDate)
    
    this.setData({
      examDate: examDate || '',
      countdownDays: days > 0 ? days : 0,
      reminderTime: reminderTime,
      reminderEnabled: reminderEnabled
    })
  },

  // 设置考试日期
  setExamDate() {
    wx.showActionSheet({
      itemList: ['设置考试日期', '清除考试日期'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.showDatePicker()
        } else {
          const app = getApp()
          app.globalData.examDate = null
          wx.removeStorageSync('examDate')
          this.setData({ examDate: '', countdownDays: 0 })
        }
      }
    })
  },

  // 显示日期选择器
  showDatePicker() {
    // 使用 input 的 date 类型
    const today = new Date().toISOString().split('T')[0]
    
    wx.showModal({
      title: '设置考试日期',
      content: '请输入考试日期（格式：2024-12-31）',
      editable: true,
      success: (res) => {
        if (res.confirm && res.content) {
          const dateStr = res.content.trim()
          // 验证日期格式
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const app = getApp()
            app.globalData.examDate = dateStr
            wx.setStorageSync('examDate', dateStr)
            
            const days = getCountdown(dateStr)
            this.setData({
              examDate: dateStr,
              countdownDays: days > 0 ? days : 0
            })
          } else {
            wx.showToast({ title: '日期格式错误', icon: 'none' })
          }
        }
      }
    })
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

  // 设置提醒时间
  setReminderTime() {
    wx.showModal({
      title: '设置提醒时间',
      content: '请输入时间（格式：20:00）',
      editable: true,
      success: (res) => {
        if (res.confirm && res.content) {
          const timeStr = res.content.trim()
          if (/^\d{2}:\d{2}$/.test(timeStr)) {
            wx.setStorageSync('reminderTime', timeStr)
            this.setData({ reminderTime: timeStr })
          } else {
            wx.showToast({ title: '时间格式错误', icon: 'none' })
          }
        }
      }
    })
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
    wx.showLoading({ title: '准备导出...' })
    
    const questions = wx.getStorageSync('questions') || []
    const reviewRecords = wx.getStorageSync('review_records') || []
    
    const exportData = {
      exportDate: new Date().toISOString(),
      questions: questions,
      reviewRecords: reviewRecords
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    
    // 复制到剪贴板
    wx.setClipboardData({
      data: dataStr,
      success: () => {
        wx.hideLoading()
        wx.showModal({
          title: '导出成功',
          content: '数据已复制到剪贴板，您可以粘贴到文本编辑器中保存',
          showCancel: false
        })
      }
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
    
    // 初始化空数据
    wx.setStorageSync('questions', [])
    wx.setStorageSync('review_records', [])
    wx.setStorageSync('checkinRecords', [])
    
    wx.hideLoading()
    wx.showToast({ title: '已清空', icon: 'success' })
    
    this.loadStats()
  },

  // 显示关于
  showAbout() {
    wx.showModal({
      title: '关于郭子考公',
      content: '郭子考公是一款基于艾宾浩斯遗忘曲线的智能错题本小程序，帮助考公人群高效复习错题。\n\n核心功能：\n• 拍照录入错题\n• 艾宾浩斯遗忘曲线复习提醒\n• 学习数据统计\n\n版本：v1.0.0',
      showCancel: false
    })
  }
})

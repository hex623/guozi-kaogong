// app.js
App({
  onLaunch: function () {
    // 初始化本地存储数据结构
    this.initLocalStorage()
    
    // 检查登录状态
    this.checkLoginStatus()
    
    // 初始化全局数据
    this.globalData = {
      userInfo: null,
      examName: wx.getStorageSync('examName') || '',
      examDate: wx.getStorageSync('examDate') || null,
      reminderTime: wx.getStorageSync('reminderTime') || '20:00'
    }
  },

  // 初始化本地存储
  initLocalStorage() {
    // 检查是否已有数据，没有则初始化
    if (!wx.getStorageSync('questions')) {
      wx.setStorageSync('questions', [])
    }
    if (!wx.getStorageSync('review_records')) {
      wx.setStorageSync('review_records', [])
    }
    if (!wx.getStorageSync('checkinRecords')) {
      wx.setStorageSync('checkinRecords', [])
    }
  },

  checkLoginStatus() {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: (res) => {
              this.globalData.userInfo = res.userInfo
            }
          })
        }
      }
    })
  },

  globalData: {
    userInfo: null,
    examDate: null,
    reminderTime: '20:00'
  }
})

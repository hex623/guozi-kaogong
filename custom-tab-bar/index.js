Component({
  data: {
    selected: 0,
    color: '#999',
    selectedColor: '#333',
    list: [
      {
        pagePath: '/pages/index/index',
        text: '首页',
        icon: '🏠'
      },
      {
        pagePath: '/pages/add/add',
        text: '录入',
        icon: '➕'
      },
      {
        pagePath: '/pages/review/review',
        text: '复习',
        icon: '📚'
      },
      {
        pagePath: '/pages/library/library',
        text: '题库',
        icon: '📋'
      },
      {
        pagePath: '/pages/profile/profile',
        text: '我的',
        icon: '👤'
      }
    ]
  },

  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      const url = data.path
      wx.switchTab({ url })
      this.setData({
        selected: data.index
      })
    }
  }
})

// pages/library/library.js
Page({
  data: {
    questions: [],
    filteredQuestions: [],
    allTags: [],
    selectedTag: '',
    statusFilter: 'all',
    searchKey: '',
    statusCounts: {
      all: 0,
      learning: 0,
      mastered: 0
    },
    loading: true,
    emptyText: '暂无错题'
  },

  onLoad() {
    this.loadQuestions()
  },

  onShow() {
    // 设置 tabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 3
      })
    }
    // 刷新数据
    this.loadQuestions()
  },

  // 加载错题列表
  loadQuestions() {
    this.setData({ loading: true })
    
    const questions = wx.getStorageSync('questions') || []
    
    const formattedQuestions = questions.map(q => ({
      ...q,
      addDate: this.formatDate(q.addDate)
    }))
    
    // 提取所有标签
    const allTags = new Set()
    questions.forEach(q => {
      if (q.tags) {
        q.tags.forEach(tag => allTags.add(tag))
      }
    })
    
    // 统计各状态数量
    const statusCounts = {
      all: questions.length,
      learning: questions.filter(q => q.status !== 'mastered').length,
      mastered: questions.filter(q => q.status === 'mastered').length
    }
    
    this.setData({
      questions: formattedQuestions,
      filteredQuestions: formattedQuestions,
      allTags: Array.from(allTags),
      statusCounts: statusCounts,
      loading: false
    })
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ searchKey: e.detail.value })
  },

  // 执行搜索
  doSearch() {
    this.applyFilters()
  },

  // 按标签筛选
  filterByTag(e) {
    const tag = e.currentTarget.dataset.tag
    this.setData({ selectedTag: tag }, this.applyFilters)
  },

  // 按状态筛选
  filterByStatus(e) {
    const status = e.currentTarget.dataset.status
    this.setData({ statusFilter: status }, this.applyFilters)
  },

  // 应用筛选
  applyFilters() {
    const filtered = this.filterQuestions(this.data.questions)
    this.setData({
      filteredQuestions: filtered,
      emptyText: this.getEmptyText()
    })
  },

  // 筛选逻辑
  filterQuestions(questions) {
    const { selectedTag, statusFilter, searchKey } = this.data
    
    return questions.filter(q => {
      // 标签筛选
      if (selectedTag && (!q.tags || !q.tags.includes(selectedTag))) {
        return false
      }
      
      // 状态筛选
      if (statusFilter !== 'all') {
        const qStatus = q.status || 'learning'
        if (statusFilter === 'mastered' && qStatus !== 'mastered') {
          return false
        }
        if (statusFilter === 'learning' && qStatus === 'mastered') {
          return false
        }
      }
      
      // 关键词搜索
      if (searchKey) {
        const key = searchKey.toLowerCase()
        const inTags = q.tags && q.tags.some(t => t.toLowerCase().includes(key))
        if (!inTags) {
          return false
        }
      }
      
      return true
    })
  },

  // 获取空状态文本
  getEmptyText() {
    const { searchKey, selectedTag, statusFilter } = this.data
    
    if (searchKey) {
      return `未找到包含"${searchKey}"的错题`
    }
    if (selectedTag) {
      return `暂无"${selectedTag}"标签的错题`
    }
    if (statusFilter === 'mastered') {
      return '还没有已掌握的错题，快去复习吧'
    }
    if (statusFilter === 'learning') {
      return '暂无学习中的错题'
    }
    return '暂无错题，点击录入开始记录'
  },

  // 跳转到详情
  goToDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/question-detail/question-detail?id=${id}`
    })
  },

  // 格式化日期
  formatDate(date) {
    if (!date) return ''
    const d = new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
})

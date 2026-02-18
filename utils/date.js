// utils/date.js
/**
 * 格式化日期
 */
function formatDate(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 获取今天日期字符串
 */
function getToday() {
  return formatDate(new Date())
}

/**
 * 获取倒计时天数
 */
function getCountdown(targetDate) {
  if (!targetDate) return null
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const target = new Date(targetDate)
  target.setHours(0, 0, 0, 0)
  
  const diff = target - today
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  
  return days
}

/**
 * 获取近7天日期数组
 */
function getLast7Days() {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(formatDate(d))
  }
  return days
}

/**
 * 获取近30天日期数组
 */
function getLast30Days() {
  const days = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(formatDate(d))
  }
  return days
}

module.exports = {
  formatDate,
  getToday,
  getCountdown,
  getLast7Days,
  getLast30Days
}

// utils/ebinhause.js
/**
 * 艾宾浩斯遗忘曲线复习间隔（天数）
 * 第1次复习：第1天
 * 第2次复习：第2天
 * 第3次复习：第4天
 * 第4次复习：第7天
 * 第5次复习：第15天
 */
const REVIEW_INTERVALS = [1, 2, 4, 7, 15]

/**
 * 计算下次复习日期
 * @param {Date} addDate 添加日期
 * @param {number} reviewCount 已复习次数
 * @returns {Date} 下次复习日期
 */
function getNextReviewDate(addDate, reviewCount = 0) {
  if (reviewCount >= REVIEW_INTERVALS.length) {
    return null // 已完成所有复习
  }
  
  const interval = REVIEW_INTERVALS[reviewCount]
  const nextDate = new Date(addDate)
  nextDate.setDate(nextDate.getDate() + interval)
  return nextDate
}

/**
 * 检查某道题今天是否需要复习
 * @param {Object} question 错题对象
 * @returns {boolean}
 */
function needsReviewToday(question) {
  if (question.status === 'mastered') {
    return false
  }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const nextReview = getNextReviewDate(
    new Date(question.addDate),
    question.reviewCount || 0
  )
  
  if (!nextReview) return false
  
  nextReview.setHours(0, 0, 0, 0)
  return nextReview <= today
}

/**
 * 获取复习优先级分数（用于排序）
 * @param {Object} question 错题对象
 * @returns {number} 分数越高优先级越高
 */
function getReviewPriority(question) {
  let priority = 0
  
  // 基础：复习次数越少优先级越高
  priority += (5 - (question.reviewCount || 0)) * 10
  
  // 用户标记"还需复习"的加分
  if (question.needsMoreReview) {
    priority += 20
  }
  
  // 错误次数多的加分
  priority += (question.wrongCount || 0) * 5
  
  return priority
}

module.exports = {
  REVIEW_INTERVALS,
  getNextReviewDate,
  needsReviewToday,
  getReviewPriority
}

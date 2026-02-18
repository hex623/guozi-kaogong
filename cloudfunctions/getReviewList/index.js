const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const REVIEW_INTERVALS = [1, 2, 4, 7, 15]

function getNextReviewDate(addDate, reviewCount) {
  if (reviewCount >= REVIEW_INTERVALS.length) {
    return null
  }
  const interval = REVIEW_INTERVALS[reviewCount]
  const nextDate = new Date(addDate)
  nextDate.setDate(nextDate.getDate() + interval)
  return nextDate
}

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

function getReviewPriority(question) {
  let priority = 0
  priority += (5 - (question.reviewCount || 0)) * 10
  if (question.needsMoreReview) {
    priority += 20
  }
  priority += (question.wrongCount || 0) * 5
  return priority
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  
  try {
    const res = await db.collection('questions').get()
    const questions = res.data
    
    const todayList = questions
      .filter(q => needsReviewToday(q))
      .map(q => ({
        ...q,
        priority: getReviewPriority(q)
      }))
      .sort((a, b) => b.priority - a.priority)
    
    return {
      success: true,
      data: todayList,
      count: todayList.length
    }
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}

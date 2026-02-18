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

exports.main = async (event, context) => {
  const { questionId, isMastered } = event
  const { OPENID } = cloud.getWXContext()
  
  try {
    // 获取题目
    const questionRes = await db.collection('questions').doc(questionId).get()
    const question = questionRes.data
    
    const newReviewCount = (question.reviewCount || 0) + 1
    
    // 更新题目状态
    const updateData = {
      reviewCount: newReviewCount,
      lastReviewDate: new Date(),
      needsMoreReview: !isMastered
    }
    
    if (newReviewCount >= 5 && isMastered) {
      updateData.status = 'mastered'
    }
    
    if (!isMastered) {
      updateData.wrongCount = db.command.inc(1)
    }
    
    await db.collection('questions').doc(questionId).update({
      data: updateData
    })
    
    // 记录复习历史
    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    
    await db.collection('review_records').add({
      data: {
        questionId: questionId,
        date: dateStr,
        completed: true,
        isMastered: isMastered,
        createTime: db.serverDate()
      }
    })
    
    // 计算下次复习日期
    const nextDate = getNextReviewDate(new Date(question.addDate), newReviewCount)
    
    return {
      success: true,
      data: {
        reviewCount: newReviewCount,
        status: updateData.status || 'learning',
        nextReviewDate: nextDate ? `${nextDate.getMonth() + 1}月${nextDate.getDate()}日` : null
      }
    }
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}

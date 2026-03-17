// cloudfunctions/settlement/getBalance/index.js
const { db, _, cloud } = require('../common/db')
const { COLLECTIONS } = require('../common/config')

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

exports.main = async (event) => {
  const { userId, periodId } = event

  if (!userId) {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    // 获取当前用户
    const userResult = await db.collection(COLLECTIONS.USER).where({
      openid
    }).get()

    if (userResult.data.length === 0) {
      return {
        success: false,
        message: '用户不存在'
      }
    }

    userId = userResult.data[0]._id
  }

  try {
    const today = new Date()
    const dateStr = formatDate(today)

    // 获取今日所有打卡记录
    const recordsResult = await db.collection(COLLECTIONS.CHECKIN_RECORD).where({
      userId: userId,
      date: dateStr
    }).get()

    // 获取条目信息
    let totalPoints = 0
    for (const record of recordsResult.data) {
      const itemResult = await db.collection(COLLECTIONS.CHECKIN_ITEM).doc(record.itemId).get()
      if (itemResult.data) {
        totalPoints += itemResult.data.points || 1
      }
    }

    return {
      success: true,
      data: {
        userId,
        periodId: periodId || null,
        date: dateStr,
        totalPoints,
        recordCount: recordsResult.data.length
      }
    }
  } catch (error) {
    console.error('获取余额失败:', error)
    return {
      success: false,
      message: '获取余额失败',
      error: error.message
    }
  }
}

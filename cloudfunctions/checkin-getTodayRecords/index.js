// cloudfunctions/checkin/getTodayRecords/index.js
const { db, _, cloud } = require('./common/db')
const { COLLECTIONS } = require('./common/config')

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

exports.main = async (event) => {
  const { userId } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    let targetUserId = userId

    // 如果没有指定 userId，使用当前用户
    if (!targetUserId) {
      // 获取用户
      const userResult = await db.collection(COLLECTIONS.USER).where({
        openid
      }).get()

      if (userResult.data.length === 0) {
        return {
          success: false,
          message: '用户不存在'
        }
      }

      targetUserId = userResult.data[0]._id
    }

    const today = new Date()
    const dateStr = formatDate(today)

    // 获取今日打卡记录
    const recordsResult = await db.collection(COLLECTIONS.CHECKIN_RECORD).where({
      userId: targetUserId,
      date: dateStr
    }).orderBy('createdAt', 'desc').get()

    return {
      success: true,
      data: recordsResult.data
    }
  } catch (error) {
    console.error('获取今日打卡记录失败:', error)
    return {
      success: false,
      message: '获取今日打卡记录失败',
      error: error.message
    }
  }
}

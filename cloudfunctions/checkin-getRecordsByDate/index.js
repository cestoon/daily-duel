/**
 * 获取指定日期的打卡记录
 * 用于查看历史日期的打卡情况
 */

const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

const COLLECTIONS = {
  USER: 'User',
  CHECKIN_RECORD: 'CheckinRecord'
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { date } = event

  if (!date) {
    return {
      success: false,
      message: '日期参数缺失'
    }
  }

  try {
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

    const user = userResult.data[0]

    // 获取指定日期的打卡记录
    const records = await db.collection(COLLECTIONS.CHECKIN_RECORD).where({
      userId: user._id,
      date: date
    }).get()

    return {
      success: true,
      data: records.data
    }
  } catch (error) {
    console.error('获取打卡记录失败:', error)
    return {
      success: false,
      message: '获取打卡记录失败',
      error: error.message
    }
  }
}

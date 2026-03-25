// cloudfunctions/stats-getDailyTrend/index.js
// 获取每日打卡趋势

const { db, _, cloud } = require('./common/db')
const { COLLECTIONS } = require('./common/config')

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

exports.main = async (event) => {
  const { days = 7 } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
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

    const user = userResult.data[0]
    const partner = await db.collection(COLLECTIONS.USER).doc(user.partnerId).get()

    // 生成最近N天的日期列表
    const dates = []
    const now = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      dates.push({
        date: formatDate(d),
        dayOfWeek: ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
      })
    }

    const trend = []

    for (const dateItem of dates) {
      // 获取我的当日记录
      const myRecords = await db.collection(COLLECTIONS.CHECKIN_RECORD).where({
        userId: user._id,
        date: dateItem.date
      }).get()

      const myCompleted = myRecords.data.filter(r => r.status === 'completed').length
      const myMissed = myRecords.data.filter(r => r.status === 'missed').length

      let partnerCompleted = 0
      let partnerMissed = 0

      if (partner.data) {
        // 获取伙伴当日记录
        const partnerRecords = await db.collection(COLLECTIONS.CHECKIN_RECORD).where({
          userId: partner.data._id,
          date: dateItem.date
        }).get()

        partnerCompleted = partnerRecords.data.filter(r => r.status === 'completed').length
        partnerMissed = partnerRecords.data.filter(r => r.status === 'missed').length
      }

      trend.push({
        date: dateItem.date,
        dayOfWeek: dateItem.dayOfWeek,
        myCompleted,
        myMissed,
        myTotal: myCompleted + myMissed,
        partnerCompleted,
        partnerMissed,
        partnerTotal: partnerCompleted + partnerMissed
      })
    }

    return {
      success: true,
      data: trend
    }
  } catch (error) {
    console.error('获取每日趋势失败:', error)
    return {
      success: false,
      message: '获取每日趋势失败',
      error: error.message
    }
  }
}

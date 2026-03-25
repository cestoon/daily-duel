// cloudfunctions/stats-getHistory/index.js
// 获取历史周期统计数据

const { db, _, cloud } = require('./common/db')
const { COLLECTIONS, PERIOD_STATUS } = require('./common/config')

exports.main = async (event) => {
  const { limit = 10 } = event
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

    if (!partner.data) {
      return {
        success: true,
        data: []
      }
    }

    // 获取已完成的周期（按时间倒序）
    const periodsResult = await db.collection(COLLECTIONS.PERIOD).where({
      status: PERIOD_STATUS.COMPLETED
    }).orderBy('endDate', 'desc').limit(limit).get()

    const periods = []

    for (const period of periodsResult.data) {
      // 获取我的统计
      const myRecords = await db.collection(COLLECTIONS.CHECKIN_RECORD).where({
        userId: user._id,
        periodId: period._id
      }).get()

      // 获取伙伴统计
      const partnerRecords = await db.collection(COLLECTIONS.CHECKIN_RECORD).where({
        userId: partner.data._id,
        periodId: period._id
      }).get()

      // 计算积分
      const myCompleted = await calculatePoints(myRecords.data.filter(r => r.status === 'completed'))
      const myMissed = await calculatePoints(myRecords.data.filter(r => r.status === 'missed'))
      
      const partnerCompleted = await calculatePoints(partnerRecords.data.filter(r => r.status === 'completed'))
      const partnerMissed = await calculatePoints(partnerRecords.data.filter(r => r.status === 'missed'))

      // 获取结算信息
      const settlementResult = await db.collection(COLLECTIONS.SETTLEMENT).where({
        periodId: period._id
      }).get()

      let settlement = null
      if (settlementResult.data.length > 0) {
        const s = settlementResult.data[0]
        settlement = {
          amount: s.amount,
          winner: s.payerId === user._id ? 'partner' : 'me',
          status: s.status
        }
      }

      periods.push({
        _id: period._id,
        startDate: period.startDate,
        endDate: period.endDate,
        status: period.status,
        myCompleted,
        myMissed,
        partnerCompleted,
        partnerMissed,
        settlement
      })
    }

    return {
      success: true,
      data: periods
    }
  } catch (error) {
    console.error('获取历史统计失败:', error)
    return {
      success: false,
      message: '获取历史统计失败',
      error: error.message
    }
  }
}

// 计算积分
async function calculatePoints(records) {
  if (records.length === 0) return 0
  
  const { COLLECTIONS } = require('./common/config')
  
  const itemIds = [...new Set(records.map(r => r.itemId))]
  
  const itemsResult = await db.collection(COLLECTIONS.CHECKIN_ITEM).where({
    _id: _.in(itemIds)
  }).get()
  
  const itemsMap = {}
  itemsResult.data.forEach(item => {
    itemsMap[item._id] = item.points || 1
  })
  
  let total = 0
  records.forEach(record => {
    total += itemsMap[record.itemId] || 1
  })
  
  return total
}

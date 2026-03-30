// cloudfunctions/settlement/getMissedPoints/index.js
const { db, _, cloud } = require('./common/db')
const { COLLECTIONS } = require('./common/config')

exports.main = async (event) => {
  const { userId, periodId } = event

  let targetUserId = userId

  if (!targetUserId) {
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

    targetUserId = userResult.data[0]._id
  }

  try {
    // 获取用户当前周期
    let targetPeriodId = periodId
    if (!targetPeriodId) {
      const userResult = await db.collection(COLLECTIONS.USER).doc(targetUserId).get()
      if (userResult.data) {
        targetPeriodId = userResult.data.currentPeriodId
      }
    }

    if (!targetPeriodId) {
      // 没有周期，返回 0
      return {
        success: true,
        data: {
          userId: targetUserId,
          periodId: null,
          totalMissedPoints: 0,
          missedCount: 0
        }
      }
    }

    // 获取用户配置（检查是否开启周末免打卡）
    const userResult = await db.collection(COLLECTIONS.USER).doc(targetUserId).get()
    const weekendSkip = userResult.data?.weekendSkip || false

    // 获取该周期的所有漏卡记录
    const recordsResult = await db.collection(COLLECTIONS.CHECKIN_RECORD).where({
      userId: targetUserId,
      periodId: targetPeriodId,
      status: 'missed'
    }).get()

    if (recordsResult.data.length === 0) {
      return {
        success: true,
        data: {
          userId: targetUserId,
          periodId: targetPeriodId,
          totalMissedPoints: 0,
          missedCount: 0
        }
      }
    }

    // ✅ 过滤周末漏卡（如果用户开启了周末免打卡）
    let filteredRecords = recordsResult.data
    if (weekendSkip) {
      filteredRecords = recordsResult.data.filter(record => {
        const recordDate = new Date(record.date)
        const day = recordDate.getDay()
        // 0=周日, 6=周六
        return day !== 0 && day !== 6
      })
    }

    // ✅ 优先使用记录中的快照积分（防止条目删除后丢失积分）
    let totalMissedPoints = 0
    const missingItemIds = []

    for (const record of filteredRecords) {
      if (record.itemPoints !== undefined) {
        // 有快照积分，直接使用
        totalMissedPoints += record.itemPoints
      } else {
        // 没有快照积分（旧数据），需要查询条目
        missingItemIds.push(record.itemId)
      }
    }

    // 如果有旧数据没有快照，批量查询条目
    if (missingItemIds.length > 0) {
      const itemsResult = await db.collection(COLLECTIONS.CHECKIN_ITEM).where({
        _id: _.in(missingItemIds)
      }).get()

      const itemsMap = {}
      itemsResult.data.forEach(item => {
        itemsMap[item._id] = item.points || 10
      })

      // 补充旧数据的积分
      for (const record of filteredRecords) {
        if (record.itemPoints === undefined) {
          totalMissedPoints += itemsMap[record.itemId] || 10
        }
      }
    }

    return {
      success: true,
      data: {
        userId: targetUserId,
        periodId: targetPeriodId,
        totalMissedPoints,
        missedCount: filteredRecords.length,
        weekendSkip: weekendSkip,
        totalRecords: recordsResult.data.length,
        filteredRecords: filteredRecords.length
      }
    }
  } catch (error) {
    console.error('获取漏卡积分失败:', error)
    return {
      success: false,
      message: '获取漏卡积分失败',
      error: error.message
    }
  }
}

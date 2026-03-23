// cloudfunctions/settlement/getBalance/index.js
const { db, _, cloud } = require('./common/db')
const { COLLECTIONS } = require('./common/config')

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

exports.main = async (event) => {
  let { userId, periodId } = event
  const wxContext = cloud.getWXContext()

  // 如果没有传 userId，使用当前登录用户
  if (!userId) {
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
    // 获取用户当前周期
    let targetPeriodId = periodId
    if (!targetPeriodId) {
      const userResult = await db.collection(COLLECTIONS.USER).doc(userId).get()
      if (userResult.data) {
        targetPeriodId = userResult.data.currentPeriodId
      }
    }

    if (!targetPeriodId) {
      // 没有周期，返回 0
      return {
        success: true,
        data: {
          userId,
          periodId: null,
          totalPoints: 0,
          recordCount: 0
        }
      }
    }

    // 获取该周期的所有打卡记录
    const recordsResult = await db.collection(COLLECTIONS.CHECKIN_RECORD).where({
      userId: userId,
      periodId: targetPeriodId
    }).get()

    // ✅ 批量获取所有 itemId
    const completedRecords = recordsResult.data.filter(r => r.status === 'completed')
    const itemIds = [...new Set(completedRecords.map(r => r.itemId))]

    if (itemIds.length === 0) {
      return {
        success: true,
        data: {
          userId,
          periodId: targetPeriodId,
          totalPoints: 0,
          recordCount: recordsResult.data.length
        }
      }
    }

    // ✅ 一次性查询所有条目（避免N+1问题）
    const itemsResult = await db.collection(COLLECTIONS.CHECKIN_ITEM).where({
      _id: _.in(itemIds)
    }).get()

    // 构建 itemId -> points 映射
    const itemsMap = {}
    itemsResult.data.forEach(item => {
      itemsMap[item._id] = item.points || 1
    })

    // 计算总积分
    let totalPoints = 0
    for (const record of completedRecords) {
      totalPoints += itemsMap[record.itemId] || 1
    }

    return {
      success: true,
      data: {
        userId,
        periodId: targetPeriodId,
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

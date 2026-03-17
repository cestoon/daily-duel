// cloudfunctions/period/create/index.js
const { db, _, cloud } = require('./common/db')
const { COLLECTIONS, PERIOD_STATUS } = require('./common/config')

function getMondayOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday
}

function getSundayOfWeek(date) {
  const monday = getMondayOfWeek(date)
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return sunday
}

exports.main = async (event) => {
  const { userIds } = event

  if (!userIds || userIds.length === 0) {
    return {
      success: false,
      message: '用户ID不能为空'
    }
  }

  try {
    const now = new Date()
    const monday = getMondayOfWeek(now)
    const sunday = getSundayOfWeek(now)

    // 创建新周期
    const periodResult = await db.collection(COLLECTIONS.PERIOD).add({
      data: {
        startDate: monday,
        endDate: sunday,
        status: PERIOD_STATUS.ACTIVE,
        createdAt: now,
        updatedAt: now
      }
    })

    const periodId = periodResult._id

    // 更新用户的当期周期
    for (const userId of userIds) {
      await db.collection(COLLECTIONS.USER).doc(userId).update({
        data: {
          currentPeriodId: periodId,
          updatedAt: now
        }
      })
    }

    return {
      success: true,
      data: { periodId },
      message: '周期创建成功'
    }
  } catch (error) {
    console.error('创建周期失败:', error)
    return {
      success: false,
      message: '创建周期失败',
      error: error.message
    }
  }
}

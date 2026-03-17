// cloudfunctions/timer/dailyCheck/index.js
const { db, _, cloud } = require('../../common/db')
const { COLLECTIONS, CHECKIN_STATUS, PERIOD_STATUS } = require('../../common/config')

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

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
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = formatDate(yesterday)

  try {
    console.log('开始每日打卡检查:', yesterdayStr)

    // 获取所有活跃周期的用户
    const activePeriods = await db.collection(COLLECTIONS.PERIOD).where({
      status: PERIOD_STATUS.ACTIVE
    }).get()

    const periodIds = activePeriods.data.map(p => p._id)

    // 获取这些周期的用户
    const users = await db.collection(COLLECTIONS.USER).where({
      currentPeriodId: _.in(periodIds)
    }).get()

    let missedCount = 0

    // 检查每个用户昨天的打卡情况
    for (const user of users.data) {
      // 获取用户的所有启用的打卡条目
      const items = await db.collection(COLLECTIONS.CHECKIN_ITEM).where({
        userId: user._id,
        enabled: true
      }).get()

      for (const item of items.data) {
        // 检查昨天是否已打卡
        const existingRecord = await db.collection(COLLECTIONS.CHECKIN_RECORD).where({
          userId: user._id,
          itemId: item._id,
          date: yesterdayStr
        }).get()

        if (existingRecord.data.length === 0) {
          // 未打卡，创建漏卡记录
          await db.collection(COLLECTIONS.CHECKIN_RECORD).add({
            data: {
              userId: user._id,
              itemId: item._id,
              periodId: user.currentPeriodId,
              date: yesterdayStr,
              status: CHECKIN_STATUS.MISSED,
              checkinTime: null,
              note: '',
              createdAt: now,
              updatedAt: now
            }
          })
          missedCount++
          console.log(`用户 ${user.nickName} 条目 ${item.title} 漏卡`)
        }
      }
    }

    console.log('每日打卡检查完成，漏卡数量:', missedCount)

    return {
      success: true,
      data: {
        checkedDate: yesterdayStr,
        checkedUserCount: users.data.length,
        missedCount
      }
    }
  } catch (error) {
    console.error('每日打卡检查失败:', error)
    return {
      success: false,
      message: '每日打卡检查失败',
      error: error.message
    }
  }
}

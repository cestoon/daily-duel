// cloudfunctions/timer/dailyCheck/index.js
const { db, _, cloud } = require('./common/db')
const { COLLECTIONS, CHECKIN_STATUS, PERIOD_STATUS } = require('./common/config')

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
  const todayStr = formatDate(now)
  const dayOfWeek = now.getDay() // 0=周日, 6=周六

  try {
    console.log('开始每日打卡检查（23:59）:', todayStr, `星期${dayOfWeek === 0 ? '日' : dayOfWeek}`)

    // 获取所有活跃周期的用户
    const activePeriods = await db.collection(COLLECTIONS.PERIOD).where({
      status: PERIOD_STATUS.ACTIVE
    }).get()

    if (activePeriods.data.length === 0) {
      console.log('没有活跃周期，跳过检查')
      return {
        success: true,
        data: {
          checkedDate: todayStr,
          checkedUserCount: 0,
          missedCount: 0
        }
      }
    }

    const periodIds = activePeriods.data.map(p => p._id)

    // 获取这些周期的用户
    const users = await db.collection(COLLECTIONS.USER).where({
      currentPeriodId: _.in(periodIds)
    }).get()

    let missedCount = 0
    let checkedItemCount = 0

    // 检查每个用户今天的打卡情况
    for (const user of users.data) {
      // 检查用户是否开启周末免打卡
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 // 周六或周日
      const weekendSkipEnabled = user.weekendSkip === true

      if (isWeekend && weekendSkipEnabled) {
        console.log(`用户 ${user.nickName} 开启了周末免打卡，跳过今日检查`)
        continue
      }

      // 获取用户的所有启用的打卡条目
      const items = await db.collection(COLLECTIONS.CHECKIN_ITEM).where({
        userId: user._id,
        enabled: true
      }).get()

      for (const item of items.data) {
        checkedItemCount++
        
        // 检查今天是否已有记录
        const existingRecord = await db.collection(COLLECTIONS.CHECKIN_RECORD).where({
          userId: user._id,
          itemId: item._id,
          date: todayStr
        }).get()

        if (existingRecord.data.length === 0) {
          // 今天没有任何记录，创建漏卡记录（保存条目快照）
          await db.collection(COLLECTIONS.CHECKIN_RECORD).add({
            data: {
              userId: user._id,
              itemId: item._id,
              itemTitle: item.title,              // ✅ 新增：条目标题快照
              itemPoints: item.points || 10,      // ✅ 新增：条目积分快照
              periodId: user.currentPeriodId,
              date: todayStr,
              status: CHECKIN_STATUS.MISSED,
              checkinTime: null,
              note: '自动标记漏卡',
              createdAt: now,
              updatedAt: now
            }
          })
          missedCount++
          console.log(`用户 ${user.nickName} 条目 ${item.title} 未打卡，自动标记漏卡`)
        } else {
          const record = existingRecord.data[0]
          if (record.status === CHECKIN_STATUS.MISSED) {
            console.log(`用户 ${user.nickName} 条目 ${item.title} 已标记漏卡`)
          } else {
            console.log(`用户 ${user.nickName} 条目 ${item.title} 已完成打卡 ✓`)
          }
        }
      }
    }

    console.log('每日打卡检查完成')
    console.log(`- 检查日期: ${todayStr}`)
    console.log(`- 检查用户: ${users.data.length}`)
    console.log(`- 检查条目: ${checkedItemCount}`)
    console.log(`- 新增漏卡: ${missedCount}`)

    return {
      success: true,
      data: {
        checkedDate: todayStr,
        checkedUserCount: users.data.length,
        checkedItemCount,
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

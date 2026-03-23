/**
 * 检查今日数据状态
 * 用于诊断为什么PK页面显示0
 */

const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

const COLLECTIONS = {
  USER: 'User',
  PERIOD: 'Period',
  CHECKIN_ITEM: 'CheckinItem',
  CHECKIN_RECORD: 'CheckinRecord'
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

exports.main = async (event, context) => {
  const now = new Date()
  const today = formatDate(now)

  try {
    console.log('=== 检查今日数据 ===')
    console.log('日期:', today)

    // 1. 获取所有用户
    const users = await db.collection(COLLECTIONS.USER).get()
    console.log('\n用户数量:', users.data.length)

    const report = {
      date: today,
      users: []
    }

    for (const user of users.data) {
      console.log(`\n--- 用户: ${user.nickName} (${user._id}) ---`)
      
      const userReport = {
        userId: user._id,
        nickName: user.nickName,
        currentPeriodId: user.currentPeriodId,
        todayRecords: [],
        todayStats: { completed: 0, missed: 0, total: 0 },
        weekStats: { completed: 0, missed: 0, total: 0 }
      }

      // 2. 获取今日打卡记录
      const todayRecords = await db.collection(COLLECTIONS.CHECKIN_RECORD).where({
        userId: user._id,
        date: today
      }).get()

      console.log('今日打卡记录数:', todayRecords.data.length)

      for (const record of todayRecords.data) {
        const item = await db.collection(COLLECTIONS.CHECKIN_ITEM).doc(record.itemId).get()
        
        const recordInfo = {
          itemId: record.itemId,
          itemTitle: item.data ? item.data.title : '未知',
          points: item.data ? item.data.points : 0,
          status: record.status,
          periodId: record.periodId,
          isPeriodCurrent: record.periodId === user.currentPeriodId
        }

        userReport.todayRecords.push(recordInfo)

        if (record.status === 'completed') {
          userReport.todayStats.completed++
        } else if (record.status === 'missed') {
          userReport.todayStats.missed++
        }

        console.log(`  - ${recordInfo.itemTitle}: ${record.status}, periodId=${record.periodId}, 匹配当前周期=${recordInfo.isPeriodCurrent}`)
      }

      userReport.todayStats.total = todayRecords.data.length

      // 3. 获取本周打卡记录（当前周期）
      if (user.currentPeriodId) {
        const weekRecords = await db.collection(COLLECTIONS.CHECKIN_RECORD).where({
          userId: user._id,
          periodId: user.currentPeriodId
        }).get()

        console.log('本周打卡记录数 (当前周期):', weekRecords.data.length)

        let weekCompleted = 0
        let weekMissed = 0

        for (const record of weekRecords.data) {
          if (record.status === 'completed') {
            weekCompleted++
          } else if (record.status === 'missed') {
            weekMissed++
          }
        }

        userReport.weekStats = {
          completed: weekCompleted,
          missed: weekMissed,
          total: weekRecords.data.length
        }

        console.log(`本周统计: 已完成 ${weekCompleted}, 漏卡 ${weekMissed}, 总计 ${weekRecords.data.length}`)
      } else {
        console.log('⚠️ 用户没有当前周期ID')
      }

      report.users.push(userReport)
    }

    // 4. 生成问题诊断
    const issues = []

    for (const userReport of report.users) {
      // 检查今日记录的周期ID
      const mismatchRecords = userReport.todayRecords.filter(r => !r.isPeriodCurrent)
      if (mismatchRecords.length > 0) {
        issues.push(`⚠️ 用户 ${userReport.nickName}: 有 ${mismatchRecords.length} 条今日记录的周期ID不匹配`)
      }

      // 检查今日有记录但本周统计为0
      if (userReport.todayStats.total > 0 && userReport.weekStats.total === 0) {
        issues.push(`❌ 用户 ${userReport.nickName}: 今日有 ${userReport.todayStats.total} 条记录，但本周统计为0（周期ID不匹配）`)
      }
    }

    if (issues.length === 0) {
      issues.push('✅ 数据状态正常')
    }

    report.issues = issues

    console.log('\n=== 诊断结果 ===')
    issues.forEach(issue => console.log(issue))

    return {
      success: true,
      data: report
    }
  } catch (error) {
    console.error('检查失败:', error)
    return {
      success: false,
      message: '检查失败',
      error: error.message
    }
  }
}

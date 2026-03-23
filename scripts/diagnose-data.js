/**
 * 数据诊断工具
 * 检查周期、用户、打卡记录的完整性
 * 
 * 使用方法：
 * 1. 上传为云函数到 cloudfunctions/scripts-diagnose/
 * 2. 在云开发控制台测试运行（不需要参数）
 */

const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

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

function getMondayOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday
}

exports.main = async (event, context) => {
  const now = new Date()
  const today = formatDate(now)
  const thisMonday = getMondayOfWeek(now)

  const report = {
    timestamp: now.toISOString(),
    today: today,
    thisWeekMonday: thisMonday.toISOString(),
    checks: {}
  }

  try {
    console.log('=== 开始数据诊断 ===')
    console.log('诊断时间:', now)
    console.log('今天:', today)

    // 1. 检查活动周期
    console.log('\n--- 检查周期 ---')
    const activePeriods = await db.collection(COLLECTIONS.PERIOD).where({
      status: 'active'
    }).get()

    report.checks.activePeriods = {
      count: activePeriods.data.length,
      periods: activePeriods.data.map(p => ({
        _id: p._id,
        startDate: p.startDate,
        endDate: p.endDate,
        isThisWeek: p.startDate.getTime() === thisMonday.getTime()
      }))
    }

    console.log('活动周期数量:', activePeriods.data.length)
    activePeriods.data.forEach(p => {
      console.log(`  周期 ${p._id}:`, p.startDate, '~', p.endDate)
    })

    // 2. 检查用户
    console.log('\n--- 检查用户 ---')
    const users = await db.collection(COLLECTIONS.USER).get()
    
    report.checks.users = {
      total: users.data.length,
      withPartner: 0,
      withCurrentPeriod: 0,
      details: []
    }

    for (const user of users.data) {
      const userInfo = {
        _id: user._id,
        nickName: user.nickName,
        hasPartner: !!user.partnerId,
        currentPeriodId: user.currentPeriodId || null
      }

      if (user.partnerId) {
        report.checks.users.withPartner++
      }

      if (user.currentPeriodId) {
        report.checks.users.withCurrentPeriod++
        
        // 检查周期是否匹配
        const period = activePeriods.data.find(p => p._id === user.currentPeriodId)
        if (period) {
          userInfo.periodIsActive = true
          userInfo.periodIsThisWeek = period.startDate.getTime() === thisMonday.getTime()
        } else {
          userInfo.periodIsActive = false
          userInfo.warning = '用户的周期ID不在活动周期中'
        }
      } else {
        userInfo.warning = '用户没有当前周期ID'
      }

      report.checks.users.details.push(userInfo)
      console.log(`  用户 ${user.nickName}:`, userInfo)
    }

    // 3. 检查打卡条目
    console.log('\n--- 检查打卡条目 ---')
    const items = await db.collection(COLLECTIONS.CHECKIN_ITEM).get()
    
    const itemsByUser = {}
    items.data.forEach(item => {
      if (!itemsByUser[item.userId]) {
        itemsByUser[item.userId] = []
      }
      itemsByUser[item.userId].push({
        _id: item._id,
        title: item.title,
        points: item.points,
        enabled: item.enabled
      })
    })

    report.checks.items = {
      total: items.data.length,
      byUser: Object.keys(itemsByUser).map(userId => ({
        userId,
        count: itemsByUser[userId].length,
        enabled: itemsByUser[userId].filter(i => i.enabled).length,
        items: itemsByUser[userId]
      }))
    }

    console.log('打卡条目总数:', items.data.length)
    Object.keys(itemsByUser).forEach(userId => {
      console.log(`  用户 ${userId}: ${itemsByUser[userId].length} 个条目`)
    })

    // 4. 检查今日打卡记录
    console.log('\n--- 检查今日打卡记录 ---')
    const todayRecords = await db.collection(COLLECTIONS.CHECKIN_RECORD).where({
      date: today
    }).get()

    const recordsByUser = {}
    todayRecords.data.forEach(record => {
      if (!recordsByUser[record.userId]) {
        recordsByUser[record.userId] = { completed: 0, missed: 0, records: [] }
      }
      if (record.status === 'completed') {
        recordsByUser[record.userId].completed++
      } else if (record.status === 'missed') {
        recordsByUser[record.userId].missed++
      }
      recordsByUser[record.userId].records.push({
        itemId: record.itemId,
        status: record.status,
        periodId: record.periodId
      })
    })

    report.checks.todayRecords = {
      total: todayRecords.data.length,
      byUser: Object.keys(recordsByUser).map(userId => ({
        userId,
        completed: recordsByUser[userId].completed,
        missed: recordsByUser[userId].missed,
        records: recordsByUser[userId].records
      }))
    }

    console.log('今日打卡记录总数:', todayRecords.data.length)
    Object.keys(recordsByUser).forEach(userId => {
      const stats = recordsByUser[userId]
      console.log(`  用户 ${userId}: 已完成 ${stats.completed}, 漏卡 ${stats.missed}`)
    })

    // 5. 检查本周打卡记录（所有活动周期）
    console.log('\n--- 检查本周打卡记录 ---')
    if (activePeriods.data.length > 0) {
      const periodIds = activePeriods.data.map(p => p._id)
      const weekRecords = await db.collection(COLLECTIONS.CHECKIN_RECORD).where({
        periodId: _.in(periodIds)
      }).get()

      report.checks.weekRecords = {
        total: weekRecords.data.length,
        completed: weekRecords.data.filter(r => r.status === 'completed').length,
        missed: weekRecords.data.filter(r => r.status === 'missed').length
      }

      console.log('本周打卡记录总数:', weekRecords.data.length)
      console.log('  已完成:', report.checks.weekRecords.completed)
      console.log('  漏卡:', report.checks.weekRecords.missed)
    }

    // 6. 生成诊断结论
    console.log('\n=== 诊断结论 ===')
    const issues = []

    if (activePeriods.data.length === 0) {
      issues.push('❌ 没有活动周期！需要创建本周周期')
    } else if (activePeriods.data.length > 1) {
      issues.push(`⚠️  存在 ${activePeriods.data.length} 个活动周期，应该只有1个`)
    }

    const thisWeekPeriod = activePeriods.data.find(p => 
      p.startDate.getTime() === thisMonday.getTime()
    )
    if (!thisWeekPeriod && activePeriods.data.length > 0) {
      issues.push('⚠️  活动周期不是本周的周期，可能是上周未结算')
    }

    report.checks.users.details.forEach(user => {
      if (user.warning) {
        issues.push(`⚠️  用户 ${user.nickName}: ${user.warning}`)
      }
    })

    if (issues.length === 0) {
      issues.push('✅ 数据状态正常')
    }

    report.issues = issues
    report.success = true

    issues.forEach(issue => console.log(issue))

    return report
  } catch (error) {
    console.error('诊断失败:', error)
    return {
      success: false,
      message: '诊断失败',
      error: error.message,
      stack: error.stack
    }
  }
}

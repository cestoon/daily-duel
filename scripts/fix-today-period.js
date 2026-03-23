/**
 * 修复今日打卡记录的周期ID
 * 将今日的打卡记录关联到用户的当前周期
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
    console.log('=== 开始修复今日打卡记录 ===')
    console.log('日期:', today)

    // 1. 获取所有用户
    const users = await db.collection(COLLECTIONS.USER).get()
    console.log('用户数量:', users.data.length)

    let totalFixed = 0

    for (const user of users.data) {
      if (!user.currentPeriodId) {
        console.log(`⚠️ 跳过用户 ${user.nickName}: 没有当前周期ID`)
        continue
      }

      console.log(`\n处理用户: ${user.nickName}`)
      console.log(`  当前周期ID: ${user.currentPeriodId}`)

      // 2. 获取今日打卡记录
      const todayRecords = await db.collection(COLLECTIONS.CHECKIN_RECORD).where({
        userId: user._id,
        date: today
      }).get()

      console.log(`  今日打卡记录数: ${todayRecords.data.length}`)

      // 3. 更新周期ID不匹配的记录
      let userFixed = 0
      for (const record of todayRecords.data) {
        if (record.periodId !== user.currentPeriodId) {
          console.log(`  - 修复记录 ${record._id}: ${record.periodId} → ${user.currentPeriodId}`)
          
          await db.collection(COLLECTIONS.CHECKIN_RECORD).doc(record._id).update({
            data: {
              periodId: user.currentPeriodId,
              updatedAt: now
            }
          })

          userFixed++
          totalFixed++
        } else {
          console.log(`  - 记录 ${record._id}: 周期ID已正确`)
        }
      }

      if (userFixed > 0) {
        console.log(`  ✅ 修复了 ${userFixed} 条记录`)
      }
    }

    console.log('\n=== 修复完成 ===')
    console.log(`总共修复了 ${totalFixed} 条记录`)

    return {
      success: true,
      data: {
        date: today,
        recordsFixed: totalFixed,
        message: totalFixed > 0 
          ? `成功修复 ${totalFixed} 条今日打卡记录的周期ID`
          : '所有记录的周期ID都是正确的'
      }
    }
  } catch (error) {
    console.error('修复失败:', error)
    return {
      success: false,
      message: '修复失败',
      error: error.message
    }
  }
}

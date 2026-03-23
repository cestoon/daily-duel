/**
 * 强制创建新周期并更新用户
 * 用于修复周一未自动创建新周期的问题
 * 
 * 使用方法：
 * 1. 上传为云函数到 cloudfunctions/scripts-forceNewPeriod/
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
  PERIOD: 'Period'
}

const PERIOD_STATUS = {
  ACTIVE: 'active',
  ENDED: 'ended'
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

exports.main = async (event, context) => {
  const now = new Date()
  const thisMonday = getMondayOfWeek(now)
  const thisSunday = getSundayOfWeek(now)

  try {
    console.log('=== 开始强制创建本周周期 ===')
    console.log('本周周期范围:', thisMonday, '~', thisSunday)

    // 1. 查找本周是否已有周期
    const existingPeriods = await db.collection(COLLECTIONS.PERIOD).where({
      startDate: thisMonday,
      status: PERIOD_STATUS.ACTIVE
    }).get()

    let currentPeriodId

    if (existingPeriods.data.length > 0) {
      console.log('本周周期已存在，使用已有周期ID:', existingPeriods.data[0]._id)
      currentPeriodId = existingPeriods.data[0]._id
    } else {
      // 2. 创建新周期
      const newPeriodResult = await db.collection(COLLECTIONS.PERIOD).add({
        data: {
          startDate: thisMonday,
          endDate: thisSunday,
          status: PERIOD_STATUS.ACTIVE,
          createdAt: now,
          updatedAt: now
        }
      })

      currentPeriodId = newPeriodResult._id
      console.log('✅ 新周期已创建:', currentPeriodId)
    }

    // 3. 关闭旧的活动周期（如果有）
    const oldActivePeriods = await db.collection(COLLECTIONS.PERIOD).where({
      status: PERIOD_STATUS.ACTIVE,
      endDate: _.lt(thisSunday)
    }).get()

    if (oldActivePeriods.data.length > 0) {
      console.log('发现', oldActivePeriods.data.length, '个旧的活动周期，准备关闭')
      
      for (const oldPeriod of oldActivePeriods.data) {
        if (oldPeriod._id !== currentPeriodId) {
          await db.collection(COLLECTIONS.PERIOD).doc(oldPeriod._id).update({
            data: {
              status: PERIOD_STATUS.ENDED,
              updatedAt: now
            }
          })
          console.log('✅ 已关闭旧周期:', oldPeriod._id)
        }
      }
    }

    // 4. 更新所有用户的 currentPeriodId 为新周期
    const allUsers = await db.collection(COLLECTIONS.USER).where({
      partnerId: _.neq(null)  // 只更新已绑定伙伴的用户
    }).get()

    console.log('找到', allUsers.data.length, '个已绑定伙伴的用户')

    let updatedCount = 0
    for (const user of allUsers.data) {
      if (user.currentPeriodId !== currentPeriodId) {
        await db.collection(COLLECTIONS.USER).doc(user._id).update({
          data: {
            currentPeriodId: currentPeriodId,
            updatedAt: now
          }
        })
        console.log(`✅ 已更新用户 ${user.nickName} 的周期ID`)
        updatedCount++
      } else {
        console.log(`ℹ️  用户 ${user.nickName} 的周期ID已是最新`)
      }
    }

    console.log('=== 周期修复完成 ===')
    console.log('当前周期ID:', currentPeriodId)
    console.log('更新用户数:', updatedCount)

    return {
      success: true,
      data: {
        periodId: currentPeriodId,
        periodRange: {
          start: thisMonday.toISOString(),
          end: thisSunday.toISOString()
        },
        usersUpdated: updatedCount,
        oldPeriodsClosed: oldActivePeriods.data.length
      }
    }
  } catch (error) {
    console.error('创建周期失败:', error)
    return {
      success: false,
      message: '创建周期失败',
      error: error.message,
      stack: error.stack
    }
  }
}

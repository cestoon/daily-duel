// cloudfunctions/timer/weeklySettlement/index.js
const { db, _, cloud } = require('../common/db')
const { COLLECTIONS, SETTLEMENT_STATUS, PERIOD_STATUS } = require('../common/config')

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

  try {
    console.log('开始每周结算')

    // 查找昨天结束的周期
    const yesterdayStr = formatDate(yesterday)
    const yesterdayEnd = new Date(yesterday)
    yesterdayEnd.setHours(23, 59, 59, 999)

    const periods = await db.collection(COLLECTIONS.PERIOD).where({
      status: PERIOD_STATUS.ACTIVE,
      endDate: _.lte(yesterdayEnd)
    }).get()

    if (periods.data.length === 0) {
      console.log('没有需要结算的周期')
      return {
        success: true,
        data: { message: '没有需要结算的周期' }
      }
    }

    let settlementCount = 0

    for (const period of periods.data) {
      console.log('处理周期:', period._id)

      // 获取该周期的用户
      const users = await db.collection(COLLECTIONS.USER).where({
        currentPeriodId: period._id
      }).get()

      if (users.data.length !== 2) {
        console.log('周期用户数量不正确，跳过:', users.data.length)
        continue
      }

      const user1 = users.data[0]
      const user2 = users.data[1]

      // 计算两个用户的总积分
      const balance1 = await calculateBalance(user1._id, period._id)
      const balance2 = await calculateBalance(user2._id, period._id)

      console.log(`用户 ${user1.nickName} 积分: ${balance1}`)
      console.log(`用户 ${user2.nickName} 积分: ${balance2}`)

      // 确定付款方和收款方
      let payerId, payeeId, amount
      if (balance1 > balance2) {
        payerId = user2._id
        payeeId = user1._id
        amount = balance1 - balance2
      } else if (balance2 > balance1) {
        payerId = user1._id
        payeeId = user2._id
        amount = balance2 - balance1
      } else {
        console.log('积分相同，无需结算')
        continue
      }

      // 创建结算记录
      await db.collection(COLLECTIONS.SETTLEMENT).add({
        data: {
          periodId: period._id,
          payerId,
          payeeId,
          amount,
          status: SETTLEMENT_STATUS.PENDING,
          payerConfirmed: false,
          payerConfirmTime: null,
          payeeConfirmed: false,
          payeeConfirmTime: null,
          completedAt: null,
          createdAt: now,
          updatedAt: now
        }
      })

      // 更新周期状态
      await db.collection(COLLECTIONS.PERIOD).doc(period._id).update({
        data: {
          status: PERIOD_STATUS.ENDED,
          updatedAt: now
        }
      })

      settlementCount++
      console.log('结算记录已创建，金额:', amount)
    }

    console.log('每周结算完成，结算数量:', settlementCount)

    return {
      success: true,
      data: {
        settlementCount
      }
    }
  } catch (error) {
    console.error('每周结算失败:', error)
    return {
      success: false,
      message: '每周结算失败',
      error: error.message
    }
  }
}

async function calculateBalance(userId, periodId) {
  const { COLLECTIONS } = require('../common/config')

  // 获取该用户在该周期的所有打卡记录
  const records = await db.collection(COLLECTIONS.CHECKIN_RECORD).where({
    userId,
    periodId
  }).get()

  let totalPoints = 0
  for (const record of records.data) {
    if (record.status === 'completed') {
      const item = await db.collection(COLLECTIONS.CHECKIN_ITEM).doc(record.itemId).get()
      if (item.data) {
        totalPoints += item.data.points || 1
      }
    }
  }

  return totalPoints
}

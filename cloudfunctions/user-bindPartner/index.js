// cloudfunctions/user/bindPartner/index.js
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
  const { partnerCode } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
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

    const user = userResult.data[0]

    // 检查是否已有伙伴
    if (user.partnerId) {
      return {
        success: false,
        message: '已有伙伴'
      }
    }

    // 🎯 改进：通过邀请码查找伙伴（优先）
    let partnerResult
    
    // 如果输入的是6位数字，按邀请码查询
    if (/^\d{6}$/.test(partnerCode)) {
      partnerResult = await db.collection(COLLECTIONS.USER).where({
        inviteCode: partnerCode
      }).get()
    } else {
      // 兼容旧逻辑：按 openid 查询
      partnerResult = await db.collection(COLLECTIONS.USER).where({
        openid: partnerCode
      }).get()
    }

    if (partnerResult.data.length === 0) {
      return {
        success: false,
        message: '邀请码无效或伙伴不存在'
      }
    }

    const partner = partnerResult.data[0]
    
    // 不能绑定自己
    if (partner._id === user._id) {
      return {
        success: false,
        message: '不能绑定自己'
      }
    }

    // 检查伙伴是否已有伙伴
    if (partner.partnerId) {
      return {
        success: false,
        message: '对方已有伙伴'
      }
    }

    const now = new Date()

    // 绑定伙伴关系
    await db.collection(COLLECTIONS.USER).doc(user._id).update({
      data: {
        partnerId: partner._id,
        updatedAt: now
      }
    })

    await db.collection(COLLECTIONS.USER).doc(partner._id).update({
      data: {
        partnerId: user._id,
        updatedAt: now
      }
    })

    // 创建本周周期
    const monday = getMondayOfWeek(now)
    const sunday = getSundayOfWeek(now)

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

    // 更新两个用户的当前周期
    await db.collection(COLLECTIONS.USER).doc(user._id).update({
      data: {
        currentPeriodId: periodId,
        updatedAt: now
      }
    })

    await db.collection(COLLECTIONS.USER).doc(partner._id).update({
      data: {
        currentPeriodId: periodId,
        updatedAt: now
      }
    })

    return {
      success: true,
      data: partner,
      message: '绑定成功'
    }
  } catch (error) {
    console.error('绑定伙伴失败:', error)
    return {
      success: false,
      message: '绑定失败',
      error: error.message
    }
  }
}

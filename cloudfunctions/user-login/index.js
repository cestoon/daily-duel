// cloudfunctions/user/login/index.js
const { db, _, cloud } = require('./common/db')
const { COLLECTIONS, PERIOD_STATUS } = require('./common/config')

// 生成6位数字邀请码
function generateInviteCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// 检查邀请码是否已存在
async function isInviteCodeExists(code) {
  const result = await db.collection(COLLECTIONS.USER).where({
    inviteCode: code
  }).count()
  return result.total > 0
}

// 为双方创建共享周期
async function createPeriodForBoth(userId, partnerId) {
  const now = new Date()
  const day = now.getDay()
  
  // 计算本周一
  const monday = new Date(now)
  const diff = monday.getDate() - day + (day === 0 ? -6 : 1)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  
  // 计算本周日
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  
  // 创建周期
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
  
  // 更新双方的周期ID
  await Promise.all([
    db.collection(COLLECTIONS.USER).doc(userId).update({
      data: { currentPeriodId: periodId }
    }),
    db.collection(COLLECTIONS.USER).doc(partnerId).update({
      data: { currentPeriodId: periodId }
    })
  ])
  
  return periodId
}

// 生成唯一邀请码
async function generateUniqueInviteCode() {
  let code
  let exists = true
  let attempts = 0
  
  while (exists && attempts < 10) {
    code = generateInviteCode()
    exists = await isInviteCodeExists(code)
    attempts++
  }
  
  if (exists) {
    // 如果10次都重复，使用时间戳保证唯一
    code = Date.now().toString().slice(-6)
  }
  
  return code
}

exports.main = async (event) => {
  const { nickName, avatarUrl } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 查找用户是否存在
    const userResult = await db.collection(COLLECTIONS.USER).where({
      openid
    }).get()

    let user

    if (userResult.data.length === 0) {
      // 创建新用户
      const now = new Date()
      const inviteCode = await generateUniqueInviteCode()
      
      const createResult = await db.collection(COLLECTIONS.USER).add({
        data: {
          openid,
          nickName,
          avatarUrl,
          inviteCode,
          partnerId: null,
          currentPeriodId: null,
          createdAt: now,
          updatedAt: now
        }
      })

      // 获取创建的用户
      const newUserResult = await db.collection(COLLECTIONS.USER).doc(createResult._id).get()
      user = newUserResult.data
    } else {
      // 更新用户信息
      user = userResult.data[0]
      
      // 如果老用户没有邀请码，生成一个
      if (!user.inviteCode) {
        const inviteCode = await generateUniqueInviteCode()
        await db.collection(COLLECTIONS.USER).doc(user._id).update({
          data: {
            inviteCode,
            nickName,
            avatarUrl,
            updatedAt: new Date()
          }
        })
        user.inviteCode = inviteCode
      } else {
        await db.collection(COLLECTIONS.USER).doc(user._id).update({
          data: {
            nickName,
            avatarUrl,
            updatedAt: new Date()
          }
        })
      }
      
      user.nickName = nickName
      user.avatarUrl = avatarUrl
    }

    // ✅ 容错：检查周期有效性
    if (user.currentPeriodId) {
      const periodResult = await db.collection(COLLECTIONS.PERIOD).doc(user.currentPeriodId).get()
      
      // 如果周期不存在或状态不是active，自动修复
      if (!periodResult.data || periodResult.data.status !== 'active') {
        console.log(`用户 ${user.nickName} 的周期无效，自动修复`)
        
        // 如果有伙伴，创建共享周期
        if (user.partnerId) {
          const partner = await db.collection(COLLECTIONS.USER).doc(user.partnerId).get()
          
          if (partner.data) {
            // 尝试使用伙伴的周期
            if (partner.data.currentPeriodId) {
              const partnerPeriod = await db.collection(COLLECTIONS.PERIOD).doc(partner.data.currentPeriodId).get()
              
              if (partnerPeriod.data && partnerPeriod.data.status === 'active') {
                // 使用伙伴的有效周期
                await db.collection(COLLECTIONS.USER).doc(user._id).update({
                  data: { currentPeriodId: partner.data.currentPeriodId }
                })
                user.currentPeriodId = partner.data.currentPeriodId
                console.log(`使用伙伴的周期: ${partner.data.currentPeriodId}`)
              } else {
                // 伙伴周期也无效，创建新周期
                const newPeriodId = await createPeriodForBoth(user._id, user.partnerId)
                user.currentPeriodId = newPeriodId
                console.log(`创建新周期: ${newPeriodId}`)
              }
            } else {
              // 伙伴没有周期，创建新周期
              const newPeriodId = await createPeriodForBoth(user._id, user.partnerId)
              user.currentPeriodId = newPeriodId
              console.log(`创建新周期: ${newPeriodId}`)
            }
          }
        }
      }
    }

    return {
      success: true,
      data: user
    }
  } catch (error) {
    console.error('登录失败:', error)
    return {
      success: false,
      message: '登录失败',
      error: error.message
    }
  }
}

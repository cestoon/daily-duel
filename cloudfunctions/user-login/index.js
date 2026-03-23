// cloudfunctions/user/login/index.js
const { db, _, cloud } = require('./common/db')
const { COLLECTIONS } = require('./common/config')

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

// cloudfunctions/user/login/index.js
const { db, _, cloud } = require('../common/db')
const { COLLECTIONS } = require('../common/config')

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
      const createResult = await db.collection(COLLECTIONS.USER).add({
        data: {
          openid,
          nickName,
          avatarUrl,
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
      await db.collection(COLLECTIONS.USER).doc(user._id).update({
        data: {
          nickName,
          avatarUrl,
          updatedAt: new Date()
        }
      })
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

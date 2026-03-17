// cloudfunctions/user/getInfo/index.js
const { db, _, cloud } = require('../common/db')
const { COLLECTIONS } = require('../common/config')

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
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
    return {
      success: true,
      data: user
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return {
      success: false,
      message: '获取用户信息失败',
      error: error.message
    }
  }
}

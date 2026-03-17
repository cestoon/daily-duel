// cloudfunctions/user/getPartner/index.js
const { db, _, cloud } = require('../common/db')
const { COLLECTIONS } = require('../common/config')

exports.main = async (event) => {
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

    if (!user.partnerId) {
      return {
        success: true,
        data: null,
        message: '尚未绑定伙伴'
      }
    }

    // 获取伙伴信息
    const partnerResult = await db.collection(COLLECTIONS.USER).doc(user.partnerId).get()

    if (partnerResult.data.length === 0) {
      return {
        success: false,
        message: '伙伴不存在'
      }
    }

    return {
      success: true,
      data: partnerResult.data
    }
  } catch (error) {
    console.error('获取伙伴信息失败:', error)
    return {
      success: false,
      message: '获取伙伴信息失败',
      error: error.message
    }
  }
}

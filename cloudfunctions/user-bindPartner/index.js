// cloudfunctions/user/bindPartner/index.js
const { db, _, cloud } = require('../common/db')
const { COLLECTIONS } = require('../common/config')

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

    // 查找伙伴（通过partnerCode，这里简化为openid）
    const partnerResult = await db.collection(COLLECTIONS.USER).where({
      openid: partnerCode
    }).get()

    if (partnerResult.data.length === 0) {
      return {
        success: false,
        message: '伙伴不存在'
      }
    }

    const partner = partnerResult.data[0]

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

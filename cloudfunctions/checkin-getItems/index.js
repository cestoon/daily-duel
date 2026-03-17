// cloudfunctions/checkin/getItems/index.js
const { db, _, cloud } = require('../common/db')
const { COLLECTIONS } = require('../common/config')

exports.main = async (event) => {
  const { partnerItems = false } = event
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
    let targetUserId = user._id

    // 如果请求伙伴的条目
    if (partnerItems) {
      if (!user.partnerId) {
        return {
          success: false,
          message: '尚未绑定伙伴'
        }
      }
      targetUserId = user.partnerId
    }

    // 获取条目列表
    const itemsResult = await db.collection(COLLECTIONS.CHECKIN_ITEM).where({
      userId: targetUserId,
      enabled: true
    }).orderBy('sort', 'asc').get()

    return {
      success: true,
      data: itemsResult.data
    }
  } catch (error) {
    console.error('获取打卡条目失败:', error)
    return {
      success: false,
      message: '获取打卡条目失败',
      error: error.message
    }
  }
}

// cloudfunctions/checkin/updateItem/index.js
const { db, _, cloud } = require('../common/db')
const { COLLECTIONS } = require('../common/config')

exports.main = async (event) => {
  const { itemId, title, points, time, enabled } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 获取用户
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

    // 获取条目
    const itemResult = await db.collection(COLLECTIONS.CHECKIN_ITEM).doc(itemId).get()

    if (!itemResult.data) {
      return {
        success: false,
        message: '条目不存在'
      }
    }

    const item = itemResult.data

    // 检查权限
    if (item.userId !== user._id) {
      return {
        success: false,
        message: '无权操作此条目'
      }
    }

    const now = new Date()
    const updateData = {
      updatedAt: now
    }

    if (title !== undefined) updateData.title = title
    if (points !== undefined) updateData.points = points
    if (time !== undefined) updateData.time = time
    if (enabled !== undefined) updateData.enabled = enabled

    // 更新条目
    await db.collection(COLLECTIONS.CHECKIN_ITEM).doc(itemId).update({
      data: updateData
    })

    return {
      success: true,
      message: '更新成功'
    }
  } catch (error) {
    console.error('更新条目失败:', error)
    return {
      success: false,
      message: '更新失败',
      error: error.message
    }
  }
}

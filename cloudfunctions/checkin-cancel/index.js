// cloudfunctions/checkin-cancel/index.js
const { db, cloud } = require('./common/db')
const { COLLECTIONS } = require('./common/config')

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

exports.main = async (event) => {
  const { itemId } = event
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

    // 获取打卡条目
    const itemResult = await db.collection(COLLECTIONS.CHECKIN_ITEM).doc(itemId).get()

    if (!itemResult.data) {
      return {
        success: false,
        message: '打卡条目不存在'
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
    const dateStr = formatDate(now)

    // 查找今日打卡记录
    const existingRecords = await db.collection(COLLECTIONS.CHECKIN_RECORD).where({
      userId: user._id,
      itemId: itemId,
      date: dateStr
    }).get()

    if (existingRecords.data.length === 0) {
      return {
        success: false,
        message: '今日未打卡'
      }
    }

    // 删除打卡记录
    await db.collection(COLLECTIONS.CHECKIN_RECORD).doc(existingRecords.data[0]._id).remove()

    return {
      success: true,
      message: '取消打卡成功'
    }
  } catch (error) {
    console.error('取消打卡失败:', error)
    return {
      success: false,
      message: '取消打卡失败',
      error: error.message
    }
  }
}

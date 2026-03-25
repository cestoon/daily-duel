// cloudfunctions/checkin/submit/index.js
const { db, _, cloud } = require('./common/db')
const { COLLECTIONS, CHECKIN_STATUS } = require('./common/config')

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

    // ✅ 容错：检查周期有效性
    if (!user.currentPeriodId) {
      return {
        success: false,
        message: '当前没有活跃周期，请刷新小程序重试'
      }
    }

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

    // 检查条目是否启用
    if (!item.enabled) {
      return {
        success: false,
        message: '条目已禁用'
      }
    }

    const now = new Date()
    const dateStr = formatDate(now)

    // 检查今日是否已打卡
    const existingRecord = await db.collection(COLLECTIONS.CHECKIN_RECORD).where({
      userId: user._id,
      itemId: itemId,
      date: dateStr
    }).get()

    if (existingRecord.data.length > 0) {
      return {
        success: false,
        message: '今日已打卡'
      }
    }

    // 创建打卡记录（保存条目快照，防止删除后丢失积分）
    await db.collection(COLLECTIONS.CHECKIN_RECORD).add({
      data: {
        userId: user._id,
        itemId: itemId,
        itemTitle: item.title,              // ✅ 新增：条目标题快照
        itemPoints: item.points || 10,      // ✅ 新增：条目积分快照
        periodId: user.currentPeriodId,
        date: dateStr,
        status: CHECKIN_STATUS.COMPLETED,
        checkinTime: now,
        note: '',
        createdAt: now,
        updatedAt: now
      }
    })

    return {
      success: true,
      message: '打卡成功'
    }
  } catch (error) {
    console.error('打卡失败:', error)
    return {
      success: false,
      message: '打卡失败',
      error: error.message
    }
  }
}

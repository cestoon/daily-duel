// cloudfunctions/fix-data/index.js
// 修复历史打卡记录，关联到当前周期

const { db, cloud } = require('./common/db')
const { COLLECTIONS } = require('./common/config')

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 获取当前用户
    const userResult = await db.collection(COLLECTIONS.USER).where({
      openid
    }).get()

    if (userResult.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }

    const user = userResult.data[0]
    const currentPeriodId = user.currentPeriodId

    if (!currentPeriodId) {
      return { success: false, message: '当前没有周期' }
    }

    // 查找所有 periodId 为 null 的打卡记录
    const recordsResult = await db.collection(COLLECTIONS.CHECKIN_RECORD).where({
      userId: user._id,
      periodId: _.or(_.eq(null), _.exists(false))
    }).get()

    if (recordsResult.data.length === 0) {
      return { success: true, message: '没有需要修复的记录', fixedCount: 0 }
    }

    // 批量更新
    let fixedCount = 0
    for (const record of recordsResult.data) {
      await db.collection(COLLECTIONS.CHECKIN_RECORD).doc(record._id).update({
        data: {
          periodId: currentPeriodId,
          updatedAt: new Date()
        }
      })
      fixedCount++
    }

    return {
      success: true,
      message: `成功修复 ${fixedCount} 条记录`,
      fixedCount
    }
  } catch (error) {
    console.error('修复数据失败:', error)
    return {
      success: false,
      message: '修复失败',
      error: error.message
    }
  }
}

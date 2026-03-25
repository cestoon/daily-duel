// 标记历史打卡记录云函数
const { db, _, cloud } = require('./common/db')
const { COLLECTIONS, CHECKIN_STATUS } = require('./common/config')

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { itemId, date, status } = event

  try {
    // 参数验证
    if (!itemId || !date || !status) {
      return {
        success: false,
        message: '参数不完整'
      }
    }

    if (status !== CHECKIN_STATUS.COMPLETED && status !== CHECKIN_STATUS.MISSED) {
      return {
        success: false,
        message: '状态值无效'
      }
    }

    // 验证日期不能是未来
    const targetDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (targetDate > today) {
      return {
        success: false,
        message: '不能标记未来日期'
      }
    }

    // 查询用户信息
    const userRes = await db.collection(COLLECTIONS.USER)
      .where({ openid: OPENID })
      .get()

    if (userRes.data.length === 0) {
      return {
        success: false,
        message: '用户不存在'
      }
    }

    const user = userRes.data[0]
    const userId = user._id

    // 查询条目信息（用于获取快照）
    const itemRes = await db.collection(COLLECTIONS.CHECKIN_ITEM)
      .doc(itemId)
      .get()

    if (!itemRes.data) {
      return {
        success: false,
        message: '条目不存在'
      }
    }

    const item = itemRes.data

    // 检查是否已有该日期的打卡记录
    const existingRecordRes = await db.collection(COLLECTIONS.CHECKIN_RECORD)
      .where({
        userId,
        itemId,
        date
      })
      .get()

    const now = new Date()

    if (existingRecordRes.data.length > 0) {
      // 已有记录，更新状态
      const recordId = existingRecordRes.data[0]._id
      
      await db.collection(COLLECTIONS.CHECKIN_RECORD)
        .doc(recordId)
        .update({
          data: {
            status,
            itemTitle: item.title,     // 更新快照
            itemPoints: item.points,   // 更新快照
            updatedAt: now
          }
        })

      return {
        success: true,
        message: '更新成功',
        action: 'update'
      }
    } else {
      // 没有记录，创建新记录
      await db.collection(COLLECTIONS.CHECKIN_RECORD).add({
        data: {
          userId,
          itemId,
          date,
          status,
          itemTitle: item.title,     // 保存快照
          itemPoints: item.points,   // 保存快照
          periodId: user.currentPeriodId || null,
          createdAt: now,
          updatedAt: now
        }
      })

      return {
        success: true,
        message: '创建成功',
        action: 'create'
      }
    }
  } catch (error) {
    console.error('[checkin-markHistorical] 错误:', error)
    return {
      success: false,
      message: '操作失败: ' + error.message
    }
  }
}

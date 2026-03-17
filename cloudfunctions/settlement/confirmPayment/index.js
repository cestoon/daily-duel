// cloudfunctions/settlement/confirmPayment/index.js
const { db, _, cloud } = require('../../common/db')
const { COLLECTIONS, SETTLEMENT_STATUS } = require('../../common/config')

exports.main = async (event) => {
  const { settlementId } = event
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

    // 获取结算记录
    const settlementResult = await db.collection(COLLECTIONS.SETTLEMENT).doc(settlementId).get()

    if (!settlementResult.data) {
      return {
        success: false,
        message: '结算记录不存在'
      }
    }

    const settlement = settlementResult.data

    // 检查权限
    if (settlement.payerId !== user._id && settlement.payeeId !== user._id) {
      return {
        success: false,
        message: '无权操作此记录'
      }
    }

    const now = new Date()

    // 更新确认状态
    let updateData = {
      updatedAt: now
    }

    if (settlement.payerId === user._id) {
      updateData.payerConfirmed = true
      updateData.payerConfirmTime = now
    } else {
      updateData.payeeConfirmed = true
      updateData.payeeConfirmTime = now
    }

    // 如果双方都已确认，标记为完成
    const newSettlement = { ...settlement, ...updateData }
    if (newSettlement.payerConfirmed && newSettlement.payeeConfirmed) {
      updateData.status = SETTLEMENT_STATUS.COMPLETED
      updateData.completedAt = now
    }

    await db.collection(COLLECTIONS.SETTLEMENT).doc(settlementId).update({
      data: updateData
    })

    return {
      success: true,
      message: '确认成功'
    }
  } catch (error) {
    console.error('确认支付失败:', error)
    return {
      success: false,
      message: '确认失败',
      error: error.message
    }
  }
}

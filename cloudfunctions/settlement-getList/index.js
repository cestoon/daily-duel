// cloudfunctions/settlement/getList/index.js
const { db, _, cloud } = require('./common/db')
const { COLLECTIONS } = require('./common/config')

exports.main = async (event) => {
  const { limit = 20, offset = 0 } = event
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

    // 获取结算列表（作为付款方或收款方）
    const settlementResult = await db.collection(COLLECTIONS.SETTLEMENT).where(
      _.or([
        { payerId: user._id },
        { payeeId: user._id }
      ])
    ).orderBy('createdAt', 'desc').skip(offset).limit(limit).get()

    // 获取用户信息
    const settlements = []
    for (const settlement of settlementResult.data) {
      const payer = await db.collection(COLLECTIONS.USER).doc(settlement.payerId).field({
        nickName: true,
        avatarUrl: true
      }).get()

      const payee = await db.collection(COLLECTIONS.USER).doc(settlement.payeeId).field({
        nickName: true,
        avatarUrl: true
      }).get()

      settlements.push({
        ...settlement,
        payer: payer.data,
        payee: payee.data
      })
    }

    return {
      success: true,
      data: settlements
    }
  } catch (error) {
    console.error('获取结算列表失败:', error)
    return {
      success: false,
      message: '获取结算列表失败',
      error: error.message
    }
  }
}

// cloudfunctions/user-updateWeekendSkip/index.js
const { db, cloud } = require('./common/db')
const { COLLECTIONS } = require('./common/config')

exports.main = async (event) => {
  const { weekendSkip } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 更新用户配置
    await db.collection(COLLECTIONS.USER).where({
      openid
    }).update({
      data: {
        weekendSkip: weekendSkip,
        updatedAt: new Date()
      }
    })

    return {
      success: true,
      message: weekendSkip ? '已开启周末免打卡' : '已关闭周末免打卡'
    }
  } catch (error) {
    console.error('更新周末免打卡配置失败:', error)
    return {
      success: false,
      message: '更新失败',
      error: error.message
    }
  }
}

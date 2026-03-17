// cloudfunctions/checkin/addItem/index.js
const { db, _, cloud } = require('../common/db')
const { COLLECTIONS } = require('../common/config')

exports.main = async (event) => {
  const { title, points, time, sort } = event
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

    const now = new Date()

    // 创建打卡条目
    const itemResult = await db.collection(COLLECTIONS.CHECKIN_ITEM).add({
      data: {
        userId: user._id,
        title,
        points: points || 1,
        time: time || '00:00',
        sort: sort || 0,
        enabled: true,
        createdAt: now,
        updatedAt: now
      }
    })

    return {
      success: true,
      data: { _id: itemResult._id },
      message: '添加成功'
    }
  } catch (error) {
    console.error('添加打卡条目失败:', error)
    return {
      success: false,
      message: '添加失败',
      error: error.message
    }
  }
}

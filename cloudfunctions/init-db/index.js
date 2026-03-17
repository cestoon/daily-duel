// cloudfunctions/init-db/index.js
const { db, _, cloud } = require('../common/db')
const { COLLECTIONS, PERIOD_STATUS, CHECKIN_STATUS, SETTLEMENT_STATUS } = require('../common/config')

exports.main = async (event) => {
  try {
    console.log('开始初始化数据库...')

    // 创建索引
    await createIndexes()

    console.log('数据库初始化完成')

    return {
      success: true,
      message: '数据库初始化成功'
    }
  } catch (error) {
    console.error('数据库初始化失败:', error)
    return {
      success: false,
      message: '数据库初始化失败',
      error: error.message
    }
  }
}

async function createIndexes() {
  // User 集合索引
  console.log('创建 User 集合索引...')
  await createIndex(COLLECTIONS.USER, { openid: 1 }, { unique: true })
  await createIndex(COLLECTIONS.USER, { partnerId: 1 })
  await createIndex(COLLECTIONS.USER, { currentPeriodId: 1 })

  // Period 集合索引
  console.log('创建 Period 集合索引...')
  await createIndex(COLLECTIONS.PERIOD, { status: 1 })
  await createIndex(COLLECTIONS.PERIOD, { startDate: -1 })

  // CheckinItem 集合索引
  console.log('创建 CheckinItem 集合索引...')
  await createIndex(COLLECTIONS.CHECKIN_ITEM, { userId: 1 })
  await createIndex(COLLECTIONS.CHECKIN_ITEM, { userId: 1, enabled: 1 })

  // CheckinRecord 集合索引
  console.log('创建 CheckinRecord 集合索引...')
  await createIndex(COLLECTIONS.CHECKIN_RECORD, { userId: 1 })
  await createIndex(COLLECTIONS.CHECKIN_RECORD, { userId: 1, date: -1 })
  await createIndex(COLLECTIONS.CHECKIN_RECORD, { userId: 1, periodId: 1 })
  await createIndex(COLLECTIONS.CHECKIN_RECORD, { userId: 1, itemId: 1, date: 1 })

  // Settlement 集合索引
  console.log('创建 Settlement 集合索引...')
  await createIndex(COLLECTIONS.SETTLEMENT, { periodId: 1 })
  await createIndex(COLLECTIONS.SETTLEMENT, { payerId: 1 })
  await createIndex(COLLECTIONS.SETTLEMENT, { payeeId: 1 })
  await createIndex(COLLECTIONS.SETTLEMENT, { status: 1 })
  await createIndex(COLLECTIONS.SETTLEMENT, { createdAt: -1 })

  // ReminderConfig 集合索引
  console.log('创建 ReminderConfig 集合索引...')
  await createIndex(COLLECTIONS.REMINDER_CONFIG, { userId: 1 }, { unique: true })

  console.log('所有索引创建完成')
}

async function createIndex(collection, keys, options = {}) {
  try {
    const collectionRef = db.collection(collection)
    // 微信云开发会自动创建索引，这里主要是记录索引配置
    console.log(`索引配置: ${collection}`, { keys, options })
  } catch (error) {
    console.error(`创建索引失败: ${collection}`, error)
  }
}

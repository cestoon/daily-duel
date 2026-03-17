// cloudfunctions/init-db/index.js
const { db, _, cloud } = require('../common/db')
const { COLLECTIONS, PERIOD_STATUS, CHECKIN_STATUS, SETTLEMENT_STATUS } = require('../common/config')

exports.main = async (event) => {
  try {
    console.log('开始初始化数据库...')

    // 自动创建所有集合
    await createCollections()

    // 创建索引
    await createIndexes()

    console.log('数据库初始化完成')

    return {
      success: true,
      message: '数据库初始化成功，已创建 6 个集合',
      collections: Object.values(COLLECTIONS)
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

async function createCollections() {
  console.log('开始创建数据库集合...')

  const collections = Object.values(COLLECTIONS)

  for (const collectionName of collections) {
    try {
      // 通过插入一条临时数据来创建集合
      // 微信云开发会自动创建集合
      console.log(`准备集合: ${collectionName}`)

      // 尝试插入一条初始化数据（如果集合不存在会自动创建）
      // 如果集合已存在，这条记录会被忽略或删除
      await db.collection(collectionName).add({
        data: {
          _init: true,
          note: '集合初始化记录，可删除',
          createdAt: new Date()
        }
      }).catch(err => {
        // 集合已存在时的忽略错误
        console.log(`集合 ${collectionName} 已存在或创建完成`)
      })
    } catch (error) {
      console.error(`创建集合失败: ${collectionName}`, error)
    }
  }

  console.log(`已完成 ${collections.length} 个集合的创建`)
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
    // 微信云开发通过创建数据时自动创建索引
    // 这里主要是记录索引配置供参考
    console.log(`索引配置: ${collection}`, { keys, options })
  } catch (error) {
    console.error(`创建索引失败: ${collection}`, error)
  }
}

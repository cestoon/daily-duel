// cloudfunctions/common/db.js
const cloud = require('wx-server-sdk')

// 初始化云开发
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const $ = db.aggregate

module.exports = {
  db,
  _,
  $,
  cloud
}

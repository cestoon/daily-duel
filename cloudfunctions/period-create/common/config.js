// cloudfunctions/common/config.js
module.exports = {
  // 数据库集合名称
  COLLECTIONS: {
    USER: 'User',
    PERIOD: 'Period',
    CHECKIN_ITEM: 'CheckinItem',
    CHECKIN_RECORD: 'CheckinRecord',
    SETTLEMENT: 'Settlement',
    REMINDER_CONFIG: 'ReminderConfig'
  },

  // 周期状态
  PERIOD_STATUS: {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },

  // 打卡状态
  CHECKIN_STATUS: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    MISSED: 'missed'
  },

  // 结算状态
  SETTLEMENT_STATUS: {
    PENDING: 'pending',
    COMPLETED: 'completed'
  },

  // 常用时间格式
  TIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',
  DATE_FORMAT: 'YYYY-MM-DD',

  // 每日打卡截止时间
  CHECKIN_DEADLINE_HOUR: 23,
  CHECKIN_DEADLINE_MINUTE: 59,

  // 结算日（周日=0）
  SETTLEMENT_DAY: 0,

  // 数据保留天数
  DATA_RETENTION_DAYS: 730
}

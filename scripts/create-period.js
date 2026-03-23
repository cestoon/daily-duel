// 在云开发控制台执行
// 数据库 → periods 集合 → 添加记录

{
  "startDate": new Date("2026-03-17T00:00:00Z"),  // 本周一
  "endDate": new Date("2026-03-23T23:59:59Z"),    // 本周日
  "status": "active",
  "createdAt": new Date(),
  "updatedAt": new Date()
}

// 添加后，复制这条记录的 _id
// 然后在 users 集合中，更新你的记录：
// currentPeriodId = 刚才的周期_id

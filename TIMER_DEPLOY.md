# ⏰ 定时任务部署指南

## 已完成修改

### 1. 每日漏卡检查 ✅
**云函数**：`timer-dailyCheck`

**修改内容**：
- ✅ 改为检查**今天**（而非昨天）
- ✅ 在 23:59 运行，标记今天未打卡的条目为漏卡
- ✅ 增加详细日志输出
- ✅ 处理无活跃周期的情况

**触发时间**：每天 23:59

**逻辑**：
```
1. 查找所有活跃周期
2. 获取周期内的用户
3. 对每个用户：
   - 获取所有启用的打卡条目
   - 检查今天是否已打卡
   - 未打卡 → 创建漏卡记录（status='missed'）
4. 输出统计：检查用户数、条目数、新增漏卡数
```

---

### 2. 每周结算 ✅
**云函数**：`timer-weeklySettlement`

**修改内容**：
- ✅ 改为按**漏卡积分差**结算（而非已完成积分差）
- ✅ 漏卡多的人付钱给漏卡少的人
- ✅ 周期状态改为 `completed`（而非 `ended`）
- ✅ 自动创建下周新周期
- ✅ 更新用户的 `currentPeriodId`

**触发时间**：每周日 23:59

**逻辑**：
```
1. 查找昨天结束的活跃周期
2. 对每个周期：
   - 获取两个用户
   - 计算双方漏卡积分
   - 漏卡差 = |user1漏卡 - user2漏卡|
   - 漏卡多的人 → 付款方
   - 漏卡少的人 → 收款方
   - 创建结算记录（status='pending'）
   - 标记周期为 completed
   - 创建新周期（下周一到下周日）
   - 更新用户的 currentPeriodId
```

**结算规则**：
```
用户A漏卡: 30分
用户B漏卡: 50分
差额: 20分
→ 用户B付20元给用户A
```

---

### 3. 配置文件统一 ✅
**所有云函数**：`*/common/config.js`

**修改内容**：
```javascript
PERIOD_STATUS: {
  ACTIVE: 'active',        // 进行中
  COMPLETED: 'completed',  // 已完成（结算后）
  CANCELLED: 'cancelled'   // 已取消
}
```

**删除**：`ENDED: 'ended'`（统一使用 `COMPLETED`）

---

## 部署步骤

### 1. 上传云函数

```
微信开发者工具 → 云开发 → 云函数

必须上传的云函数：
1. timer-dailyCheck       (每日检查)
2. timer-weeklySettlement (每周结算)

可选更新（如果之前部署过）：
3. 所有其他云函数的 common/config.js 已更新
```

---

### 2. 配置定时触发器

#### 每日漏卡检查

```
云函数 → timer-dailyCheck → 设置 → 触发器

触发器名称: daily-check
触发周期: 自定义
Cron 表达式: 0 59 23 * * * *

说明: 每天 23:59 执行
```

#### 每周结算

```
云函数 → timer-weeklySettlement → 设置 → 触发器

触发器名称: weekly-settlement
触发周期: 自定义
Cron 表达式: 0 59 23 * * 0

说明: 每周日 23:59 执行
```

**Cron 表达式格式**：
```
秒 分 时 日 月 周
*  *  *  *  *  *

示例：
0 59 23 * * * *  → 每天 23:59:00
0 59 23 * * 0    → 每周日 23:59:00
0 0 3 * * * *    → 每天 03:00:00
```

---

### 3. 手动测试

#### 测试每日检查

```
云开发 → 云函数 → timer-dailyCheck → 测试

输入参数: {}

点击「运行测试」

查看日志输出：
✅ 开始每日打卡检查（23:59）: 2026-03-19
✅ 检查用户: 2
✅ 检查条目: 10
✅ 新增漏卡: 3
```

#### 测试每周结算

```
云开发 → 云函数 → timer-weeklySettlement → 测试

输入参数: {}

点击「运行测试」

查看日志输出：
✅ 用户 张三 漏卡积分: 30
✅ 用户 李四 漏卡积分: 50
✅ 结算记录已创建，金额: 20
✅ 新周期已创建: xxx
```

---

## 验证测试

### 验证每日检查

**场景**：用户今天没有打卡

```
1. 手动运行 timer-dailyCheck
2. 查看数据库 → checkin_records
3. 筛选条件：
   - date = 今天
   - status = 'missed'
4. 应该看到新增的漏卡记录
```

---

### 验证每周结算

**场景**：本周周期结束

```
1. 数据库 → periods → 找到本周周期
2. 修改 endDate 为昨天 23:59:59
3. 手动运行 timer-weeklySettlement
4. 查看结果：
   - periods 表：本周周期 status='completed'
   - settlements 表：新增结算记录
   - periods 表：新建下周周期
   - users 表：currentPeriodId 更新为新周期
```

---

## 数据结构

### settlements（结算表）

```javascript
{
  _id: ObjectId,
  periodId: ObjectId,        // 周期ID
  payerId: ObjectId,         // 付款方用户ID（漏卡多的人）
  payeeId: ObjectId,         // 收款方用户ID（漏卡少的人）
  amount: Number,            // 金额（漏卡积分差）
  status: String,            // 状态：pending | completed
  payerConfirmed: Boolean,   // 付款方是否确认
  payerConfirmTime: Date,    // 付款方确认时间
  payeeConfirmed: Boolean,   // 收款方是否确认
  payeeConfirmTime: Date,    // 收款方确认时间
  completedAt: Date,         // 完成时间
  createdAt: Date,
  updatedAt: Date
}
```

---

## 前端对接

### 结算页面需要显示

```javascript
// 获取结算列表
wx.cloud.callFunction({
  name: 'settlement-getList',
  data: {}
})

// 返回结果
{
  success: true,
  data: [
    {
      _id: "xxx",
      periodId: "xxx",
      amount: 20,
      status: "pending",
      iAmPayer: true,      // 我是付款方
      partnerName: "李四",
      createdAt: "2026-03-16"
    }
  ]
}
```

### 确认支付

```javascript
wx.cloud.callFunction({
  name: 'settlement-confirmPayment',
  data: {
    settlementId: "xxx"
  }
})
```

---

## 常见问题

### Q1: 定时任务不执行？

**检查**：
1. 触发器是否配置正确
2. 云函数是否部署成功
3. 查看云函数日志

---

### Q2: 漏卡记录重复创建？

**原因**：每日检查会在 23:59 运行，如果用户在 23:59 前没打卡，就会创建漏卡记录。

**解决**：代码已加入检查，不会重复创建。

---

### Q3: 结算金额计算错误？

**检查**：
1. 查看云函数日志，确认两个用户的漏卡积分
2. 验证积分计算逻辑：只统计 status='missed' 的记录

---

### Q4: 新周期未创建？

**原因**：
- 周期状态不是 `active`
- 周期 `endDate` 还没到

**解决**：手动运行 `timer-weeklySettlement` 测试。

---

## 监控建议

### 设置告警

```
云开发 → 云函数 → 告警设置

监控指标：
1. 执行失败次数 > 0 → 发送告警
2. 执行超时 → 发送告警
```

### 定期检查

```
每周一早上查看：
1. 上周周期是否已 completed
2. 本周周期是否已创建
3. 结算记录是否生成
```

---

## 下一步

### 已完成 ✅
- [x] 每日漏卡检查
- [x] 每周自动结算
- [x] 自动创建新周期

### 待完成 ⏳
- [ ] 前端结算页面完善
- [ ] 支付确认功能
- [ ] 结算通知推送

---

**部署完成后记得测试！** 🎉

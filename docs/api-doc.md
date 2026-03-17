# API 文档

## 云函数 API

### 用户相关 (user/)

#### 1. user/login - 用户登录
**请求参数:**
```javascript
{
  nickName: string,  // 用户昵称
  avatarUrl: string // 用户头像URL
}
```

**返回数据:**
```javascript
{
  success: boolean,
  data: {
    _id: string,
    openid: string,
    nickName: string,
    avatarUrl: string,
    partnerId: string | null,
    currentPeriodId: string | null,
    createdAt: Date,
    updatedAt: Date
  }
}
```

#### 2. user/getInfo - 获取用户信息
**请求参数:** 无

**返回数据:**
```javascript
{
  success: boolean,
  data: User
}
```

#### 3. user/getPartner - 获取伙伴信息
**请求参数:** 无

**返回数据:**
```javascript
{
  success: boolean,
  data: User | null
}
```

#### 4. user/bindPartner - 绑定伙伴
**请求参数:**
```javascript
{
  partnerCode: string  // 伙伴的openid
}
```

**返回数据:**
```javascript
{
  success: boolean,
  data: User,  // 伙伴信息
  message: string
}
```

### 周期管理 (period/)

#### 5. period/create - 创建新周期
**请求参数:**
```javascript
{
  userIds: string[]  // 用户ID列表
}
```

**返回数据:**
```javascript
{
  success: boolean,
  data: {
    periodId: string
  },
  message: string
}
```

### 打卡相关 (checkin/)

#### 6. checkin/submit - 提交打卡
**请求参数:**
```javascript
{
  itemId: string  // 条目ID
}
```

**返回数据:**
```javascript
{
  success: boolean,
  message: string
}
```

#### 7. checkin/getItems - 获取条目列表
**请求参数:**
```javascript
{
  partnerItems: boolean  // 是否获取伙伴的条目，默认false
}
```

**返回数据:**
```javascript
{
  success: boolean,
  data: Array<{
    _id: string,
    userId: string,
    title: string,
    points: number,
    time: string,
    enabled: boolean
  }>
}
```

#### 8. checkin/getTodayRecords - 获取今日打卡记录
**请求参数:** 无

**返回数据:**
```javascript
{
  success: boolean,
  data: Array<{
    _id: string,
    userId: string,
    itemId: string,
    date: string,
    status: 'completed' | 'missed',
    checkinTime: Date | null
  }>
}
```

#### 9. checkin/addItem - 添加打卡条目
**请求参数:**
```javascript
{
  title: string,   // 条目标题
  points: number,  // 分数，默认1
  time: string,   // 打卡时间，格式HH:mm
  sort: number    // 排序，默认0
}
```

**返回数据:**
```javascript
{
  success: boolean,
  data: { _id: string },
  message: string
}
```

#### 10. checkin/updateItem - 更新打卡条目
**请求参数:**
```javascript
{
  itemId: string,
  title?: string,
  points?: number,
  time?: string,
  enabled?: boolean
}
```

**返回数据:**
```javascript
{
  success: boolean,
  message: string
}
```

#### 11. checkin/deleteItem - 删除打卡条目
**请求参数:**
```javascript
{
  itemId: string
}
```

**返回数据:**
```javascript
{
  success: boolean,
  message: string
}
```

### 结算相关 (settlement/)

#### 12. settlement/getBalance - 获取余额
**请求参数:**
```javascript
{
  userId?: string,  // 可选，默认当前用户
  periodId?: string // 可选，默认当前周期
}
```

**返回数据:**
```javascript
{
  success: boolean,
  data: {
    userId: string,
    periodId: string,
    date: string,
    totalPoints: number,
    recordCount: number
  }
}
```

#### 13. settlement/confirmPayment - 确认支付
**请求参数:**
```javascript
{
  settlementId: string
}
```

**返回数据:**
```javascript
{
  success: boolean,
  message: string
}
```

#### 14. settlement/getList - 获取结算列表
**请求参数:**
```javascript
{
  limit: number,  // 默认20
  offset: number  // 默认0
}
```

**返回数据:**
```javascript
{
  success: boolean,
  data: Array<{
    _id: string,
    periodId: string,
    payerId: string,
    payeeId: string,
    amount: number,
    status: 'pending' | 'completed',
    payerConfirmed: boolean,
    payeeConfirmed: boolean,
    payer: { nickName: string, avatarUrl: string },
    payee: { nickName: string, avatarUrl: string }
  }>
}
```

### 定时任务 (timer/)

#### 15. timer/dailyCheck - 每日打卡检查
**触发时间:** 每天 00:01
**功能:** 检查前一天的打卡情况，对未打卡的条目记录为"漏卡"

**返回数据:**
```javascript
{
  success: boolean,
  data: {
    checkedDate: string,
    checkedUserCount: number,
    missedCount: number
  }
}
```

#### 16. timer/weeklySettlement - 每周结算
**触发时间:** 每周一 00:10
**功能:** 结算上周的PK结果，计算双方积分差额并创建结算记录

**返回数据:**
```javascript
{
  success: boolean,
  data: {
    settlementCount: number
  }
}
```

### 数据库初始化

#### 17. init-db - 初始化数据库
**功能:** 创建数据库索引

**返回数据:**
```javascript
{
  success: boolean,
  message: string
}
```

## 数据模型

### User（用户）
```javascript
{
  _id: string,
  openid: string,
  nickName: string,
  avatarUrl: string,
  partnerId: string | null,
  currentPeriodId: string | null,
  createdAt: Date,
  updatedAt: Date
}
```

### Period（周期）
```javascript
{
  _id: string,
  startDate: Date,  // 周一 00:00:00
  endDate: Date,    // 周日 23:59:59
  status: 'active' | 'ended',
  createdAt: Date,
  updatedAt: Date
}
```

### CheckinItem（打卡条目）
```javascript
{
  _id: string,
  userId: string,
  title: string,
  points: number,  // 分数
  time: string,    // 打卡时间 HH:mm
  sort: number,    // 排序
  enabled: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### CheckinRecord（打卡记录）
```javascript
{
  _id: string,
  userId: string,
  itemId: string,
  periodId: string,
  date: string,    // 日期 YYYY-MM-DD
  status: 'completed' | 'missed',
  checkinTime: Date | null,
  note: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Settlement（结算）
```javascript
{
  _id: string,
  periodId: string,
  payerId: string,
  payeeId: string,
  amount: number,
  status: 'pending' | 'completed',
  payerConfirmed: boolean,
  payerConfirmTime: Date | null,
  payeeConfirmed: boolean,
  payeeConfirmTime: Date | null,
  completedAt: Date | null,
  createdAt: Date,
  updatedAt: Date
}
```

### ReminderConfig（提醒配置）
```javascript
{
  _id: string,
  userId: string,
  enabled: boolean,
  time: string,  // 提醒时间 HH:mm
  createdAt: Date,
  updatedAt: Date
}
```

## 错误码

| 错误码 | 说明 |
|--------|------|
| -1 | 系统错误 |
| -2 | 参数错误 |
| -3 | 用户不存在 |
| -4 | 无权操作 |
| -5 | 条目不存在 |
| -6 | 今日已打卡 |
| -7 | 已有伙伴 |
| -8 | 伙伴不存在 |

## 调用示例

### 小程序端调用
```javascript
// 调用云函数
wx.cloud.callFunction({
  name: 'checkin/submit',
  data: {
    itemId: 'item-id-123'
  }
}).then(res => {
  if (res.result.success) {
    console.log('打卡成功')
  }
}).catch(err => {
  console.error('打卡失败', err)
})
```

### 云函数端调用数据库
```javascript
const { db } = require('../common/db')

// 查询数据
const res = await db.collection('CheckinItem').where({
  userId: 'user-id-123',
  enabled: true
}).get()

// 插入数据
await db.collection('CheckinRecord').add({
  data: {
    userId: 'user-id-123',
    itemId: 'item-id-123',
    date: '2024-01-01',
    status: 'completed'
  }
})

// 更新数据
await db.collection('User').doc('user-id-123').update({
  data: {
    partnerId: 'partner-id-456'
  }
})
```

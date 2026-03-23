# Daily Duel - 架构设计文档

## 项目概述

**项目名称**：Daily Duel（情侣打卡PK小程序）

**项目定位**：情侣/伙伴之间的习惯养成对战小程序，通过打卡PK机制激励双方完成目标

**技术栈**：
- 前端：微信小程序（原生）
- 后端：微信云开发（云函数 + 云数据库）
- 数据库：MongoDB（微信云数据库）

---

## 核心功能

### 1. 用户系统
- 微信授权登录
- 邀请码绑定伙伴
- 用户信息管理

### 2. 打卡系统
- 创建/管理打卡条目
- 每日打卡记录
- 漏卡/补卡机制

### 3. PK对战系统
- 本周累计积分对比
- 实时PK血条展示
- 漏卡差值计算

### 4. 周期结算系统
- 每周自动结算
- 积分统计
- 历史记录查询

---

## 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                      微信小程序前端                        │
│  ┌──────────┬──────────┬──────────┬──────────┬────────┐ │
│  │ PK对战页  │ 今日打卡 │ 条目管理 │  结算页  │ 设置页  │ │
│  └──────────┴──────────┴──────────┴──────────┴────────┘ │
└───────────────────────────┬─────────────────────────────┘
                            │ 云函数调用
┌───────────────────────────▼─────────────────────────────┐
│                      微信云开发                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │                   云函数层                          │ │
│  │  ┌──────────┬──────────┬──────────┬──────────────┐ │ │
│  │  │ 用户模块  │ 打卡模块  │ 结算模块  │  定时任务   │ │ │
│  │  └──────────┴──────────┴──────────┴──────────────┘ │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │                   云数据库                          │ │
│  │  ┌────────┬────────┬────────┬────────┬──────────┐  │ │
│  │  │ users  │ periods│ items  │records │settlements│ │ │
│  │  └────────┴────────┴────────┴────────┴──────────┘  │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 数据库设计

### 1. users（用户表）

```javascript
{
  _id: ObjectId,                    // 用户唯一标识
  openid: String,                   // 微信 openid（唯一）
  nickName: String,                 // 昵称
  avatarUrl: String,                // 头像
  inviteCode: String,               // 6位数字邀请码（唯一）
  partnerId: ObjectId | null,       // 伙伴用户ID
  currentPeriodId: ObjectId | null, // 当前周期ID
  createdAt: Date,
  updatedAt: Date
}
```

**索引**：
- `openid`（唯一）
- `inviteCode`（唯一）

---

### 2. periods（周期表）

```javascript
{
  _id: ObjectId,           // 周期唯一标识
  startDate: Date,         // 开始日期（周一 00:00:00）
  endDate: Date,           // 结束日期（周日 23:59:59）
  status: String,          // 状态：active | completed | cancelled
  createdAt: Date,
  updatedAt: Date
}
```

**说明**：
- 一个周期对应一周（周一到周日）
- 绑定伙伴时自动创建本周周期
- 两个伙伴共享同一个周期

---

### 3. checkin_items（打卡条目表）

```javascript
{
  _id: ObjectId,      // 条目唯一标识
  userId: ObjectId,   // 所属用户ID
  title: String,      // 条目标题（如：跑步、读书）
  points: Number,     // 积分（默认10）
  time: String,       // 打卡时间（HH:mm 格式）
  enabled: Boolean,   // 是否启用
  sort: Number,       // 排序
  createdAt: Date,
  updatedAt: Date
}
```

**索引**：
- `userId`

---

### 4. checkin_records（打卡记录表）

```javascript
{
  _id: ObjectId,              // 记录唯一标识
  userId: ObjectId,           // 用户ID
  itemId: ObjectId,           // 条目ID
  periodId: ObjectId | null,  // 周期ID
  date: String,               // 日期（YYYY-MM-DD）
  status: String,             // 状态：completed | missed | pending
  checkinTime: Date | null,   // 打卡时间
  note: String,               // 备注
  createdAt: Date,
  updatedAt: Date
}
```

**索引**：
- `userId + periodId`
- `userId + date`
- `itemId + date`

**状态说明**：
- `completed`：已完成
- `missed`：已漏卡
- `pending`：待打卡（未使用）

---

### 5. settlements（结算记录表）

```javascript
{
  _id: ObjectId,           // 结算唯一标识
  periodId: ObjectId,      // 周期ID
  userId: ObjectId,        // 用户ID
  totalPoints: Number,     // 总积分
  paidAmount: Number,      // 已支付金额
  status: String,          // 状态：pending | confirmed | cancelled
  createdAt: Date,
  updatedAt: Date
}
```

---

## 云函数设计

### 用户模块

#### user-login
**功能**：用户登录/注册

**输入**：
```javascript
{
  nickName: String,   // 昵称
  avatarUrl: String   // 头像
}
```

**输出**：
```javascript
{
  success: Boolean,
  data: {
    _id: ObjectId,
    openid: String,
    nickName: String,
    avatarUrl: String,
    inviteCode: String,    // 自动生成6位数字
    partnerId: ObjectId | null,
    currentPeriodId: ObjectId | null
  }
}
```

**逻辑**：
1. 通过 `openid` 查询用户是否存在
2. 不存在则创建新用户，生成唯一邀请码
3. 存在则更新用户信息，老用户补充邀请码
4. 返回用户完整信息

---

#### user-bindPartner
**功能**：绑定伙伴

**输入**：
```javascript
{
  partnerCode: String  // 6位邀请码或openid
}
```

**输出**：
```javascript
{
  success: Boolean,
  data: { /* 伙伴用户信息 */ },
  message: String
}
```

**逻辑**：
1. 验证当前用户是否已有伙伴
2. 通过邀请码查找目标用户
3. 验证目标用户是否已有伙伴
4. 双向绑定伙伴关系
5. **自动创建本周周期**
6. 更新两个用户的 `currentPeriodId`

**关键代码**：
```javascript
// 创建本周周期
const monday = getMondayOfWeek(now)
const sunday = getSundayOfWeek(now)

const periodResult = await db.collection(COLLECTIONS.PERIOD).add({
  data: {
    startDate: monday,
    endDate: sunday,
    status: PERIOD_STATUS.ACTIVE,
    createdAt: now,
    updatedAt: now
  }
})

const periodId = periodResult._id

// 更新两个用户的当前周期
await db.collection(COLLECTIONS.USER).doc(user._id).update({
  data: { currentPeriodId: periodId }
})
await db.collection(COLLECTIONS.USER).doc(partner._id).update({
  data: { currentPeriodId: periodId }
})
```

---

#### user-getInfo
**功能**：获取当前用户信息

**输出**：
```javascript
{
  success: Boolean,
  data: { /* 用户信息 */ }
}
```

---

#### user-getPartner
**功能**：获取伙伴信息

**输出**：
```javascript
{
  success: Boolean,
  data: { /* 伙伴信息 */ } | null
}
```

---

### 打卡模块

#### checkin-getItems
**功能**：获取打卡条目列表

**输入**：
```javascript
{
  partnerItems: Boolean  // 是否获取伙伴的条目
}
```

**输出**：
```javascript
{
  success: Boolean,
  data: [/* 条目列表 */]
}
```

---

#### checkin-addItem
**功能**：添加打卡条目

**输入**：
```javascript
{
  title: String,     // 标题
  points: Number,    // 积分
  time: String       // 时间
}
```

---

#### checkin-updateItem
**功能**：更新打卡条目

**输入**：
```javascript
{
  itemId: ObjectId,
  title: String,
  points: Number,
  time: String,
  enabled: Boolean
}
```

---

#### checkin-deleteItem
**功能**：删除打卡条目

**输入**：
```javascript
{
  itemId: ObjectId
}
```

---

#### checkin-submit
**功能**：提交打卡

**输入**：
```javascript
{
  itemId: ObjectId,
  note: String       // 备注（可选）
}
```

**逻辑**：
1. 验证条目是否存在且属于当前用户
2. 检查今天是否已打卡
3. 创建打卡记录，状态为 `completed`
4. 关联当前周期 `periodId`

---

#### checkin-cancel
**功能**：取消打卡

**输入**：
```javascript
{
  itemId: ObjectId
}
```

**逻辑**：
1. 查找今日该条目的打卡记录
2. 更新状态为 `missed`

---

#### checkin-getTodayRecords
**功能**：获取今日打卡记录

**输入**：
```javascript
{
  userId: ObjectId  // 可选，不传则获取当前用户
}
```

**输出**：
```javascript
{
  success: Boolean,
  data: [
    {
      _id: ObjectId,
      itemId: ObjectId,
      status: String,
      checkinTime: Date,
      note: String
    }
  ]
}
```

---

### 结算模块

#### settlement-getBalance
**功能**：获取本周已完成积分

**输入**：
```javascript
{
  userId: ObjectId,   // 可选
  periodId: ObjectId  // 可选
}
```

**输出**：
```javascript
{
  success: Boolean,
  data: {
    userId: ObjectId,
    periodId: ObjectId,
    totalPoints: Number,      // 已完成总积分
    recordCount: Number       // 记录数
  }
}
```

**逻辑**：
1. 获取用户当前周期ID
2. 查询该周期内所有 `status = 'completed'` 的记录
3. 根据 `itemId` 获取每条记录的积分
4. 累加计算总积分

---

#### settlement-getMissedPoints
**功能**：获取本周漏卡积分

**输入**：
```javascript
{
  userId: ObjectId,   // 可选
  periodId: ObjectId  // 可选
}
```

**输出**：
```javascript
{
  success: Boolean,
  data: {
    userId: ObjectId,
    periodId: ObjectId,
    totalMissedPoints: Number,  // 漏卡总积分
    missedCount: Number         // 漏卡次数
  }
}
```

**逻辑**：
1. 获取用户当前周期ID
2. 查询该周期内所有 `status = 'missed'` 的记录
3. 根据 `itemId` 获取每条记录的积分
4. 累加计算漏卡总积分

---

#### settlement-getList
**功能**：获取结算记录列表

---

#### settlement-confirmPayment
**功能**：确认支付结算

---

### 周期模块

#### period-create
**功能**：创建周期

**输入**：
```javascript
{
  userIds: [ObjectId]  // 需要关联的用户ID列表
}
```

**输出**：
```javascript
{
  success: Boolean,
  data: { periodId: ObjectId }
}
```

**逻辑**：
1. 计算本周周一和周日
2. 创建周期记录
3. 更新所有用户的 `currentPeriodId`

**辅助函数**：
```javascript
// 获取本周一
function getMondayOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday
}

// 获取本周日
function getSundayOfWeek(date) {
  const monday = getMondayOfWeek(date)
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return sunday
}
```

---

### 定时任务模块

#### timer-dailyCheck
**功能**：每日定时检查漏卡

**触发时间**：每天 23:59

**逻辑**：
1. 遍历所有用户
2. 检查今日是否有未打卡的条目
3. 创建漏卡记录（`status = 'missed'`）

---

#### timer-weeklySettlement
**功能**：每周结算

**触发时间**：每周日 23:59

**逻辑**：
1. 标记本周周期为 `completed`
2. 计算每个用户的积分
3. 创建结算记录
4. 生成新周期

---

## 前端架构

### 页面结构

```
pages/
├── index/          # 欢迎页（未使用）
├── pk/             # PK对战页
├── checkin/        # 今日打卡页
├── items/          # 条目管理页
├── settlement/     # 结算页
├── stats/          # 统计页（未实现）
└── settings/       # 设置页
```

---

### 核心页面实现

#### PK对战页 (pages/pk/pk.js)

**数据结构**：
```javascript
data: {
  user: Object,                      // 当前用户
  partner: Object,                   // 伙伴信息
  myBalance: Number,                 // 我的本周已完成积分
  partnerBalance: Number,            // 伙伴本周已完成积分
  myMissedPoints: Number,            // 我的本周漏卡积分
  partnerMissedPoints: Number,       // 伙伴本周漏卡积分
  leadValue: Number,                 // 领先值 = 对方漏卡 - 我的漏卡
  myPercentage: Number,              // 我的血条百分比
  partnerPercentage: Number,         // 伙伴血条百分比
  todayChecked: Number,              // 今日已打卡数
  todayTotalItems: Number,           // 今日总条目数
  partnerTodayChecked: Number,       // 伙伴今日已打卡数
  partnerTotalItems: Number          // 伙伴今日总条目数
}
```

**核心逻辑**：

**1. 加载数据**
```javascript
async loadData() {
  await Promise.all([
    this.getUserInfo(),           // 获取用户信息
    this.getPartnerInfo(),        // 获取伙伴信息
    this.getWeekStats(),          // 获取本周统计（已完成+漏卡）
    this.getPartnerWeekStats(),   // 获取伙伴本周统计
    this.getTodayStats(),         // 获取今日统计
    this.getPartnerTodayStats()   // 获取伙伴今日统计
  ])
  
  this.calculatePercentages()     // 计算血条百分比
}
```

**2. PK血条计算**
```javascript
calculatePercentages() {
  // 计算领先值：对方本周漏卡 - 我的本周漏卡
  const leadValue = this.data.partnerMissedPoints - this.data.myMissedPoints
  
  // 封顶：差值范围 [-100, +100]
  const cappedLeadValue = Math.max(-100, Math.min(100, leadValue))
  
  // 计算血条百分比
  // 领先值为正 → 我领先（对方漏卡更多）→ 我的橙色区域更大
  // 领先值为负 → 对方领先（我漏卡更多）→ 对方蓝色区域更大
  
  const myPercentage = 50 + (cappedLeadValue / 2)        // 范围: [0, 100]
  const partnerPercentage = 50 - (cappedLeadValue / 2)  // 范围: [0, 100]
  
  this.setData({
    leadValue: cappedLeadValue,
    myPercentage: myPercentage,
    partnerPercentage: partnerPercentage
  })
}
```

**血条样式**（双色对抗条）：
```wxss
.pk-bar {
  display: flex;
  height: 40rpx;
  border-radius: 20rpx;
  overflow: hidden;
}

/* 对手区域（深蓝） */
.bar-partner {
  background: linear-gradient(90deg, #1E3A8A 0%, #3B82F6 100%);
  width: {{partnerPercentage}}%;
}

/* 我的区域（橙色） */
.bar-mine {
  background: linear-gradient(90deg, #F7931E 0%, #FF6B35 100%);
  width: {{myPercentage}}%;
}
```

---

#### 今日打卡页 (pages/checkin/checkin.js)

**核心功能**：
1. 显示今日打卡条目列表
2. 点击打卡/取消打卡
3. 实时更新打卡状态

**关键逻辑**：
```javascript
// 打卡
async handleCheckin(itemId) {
  const res = await wx.cloud.callFunction({
    name: 'checkin-submit',
    data: { itemId }
  })
  
  if (res.result.success) {
    wx.showToast({ title: '打卡成功' })
    this.loadData()  // 刷新列表
  }
}

// 取消打卡
async handleCancel(itemId) {
  const res = await wx.cloud.callFunction({
    name: 'checkin-cancel',
    data: { itemId }
  })
  
  if (res.result.success) {
    wx.showToast({ title: '已取消' })
    this.loadData()
  }
}
```

---

#### 条目管理页 (pages/items/items.js)

**功能**：
1. 显示我的条目和伙伴的条目（两个 Tab）
2. 添加/编辑/删除/启用/禁用条目

**关键实现**：
```javascript
// 切换 Tab
onTabChange(e) {
  const index = e.detail.index
  this.setData({ 
    currentTab: index 
  })
  
  if (index === 1) {
    // 加载伙伴条目
    this.loadPartnerItems()
  }
}

// 添加条目
async addItem(data) {
  const res = await wx.cloud.callFunction({
    name: 'checkin-addItem',
    data: {
      title: data.title,
      points: parseInt(data.points),
      time: data.time
    }
  })
  
  if (res.result.success) {
    wx.showToast({ title: '添加成功' })
    this.loadMyItems()
  }
}
```

---

#### 设置页 (pages/settings/settings.js)

**核心功能**：
1. 显示用户信息和邀请码
2. 绑定/解绑伙伴
3. 打卡提醒设置

**邀请码展示**：
```javascript
data: {
  user: {
    nickName: String,
    avatarUrl: String,
    inviteCode: String  // 6位数字邀请码
  }
}
```

**绑定伙伴**：
```javascript
async bindPartner() {
  const code = this.data.bindCode.trim()
  
  // 验证格式（6位数字）
  if (!/^\d{6}$/.test(code)) {
    wx.showToast({
      title: '邀请码格式错误',
      icon: 'none'
    })
    return
  }
  
  const res = await wx.cloud.callFunction({
    name: 'user-bindPartner',
    data: { partnerCode: code }
  })
  
  if (res.result.success) {
    wx.showToast({ title: '绑定成功' })
    this.getPartnerInfo()
  } else {
    wx.showToast({
      title: res.result.message,
      icon: 'none'
    })
  }
}
```

**复制邀请码**：
```javascript
copyInviteCode() {
  const code = this.data.user?.inviteCode
  if (!code) return
  
  wx.setClipboardData({
    data: code,
    success: () => {
      wx.showToast({ title: '邀请码已复制' })
    }
  })
}
```

---

## UI设计规范

### 主题色

**橙色对战主题**：
```css
/* 主色 - 火焰橙 */
--primary-color: #FF6B35;

/* 辅助色 */
--secondary-color: #F7931E;
--accent-color: #FFC107;

/* 对比色 - 深海蓝 */
--contrast-color: #1E3A8A;
--contrast-light: #3B82F6;

/* 中性色 */
--text-primary: #333333;
--text-secondary: #666666;
--text-disabled: #999999;
--border-color: #E0E0E0;
--background: #F5F5F5;
```

### 渐变效果

**橙色渐变**（按钮、进度条、我的区域）：
```css
background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
```

**深蓝渐变**（对手区域）：
```css
background: linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%);
```

### 导航栏

```javascript
// app.json
"window": {
  "navigationBarBackgroundColor": "#FF6B35",
  "navigationBarTitleText": "情侣打卡PK",
  "navigationBarTextStyle": "white"
}
```

### 底部导航栏

```javascript
"tabBar": {
  "color": "#999999",
  "selectedColor": "#FF6B35",
  "backgroundColor": "#ffffff",
  "list": [
    { "pagePath": "pages/pk/pk", "text": "PK对战" },
    { "pagePath": "pages/checkin/checkin", "text": "今日打卡" },
    { "pagePath": "pages/items/items", "text": "条目管理" },
    { "pagePath": "pages/settlement/settlement", "text": "结算" },
    { "pagePath": "pages/settings/settings", "text": "设置" }
  ]
}
```

---

## 关键业务逻辑

### 1. 邀请码生成机制

**生成规则**：
- 6位纯数字
- 确保唯一性（数据库查重）
- 最多重试10次，失败则使用时间戳

**实现代码**：
```javascript
// 生成6位数字邀请码
function generateInviteCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// 检查邀请码是否已存在
async function isInviteCodeExists(code) {
  const result = await db.collection(COLLECTIONS.USER).where({
    inviteCode: code
  }).count()
  return result.total > 0
}

// 生成唯一邀请码
async function generateUniqueInviteCode() {
  let code
  let exists = true
  let attempts = 0
  
  while (exists && attempts < 10) {
    code = generateInviteCode()
    exists = await isInviteCodeExists(code)
    attempts++
  }
  
  if (exists) {
    // 如果10次都重复，使用时间戳保证唯一
    code = Date.now().toString().slice(-6)
  }
  
  return code
}
```

---

### 2. 伙伴绑定机制

**绑定流程**：
```
用户A                           用户B
  │                               │
  ├─ 生成邀请码: 123456           │
  │                               │
  │                               ├─ 输入: 123456
  │                               │
  │                               ├─ 验证邀请码
  │                               │
  │◄──────── 双向绑定 ─────────────┤
  │                               │
  ├──────── 创建周期 ──────────────┤
  │                               │
  ├─ currentPeriodId = Period_1   │
  │                               ├─ currentPeriodId = Period_1
  │                               │
  └─────────── 绑定完成 ───────────┘
```

**限制条件**：
- 一个用户只能绑定一个伙伴
- 已有伙伴的用户不能重复绑定
- 不能绑定自己
- 邀请码必须存在且有效

---

### 3. 周期管理机制

**周期生命周期**：
```
创建 (active) → 进行中 → 结算 (completed) → 历史记录
```

**周期创建时机**：
1. 绑定伙伴时自动创建本周周期
2. 每周日23:59结算后自动创建下周周期

**周期结构**：
- 固定周期：周一 00:00:00 ~ 周日 23:59:59
- 两个伙伴共享同一个周期ID
- 所有打卡记录必须关联周期ID

**关键点**：
- 用户未绑定伙伴时，`currentPeriodId` 为 `null`
- 此时打卡记录的 `periodId` 也为 `null`
- 统计时会忽略 `periodId = null` 的记录

---

### 4. 打卡状态机

```
         添加条目
            ↓
       [pending]  ← 未使用（前端不展示）
            ↓
     用户点击打卡
            ↓
      [completed] ←──── 用户取消 ─────┐
            │                         │
            │                         │
      23:59 定时检查                   │
            ↓                         │
        [missed] ─────────────────────┘
```

**状态说明**：
- `completed`：用户主动打卡
- `missed`：用户取消打卡 或 定时任务标记漏卡
- `pending`：保留状态，暂未使用

---

### 5. PK血条计算逻辑

**公式**：
```
领先值 = 对方本周漏卡积分 - 我的本周漏卡积分
封顶领先值 = Math.max(-100, Math.min(100, 领先值))
我的血条百分比 = 50 + (封顶领先值 / 2)
对方血条百分比 = 50 - (封顶领先值 / 2)
```

**示例**：
| 我的漏卡 | 对方漏卡 | 领先值 | 我的血条 | 对方血条 |
|---------|---------|-------|---------|---------|
| 10      | 20      | +10   | 55%     | 45%     |
| 30      | 10      | -20   | 40%     | 60%     |
| 0       | 100     | +100  | 100%    | 0%      |
| 100     | 0       | -100  | 0%      | 100%    |
| 10      | 10      | 0     | 50%     | 50%     |

**视觉呈现**：
- 左侧：对手区域（深蓝渐变）
- 右侧：我的区域（橙色渐变）
- 谁漏卡少，谁的区域更大

---

## 技术难点与解决方案

### 1. 周期关联问题

**问题**：
- 用户在绑定伙伴前打卡，没有周期ID
- 导致历史记录无法统计

**解决方案**：
- 绑定伙伴时自动创建周期
- 可选：创建数据修复云函数，将历史记录关联到当前周期

---

### 2. 伙伴数据查询

**问题**：
- 需要查询伙伴的打卡条目和记录
- 权限控制（只能查看绑定伙伴的数据）

**解决方案**：
- 云函数增加 `partnerItems` 参数
- 根据 `partnerId` 查询伙伴数据
- 在云函数层做权限校验

---

### 3. 云函数部署问题

**问题**：
- CLI 上传失败（`EISDIR` 错误）
- 原因：云函数包含 `common/` 目录

**解决方案**：
- 使用微信开发者工具手动上传
- 右键 → 上传并部署：云端安装依赖

---

### 4. 实时数据同步

**问题**：
- 伙伴打卡后，我的PK页面不会自动刷新

**当前方案**：
- 页面 `onShow` 时重新加载数据
- 下拉刷新

**未来优化**：
- 使用实时数据库订阅
- WebSocket 推送更新

---

## 部署说明

### 环境配置

```javascript
// miniprogram/app.js
wx.cloud.init({
  env: 'cloud1-9gtimm7r81602bae',  // 云环境ID
  traceUser: true
})
```

### 云函数列表

**必须部署的云函数**：
```
✅ user-login              # 用户登录
✅ user-bindPartner        # 绑定伙伴（会创建周期）
✅ user-getInfo            # 获取用户信息
✅ user-getPartner         # 获取伙伴信息
✅ checkin-getItems        # 获取条目列表
✅ checkin-addItem         # 添加条目
✅ checkin-updateItem      # 更新条目
✅ checkin-deleteItem      # 删除条目
✅ checkin-submit          # 提交打卡
✅ checkin-cancel          # 取消打卡
✅ checkin-getTodayRecords # 获取今日记录
✅ settlement-getBalance   # 获取已完成积分
✅ settlement-getMissedPoints # 获取漏卡积分
✅ settlement-getList      # 获取结算列表
✅ period-create           # 创建周期
```

**可选云函数**：
```
⚪ timer-dailyCheck       # 每日漏卡检查（定时任务）
⚪ timer-weeklySettlement # 每周结算（定时任务）
⚪ init-db                # 数据库初始化
```

### 部署步骤

1. **上传云函数**：
   ```
   微信开发者工具 → 云开发 → 云函数
   右键对应云函数 → 上传并部署：云端安装依赖
   ```

2. **配置数据库索引**：
   ```
   云开发 → 数据库 → 创建集合
   users: openid(唯一), inviteCode(唯一)
   checkin_records: userId+periodId, userId+date
   checkin_items: userId
   ```

3. **配置定时触发器**（可选）：
   ```
   云函数 → 定时触发器
   timer-dailyCheck: 0 59 23 * * * *  (每天23:59)
   timer-weeklySettlement: 0 59 23 * * 0  (每周日23:59)
   ```

---

## 测试指南

### 单用户测试

1. 登录小程序
2. 添加打卡条目
3. 完成打卡
4. 查看设置页的邀请码

### 双用户测试

1. **准备两个微信账号**
2. **账号A**：
   - 登录小程序
   - 设置页 → 复制邀请码（如：123456）
3. **账号B**：
   - 登录小程序
   - 设置页 → 绑定搭档 → 输入123456
4. **验证绑定**：
   - 双方设置页都显示伙伴信息
   - PK页面显示对方头像和数据
5. **测试PK**：
   - 双方分别创建打卡条目
   - 完成部分打卡，漏卡部分
   - 查看PK血条是否正确显示

### 切换账号测试

```
微信开发者工具 → 模拟器右上角「...」→ 切换用户
```

---

## 未来优化方向

### 功能优化

1. **实时数据推送**
   - 使用云数据库实时订阅
   - 伙伴打卡后立即更新PK页面

2. **统计分析页面**
   - 周/月/年趋势图表
   - 完成率统计
   - 对比分析

3. **社交功能**
   - 打卡动态朋友圈
   - 评论互动
   - 点赞鼓励

4. **激励机制**
   - 连续打卡徽章
   - 成就系统
   - 排行榜

### 技术优化

1. **性能优化**
   - 云函数批量查询
   - 数据缓存策略
   - 图片懒加载

2. **代码优化**
   - 提取公共方法到 utils
   - 组件化复用
   - TypeScript 改造

3. **体验优化**
   - 加载状态优化
   - 错误提示优化
   - 操作反馈优化

---

## 项目文件结构

```
daily-duel/
├── cloudfunctions/              # 云函数
│   ├── user-login/             # 用户登录
│   ├── user-bindPartner/       # 绑定伙伴
│   ├── user-getInfo/           # 获取用户信息
│   ├── user-getPartner/        # 获取伙伴信息
│   ├── checkin-getItems/       # 获取条目
│   ├── checkin-addItem/        # 添加条目
│   ├── checkin-updateItem/     # 更新条目
│   ├── checkin-deleteItem/     # 删除条目
│   ├── checkin-submit/         # 提交打卡
│   ├── checkin-cancel/         # 取消打卡
│   ├── checkin-getTodayRecords/# 获取今日记录
│   ├── settlement-getBalance/  # 获取已完成积分
│   ├── settlement-getMissedPoints/ # 获取漏卡积分
│   ├── settlement-getList/     # 获取结算列表
│   ├── period-create/          # 创建周期
│   ├── timer-dailyCheck/       # 每日检查
│   └── timer-weeklySettlement/ # 每周结算
│
├── miniprogram/                # 小程序前端
│   ├── pages/                  # 页面
│   │   ├── index/             # 欢迎页
│   │   ├── pk/                # PK对战页
│   │   ├── checkin/           # 今日打卡页
│   │   ├── items/             # 条目管理页
│   │   ├── settlement/        # 结算页
│   │   ├── stats/             # 统计页
│   │   └── settings/          # 设置页
│   ├── assets/                # 静态资源
│   │   └── icons/             # 图标
│   ├── utils/                 # 工具函数
│   ├── app.js                 # 小程序入口
│   ├── app.json               # 全局配置
│   └── app.wxss               # 全局样式
│
├── docs/                       # 文档
│   ├── ARCHITECTURE.md        # 架构设计（本文档）
│   ├── CLI_DEPLOY.md          # CLI部署指南
│   └── API.md                 # API文档（待补充）
│
├── scripts/                    # 脚本
│   ├── create-period.js       # 创建周期脚本
│   ├── create-test-partner-guide.js # 测试伙伴数据
│   └── deploy-cloud-functions.sh    # 云函数部署脚本
│
├── DEPLOY_CHECKLIST.md        # 部署检查清单
├── QUICK_TEST_GUIDE.txt       # 快速测试指南
├── project.config.json        # 项目配置
└── README.md                  # 项目说明
```

---

## 常见问题

### Q1: 为什么本周累计显示0？

**原因**：
- 没有绑定伙伴，`currentPeriodId` 为空
- 打卡记录没有关联周期ID

**解决**：
1. 绑定伙伴（会自动创建周期）
2. 重新打卡（新记录会关联周期）

---

### Q2: 如何添加第二个测试账号？

**方法1**：开发者工具切换用户
```
模拟器右上角「...」→ 切换用户
```

**方法2**：真机预览
```
点击「预览」→ 扫码 → 让朋友也扫码
```

---

### Q3: 云函数上传失败怎么办？

**错误**：`EISDIR: illegal operation on a directory`

**解决**：
- 使用微信开发者工具手动上传
- 右键云函数 → 上传并部署：云端安装依赖
- **不要使用 CLI 上传**（已知bug）

---

### Q4: 如何修复历史打卡记录？

**场景**：绑定伙伴前的打卡记录没有周期ID

**方案1**：数据库手动修复
```
云开发 → 数据库 → checkin_records
筛选 periodId = null
批量更新 periodId = 当前周期ID
```

**方案2**：部署修复云函数
```
上传 fix-data 云函数
调用一次即可修复所有历史记录
```

---

## 更新日志

### v1.0.0 (2026-03-19)

**功能**：
- ✅ 用户登录注册
- ✅ 邀请码绑定伙伴
- ✅ 打卡条目管理
- ✅ 今日打卡功能
- ✅ PK对战页面
- ✅ 本周统计（已完成+漏卡）
- ✅ PK血条（本周漏卡差值）
- ✅ 橙色对战主题
- ✅ 周期自动创建

**已知问题**：
- ⚠️ 历史记录可能缺少周期ID
- ⚠️ CLI 无法上传云函数
- ⚠️ 实时数据不同步

---

## 贡献指南

欢迎提交 Issue 和 Pull Request！

**开发流程**：
1. Fork 项目
2. 创建功能分支
3. 提交变更
4. 推送到分支
5. 创建 Pull Request

---

## 许可证

MIT License

---

**文档维护**：请在每次重大功能更新后同步更新本文档
**最后更新**：2026-03-19

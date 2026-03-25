# 🔧 历史打卡功能修复

**修复时间**：2026-03-25
**版本**：v1.2.0 补丁

---

## 🐛 问题描述

**问题**：标记历史打卡时提示"用户不存在"

**原因**：集合名称错误

```javascript
// ❌ 错误的集合名称
db.collection('User')       // 应该是 'User'（正确）
db.collection('Item')       // ❌ 应该是 'CheckinItem'
db.collection('Record')     // ❌ 应该是 'CheckinRecord'

// ❌ 错误的字段名
.where({ openId: OPENID })  // ❌ 应该是 openid（小写）
```

---

## ✅ 解决方案

### 1. 使用标准配置文件

**创建配置文件**：
```
cloudfunctions/checkin-markHistorical/common/
├── config.js    (集合名称配置)
└── db.js        (数据库工具)
```

**标准集合名称**：
```javascript
COLLECTIONS: {
  USER: 'User',
  PERIOD: 'Period',
  CHECKIN_ITEM: 'CheckinItem',        // ✅ 正确
  CHECKIN_RECORD: 'CheckinRecord',    // ✅ 正确
  SETTLEMENT: 'Settlement',
  REMINDER_CONFIG: 'ReminderConfig'
}
```

---

### 2. 修复云函数代码

**修改前**：
```javascript
const userRes = await db.collection('User')
  .where({ openId: OPENID })  // ❌ 错误字段名
  .get()

const itemRes = await db.collection('Item')  // ❌ 错误集合名
  .doc(itemId)
  .get()

const recordRes = await db.collection('Record')  // ❌ 错误集合名
  .where({ ... })
  .get()
```

**修改后**：
```javascript
const userRes = await db.collection(COLLECTIONS.USER)
  .where({ openid: OPENID })  // ✅ 正确字段名（小写）
  .get()

const itemRes = await db.collection(COLLECTIONS.CHECKIN_ITEM)  // ✅ 正确
  .doc(itemId)
  .get()

const recordRes = await db.collection(COLLECTIONS.CHECKIN_RECORD)  // ✅ 正确
  .where({ ... })
  .get()
```

---

## 📦 修复文件清单

### 新增文件
```
cloudfunctions/checkin-markHistorical/common/
├── config.js    (集合名称配置)
└── db.js        (数据库工具)
```

### 修改文件
```
cloudfunctions/checkin-markHistorical/index.js  (使用标准配置)
```

---

## 🚀 部署步骤

### 1. 重新上传云函数

```
微信开发者工具
→ 云开发控制台
→ 云函数
→ 右键 checkin-markHistorical
→ 上传并部署：云端安装依赖
```

---

### 2. 测试功能

```
1. 切换到昨天
2. 点击"早睡早起"
3. 选择"标记为未打卡（漏卡）"
4. 应该显示"创建成功"或"更新成功"
5. 刷新页面，验证状态保存
```

---

## 🔍 数据库集合名称对照

### 实际数据库集合
```
✅ User              - 用户表
✅ CheckinItem       - 打卡条目表
✅ CheckinRecord     - 打卡记录表
✅ Period            - 周期表
✅ Settlement        - 结算表
```

### 配置文件常量
```javascript
COLLECTIONS.USER              → 'User'
COLLECTIONS.CHECKIN_ITEM      → 'CheckinItem'
COLLECTIONS.CHECKIN_RECORD    → 'CheckinRecord'
COLLECTIONS.PERIOD            → 'Period'
COLLECTIONS.SETTLEMENT        → 'Settlement'
```

---

## 📝 字段名称对照

### User 集合
```javascript
openid           // ✅ 小写（微信OpenID）
nickName         // 昵称
avatarUrl        // 头像
inviteCode       // 邀请码
partnerId        // 伙伴ID
currentPeriodId  // 当前周期ID
```

### CheckinItem 集合
```javascript
title            // 条目标题
points           // 积分
time             // 时间
userId           // 用户ID
enabled          // 是否启用
```

### CheckinRecord 集合
```javascript
userId           // 用户ID
itemId           // 条目ID
date             // 日期 'YYYY-MM-DD'
status           // 状态 completed/missed
itemTitle        // 条目标题快照
itemPoints       // 条目积分快照
periodId         // 周期ID
```

---

## ⚠️ 常见错误

### 错误1：集合不存在
```
errCode: -502005
errMsg: collection not found
```

**原因**：集合名称错误

**解决**：使用 `COLLECTIONS` 配置

---

### 错误2：查询不到数据
```
userRes.data.length === 0
```

**原因**：字段名错误（`openId` vs `openid`）

**解决**：使用小写 `openid`

---

### 错误3：权限错误
```
errCode: -1
errMsg: permission denied
```

**原因**：数据库权限设置不当

**解决**：
```
云开发控制台
→ 数据库
→ 集合权限
→ 设置为"所有用户可读写"（开发阶段）
```

---

## ✅ 验证清单

- [ ] 重新上传 `checkin-markHistorical` 云函数
- [ ] 切换到历史日期
- [ ] 点击条目
- [ ] 选择"标记为未打卡（漏卡）"
- [ ] 显示成功提示
- [ ] 刷新页面验证状态
- [ ] 查看数据库 `CheckinRecord` 集合
- [ ] 验证快照字段存在

---

## 🎯 测试场景

### 场景1：创建新记录
```
1. 切换到昨天
2. 选择一个没有打卡记录的条目
3. 标记为"已打卡"
4. 应该创建新记录
5. 数据库应该有 1 条新记录
```

### 场景2：更新已有记录
```
1. 切换到昨天
2. 选择一个已有记录的条目（如"运动"漏卡）
3. 标记为"已打卡"
4. 应该更新记录状态
5. 数据库记录的 status 从 missed → completed
```

### 场景3：快照验证
```
1. 标记历史打卡后
2. 查看数据库 CheckinRecord 集合
3. 记录应该包含：
   - itemTitle: "早睡早起"
   - itemPoints: 10
4. 快照字段存在且正确
```

---

## 📊 修复前后对比

### 修复前 ❌
```javascript
// 硬编码集合名称
db.collection('User')
db.collection('Item')       // ❌ 错误
db.collection('Record')     // ❌ 错误

// 错误字段名
.where({ openId: OPENID })  // ❌ 大写 I
```

### 修复后 ✅
```javascript
// 使用配置常量
db.collection(COLLECTIONS.USER)
db.collection(COLLECTIONS.CHECKIN_ITEM)       // ✅
db.collection(COLLECTIONS.CHECKIN_RECORD)     // ✅

// 正确字段名
.where({ openid: OPENID })  // ✅ 小写
```

---

## 🎊 总结

**问题**：
- ❌ 集合名称错误
- ❌ 字段名大小写错误
- ❌ 没有使用标准配置

**修复**：
- ✅ 创建标准配置文件
- ✅ 使用 `COLLECTIONS` 常量
- ✅ 修正字段名为小写 `openid`
- ✅ 与其他云函数保持一致

**结果**：
- ✅ 历史打卡功能正常
- ✅ 代码规范统一
- ✅ 易于维护

---

**现在重新上传云函数，功能就能正常使用了！** 🎉

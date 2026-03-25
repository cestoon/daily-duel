# 📦 数据修复工具使用指南

## 功能说明

**云函数**：`fix-data`

**作用**：修复没有周期ID的历史打卡记录，将它们关联到用户当前周期。

**使用场景**：
1. 用户在绑定伙伴前打卡，这些记录没有 `periodId`
2. 数据迁移后需要批量修复
3. 周期异常导致记录丢失关联

---

## 使用方式

### 方式1：小程序内调用（推荐用户使用）

在小程序任意页面调用：

```javascript
// 修复当前用户的历史记录
async fixMyData() {
  wx.showLoading({ title: '修复中...' })
  
  try {
    const res = await wx.cloud.callFunction({
      name: 'fix-data',
      data: {}  // 不传参数，只修复当前用户
    })
    
    wx.hideLoading()
    
    if (res.result.success) {
      wx.showModal({
        title: '修复成功',
        content: `已修复 ${res.result.totalFixed} 条记录`,
        showCancel: false
      })
    } else {
      wx.showModal({
        title: '修复失败',
        content: res.result.message,
        showCancel: false
      })
    }
  } catch (e) {
    wx.hideLoading()
    wx.showToast({
      title: '修复异常',
      icon: 'none'
    })
    console.error('修复失败:', e)
  }
}
```

---

### 方式2：云开发控制台（管理员使用）

#### 修复单个用户

```
云开发 → 云函数 → fix-data → 测试

输入参数:
{}

点击「运行测试」
```

**返回结果**：
```json
{
  "success": true,
  "message": "成功修复 5 条记录",
  "totalFixed": 5,
  "usersProcessed": 1,
  "details": [
    {
      "userId": "xxx",
      "nickName": "张三",
      "fixed": 5,
      "skipped": false
    }
  ]
}
```

---

#### 修复所有用户（管理员）

```
云开发 → 云函数 → fix-data → 测试

输入参数:
{
  "fixAllUsers": true
}

点击「运行测试」
```

**返回结果**：
```json
{
  "success": true,
  "message": "成功修复 15 条记录",
  "totalFixed": 15,
  "usersProcessed": 3,
  "details": [
    {
      "userId": "user1",
      "nickName": "张三",
      "fixed": 5,
      "skipped": false
    },
    {
      "userId": "user2",
      "nickName": "李四",
      "fixed": 10,
      "skipped": false
    },
    {
      "userId": "user3",
      "nickName": "王五",
      "fixed": 0,
      "skipped": true,
      "reason": "没有当前周期"
    }
  ]
}
```

---

## 修复逻辑

### 1. 单用户模式（默认）

```
1. 获取当前登录用户
2. 检查用户是否有 currentPeriodId
3. 查找该用户所有 periodId 为 null 的记录
4. 将这些记录的 periodId 更新为当前周期ID
5. 返回修复结果
```

---

### 2. 全用户模式（管理员）

```
1. 获取所有有周期的用户
2. 对每个用户：
   - 查找其 periodId 为 null 的记录
   - 更新为该用户的 currentPeriodId
3. 统计每个用户的修复数量
4. 返回汇总结果
```

---

## 何时需要修复

### ✅ 需要修复的情况

1. **绑定伙伴前的打卡记录**
   ```
   症状：本周累计显示0，但实际有打卡
   原因：绑定前没有周期ID
   ```

2. **PK数据显示异常**
   ```
   症状：PK血条不准确，统计数据缺失
   原因：部分记录没有关联周期
   ```

3. **test-runner 警告**
   ```
   ⚠️ 发现 5 条无周期记录，可能需要数据修复
   ```

---

### ❌ 不需要修复的情况

1. **新用户首次打卡**
   - 绑定伙伴后会自动创建周期
   - 新记录会自动关联

2. **数据本身正确**
   - 所有记录都有周期ID
   - 统计数据准确

---

## 验证修复结果

### 方法1：查看返回结果

```json
{
  "totalFixed": 5  // 大于0说明有修复
}
```

---

### 方法2：数据库验证

```
云开发 → 数据库 → checkin_records

筛选条件：
periodId 等于 null

查询结果：应该为 0 条（修复后）
```

---

### 方法3：小程序验证

```
1. 打开PK页面
2. 查看本周累计数据
3. 应该显示正确的已完成和漏卡积分
```

---

## 安全机制

### 1. 用户隔离

- 默认只修复当前登录用户的数据
- 无法修复其他用户（保护隐私）

---

### 2. 数据保护

- 只更新 `periodId` 字段
- 不修改其他字段（status、date、points等）
- 不会删除任何记录

---

### 3. 幂等性

- 多次执行不会重复修复
- 已有 `periodId` 的记录不会被修改
- 可以安全地重复调用

---

## 集成到小程序

### 添加到设置页

```javascript
// pages/settings/settings.js

Page({
  data: {
    needsFix: false  // 是否需要修复
  },

  async onLoad() {
    this.checkNeedsFix()
  },

  // 检查是否需要修复
  async checkNeedsFix() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'fix-data',
        data: {}
      })
      
      if (res.result.success && res.result.totalFixed > 0) {
        // 有记录被修复，说明之前有问题
        this.setData({ needsFix: true })
      }
    } catch (e) {
      console.error('检查修复状态失败:', e)
    }
  },

  // 修复数据
  async fixData() {
    wx.showLoading({ title: '修复中...' })
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'fix-data',
        data: {}
      })
      
      wx.hideLoading()
      
      if (res.result.success) {
        if (res.result.totalFixed > 0) {
          wx.showModal({
            title: '修复成功',
            content: `已修复 ${res.result.totalFixed} 条历史记录`,
            showCancel: false
          })
          this.setData({ needsFix: false })
        } else {
          wx.showModal({
            title: '无需修复',
            content: '您的数据完好，无需修复',
            showCancel: false
          })
        }
      } else {
        wx.showModal({
          title: '修复失败',
          content: res.result.message,
          showCancel: false
        })
      }
    } catch (e) {
      wx.hideLoading()
      wx.showToast({
        title: '修复异常',
        icon: 'none'
      })
    }
  }
})
```

---

### 在设置页显示提示

```xml
<!-- pages/settings/settings.wxml -->

<view wx:if="{{needsFix}}" class="fix-tip">
  <view class="tip-icon">⚠️</view>
  <view class="tip-text">检测到历史数据异常</view>
  <button bindtap="fixData" size="mini">立即修复</button>
</view>
```

---

## 常见问题

### Q1: 修复后数据还是不对？

**检查**：
1. 用户是否有 `currentPeriodId`（必须先绑定伙伴）
2. 云函数是否执行成功（查看日志）
3. 数据库中记录是否真的更新了

---

### Q2: 可以撤销修复吗？

**答**：不能。修复是永久性的。但是：
- 只更新了 `periodId`，没有修改其他数据
- 如果修复错误，可以手动在数据库中改回 `null`

---

### Q3: 修复会影响积分计算吗？

**答**：会。修复后这些记录会被计入统计：
- 本周累计积分会增加
- PK血条会更新
- 结算金额可能变化

---

### Q4: 什么时候执行修复？

**建议时机**：
1. 刚绑定伙伴后（如果之前有打卡）
2. 发现数据异常时
3. 每周结算前（确保数据准确）

---

## 监控建议

### 定期检查

```
每周一早上运行 test-runner
查看「无周期记录检查」
如果发现记录 → 执行 fix-data
```

---

### 自动提醒

可以在小程序启动时检查：

```javascript
// app.js
onLaunch() {
  this.checkDataIntegrity()
}

async checkDataIntegrity() {
  try {
    const res = await wx.cloud.callFunction({
      name: 'fix-data',
      data: {}
    })
    
    if (res.result.totalFixed > 0) {
      // 静默修复
      console.log('自动修复历史数据:', res.result.totalFixed)
      
      // 可选：提示用户
      wx.showToast({
        title: `已修复${res.result.totalFixed}条记录`,
        icon: 'success'
      })
    }
  } catch (e) {
    console.error('数据完整性检查失败:', e)
  }
}
```

---

## 总结

**适用场景**：历史数据修复

**使用频率**：按需使用（有问题时）

**安全性**：高（只更新周期ID，不删除数据）

**性能**：快（批量更新，通常1-2秒完成）

---

**现在就部署并测试吧！** 🚀

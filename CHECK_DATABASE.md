# 📊 数据库检查指南

## 直接查询数据（最快）

### 1. 查看当前周期

```
云开发 → 数据库 → periods

筛选条件：status = 'active'

查看字段：
- startDate
- endDate
- createdAt
```

**预期结果**：
```
startDate: 2026-03-23
endDate: 2026-03-29
status: active
```

---

### 2. 查看打卡记录

```
云开发 → 数据库 → checkin_records

按 date 字段排序（降序）

查看前20条：
- date
- status
- periodId
- userId
```

**关键问题**：
1. **本周记录**（3.23 ~ 3.29）的 `periodId` 是否为当前周期ID？
2. **上周记录**（3.17 ~ 3.22）的 `periodId` 是否为 `null`？
3. **更早记录**（3.16之前）的 `periodId` 是否为 `null`？

---

### 3. 查看历史周期

```
云开发 → 数据库 → periods

筛选条件：status = 'completed'

按 endDate 排序（降序）
```

**检查**：
- 是否有上周的周期（3.17 ~ 3.22 或 3.16 ~ 3.22）？
- 如果有，记录它的 `_id`

---

## 问题诊断

### 问题1：本周漏卡50分

**可能原因**：
- 历史记录被错误关联到本周
- 已经通过 `fix-data-rollback-admin` 修复

**验证**：
```sql
SELECT * FROM checkin_records 
WHERE periodId = '当前周期ID' 
  AND date < '2026-03-23'
```

如果有结果 → 说明还有历史记录被错误关联

---

### 问题2：已完成71分

**可能原因**：
- 统计了历史记录
- 或者条目积分设置错误

**验证**：
```
1. 查看你的打卡条目（checkin_items）
   每个条目的 points 是多少？

2. 查看本周已完成的记录
   WHERE periodId = 当前周期ID
   AND status = 'completed'
   
3. 手动计算积分总和
```

---

### 问题3：新条目出现在历史日期

**问题**：
- 条目是3.23创建的
- 但3.17的打卡记录显示了这个条目

**这是前端显示问题**，不是数据问题！

**检查**：
```
云开发 → 数据库 → checkin_records

筛选：date = '2026-03-17'

查看 itemId 字段，是否指向新创建的条目？
```

**如果是**：
- 前端逻辑错误：显示了不该显示的条目
- 需要修复 `pages/index/index.js` 的历史记录渲染

---

## 快速检查命令

### 检查本周记录数量

```
云开发 → 数据库 → checkin_records

筛选：
periodId = '你的周期ID'

查看记录总数
```

**正常情况**：
- 今天是周一第一天
- 应该只有今天的记录
- 数量 = 你的打卡条目数量

---

### 检查无周期记录

```
云开发 → 数据库 → checkin_records

筛选：
periodId = null 或 不存在

按 date 排序
```

**应该看到**：
- 上周的记录（3.17 ~ 3.22）
- 更早的记录

---

## 🚨 紧急修复方案

### 如果本周数据仍然不对

**手动清理本周数据**：

```
云开发 → 数据库 → checkin_records

筛选：
periodId = '当前周期ID'
date < '2026-03-23'

删除这些记录
```

**然后重新生成今天的打卡条目**。

---

## 📸 需要截图的内容

请提供以下截图：

1. **periods 表**
   - 筛选 `status = 'active'`
   - 显示 startDate, endDate

2. **checkin_records 表**
   - 按 date 降序
   - 显示前20条的 date, status, periodId

3. **你的打卡条目**
   - checkin_items 表
   - 显示 name, points

有了这些数据，我可以精确定位问题！

---

或者，**上传修复后的 check-data**，输入 `{}` 运行。

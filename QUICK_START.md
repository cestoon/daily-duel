# 5分钟快速部署指南

## 前置条件
- [ ] 云开发已开通（免费版）
- [ ] 数据库集合已手动创建（6个）

---

## 第一步：配置环境ID（1分钟）

1. 在微信开发者工具中打开 `miniprogram/app.js`
2. 找到第 9 行：
   ```javascript
   env: 'daily-duel-xxx'
   ```
3. 将 `daily-duel-xxx` 替换为你的**实际环境ID**
   - 环境ID在云开发控制台可以看到
   - 格式类似：`daily-duel-7g3h4k5m6n`

**示例：**
```javascript
env: 'daily-duel-7g3h4k5m6n'
```

---

## 第二步：批量部署云函数（3-5分钟）

### 批量上传方法

在微信开发者工具中，**依次右键**以下云函数，选择「上传并部署：云端安装依赖」：

#### 📦 一、用户相关（4个）
```
cloudfunctions/user/login
cloudfunctions/user/getInfo
cloudfunctions/user/getPartner
cloudfunctions/user/bindPartner
```

#### 📦 二、周期管理（1个）
```
cloudfunctions/period/create
```

#### 📦 三、打卡相关（6个）
```
cloudfunctions/checkin/submit
cloudfunctions/checkin/getItems
cloudfunctions/checkin/getTodayRecords
cloudfunctions/checkin/addItem
cloudfunctions/checkin/updateItem
cloudfunctions/checkin/deleteItem
```

#### 📦 四、结算相关（3个）
```
cloudfunctions/settlement/getBalance
cloudfunctions/settlement/confirmPayment
cloudfunctions/settlement/getList
```

#### 📦 五、定时任务（2个）
```
cloudfunctions/timer/dailyCheck
cloudfunctions/timer/weeklySettlement
```

### 如何验证部署成功？

1. 点击「云开发」按钮
2. 进入「云函数」标签
3. 检查是否能看到所有云函数（共17个）

---

## 第三步：配置定时触发器（1分钟）

### 1. 每日打卡检查

1. 云开发控制台 → 云函数 → 找到 `timer-dailyCheck`
2. 点击「触发器」→「添加触发器」
3. 配置：
   - 名称：`daily-check`
   - 类型：`定时触发器`
   - Cron表达式：`0 0 1 * * * *`
   - 说明：每天00:01执行

### 2. 每周结算

1. 找到 `timer-weeklySettlement` 云函数
2. 点击「触发器」→「添加触发器」
3. 配置：
   - 名称：`weekly-settlement`
   - 类型：`定时触发器`
   - Cron表达式：`0 0 10 * * 1 *`
   - 说明：每周一00:10执行

---

## 验证部署

### 1. 测试登录功能
- 在模拟器中点击「微信登录」
- 确认可以正常登录

### 2. 测试云函数
在云开发控制台 → 云函数 → 日志中查看是否有错误

### 3. 检查定时触发器
- 云开发控制台 → 云函数 → 触发器
- 确认两个触发器都已添加

---

## 常见问题

### Q1: 云函数上传失败
**解决：**
- 检查是否已开通云开发
- 确认网络连接正常
- 重新尝试上传

### Q2: 登录仍然失败
**检查：**
- 环境ID是否正确配置？
- 云函数是否全部部署？
- 查看云函数日志（云开发控制台 → 云函数 → 日志）

### Q3: 找不到触发器入口
**解决：**
- 在云函数列表中找到对应云函数
- 点击云函数名称进入详情
- 右侧面板中找到「触发器」标签

---

## 下一步

部署完成后，你可以：
1. **测试登录**：点击微信登录按钮
2. **添加打卡条目**：在「条目管理」页面添加
3. **测试打卡**：在「今日打卡」页面打卡
4. **查看PK对战**：在「PK对战」页面查看积分对比

---

## 技术支持

- 完整文档：`docs/`
- 部署指南：`DEPLOY.md`
- 问题反馈：GitHub Issues

---

## 批量部署技巧

虽然无法完全自动化，但你可以：

1. **使用键盘快捷键**：
   - 右键云函数文件夹
   - 按 `D` 键（上传并部署）
   - 快速连续操作

2. **按模块分批部署**：
   - 先部署用户相关（4个）
   - 再部署打卡相关（6个）
   - 最后部署定时任务（2个）

3. **查看部署状态**：
   - 右下角会显示上传进度
   - 全部完成后云开发控制台会自动刷新

---

## 完成！

部署完成后，你的 Daily Duel 就可以正常使用了！🎉

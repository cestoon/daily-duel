# 快速部署指南

## 前置检查清单

- [ ] 已安装微信开发者工具
- [ ] 已有微信小程序账号
- [ ] 小程序 AppID: `wxd5ddddb5808e1066`（已配置）

## 第一步：开通云开发

1. 在微信开发者工具中打开项目
2. 点击工具栏「云开发」按钮
3. 点击「开通」（首次免费）
4. 选择「按量付费」（推荐）或「包年包月」
5. 创建环境，环境名称：`daily-duel`
6. 记下环境ID（格式：`daily-duel-xxxxx`）

## 第二步：配置环境ID

1. 打开 `miniprogram/app.js` 第9行
2. 将 `env: 'daily-duel-xxx'` 替换为你的实际环境ID

例如：
```javascript
env: 'daily-duel-7g3h4k5m6n'
```

## 第三步：初始化数据库

### 方式一：使用云开发控制台（推荐）

1. 在微信开发者工具中点击「云开发」
2. 进入「数据库」
3. 依次创建以下集合（无需字段，创建即可）：
   - `User` - 用户表
   - `Period` - 周期表
   - `CheckinItem` - 打卡条目表
   - `CheckinRecord` - 打卡记录表
   - `Settlement` - 结算表
   - `ReminderConfig` - 提醒配置表

4. 右键 `cloudfunctions/init-db` 云函数
5. 选择「上传并部署：云端安装依赖」
6. 在云开发控制台 → 云函数 → init-db
7. 点击「测试」按钮
8. 点击「运行测试」（不需要传参数）

### 方式二：自动初始化（如需自动化脚本）

详见 `scripts/init-db.sh`

## 第四步：部署云函数

在微信开发者工具中，依次右键上传以下云函数：

### 用户相关
- `cloudfunctions/user/login` - 登录
- `cloudfunctions/user/getInfo` - 获取用户信息
- `cloudfunctions/user/getPartner` - 获取伙伴信息
- `cloudfunctions/user/bindPartner` - 绑定伙伴

### 周期管理
- `cloudfunctions/period/create` - 创建新周期

### 打卡相关
- `cloudfunctions/checkin/submit` - 提交打卡
- `cloudfunctions/checkin/getItems` - 获取条目列表
- `cloudfunctions/checkin/getTodayRecords` - 获取今日记录
- `cloudfunctions/checkin/addItem` - 添加条目
- `cloudfunctions/checkin/updateItem` - 更新条目
- `cloudfunctions/checkin/deleteItem` - 删除条目

### 结算相关
- `cloudfunctions/settlement/getBalance` - 获取余额
- `cloudfunctions/settlement/confirmPayment` - 确认支付
- `cloudfunctions/settlement/getList` - 获取结算列表

### 定时任务
- `cloudfunctions/timer/dailyCheck` - 每日打卡检查
- `cloudfunctions/timer/weeklySettlement` - 每周结算

**批量部署方法：**
在云函数目录右键选择「上传并部署：云端安装依赖」，然后手动依次上传每个云函数。

## 第五步：配置定时触发器

### 1. 每日打卡检查

1. 在云开发控制台进入「云函数」
2. 找到 `timer-dailyCheck` 云函数
3. 点击「触发器」
4. 添加触发器：
   ```
   名称：daily-check
   类型：定时触发器
   Cron表达式：0 0 1 * * * *
   描述：每天00:01执行
   ```

### 2. 每周结算

1. 找到 `timer-weeklySettlement` 云函数
2. 点击「触发器」
3. 添加触发器：
   ```
   名称：weekly-settlement
   类型：定时触发器
   Cron表达式：0 0 10 * * 1 *
   描述：每周一00:10执行
   ```

**Cron表达式说明：**
- 格式：`秒 分 时 日 月 星期`
- `0 0 1 * * * *`：每天00:01:00执行
- `0 0 10 * * 1 *`：每周一00:10:00执行（星期1=周一）

## 第六步：配置订阅消息（可选）

如需打卡提醒功能：

1. 登录微信公众平台
2. 进入「功能」→「订阅消息」
3. 申请以下模板：
   - 打卡提醒：显示「今日打卡时间」、「未完成条目」
   - 结算提醒：显示「结算金额」、「支付状态」

4. 在 `miniprogram/pages/checkin/checkin.js` 中配置模板ID

## 测试验证

### 1. 登录测试
- 启动模拟器
- 点击「微信登录」
- 确认可以正常登录

### 2. 绑定伙伴测试
- 在设置页面输入伙伴的 OpenID
- 确认绑定成功

### 3. 打卡测试
- 添加打卡条目
- 提交打卡
- 确认数据正常保存

### 4. 结算测试
- 查看 PK 对战页面
- 确认余额显示正确
- 查看结算列表

## 常见问题

### Q1: 登录失败，提示「没有权限，请先开通云开发」
**A:** 检查以下项：
- 云开发是否已开通
- app.js 中的环境ID是否正确
- 云函数是否已部署

### Q2: 云函数调用失败
**A:**
- 确认云函数已上传并部署
- 检查云函数日志（云开发控制台 → 云函数 → 日志）
- 确认数据库集合已创建

### Q3: Logo/头像无法显示
**A:**
- 确认 `miniprogram/assets/logo.png` 和 `default-avatar.png` 已创建
- 检查路径是否正确（`/assets/logo.png`）
- 清除模拟器缓存

### Q4: 定时任务未执行
**A:**
- 检查触发器是否配置
- 确认 Cron 表达式格式正确
- 查看云函数日志

### Q5: 结算金额不对
**A:**
- 检查打卡记录是否完整
- 确认条目分数设置正确
- 查看余额计算逻辑

## 数据清理

如需重置数据：
```javascript
// 在云开发控制台 → 数据库执行
db.collection('User').where({}).remove()
db.collection('Period').where({}).remove()
db.collection('CheckinItem').where({}).remove()
db.collection('CheckinRecord').where({}).remove()
db.collection('Settlement').where({}).remove()
db.collection('ReminderConfig').where({}).remove()
```

## 下一步

部署完成后：
1. 配置订阅消息模板
2. 自定义 Logo 和图标（替换 `miniprogram/assets/`）
3. 调整打卡规则（修改 `cloudfunctions/common/config.js`）
4. 测试所有功能
5. 提交审核并发布

## 技术支持

- 查看完整文档：`docs/`
- API 文档：`docs/api-doc.md`
- 部署指南：`docs/deployment-guide.md`

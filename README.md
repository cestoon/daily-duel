# Daily Duel

让习惯养成变成一场有趣的对决

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![WeChat](https://img.shields.io/badge/Platform-微信小程序-green.svg)](https://developers.weixin.qq.com/miniprogram/dev/framework/)

## 项目简介

Daily Duel 是一款基于微信小程序的双人对战打卡应用。通过游戏化的 PK 机制，让习惯养成变得有趣且充满动力。每周一轮对决，通过日常打卡积累积分，周期结束后结算输赢。

## 核心功能

- **PK 对战**：实时血条对比，直观展示双方积分差距
- **今日打卡**：每日打卡提醒，支持补卡记录
- **条目管理**：自定义打卡条目，灵活设置分值
- **结算管理**：每周自动结算，支持手动确认支付
- **数据统计**：查看历史打卡数据和趋势分析
- **系统设置**：绑定伙伴、管理提醒时间

## 技术栈

- **前端**：微信小程序原生开发
- **后端**：微信云开发（Serverless）
- **数据库**：云数据库
- **定时任务**：云函数定时触发器

## 快速开始

### 前置要求

- 微信开发者工具（[下载](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)）
- 微信小程序账号
- 已开通云开发服务

### 5 分钟快速部署

1. **克隆项目**
   ```bash
   git clone https://github.com/cestoon/daily-duel.git
   cd daily-duel
   ```

2. **在微信开发者工具中导入项目**
   - 项目目录：`/Users/bingkunfeng/projects/AI/daily-duel`
   - AppID：`wxd5ddddb5808e1066`（已配置）

3. **开通云开发**
   - 点击工具栏「云开发」按钮
   - 点击「开通」
   - 创建环境（推荐环境名：`daily-duel`）
   - 记下环境ID（格式：`daily-duel-xxxxx`）

4. **配置环境ID**
   - 打开 `miniprogram/app.js` 第9行
   - 将 `'daily-duel-xxx'` 替换为你的实际环境ID

5. **初始化数据库**
   - 在云开发控制台创建以下集合：
     - `User`
     - `Period`
     - `CheckinItem`
     - `CheckinRecord`
     - `Settlement`
     - `ReminderConfig`
   - 右键 `cloudfunctions/init-db` → 「上传并部署：云端安装依赖」
   - 在云开发控制台测试 `init-db` 云函数

6. **部署云函数**
   - 依次上传并部署所有云函数（17个）

7. **配置定时触发器**
   - `dailyCheck`：每天00:01执行（`0 0 1 * * * *`）
   - `weeklySettlement`：每周一00:10执行（`0 0 10 * * 1 *`）

详细的部署步骤请参考 [部署指南](DEPLOY.md)

## 项目结构

```
daily-duel/
├── miniprogram/          # 小程序前端代码
│   ├── pages/           # 7个页面
│   │   ├── index/       # 登录页
│   │   ├── pk/          # PK对战页
│   │   ├── checkin/     # 今日打卡页
│   │   ├── items/       # 条目管理页
│   │   ├── settlement/  # 结算页
│   │   ├── stats/       # 数据统计页
│   │   └── settings/    # 系统设置页
│   ├── utils/           # 工具函数
│   ├── assets/          # 资源文件（图标、头像）
│   ├── app.js           # 小程序入口
│   ├── app.json         # 全局配置
│   └── app.wxss         # 全局样式
├── cloudfunctions/      # 云函数（17个）
│   ├── user/            # 用户相关（4个）
│   ├── period/          # 周期管理（1个）
│   ├── checkin/         # 打卡相关（6个）
│   ├── settlement/      # 结算相关（3个）
│   ├── timer/           # 定时任务（2个）
│   ├── common/          # 公共模块
│   └── init-db/         # 数据库初始化
├── docs/                # 文档
│   ├── deployment-guide.md   # 详细部署指南
│   ├── api-doc.md           # API文档
│   ├── assets-guide.md      # 资源配置指南
│   └── triggers-config.md   # 定时器配置
├── DEPLOY.md            # 快速部署指南
├── README.md            # 项目说明
└── project.config.json  # 项目配置
```

## 核心规则

### 周期管理
- 每周一0:00开启新周期，周日23:59结束
- 新周期开始时强制清零余额
- 未结算的上一周期余额记为"欠账"

### 打卡规则
- 每日23:59自动检查未打卡条目并扣分
- 本周期内允许补卡
- 支持自定义打卡时间提醒

### 结算规则
- 每周自动结算上周积分
- 积分少的一方支付差额给积分多的一方
- 任意一方点击"已确认支付"即可完成结算
- 支持后续补确认

### 透明度规则
- 双方均可查看对方的打卡明细
- 不可修改对方配置

### 数据保留
- 所有数据保留2年
- 过期数据自动清理

## 数据库设计

### User（用户表）
- openid：用户唯一标识
- nickName：昵称
- avatarUrl：头像
- partnerId：伙伴ID
- currentPeriodId：当前周期ID

### Period（周期表）
- startDate：开始日期（周一）
- endDate：结束日期（周日）
- status：周期状态

### CheckinItem（打卡条目表）
- userId：用户ID
- title：条目标题
- points：分数
- time：打卡时间
- enabled：是否启用

### CheckinRecord（打卡记录表）
- userId：用户ID
- itemId：条目ID
- periodId：周期ID
- date：日期
- status：状态

### Settlement（结算表）
- periodId：周期ID
- payerId：付款方ID
- payeeId：收款方ID
- amount：金额
- status：状态

### ReminderConfig（提醒配置表）
- userId：用户ID
- enabled：是否启用
- time：提醒时间

## API 文档

详细的 API 文档请参考 [API文档](docs/api-doc.md)

## MVP 范围

### 已实现 ✅
- 用户登录和伙伴绑定
- 打卡条目管理
- 每日打卡
- PK 对战展示
- 周期结算
- 数据统计

### 待开发 ⏳
- 补卡功能
- 请假功能
- 成就系统
- 排行榜
- 数据可视化优化
- 订阅消息推送

## 常见问题

### Q: 登录失败，提示「没有权限」？
A: 检查以下项：
- 云开发是否已开通
- app.js 中的环境ID是否正确
- 云函数是否已部署

### Q: Logo/头像无法显示？
A: 确保 `miniprogram/assets/` 下有 `logo.png` 和 `default-avatar.png`

### Q: 定时任务未执行？
A: 检查触发器配置和 Cron 表达式格式

更多问题请参考 [部署指南](DEPLOY.md#常见问题)

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

[MIT License](LICENSE)

## 链接

- [GitHub 仓库](https://github.com/cestoon/daily-duel)
- [问题反馈](https://github.com/cestoon/daily-duel/issues)

## 技术支持

如遇问题，请：
1. 查看 [部署指南](DEPLOY.md)
2. 搜索 [Issues](https://github.com/cestoon/daily-duel/issues)
3. 提交新的 Issue

---

让习惯养成变成一场有趣的对决 🎯

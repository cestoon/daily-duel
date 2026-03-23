# 云函数 CLI 上传指南

## 🚀 快速开始

### 方式 1：使用自动脚本（推荐）

```bash
./scripts/deploy-cloud-functions.sh
```

### 方式 2：手动上传（稳定）

打开微信开发者工具 → 云开发 → 云函数 → 右键上传

---

## 📋 首次使用 CLI 需要配置

### 步骤 1：启用服务端口

**在微信开发者工具中**：

```
1. 打开微信开发者工具
2. 点击右上角「设置」图标 ⚙️
3. 选择「安全设置」
4. 开启「服务端口」
```

**或者命令行自动提示**：

```bash
# 运行脚本，会自动检测并提示
./scripts/deploy-cloud-functions.sh

# 首次运行会提示开启服务端口
# 按提示操作即可
```

---

### 步骤 2：登录（如果需要）

```bash
/Applications/wechatwebdevtools.app/Contents/MacOS/cli login
```

---

### 步骤 3：打开项目

确保在微信开发者工具中打开了 Daily Duel 项目

---

## ✅ 验证 CLI 是否可用

```bash
# 检查登录状态
/Applications/wechatwebdevtools.app/Contents/MacOS/cli islogin

# 列出云函数
/Applications/wechatwebdevtools.app/Contents/MacOS/cli cloud functions list \
  --env cloud1-9gtimm7r81602bae \
  --project /Users/bingkunfeng/projects/AI/daily-duel
```

---

## 🔧 手动上传单个云函数

```bash
CLI="/Applications/wechatwebdevtools.app/Contents/MacOS/cli"

# 上传单个云函数
$CLI cloud functions deploy \
  --env cloud1-9gtimm7r81602bae \
  --names user-login \
  --project /Users/bingkunfeng/projects/AI/daily-duel \
  --remote-npm-install
```

---

## 📦 批量上传云函数

```bash
CLI="/Applications/wechatwebdevtools.app/Contents/MacOS/cli"

# 上传多个云函数
$CLI cloud functions deploy \
  --env cloud1-9gtimm7r81602bae \
  --names user-login user-bindPartner settlement-getMissedPoints \
  --project /Users/bingkunfeng/projects/AI/daily-duel \
  --remote-npm-install
```

---

## ❌ 常见错误

### 1. IDE service port disabled

**错误信息**：
```
IDE service port disabled. To use CLI Call, please enter y to confirm enabling CLI capability
```

**解决方法**：
- 打开微信开发者工具
- 设置 → 安全设置 → 开启「服务端口」

---

### 2. 项目未打开

**错误信息**：
```
Project not found
```

**解决方法**：
- 在微信开发者工具中打开 Daily Duel 项目
- 或使用 `--project` 参数指定项目路径

---

### 3. 环境 ID 错误

**错误信息**：
```
Environment not found
```

**解决方法**：
- 检查 `project.config.json` 中的环境 ID
- 确保环境 ID 是 `cloud1-9gtimm7r81602bae`

---

## 💡 推荐工作流程

### 开发阶段（快速迭代）

**使用 CLI 上传** - 快速但需要配置：
```bash
./scripts/deploy-cloud-functions.sh
```

### 生产环境（稳定可靠）

**使用开发者工具上传** - 慢但稳定：
1. 打开微信开发者工具
2. 云开发 → 云函数
3. 右键 → 上传并部署：云端安装依赖

---

## 🎯 总结

| 方式 | 速度 | 稳定性 | 推荐场景 |
|------|------|--------|----------|
| **CLI 上传** | ⚡ 快 | ⭐⭐⭐ | 开发调试 |
| **工具上传** | 🐢 慢 | ⭐⭐⭐⭐⭐ | 生产部署 |

**建议**：
- ✅ 首次部署：使用开发者工具上传（稳定）
- ✅ 快速迭代：配置好 CLI 后使用脚本上传
- ✅ 重要更新：使用开发者工具上传（确保成功）

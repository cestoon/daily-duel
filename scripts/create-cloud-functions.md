# 云函数快速创建指南

## 方法一：在云开发控制台逐个创建（推荐）

### 步骤

1. 打开云开发控制台：https://console.cloud.tencent.com/tcb
2. 选择环境：`cloud1-9gtimm7r81602bae`
3. 点击左侧 **"Cloud Function"** 菜单
4. 点击 **"+ Create"** 按钮
5. 依次创建以下云函数（只填写名称，其他默认即可）：

### 用户相关（4个）
- `user-login`
- `user-getInfo`
- `user-getPartner`
- `user-bindPartner`

### 周期管理（1个）
- `period-create`

### 打卡相关（6个）
- `checkin-submit`
- `checkin-getItems`
- `checkin-getTodayRecords`
- `checkin-addItem`
- `checkin-updateItem`
- `checkin-deleteItem`

### 结算相关（3个）
- `settlement-getBalance`
- `settlement-confirmPayment`
- `settlement-getList`

### 定时任务（2个）
- `timer-dailyCheck`
- `timer-weeklySettlement`

### 公共模块（1个）
- `common`

**总计：17 个云函数**

---

## 方法二：使用 CLI 批量创建（需要安装 tcb-cli）

### 安装 tcb-cli

```bash
npm install -g @cloudbase/cli
```

### 登录

```bash
tcb login
```

### 批量创建云函数

```bash
cd /Users/bingkunfeng/projects/AI/daily-duel
./scripts/batch-create-cloud-functions.sh
```

---

## 方法三：直接在微信开发者工具中创建（最简单）

### 步骤

1. 在微信开发者工具中，打开项目
2. 点击左侧 **"Cloud"** 或 **"云开发"** 按钮
3. 进入云开发界面
4. 找到 **"Cloud Function"** 模块
5. 点击 **"+ Create"** 按钮
6. 依次创建所有17个云函数

创建完成后，再回到项目目录，右键每个云函数文件夹，选择 **"Upload and Deploy"** 上传代码。

---

## 验证创建成功

1. 云开发控制台 → Cloud Function
2. 确认所有17个云函数都已列出
3. 状态为 "Active" 或 "Running"

---

## 下一步

云函数创建完成后，可以：

1. 在微信开发者工具中右键云函数文件夹上传代码
2. 或者在云开发控制台直接编辑代码
3. 配置定时触发器

---

**推荐使用方法一或方法三，最快！**

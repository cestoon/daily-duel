# ⚡ 快速修复检查清单

## 🎯 3分钟快速修复（今天必做）

### ✅ 步骤1: 上传3个云函数（2分钟）

在微信开发者工具中，右键上传以下云函数：

```
☐ settlement-getBalance
☐ settlement-getMissedPoints  
☐ timer-weeklySettlement
```

**操作**: 右键 → 上传并部署：云端安装依赖

---

### ✅ 步骤2: 创建并运行修复工具（1分钟）

#### 快速创建云函数

```bash
# 在项目根目录执行
mkdir -p cloudfunctions/scripts-forceNewPeriod
cp scripts/force-create-new-period.js cloudfunctions/scripts-forceNewPeriod/index.js
```

**创建 package.json**:

```bash
cat > cloudfunctions/scripts-forceNewPeriod/package.json << 'EOF'
{
  "name": "scripts-forceNewPeriod",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "~2.6.3"
  }
}
EOF
```

#### 上传并运行

1. 右键 `scripts-forceNewPeriod` → 上传并部署：云端安装依赖
2. 云开发 → 云函数 → `scripts-forceNewPeriod` → 测试
3. 点击「运行测试」（不需要参数）

**看到成功信息即可！**

---

### ✅ 步骤3: 测试验证（30秒）

1. 点击「编译」重新加载小程序
2. 清除缓存（工具 → 清缓存 → 全部清除）
3. 进入「PK对战」页面
4. 检查血条是否有图例说明

---

## 🔍 验证成功标志

### PK页面应该显示：

```
┌─────────────────────────────────┐
│ 本周PK - 漏卡对比               │
│ 进行中 (封顶±100分)              │
│                                 │
│ 📊 漏卡越少，血条越大            │
│                                 │
│ [深蓝========][橙色==========]  │
│                                 │
│ 我的漏卡: X分  TA的漏卡: Y分     │
│                                 │
│ 🎉 你领先 N 分（TA比你多漏N分）  │
└─────────────────────────────────┘
```

### 用户信息显示：

```
今日: 3/5  ✅ (正确)
而不是: 3/8  ❌ (错误)
```

---

## 🚨 如果出现问题

### 问题1: 修复工具运行失败

**查看日志**:
- 云开发 → 云函数 → `scripts-forceNewPeriod` → 日志
- 记录错误信息

### 问题2: PK页面还是显示旧数据

**清除所有缓存**:
1. 工具 → 清缓存 → 全部清除
2. 模拟器 → 清除数据缓存
3. 重新编译

### 问题3: 血条没有图例

**检查前端文件是否更新**:
1. 确认 `miniprogram/pages/pk/pk.wxml` 已保存
2. 确认 `miniprogram/pages/pk/pk.wxss` 已保存
3. 点击「编译」

---

## 📋 详细文档

完整修复指南: `BUGFIX_GUIDE_20260323.md`

---

**预计总时间**: 3-5分钟
**难度**: ⭐⭐ (简单)
**成功率**: 99%

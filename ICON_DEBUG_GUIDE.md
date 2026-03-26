# 🔍 Tab栏图标不显示问题排查指南

**问题**：开发工具能看到图标，真机预览看不到  
**日期**：2026-03-25

---

## 🎯 问题分析

### 你的情况
```
✅ 图标尺寸：81x81px（符合要求）
✅ 图标大小：300-600B（远小于40KB）
✅ 文件格式：PNG RGBA（正确）
✅ 路径配置：assets/icons/*.png（正确）
```

---

## 🔍 可能原因（按概率排序）

### 1. ⭐⭐⭐ 路径前缀问题（最可能）

**问题**：
```javascript
// 当前配置
"iconPath": "assets/icons/pk.png"

// 可能需要
"iconPath": "/assets/icons/pk.png"  // 加斜杠
或
"iconPath": "miniprogram/assets/icons/pk.png"  // 完整路径
```

**原因**：
- 真机和开发工具的路径解析可能不同
- 真机需要绝对路径（以/开头）

---

### 2. ⭐⭐ 缓存问题

**问题**：
- 真机缓存了旧版本
- 没有重新加载图标

**解决**：
- 删除小程序
- 重新扫码

---

### 3. ⭐ 图标格式问题

**问题**：
- PNG图标可能有特殊格式问题
- 某些PNG编码方式真机不支持

**解决**：
- 重新导出图标为标准PNG
- 确保不是interlaced PNG

---

## 🛠️ 解决方案

### 方案1：修改路径（推荐）⭐⭐⭐

在路径前加斜杠：

```json
{
  "tabBar": {
    "list": [
      {
        "pagePath": "pages/pk/pk",
        "text": "PK",
        "iconPath": "/assets/icons/pk.png",
        "selectedIconPath": "/assets/icons/pk-active.png"
      }
    ]
  }
}
```

---

### 方案2：清除缓存重试

**操作步骤**：
```
1. 真机上长按小程序
2. 删除小程序
3. 重新扫码预览
4. 查看是否显示
```

---

### 方案3：重新生成图标

如果上述方案都不行，可能是图标本身问题。

**使用标准PNG格式**：
```
格式：PNG-8 或 PNG-24
颜色：RGBA
尺寸：81x81px
大小：< 40KB
不要使用：interlaced（隔行扫描）
```

---

## 🚀 快速测试

### 测试1：验证路径

**修改 app.json**：
```json
"iconPath": "/assets/icons/pk.png",
"selectedIconPath": "/assets/icons/pk-active.png"
```

**保存 → 编译 → 预览 → 扫码查看**

---

### 测试2：使用系统图标（排除图标问题）

**临时测试**，创建简单图标：

```bash
# 创建纯色测试图标
cd /Users/bingkunfeng/projects/AI/daily-duel/miniprogram/assets/icons

# 备份原图标
mkdir backup
cp *.png backup/

# 创建测试图标（使用系统工具）
# 这里需要手动创建或使用现成图标
```

---

## 📋 详细排查步骤

### 步骤1：检查路径配置

**当前配置**：
```json
"iconPath": "assets/icons/pk.png"
```

**测试改为**：
```json
"iconPath": "/assets/icons/pk.png"
```

**或者**：
```json
"iconPath": "./assets/icons/pk.png"
```

---

### 步骤2：检查文件是否存在

```bash
cd /Users/bingkunfeng/projects/AI/daily-duel/miniprogram
ls -la assets/icons/
```

**确认**：
```
✅ pk.png 存在
✅ pk-active.png 存在
✅ 所有10个图标都存在
```

---

### 步骤3：检查图标格式

```bash
cd /Users/bingkunfeng/projects/AI/daily-duel/miniprogram/assets/icons
file pk.png
```

**正确格式**：
```
PNG image data, 81 x 81, 8-bit/color RGBA, non-interlaced
```

**如果是 interlaced**：
```
需要重新保存为 non-interlaced
```

---

### 步骤4：检查图标大小

```bash
ls -lh *.png
```

**要求**：
```
每个图标 < 40KB
```

**你的图标**：
```
300-600B ✅ 非常小，没问题
```

---

### 步骤5：清除缓存

**真机操作**：
```
1. 长按小程序图标
2. 删除
3. 重启微信
4. 重新扫码
```

---

## 🎯 推荐方案（按顺序尝试）

### 方案A：加斜杠（最简单）⭐⭐⭐

**操作**：
1. 修改 `app.json`
2. 所有 `iconPath` 前加 `/`
3. 编译预览
4. 扫码测试

**预计解决率**：70%

---

### 方案B：清除缓存（最快）⭐⭐

**操作**：
1. 删除真机小程序
2. 重新扫码
3. 查看效果

**预计解决率**：20%

---

### 方案C：检查图标格式（最彻底）⭐

**操作**：
1. 查看图标格式信息
2. 如果有问题，重新生成
3. 上传测试

**预计解决率**：10%

---

## 💡 常见问题

### Q1：为什么开发工具能看到，真机看不到？

**A**：
```
开发工具路径解析比较宽松
真机路径解析更严格
需要使用绝对路径（以/开头）
```

---

### Q2：图标需要多大？

**A**：
```
尺寸：81x81px（必须）
大小：< 40KB（建议）
格式：PNG（RGBA）
```

---

### Q3：需要重新上传吗？

**A**：
```
修改 app.json 后：
✅ 需要重新编译
✅ 需要重新预览
✅ 不需要重新上传云函数
```

---

## 🔧 修复代码

我帮你生成修复后的配置：

```json
{
  "tabBar": {
    "color": "#999999",
    "selectedColor": "#FF6B35",
    "backgroundColor": "#ffffff",
    "borderStyle": "white",
    "list": [
      {
        "pagePath": "pages/pk/pk",
        "text": "PK",
        "iconPath": "/assets/icons/pk.png",
        "selectedIconPath": "/assets/icons/pk-active.png"
      },
      {
        "pagePath": "pages/checkin/checkin",
        "text": "打卡",
        "iconPath": "/assets/icons/checkin.png",
        "selectedIconPath": "/assets/icons/checkin-active.png"
      },
      {
        "pagePath": "pages/items/items",
        "text": "条目",
        "iconPath": "/assets/icons/items.png",
        "selectedIconPath": "/assets/icons/items-active.png"
      },
      {
        "pagePath": "pages/settlement/settlement",
        "text": "结算",
        "iconPath": "/assets/icons/settlement.png",
        "selectedIconPath": "/assets/icons/settlement-active.png"
      },
      {
        "pagePath": "pages/settings/settings",
        "text": "设置",
        "iconPath": "/assets/icons/settings.png",
        "selectedIconPath": "/assets/icons/settings-active.png"
      }
    ]
  }
}
```

**修改点**：
```
所有 iconPath 和 selectedIconPath 前加 /
```

---

## 📝 测试清单

修改后验证：

- [ ] 修改 app.json（加斜杠）
- [ ] 保存文件
- [ ] 编译项目
- [ ] 预览
- [ ] 扫码
- [ ] 查看Tab栏
- [ ] 验证所有图标显示
- [ ] 验证选中状态图标

---

## 🎊 总结

**最可能的原因**：
```
路径需要以 / 开头（绝对路径）
```

**解决方案**：
```
在所有 iconPath 前加 /
```

**操作步骤**：
```
1. 修改 app.json
2. 编译预览
3. 扫码测试
4. 验证显示
```

---

**现在就去修改 app.json，加上斜杠试试！** 🚀

# 资源文件清单

本项目需要以下资源文件，请自行准备或使用占位图：

## 图标资源

### TabBar 图标
- `assets/icons/pk.png` - PK对战图标（未选中）
- `assets/icons/pk-active.png` - PK对战图标（选中）
- `assets/icons/checkin.png` - 今日打卡图标（未选中）
- `assets/icons/checkin-active.png` - 今日打卡图标（选中）
- `assets/icons/items.png` - 条目管理图标（未选中）
- `assets/icons/items-active.png` - 条目管理图标（选中）
- `assets/icons/settlement.png` - 结算图标（未选中）
- `assets/icons/settlement-active.png` - 结算图标（选中）

### 其他图标
- `assets/logo.png` - 应用Logo（160x160px）
- `assets/default-avatar.png` - 默认头像（200x200px）

## 图标规格

### TabBar 图标
- 尺寸：81x81px
- 格式：PNG（建议使用透明背景）
- 颜色：灰色（未选中）、彩色（选中）

### Logo
- 尺寸：160x160px 或 512x512px
- 格式：PNG（建议使用透明背景）
- 颜色：支持品牌色

### 头像
- 尺寸：200x200px
- 格式：PNG或JPG
- 内容：默认用户头像

## 获取图标资源

### 方式一：使用图标库
1. 推荐使用 [IconFont](https://www.iconfont.cn/) 或 [Flaticon](https://www.flaticon.com/)
2. 搜索相关关键词：PK、打卡、结算、设置
3. 下载PNG格式图标
4. 调整尺寸并保存到对应路径

### 方式二：使用占位图
1. 使用在线工具生成占位图
2. 例如：[placeholder.com](https://placeholder.com/)
3. 下载并保存到对应路径

### 方式三：使用emoji
在代码中可以使用emoji代替图标，例如：
```html
<text class="icon">🏆</text>
```

## 资源文件目录结构

```
miniprogram/
├── assets/
│   ├── icons/
│   │   ├── pk.png
│   │   ├── pk-active.png
│   │   ├── checkin.png
│   │   ├── checkin-active.png
│   │   ├── items.png
│   │   ├── items-active.png
│   │   ├── settlement.png
│   │   └── settlement-active.png
│   ├── logo.png
│   └── default-avatar.png
```

## 注意事项

1. **文件大小**: 图标文件不宜过大，建议每个文件小于50KB
2. **命名规范**: 使用小写字母和连字符，例如 `pk-active.png`
3. **格式选择**: 优先使用PNG格式，支持透明背景
4. **版权问题**: 确保使用的图标无版权问题或已获得授权

## 替代方案

如果暂时没有合适的图标资源，可以先使用以下临时方案：

### 方案一：使用文字
将图标替换为文字标签：
```html
<view class="icon-text">PK</view>
```

### 方案二：使用emoji
在TabBar配置中使用emoji（虽然不支持，但可以在页面中使用）

### 方案三：简化UI
暂时移除图标，只保留文字标签

## 更新资源文件

1. 将准备好的图标文件放入 `miniprogram/assets/` 对应目录
2. 确保文件名与代码中引用的文件名一致
3. 在微信开发者工具中点击"编译"预览效果

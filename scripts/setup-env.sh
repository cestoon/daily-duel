#!/bin/bash

# 快速配置云开发环境ID
# 使用方法：./scripts/setup-env.sh <your-env-id>

if [ -z "$1" ]; then
    echo "❌ 错误：请提供环境ID"
    echo ""
    echo "使用方法："
    echo "  ./scripts/setup-env.sh <your-env-id>"
    echo ""
    echo "示例："
    echo "  ./scripts/setup-env.sh daily-duel-7g3h4k5m6n"
    echo ""
    exit 1
fi

ENV_ID=$1
APP_JS="miniprogram/app.js"

echo "================================"
echo "配置云开发环境ID"
echo "================================"
echo ""

# 检查文件是否存在
if [ ! -f "$APP_JS" ]; then
    echo "❌ 错误：找不到 $APP_JS"
    exit 1
fi

echo "配置环境ID: $ENV_ID"
echo ""

# 备份原文件
cp "$APP_JS" "$APP_JS.backup"
echo "✓ 已备份原文件: $APP_JS.backup"

# 替换环境ID
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/env: 'daily-duel-xxx'/env: '$ENV_ID'/" "$APP_JS"
else
    # Linux
    sed -i "s/env: 'daily-duel-xxx'/env: '$ENV_ID'/" "$APP_JS"
fi

# 验证替换
if grep -q "env: '$ENV_ID'" "$APP_JS"; then
    echo "✓ 环境ID已更新为: $ENV_ID"
    echo ""
    echo "================================"
    echo "配置完成！"
    echo "================================"
    echo ""
    echo "下一步："
    echo "  1. 在微信开发者工具中刷新项目"
    echo "  2. 开始部署云函数"
    echo "  3. 查看 QUICK_START.md"
    echo ""
else
    echo "❌ 错误：环境ID更新失败"
    echo "正在恢复备份..."
    cp "$APP_JS.backup" "$APP_JS"
    echo "✓ 已恢复原文件"
    exit 1
fi

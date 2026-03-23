#!/bin/bash

# Daily Duel 部署检查脚本
# 每次开发完成后运行此脚本检查需要上传的内容

echo "=================================="
echo "📦 Daily Duel 部署检查"
echo "=================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查云函数修改
echo "🔍 检查云函数修改..."
echo ""

modified_functions=()

# 检查最近修改的云函数（1小时内）
for func_dir in cloudfunctions/*/; do
    func_name=$(basename "$func_dir")
    index_file="${func_dir}index.js"
    
    if [ -f "$index_file" ]; then
        # 检查文件最后修改时间（macOS 使用 -mtime -1h 需要 GNU find）
        if [ "$(find "$index_file" -mtime -1h 2>/dev/null)" ]; then
            modified_functions+=("$func_name")
        fi
    fi
done

if [ ${#modified_functions[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ 没有检测到最近修改的云函数${NC}"
else
    echo -e "${YELLOW}⚠️  检测到以下云函数已修改（需要上传）：${NC}"
    echo ""
    for func in "${modified_functions[@]}"; do
        echo "   📦 $func"
    done
fi

echo ""
echo "=================================="
echo "📋 部署步骤"
echo "=================================="
echo ""
echo "1️⃣  打开微信开发者工具"
echo "2️⃣  点击「云开发」控制台"
echo "3️⃣  进入「云函数」"
echo "4️⃣  依次上传以下云函数："
echo ""

if [ ${#modified_functions[@]} -eq 0 ]; then
    echo -e "${GREEN}   无需上传云函数${NC}"
else
    for func in "${modified_functions[@]}"; do
        echo "   ▶ $func"
        echo "      右键 → 上传并部署：云端安装依赖"
        echo ""
    done
fi

echo "=================================="
echo "📄 查看详细部署说明"
echo "=================================="
echo ""
echo "运行以下命令查看完整部署清单："
echo ""
echo "   cat DEPLOY_CHECKLIST.md"
echo ""

echo "=================================="
echo "✅ 检查完成"
echo "=================================="

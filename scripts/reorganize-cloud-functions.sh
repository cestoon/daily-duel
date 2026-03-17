#!/bin/bash

# 重新组织云函数目录结构

echo "================================"
echo "Reorganizing cloud functions..."
echo "================================"
echo ""

cd /Users/bingkunfeng/projects/AI/daily-duel/cloudfunctions

# 定义映射关系：旧路径 -> 新名称
declare -A function_map=(
    ["user/login"]="user-login"
    ["user/getInfo"]="user-getInfo"
    ["user/getPartner"]="user-getPartner"
    ["user/bindPartner"]="user-bindPartner"
    ["period/create"]="period-create"
    ["checkin/submit"]="checkin-submit"
    ["checkin/getItems"]="checkin-getItems"
    ["checkin/getTodayRecords"]="checkin-getTodayRecords"
    ["checkin/addItem"]="checkin-addItem"
    ["checkin/updateItem"]="checkin-updateItem"
    ["checkin/deleteItem"]="checkin-deleteItem"
    ["settlement/getBalance"]="settlement-getBalance"
    ["settlement/confirmPayment"]="settlement-confirmPayment"
    ["settlement/getList"]="settlement-getList"
    ["timer/dailyCheck"]="timer-dailyCheck"
    ["timer/weeklySettlement"]="timer-weeklySettlement"
)

# 创建新目录并移动文件
for old_path in "${!function_map[@]}"; do
    new_name="${function_map[$old_path]}"

    echo "Processing: $old_path -> $new_name"

    if [ -d "$new_name" ]; then
        echo "  ✗ Already exists, skipping..."
        continue
    fi

    # 创建新目录
    mkdir -p "$new_name"

    # 复制文件
    if [ -d "$old_path" ]; then
        cp -r "$old_path"/* "$new_name"/
        echo "  ✓ Copied files"
    else
        echo "  ✗ Source directory not found: $old_path"
    fi
done

echo ""
echo "================================"
echo "Reorganization complete!"
echo "================================"
echo ""
echo "New cloud function structure:"
ls -la | grep -E "^d" | grep -v "^\.$" | grep -v "^\.\.$" | awk '{print "  - " $NF}'
echo ""
echo "Next steps:"
echo "  1. Review the new structure"
echo "  2. Update require paths in cloud functions (if needed)"
echo "  3. Test in WeChat DevTools"

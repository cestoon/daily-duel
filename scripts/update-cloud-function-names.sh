#!/bin/bash

# 批量更新前端代码中的云函数名称

echo "================================"
echo "Updating cloud function names in frontend code..."
echo "================================"
echo ""

cd /Users/bingkunfeng/projects/AI/daily-duel/miniprogram

# 定义映射关系
declare -A function_name_map=(
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
)

# 查找所有JS文件
js_files=$(find . -name "*.js" -type f)

# 统计替换次数
total_replaced=0

for old_name in "${!function_name_map[@]}"; do
    new_name="${function_name_map[$old_name]}"

    # 在所有JS文件中查找并替换
    count=$(grep -r "name: '$old_name'" . --include="*.js" | wc -l | tr -d ' ')

    if [ "$count" -gt 0 ]; then
        echo "Found $count occurrences: '$old_name' → '$new_name'"

        # 使用 sed 替换（macOS 和 Linux 兼容）
        if [[ "$OSTYPE" == "darwin"* ]]; then
            find . -name "*.js" -type f -exec sed -i '' "s|name: '$old_name'|name: '$new_name'|g" {} \;
        else
            find . -name "*.js" -type f -exec sed -i "s|name: '$old_name'|name: '$new_name'|g" {} \;
        fi

        total_replaced=$((total_replaced + count))
    fi
done

echo ""
echo "================================"
echo "Update complete!"
echo "================================"
echo ""
echo "Total replacements: $total_replaced"
echo ""
echo "Verification:"
grep -h "name: '" pages/*/*.js app.js 2>/dev/null | sort -u | while read line; do
    echo "  $line"
done
echo ""
echo "Next steps:"
echo "  1. Review the changes"
echo "  2. Test in WeChat DevTools"

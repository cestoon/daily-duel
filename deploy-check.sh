#!/bin/bash

# Daily Duel 自动部署检查脚本

echo "================================"
echo "Daily Duel 部署状态检查"
echo "================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 计数器
total_steps=6
current_step=0

# 检查函数
check_step() {
    current_step=$((current_step + 1))
    echo -e "${YELLOW}[${current_step}/${total_steps}]${NC} $1"
}

check_success() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
}

check_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 检查项目目录
check_step "检查项目目录..."
if [ -f "miniprogram/app.js" ]; then
    check_success "项目目录正确"
else
    check_fail "项目目录不正确"
    exit 1
fi

# 检查云开发环境ID
check_step "检查云开发环境ID配置..."
if grep -q "daily-duel-xxx" miniprogram/app.js; then
    check_warning "环境ID未配置，需要在 miniprogram/app.js 第9行设置"
    echo "  当前: env: 'daily-duel-xxx'"
    echo "  需要替换为: env: 'your-actual-env-id'"
else
    check_success "环境ID已配置"
fi

# 检查云函数数量
check_step "检查云函数文件..."
cloudfunc_count=$(find cloudfunctions -maxdepth 2 -name "index.js" | wc -l | tr -d ' ')
if [ "$cloudfunc_count" -ge 17 ]; then
    check_success "找到 $cloudfunc_count 个云函数"
else
    check_fail "云函数数量不足（找到 $cloudfunc_count 个，需要 17 个）"
fi

# 列出所有云函数
echo ""
echo "云函数列表："
find cloudfunctions -maxdepth 2 -name "index.js" | sed 's|cloudfunctions/||' | sed 's|/index.js||' | sort | while read func; do
    echo "  - $func"
done

# 检查数据库集合配置
check_step "检查数据库集合配置..."
if grep -q "COLLECTIONS" cloudfunctions/common/config.js; then
    check_success "集合配置已定义"
    echo "  定义的集合："
    grep -A 10 "COLLECTIONS:" cloudfunctions/common/config.js | grep -E "^\s+[A-Z_]+:" | sed 's/.*://' | sed 's/^[[:space:]]*//' | sed 's/,$//' | while read col; do
        echo "    - $col"
    done
else
    check_fail "集合配置未找到"
fi

echo ""
echo "================================"
echo "接下来的操作步骤"
echo "================================"
echo ""

echo -e "${YELLOW}步骤 1：配置环境ID${NC}"
echo "  1. 在微信开发者工具中打开项目"
echo "  2. 打开 miniprogram/app.js"
echo "  3. 第9行，将 'daily-duel-xxx' 替换为你的云环境ID"
echo "  4. 保存文件"
echo ""

echo -e "${YELLOW}步骤 2：批量部署云函数（17个）${NC}"
echo "  在微信开发者工具中依次右键上传："
echo ""
echo "  用户相关（4个）："
echo "    cloudfunctions/user/login"
echo "    cloudfunctions/user/getInfo"
echo "    cloudfunctions/user/getPartner"
echo "    cloudfunctions/user/bindPartner"
echo ""
echo "  周期管理（1个）："
echo "    cloudfunctions/period/create"
echo ""
echo "  打卡相关（6个）："
echo "    cloudfunctions/checkin/submit"
echo "    cloudfunctions/checkin/getItems"
echo "    cloudfunctions/checkin/getTodayRecords"
echo "    cloudfunctions/checkin/addItem"
echo "    cloudfunctions/checkin/updateItem"
echo "    cloudfunctions/checkin/deleteItem"
echo ""
echo "  结算相关（3个）："
echo "    cloudfunctions/settlement/getBalance"
echo "    cloudfunctions/settlement/confirmPayment"
echo "    cloudfunctions/settlement/getList"
echo ""
echo "  定时任务（2个）："
echo "    cloudfunctions/timer/dailyCheck"
echo "    cloudfunctions/timer/weeklySettlement"
echo ""
echo "  公共模块（1个）："
echo "    cloudfunctions/common"
echo ""

echo -e "${YELLOW}步骤 3：配置定时触发器${NC}"
echo "  在云开发控制台 → 云函数："
echo ""
echo "  1. timer-dailyCheck 云函数："
echo "     - 添加触发器 → 定时触发器"
echo "     - Cron表达式: 0 0 1 * * * *"
echo "     - 说明: 每天00:01执行"
echo ""
echo "  2. timer-weeklySettlement 云函数："
echo "     - 添加触发器 → 定时触发器"
echo "     - Cron表达式: 0 0 10 * * 1 *"
echo "     - 说明: 每周一00:10执行"
echo ""

echo "================================"
echo "完成后运行此脚本再次检查"
echo "================================"
echo ""

# 提示运行权限
if [ ! -x "$0" ]; then
    echo "提示：给脚本添加执行权限："
    echo "  chmod +x deploy-check.sh"
    echo ""
fi

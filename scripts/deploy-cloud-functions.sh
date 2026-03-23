#!/bin/bash

# Daily Duel 云函数自动上传脚本（交互版本）
# 使用微信开发者工具 CLI 上传云函数

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 微信开发者工具 CLI 路径
CLI="/Applications/wechatwebdevtools.app/Contents/MacOS/cli"

# 项目路径
PROJECT_PATH="/Users/bingkunfeng/projects/AI/daily-duel"

# 云开发环境 ID
ENV_ID="cloud1-9gtimm7r81602bae"

# 需要上传的云函数列表
FUNCTIONS=(
    "user-login"
    "user-bindPartner"
    "settlement-getMissedPoints"
)

echo "=================================="
echo "📦 Daily Duel 云函数自动上传"
echo "=================================="
echo ""

# 检查 CLI 是否存在
if [ ! -f "$CLI" ]; then
    echo -e "${RED}❌ 错误：未找到微信开发者工具 CLI${NC}"
    echo "请确保已安装微信开发者工具"
    exit 1
fi

echo -e "${BLUE}📂 项目路径: $PROJECT_PATH${NC}"
echo -e "${BLUE}☁️  环境ID: $ENV_ID${NC}"
echo ""

# 检查项目路径
if [ ! -d "$PROJECT_PATH" ]; then
    echo -e "${RED}❌ 错误：项目路径不存在${NC}"
    exit 1
fi

cd "$PROJECT_PATH"

# 检查云函数是否都存在
echo -e "${YELLOW}🔍 检查云函数目录...${NC}"
all_exist=true
for func in "${FUNCTIONS[@]}"; do
    func_path="cloudfunctions/$func"
    if [ ! -d "$func_path" ]; then
        echo -e "${RED}   ❌ 云函数不存在: $func${NC}"
        all_exist=false
    else
        echo -e "${GREEN}   ✅ $func${NC}"
    fi
done
echo ""

if [ "$all_exist" = false ]; then
    echo -e "${RED}❌ 部分云函数目录不存在，请检查${NC}"
    exit 1
fi

# 检查是否已启用服务端口
echo -e "${YELLOW}🔌 检查 CLI 服务状态...${NC}"
echo ""

"$CLI" islogin > /dev/null 2>&1
login_status=$?

if [ $login_status -ne 0 ]; then
    echo -e "${YELLOW}⚠️  CLI 服务未启用或未登录${NC}"
    echo ""
    echo -e "${BLUE}📝 请按以下步骤启用 CLI 服务：${NC}"
    echo ""
    echo "1️⃣  打开微信开发者工具"
    echo "2️⃣  点击右上角「设置」图标"
    echo "3️⃣  选择「安全设置」"
    echo "4️⃣  开启「服务端口」"
    echo ""
    echo "或者，现在自动打开设置？"
    read -p "按 Enter 打开微信开发者工具并自动跳转到设置..." -n 1 -r
    echo ""
    
    # 尝试打开开发者工具
    open -a "wechatwebdevtools" "$PROJECT_PATH" 2>/dev/null
    
    echo ""
    echo -e "${YELLOW}等待你启用服务端口...${NC}"
    echo "启用后，再次运行此脚本即可上传"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ CLI 服务已就绪${NC}"
echo ""

echo -e "${YELLOW}⏳ 开始批量上传云函数...${NC}"
echo ""

# 构建云函数名称参数
func_names="${FUNCTIONS[*]}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📤 批量上传云函数${NC}"
echo "   函数列表: $func_names"
echo ""

# 执行批量上传
"$CLI" cloud functions deploy \
    --env "$ENV_ID" \
    --names ${FUNCTIONS[@]} \
    --project "$PROJECT_PATH" \
    --remote-npm-install \
    --lang zh

upload_status=$?

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $upload_status -eq 0 ]; then
    echo -e "${GREEN}🎉 所有云函数上传成功！${NC}"
    echo ""
    echo "=================================="
    echo "📊 上传结果"
    echo "=================================="
    echo ""
    for func in "${FUNCTIONS[@]}"; do
        echo -e "${GREEN}   ✅ $func${NC}"
    done
    echo ""
    echo "=================================="
    echo "🧪 下一步：测试功能"
    echo "=================================="
    echo ""
    echo "1. 重新登录小程序"
    echo "2. 进入设置页查看邀请码"
    echo "3. 测试绑定功能"
    echo "4. 测试 PK 血条"
    echo ""
else
    echo -e "${RED}❌ 云函数上传失败${NC}"
    echo ""
    echo -e "${YELLOW}💡 手动上传方法：${NC}"
    echo ""
    echo "1. 打开微信开发者工具"
    echo "2. 点击「云开发」→「云函数」"
    echo "3. 依次右键上传以下云函数："
    for func in "${FUNCTIONS[@]}"; do
        echo "   • $func → 上传并部署：云端安装依赖"
    done
    echo ""
    exit 1
fi

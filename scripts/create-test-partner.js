// 在云开发控制台执行此脚本创建测试伙伴

// 1. 进入云开发控制台 → 数据库 → users 集合
// 2. 点击「添加记录」，填入以下数据：

const testPartner = {
  openid: "test-partner-openid-123456",  // 测试用 openid
  nickName: "测试伙伴",
  avatarUrl: "https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132",
  partnerId: null,  // 暂时为空，后面会绑定
  currentPeriodId: null,
  createdAt: new Date(),
  updatedAt: new Date()
};

// 3. 保存后，获取新创建记录的 _id（例如：615abc123def456789）
// 4. 然后在你自己的用户记录中：
//    - 修改 partnerId 为伙伴的 _id
//    - 修改伙伴记录的 partnerId 为你的 _id

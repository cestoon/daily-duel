// 测试邀请码功能
// 在微信开发者工具的「云开发」→「云函数」→「user-login」→「测试」中运行

// 模拟登录请求
const testData = {
  nickName: "测试用户",
  avatarUrl: "https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132"
}

// 这个函数会在云端执行，检查是否生成邀请码
console.log('测试数据:', testData)
console.log('开始测试邀请码生成...')

// 预期结果：
// 1. 新用户注册时应该生成 6 位数字邀请码
// 2. 老用户登录时如果没有邀请码，会自动生成
// 3. 返回的用户数据中应该包含 inviteCode 字段

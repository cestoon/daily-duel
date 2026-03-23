// 在云开发控制台执行此脚本，创建测试伙伴
// 云开发 → 数据库 → 在浏览器控制台执行

// 步骤 1: 记录你的用户信息
// 先在 users 集合中找到你的记录，复制你的 _id 和 currentPeriodId

const myUserId = "你的用户_id";  // 替换为实际值
const myPeriodId = "你的周期_id";  // 替换为实际值

// 步骤 2: 创建测试伙伴用户
// 在云开发控制台 → 数据库 → users 集合 → 点击「添加记录」

const testPartner = {
  openid: "test-partner-" + Date.now(),  // 唯一 openid
  nickName: "测试伙伴",
  avatarUrl: "https://thirdwx.qlogo.cn/mmopen/vi_32/DYAIOgq83eoj0hHXhgJNOTSOFsS4uZs8x1ConecaVOB8eIl115xmJZcT4oCicvia7wMEufibKtTLqiaJeanU2Lpg3w/132",
  inviteCode: "888888",  // 测试邀请码
  partnerId: myUserId,  // 绑定你的 ID
  currentPeriodId: myPeriodId,  // 共享周期
  createdAt: new Date(),
  updatedAt: new Date()
};

// 添加后，记录伙伴的 _id，例如：615abc123def456789

// 步骤 3: 更新你的用户记录
// 在 users 集合中找到你的记录 → 编辑

// 添加字段：
partnerId: "伙伴的_id"  // 刚才创建的测试伙伴的 _id

// 步骤 4: 为测试伙伴创建打卡条目
// 在 checkin_items 集合 → 添加记录

const partnerItems = [
  {
    userId: "伙伴的_id",
    title: "跑步",
    points: 10,
    time: "07:00",
    enabled: true,
    sort: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    userId: "伙伴的_id",
    title: "读书",
    points: 10,
    time: "21:00",
    enabled: true,
    sort: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// 步骤 5: 创建伙伴的打卡记录（测试用）
// 在 checkin_records 集合 → 添加记录

const partnerRecords = [
  {
    userId: "伙伴的_id",
    itemId: "伙伴条目1的_id",
    periodId: myPeriodId,
    date: "2026-03-19",
    status: "completed",  // 已完成
    checkinTime: new Date(),
    note: "",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    userId: "伙伴的_id",
    itemId: "伙伴条目2的_id",
    periodId: myPeriodId,
    date: "2026-03-19",
    status: "missed",  // 漏卡
    checkinTime: null,
    note: "",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// 完成后，刷新小程序，应该能看到伙伴数据

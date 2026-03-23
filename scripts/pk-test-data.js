// pages/pk/pk.js - 临时测试代码

// 在 onLoad() 中添加：
onLoad() {
  // 临时测试数据
  if (true) {  // 改为 false 可关闭测试模式
    this.setData({
      user: {
        nickName: "我",
        avatarUrl: "https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132"
      },
      partner: {
        nickName: "测试伙伴",
        avatarUrl: "https://thirdwx.qlogo.cn/mmopen/vi_32/DYAIOgq83eoj0hHXhgJNOTSOFsS4uZs8x1ConecaVOB8eIl115xmJZcT4oCicvia7wMEufibKtTLqiaJeanU2Lpg3w/132"
      },
      // 我的数据
      myBalance: 40,        // 已完成积分
      myMissedPoints: 10,   // 漏卡积分
      todayChecked: 1,
      todayTotalItems: 2,
      todayMissed: 0,
      todayPending: 1,
      
      // 伙伴数据
      partnerBalance: 30,
      partnerMissedPoints: 20,
      partnerTodayChecked: 0,
      partnerTotalItems: 2,
      partnerProgress: 0,
      
      loading: false
    })
    
    // 计算血条
    this.calculatePercentages()
    return
  }
  
  this.loadData()
},

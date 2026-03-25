// pages/stats/stats.js
const app = getApp()

Page({
  data: {
    currentTab: 0,
    user: null,
    partner: null,
    
    // 本周数据
    weekStats: {
      myCompleted: 0,
      myMissed: 0,
      myTotal: 0,
      myRate: 0,
      partnerCompleted: 0,
      partnerMissed: 0,
      partnerTotal: 0,
      partnerRate: 0
    },
    
    // 历史周期列表
    periods: [],
    
    // 打卡趋势（最近7天）
    dailyTrend: [],
    
    loading: true
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  async loadData() {
    this.setData({ loading: true })
    
    try {
      await Promise.all([
        this.getUserInfo(),
        this.getPartnerInfo(),
        this.getWeekStats(),
        this.getHistoryPeriods(),
        this.getDailyTrend()
      ])
    } catch (e) {
      console.error('加载数据失败', e)
    } finally {
      this.setData({ loading: false })
    }
  },

  async getUserInfo() {
    if (app.globalData.user) {
      this.setData({ user: app.globalData.user })
    } else {
      const res = await wx.cloud.callFunction({
        name: 'user-getInfo'
      })
      if (res.result.success) {
        app.globalData.user = res.result.data
        this.setData({ user: res.result.data })
      }
    }
  },

  async getPartnerInfo() {
    if (app.globalData.partner) {
      this.setData({ partner: app.globalData.partner })
    } else {
      const res = await wx.cloud.callFunction({
        name: 'user-getPartner'
      })
      if (res.result.success) {
        app.globalData.partner = res.result.data
        this.setData({ partner: res.result.data })
      }
    }
  },

  async getWeekStats() {
    const user = this.data.user
    const partner = this.data.partner
    
    if (!user || !partner) return
    
    // 获取我的统计
    const [myCompleted, myMissed] = await Promise.all([
      wx.cloud.callFunction({
        name: 'settlement-getBalance'
      }),
      wx.cloud.callFunction({
        name: 'settlement-getMissedPoints'
      })
    ])
    
    // 获取伙伴统计
    const [partnerCompleted, partnerMissed] = await Promise.all([
      wx.cloud.callFunction({
        name: 'settlement-getBalance',
        data: { userId: partner._id }
      }),
      wx.cloud.callFunction({
        name: 'settlement-getMissedPoints',
        data: { userId: partner._id }
      })
    ])
    
    const myCompletedPoints = myCompleted.result.data?.totalPoints || 0
    const myMissedPoints = myMissed.result.data?.totalMissedPoints || 0
    const myTotal = myCompletedPoints + myMissedPoints
    const myRate = myTotal > 0 ? Math.round((myCompletedPoints / myTotal) * 100) : 0
    
    const partnerCompletedPoints = partnerCompleted.result.data?.totalPoints || 0
    const partnerMissedPoints = partnerMissed.result.data?.totalMissedPoints || 0
    const partnerTotal = partnerCompletedPoints + partnerMissedPoints
    const partnerRate = partnerTotal > 0 ? Math.round((partnerCompletedPoints / partnerTotal) * 100) : 0
    
    this.setData({
      weekStats: {
        myCompleted: myCompletedPoints,
        myMissed: myMissedPoints,
        myTotal: myTotal,
        myRate: myRate,
        partnerCompleted: partnerCompletedPoints,
        partnerMissed: partnerMissedPoints,
        partnerTotal: partnerTotal,
        partnerRate: partnerRate
      }
    })
  },

  async getHistoryPeriods() {
    try {
      // 调用云函数获取历史周期
      const res = await wx.cloud.callFunction({
        name: 'stats-getHistory',
        data: { limit: 10 }
      })
      
      if (res.result.success) {
        this.setData({
          periods: res.result.data || []
        })
      }
    } catch (e) {
      console.error('获取历史记录失败', e)
      this.setData({ periods: [] })
    }
  },

  async getDailyTrend() {
    try {
      // 获取最近7天的打卡趋势
      const res = await wx.cloud.callFunction({
        name: 'stats-getDailyTrend',
        data: { days: 7 }
      })
      
      if (res.result.success) {
        this.setData({
          dailyTrend: res.result.data || []
        })
      }
    } catch (e) {
      console.error('获取每日趋势失败', e)
      this.setData({ dailyTrend: [] })
    }
  },

  onTabChange(e) {
    this.setData({
      currentTab: e.detail.index
    })
  },

  formatDate(dateStr) {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}.${d.getDate()}`
  },

  formatPeriod(start, end) {
    const s = new Date(start)
    const e = new Date(end)
    return `${s.getMonth() + 1}.${s.getDate()} - ${e.getMonth() + 1}.${e.getDate()}`
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})

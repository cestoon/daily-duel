// pages/stats/stats.js
const app = getApp()
const { getToday, formatDate } = require('../../utils/util')

Page({
  data: {
    stats: {
      totalDays: 0,
      totalCheckins: 0,
      totalMissed: 0,
      completionRate: 0
    },
    weekStats: {
      myPoints: 0,
      partnerPoints: 0,
      diff: 0
    },
    trend: [],
    itemStats: [],
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
        this.loadOverallStats(),
        this.loadWeekStats(),
        this.loadTrend(),
        this.loadItemStats()
      ])
    } catch (e) {
      console.error('加载数据失败', e)
    } finally {
      this.setData({ loading: false })
    }
  },

  async loadOverallStats() {
    // 这里需要调用云函数获取统计数据
    // 暂时使用模拟数据
    this.setData({
      stats: {
        totalDays: 30,
        totalCheckins: 258,
        totalMissed: 12,
        completionRate: 96
      }
    })
  },

  async loadWeekStats() {
    try {
      const myBalanceRes = await wx.cloud.callFunction({
        name: 'settlement-getBalance'
      })

      let partnerPoints = 0
      if (app.globalData.partner) {
        const partnerBalanceRes = await wx.cloud.callFunction({
          name: 'settlement-getBalance',
          data: { userId: app.globalData.partner._id }
        })
        if (partnerBalanceRes.result.success) {
          partnerPoints = partnerBalanceRes.result.data.totalPoints
        }
      }

      const myPoints = myBalanceRes.result?.success ? myBalanceRes.result.data.totalPoints : 0

      this.setData({
        weekStats: {
          myPoints,
          partnerPoints,
          diff: myPoints - partnerPoints
        }
      })
    } catch (e) {
      console.error('加载周统计失败', e)
    }
  },

  async loadTrend() {
    // 模拟最近7天的打卡趋势
    const today = new Date()
    const trend = []
    const days = ['日', '一', '二', '三', '四', '五', '六']

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      trend.push({
        date: formatDate(date),
        day: days[date.getDay()],
        count: Math.floor(Math.random() * 5) + 1,
        percentage: Math.floor(Math.random() * 100)
      })
    }

    this.setData({ trend })
  },

  async loadItemStats() {
    // 获取用户的条目列表
    const itemsRes = await wx.cloud.callFunction({
      name: 'checkin-getItems'
    })

    if (itemsRes.result.success) {
      const items = itemsRes.result.data
      const itemStats = items.map(item => ({
        title: item.title,
        completed: Math.floor(Math.random() * 20) + 5,
        total: Math.floor(Math.random() * 5) + 20
      }))

      itemStats.forEach(item => {
        item.percentage = Math.round(item.completed / item.total * 100)
      })

      this.setData({ itemStats })
    }
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})

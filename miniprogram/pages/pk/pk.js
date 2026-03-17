// pages/pk/pk.js
const app = getApp()
const { getToday } = require('../../utils/util')

Page({
  data: {
    user: null,
    partner: null,
    myBalance: 0,
    partnerBalance: 0,
    myPercentage: 50,
    partnerPercentage: 50,
    periodInfo: '',
    todayChecked: 0,
    todayPending: 0,
    todayMissed: 0,
    partnerTodayChecked: 0,
    partnerTotalItems: 0,
    partnerProgress: 0,
    loading: true
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadData()
  },

  async loadData() {
    this.setData({ loading: true })

    try {
      await Promise.all([
        this.getUserInfo(),
        this.getPartnerInfo(),
        this.getMyBalance(),
        this.getPartnerBalance(),
        this.getTodayStats(),
        this.getPartnerTodayStats()
      ])

      this.calculatePercentages()
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
        app.saveLoginInfo()
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
        app.saveLoginInfo()
        this.setData({ partner: res.result.data })
      }
    }
  },

  async getMyBalance() {
    const res = await wx.cloud.callFunction({
      name: 'settlement-getBalance'
    })
    if (res.result.success) {
      this.setData({ myBalance: res.result.data.totalPoints })
    }
  },

  async getPartnerBalance() {
    if (!this.data.partner) return

    const res = await wx.cloud.callFunction({
      name: 'settlement-getBalance',
      data: { userId: this.data.partner._id }
    })
    if (res.result.success) {
      this.setData({ partnerBalance: res.result.data.totalPoints })
    }
  },

  async getTodayStats() {
    const res = await wx.cloud.callFunction({
      name: 'checkin-getTodayRecords'
    })
    if (res.result.success) {
      const records = res.result.data
      const checked = records.filter(r => r.status === 'completed').length
      const missed = records.filter(r => r.status === 'missed').length

      this.setData({
        todayChecked: checked,
        todayMissed: missed
      })
    }

    // 获取条目总数
    const itemsRes = await wx.cloud.callFunction({
      name: 'checkin-getItems'
    })
    if (itemsRes.success) {
      const totalItems = itemsRes.data?.length || 0
      this.setData({
        todayPending: totalItems - this.data.todayChecked - this.data.todayMissed
      })
    }
  },

  async getPartnerTodayStats() {
    if (!this.data.partner) return

    // 获取伙伴的条目总数
    const itemsRes = await wx.cloud.callFunction({
      name: 'checkin-getItems',
      data: { partnerItems: true }
    })
    if (itemsRes.result.success) {
      const totalItems = itemsRes.result.data?.length || 0

      // 获取伙伴今日打卡记录
      const recordsRes = await wx.cloud.callFunction({
        name: 'checkin-getTodayRecords',
        data: { userId: this.data.partner._id }
      })
      if (recordsRes.result.success) {
        const checked = recordsRes.result.data.filter(r => r.status === 'completed').length
        const progress = totalItems > 0 ? Math.round(checked / totalItems * 100) : 0

        this.setData({
          partnerTotalItems: totalItems,
          partnerTodayChecked: checked,
          partnerProgress: progress
        })
      }
    }
  },

  calculatePercentages() {
    const total = this.data.myBalance + this.data.partnerBalance
    if (total === 0) {
      this.setData({
        myPercentage: 50,
        partnerPercentage: 50
      })
    } else {
      this.setData({
        myPercentage: Math.round(this.data.myBalance / total * 100),
        partnerPercentage: Math.round(this.data.partnerBalance / total * 100)
      })
    }
  },

  goToCheckin() {
    wx.switchTab({
      url: '/pages/checkin/checkin'
    })
  },

  goToSettlement() {
    wx.navigateTo({
      url: '/pages/settlement/settlement'
    })
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})

// pages/pk/pk.js
const app = getApp()
const { getToday } = require('../../utils/util')

Page({
  data: {
    user: null,
    partner: null,
    myBalance: 0,
    partnerBalance: 0,
    myMissedPoints: 0,        // 我的本周漏卡积分
    partnerMissedPoints: 0,   // 伙伴的本周漏卡积分
    myTodayMissedPoints: 0,   // 我的今日漏卡积分
    partnerTodayMissedPoints: 0, // 伙伴今日漏卡积分
    leadValue: 0,             // 领先值 = 对方今日漏卡 - 我的今日漏卡
    myPercentage: 50,
    partnerPercentage: 50,
    periodInfo: '',
    todayChecked: 0,
    todayTotalItems: 0,
    partnerTodayChecked: 0,
    partnerTotalItems: 0,
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
        this.getWeekStats(),         // 改为获取本周统计（包含已完成和漏卡）
        this.getPartnerWeekStats(),  // 获取伙伴本周统计
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

  async getWeekStats() {
    // 获取本周已完成积分（不传 userId，使用当前登录用户）
    const balanceRes = await wx.cloud.callFunction({
      name: 'settlement-getBalance'
    })
    if (balanceRes.result.success) {
      this.setData({ myBalance: balanceRes.result.data.totalPoints || 0 })
    }

    // 获取本周漏卡积分
    const missedRes = await wx.cloud.callFunction({
      name: 'settlement-getMissedPoints'
    })
    if (missedRes.result.success) {
      this.setData({ myMissedPoints: missedRes.result.data.totalMissedPoints || 0 })
    }
  },

  async getPartnerWeekStats() {
    if (!this.data.partner) return

    // 获取伙伴本周已完成积分
    const balanceRes = await wx.cloud.callFunction({
      name: 'settlement-getBalance',
      data: { userId: this.data.partner._id }
    })
    if (balanceRes.result.success) {
      this.setData({ partnerBalance: balanceRes.result.data.totalPoints || 0 })
    }

    // 获取伙伴本周漏卡积分
    const missedRes = await wx.cloud.callFunction({
      name: 'settlement-getMissedPoints',
      data: { userId: this.data.partner._id }
    })
    if (missedRes.result.success) {
      this.setData({ partnerMissedPoints: missedRes.result.data.totalMissedPoints || 0 })
    }
  },

  async getTodayStats() {
    // 先获取条目总数（只获取已启用的条目）
    const itemsRes = await wx.cloud.callFunction({
      name: 'checkin-getItems'
    })
    let totalItems = 0
    if (itemsRes.result.success) {
      // 只统计已启用的条目
      totalItems = (itemsRes.result.data || []).filter(item => item.enabled).length
      this.setData({ todayTotalItems: totalItems })
    }

    // 获取今日打卡记录
    const res = await wx.cloud.callFunction({
      name: 'checkin-getTodayRecords'
    })
    if (res.result.success) {
      const records = res.result.data
      const checked = records.filter(r => r.status === 'completed').length

      // ✅ 计算今日漏卡积分（优先使用快照）
      let todayMissedPoints = 0
      const missedRecords = records.filter(r => r.status === 'missed')
      
      if (missedRecords.length > 0) {
        // 优先使用记录中的快照积分
        const hasSnapshot = missedRecords.some(r => r.itemPoints !== undefined)
        
        if (hasSnapshot) {
          // 有快照，直接使用
          missedRecords.forEach(record => {
            todayMissedPoints += (record.itemPoints || 10)
          })
        } else {
          // 没有快照（旧数据），查询条目
          if (itemsRes.result.success) {
            const items = itemsRes.result.data || []
            const itemsMap = {}
            items.forEach(item => {
              itemsMap[item._id] = item
            })
            
            missedRecords.forEach(record => {
              const item = itemsMap[record.itemId]
              if (item) {
                todayMissedPoints += (item.points || 10)
              }
            })
          }
        }
      }

      this.setData({
        todayChecked: checked,
        myTodayMissedPoints: todayMissedPoints
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
      const items = itemsRes.result.data || []
      const totalItems = items.length

      // 获取伙伴今日打卡记录
      const recordsRes = await wx.cloud.callFunction({
        name: 'checkin-getTodayRecords',
        data: { userId: this.data.partner._id }
      })
      if (recordsRes.result.success) {
        const records = recordsRes.result.data
        const checked = records.filter(r => r.status === 'completed').length

        // ✅ 计算伙伴今日漏卡积分（优先使用快照）
        let todayMissedPoints = 0
        const missedRecords = records.filter(r => r.status === 'missed')
        
        if (missedRecords.length > 0) {
          // 优先使用记录中的快照积分
          const hasSnapshot = missedRecords.some(r => r.itemPoints !== undefined)
          
          if (hasSnapshot) {
            // 有快照，直接使用
            missedRecords.forEach(record => {
              todayMissedPoints += (record.itemPoints || 10)
            })
          } else {
            // 没有快照（旧数据），查询条目
            const itemsMap = {}
            items.forEach(item => {
              itemsMap[item._id] = item
            })
            
            missedRecords.forEach(record => {
              const item = itemsMap[record.itemId]
              if (item) {
                todayMissedPoints += (item.points || 10)
              }
            })
          }
        }

        this.setData({
          partnerTotalItems: totalItems,
          partnerTodayChecked: checked,
          partnerTodayMissedPoints: todayMissedPoints
        })
      }
    }
  },

  calculatePercentages() {
    // 🎯 使用本周累计漏卡积分计算血条
    // 计算领先值：对方本周漏卡 - 我的本周漏卡
    const leadValue = this.data.partnerMissedPoints - this.data.myMissedPoints
    
    // 封顶：差值范围 [-100, +100]
    const cappedLeadValue = Math.max(-100, Math.min(100, leadValue))
    
    // 计算血条百分比
    // 领先值为正 → 我领先（对方漏卡更多）→ 我的橙色区域更大
    // 领先值为负 → 对方领先（我漏卡更多）→ 对方蓝色区域更大
    
    const myPercentage = 50 + (cappedLeadValue / 2)  // 范围: [0, 100]
    const partnerPercentage = 50 - (cappedLeadValue / 2)  // 范围: [0, 100]

    this.setData({
      leadValue: cappedLeadValue,
      myPercentage: myPercentage,
      partnerPercentage: partnerPercentage
    })
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})
